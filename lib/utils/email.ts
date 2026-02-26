import { Resend } from "resend";
import fs from "fs";
import path from "path";

/** Production app URL used for invitation links when env or passed URL is localhost. */
const PRODUCTION_APP_URL = "https://app.spair.co";

/**
 * Base URL for invitation accept links. Always returns a production URL (never localhost)
 * so users receive a link that works in production.
 * Uses INVITATION_BASE_URL if set, otherwise NEXT_PUBLIC_APP_URL only if not localhost, else PRODUCTION_APP_URL.
 */
function getInvitationBaseUrl(passedAppUrl?: string): string {
  const explicit = process.env.INVITATION_BASE_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }
  const resolved = passedAppUrl || process.env.NEXT_PUBLIC_APP_URL || PRODUCTION_APP_URL;
  const normalized = resolved.replace(/\/$/, "");
  const isLocalhost =
    /^https?:\/\/localhost(\d*)(\s|$|\/)/i.test(normalized) ||
    /^https?:\/\/127\.0\.0\.1(\s|$|\/)/i.test(normalized);
  return isLocalhost ? PRODUCTION_APP_URL : normalized;
}

// Initialize Resend only if API key is available
const getResend = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
};

export interface InvitationEmailData {
  to: string;
  memberName: string;
  ownerName: string;
  ownerEmail: string;
  invitationToken: string;
  appUrl?: string;
}

export interface CheckoutPendingEmailData {
  to: string;
  planName: string;
  trialEndDate: Date | null;
  signupUrl: string;
  appUrl?: string;
}

export interface WelcomeEmailData {
  to: string;
  userName: string;
  founderName?: string;
  appUrl?: string;
}

export interface PasswordResetEmailData {
  to: string;
  userName?: string;
  resetLink: string;
  appUrl?: string;
}

export interface AccountRemovedEmailData {
  to: string;
  userName?: string;
  appUrl?: string;
}

export interface NewSignupNotificationData {
  userEmail: string;
  userName?: string | null;
  signupSource?: "email" | "oauth" | "checkout";
}

export interface PaymentFailedEmailData {
  to: string;
  userName?: string;
  billingUrl: string;
  appUrl?: string;
}

export interface SubscriptionCancelledEmailData {
  to: string;
  userName?: string;
  appUrl?: string;
}

export interface TrialEndingEmailData {
  to: string;
  userName?: string;
  trialEndDate: Date;
  daysLeft: number;
  appUrl?: string;
}

export interface RenewalSuccessEmailData {
  to: string;
  userName?: string;
  amountFormatted?: string;
  periodEnd?: string;
  appUrl?: string;
}

export interface InviteAcceptedEmailData {
  to: string;
  ownerName: string;
  accepterName: string;
  accepterEmail: string;
  householdName?: string;
  appUrl?: string;
}

export interface ContactConfirmationEmailData {
  to: string;
  name: string;
  subject: string;
  appUrl?: string;
}

export interface NewContactNotificationData {
  fromName: string;
  fromEmail: string;
  subject: string;
  message: string;
  appUrl?: string;
}

export interface PasswordChangedEmailData {
  to: string;
  userName?: string;
  appUrl?: string;
}

export async function sendInvitationEmail(data: InvitationEmailData): Promise<void> {
  console.log("[EMAIL] sendInvitationEmail called with:", {
    to: data.to,
    memberName: data.memberName,
    ownerName: data.ownerName,
    ownerEmail: data.ownerEmail,
    hasToken: !!data.invitationToken,
    appUrl: data.appUrl,
  });

  const resend = getResend();
  
  if (!resend) {
    const apiKeyStatus = process.env.RESEND_API_KEY ? "SET (but Resend not initialized)" : "NOT SET";
    console.error("[EMAIL] ❌ RESEND_API_KEY not configured. Email will not be sent.");
    console.error("[EMAIL] RESEND_API_KEY status:", apiKeyStatus);
    throw new Error("RESEND_API_KEY not configured. Cannot send invitation email.");
  }
  
  console.log("[EMAIL] ✅ Resend initialized successfully");

  const appUrl = data.appUrl || process.env.NEXT_PUBLIC_APP_URL || "https://spair.co/";
  const invitationBaseUrl = getInvitationBaseUrl(data.appUrl);
  const invitationLink = `${invitationBaseUrl}/members/accept?token=${data.invitationToken}`;

  console.log("[EMAIL] Invitation link generated (production-safe):", invitationLink);

  // Always use noreply@spair.co as the sender with "Spair Money" as display name
  const finalFromEmail = "Spair Money <noreply@spair.co>";

  console.log("[EMAIL] Sending email from:", finalFromEmail, "to:", data.to);
  console.log("[EMAIL] Final from email value:", JSON.stringify(finalFromEmail));

  try {
    console.log("[EMAIL] Preparing to send email via Resend API...");
    const emailPayload = {
      from: finalFromEmail,
      to: data.to,
      subject: `${data.ownerName} invited you to Spair Money`,
      html: getInvitationEmailTemplate({
        memberName: data.memberName,
        ownerName: data.ownerName,
        ownerEmail: data.ownerEmail,
        invitationLink,
        memberEmail: data.to,
        appUrl,
      }),
    };
    console.log("[EMAIL] Email payload (from field):", JSON.stringify(emailPayload.from));
    const result = await resend.emails.send(emailPayload);

    console.log("[EMAIL] Resend API response received:", {
      hasError: !!result.error,
      hasData: !!result.data,
      error: result.error ? {
        message: result.error.message,
        name: result.error.name,
      } : null,
      emailId: result.data?.id,
    });

    if (result.error) {
      const errorMessage = result.error.message || JSON.stringify(result.error);
      
      // Check if it's a domain verification or testing limitation error
      const isDomainError = errorMessage.includes("validation_error") || 
          errorMessage.includes("domain") ||
          errorMessage.includes("not verified");
      const isTestingLimitation = errorMessage.includes("You can only send testing emails to your own email address");
      
      if (isDomainError || isTestingLimitation) {
        const warningMessage = `
⚠️  Resend Domain Verification Required:
The invitation was created successfully, but the email could not be sent automatically.
This is because the domain spair.co is not verified in Resend.

📋 The invitation link is: ${invitationLink}

You can manually share this link with the invited member.

🔧 To enable email sending:
1. Go to https://resend.com/domains
2. Add and verify the domain: spair.co
3. Configure DNS records (SPF, DKIM, DMARC) as instructed by Resend
4. Wait for domain verification (may take a few hours)

Once verified, emails will be sent from: noreply@spair.co
        `;
        console.warn("[EMAIL]", warningMessage);
        throw new Error(`Email not sent - domain verification required. Invitation link: ${invitationLink}`);
      } else {
        console.error("[EMAIL] ❌ Resend API error:", result.error);
        console.error("[EMAIL] Error details:", JSON.stringify(result.error, null, 2));
        throw new Error(`Resend API error: ${errorMessage}`);
      }
    } else {
      console.log("[EMAIL] ✅ Invitation email sent successfully to:", data.to);
      console.log("[EMAIL] Email ID:", result.data?.id);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error("[EMAIL] ❌ Exception caught while sending invitation email:", error);
    if (error instanceof Error) {
      console.error("[EMAIL] Error message:", error.message);
      console.error("[EMAIL] Error stack:", error.stack);
    }
    
    // Check if it's the Resend testing limitation error
    if (errorMessage.includes("validation_error") || 
        errorMessage.includes("You can only send testing emails to your own email address") ||
        errorMessage.includes("domain") ||
        errorMessage.includes("not verified") ||
        errorMessage.includes("Resend testing limitations")) {
      console.warn(`
⚠️  Resend Testing Limitation:
The invitation was created successfully, but the email could not be sent automatically.
This is because Resend's testing mode only allows sending emails to your verified email address.

📋 The invitation link is: ${invitationLink}

You can manually share this link with the invited member.

🔧 To enable email sending:
1. Go to https://resend.com/domains
2. Add and verify the domain: spair.co
3. Configure DNS records (SPF, DKIM, DMARC) as instructed by Resend
4. Wait for domain verification (may take a few hours)

Once verified, emails will be sent from: noreply@spair.co
      `);
    }
    
    // Re-throw the error so the caller knows the email wasn't sent
    // The caller can decide whether to fail the invitation or continue
    throw error;
  }
}

function getLogoUrl(): string {
  // Get Supabase URL from environment variable
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    // Fallback to hardcoded URL if env var is not set
    return "https://app.spair.co/storage/v1/object/public/images/logo-email.png";
  }

  // Construct the public URL for the logo in the images bucket
  return `${supabaseUrl}/storage/v1/object/public/images/logo-email.png`;
}

function getInvitationEmailTemplate(data: {
  memberName: string;
  ownerName: string;
  ownerEmail: string;
  invitationLink: string;
  memberEmail?: string;
  appUrl?: string;
}): string {
  try {
    const templatePath = path.join(process.cwd(), 'email-templates/household-invitation.html');
    console.log("[EMAIL] Loading template from:", templatePath);
    
    let html = fs.readFileSync(templatePath, 'utf-8');
    console.log("[EMAIL] Template loaded successfully, length:", html.length);
    
    const logoUrl = getLogoUrl();
    
    // Replace template variables
    html = html.replace(/\{\{ \.MemberName \}\}/g, data.memberName || "there");
    html = html.replace(/\{\{ \.OwnerName \}\}/g, data.ownerName || "A user");
    html = html.replace(/\{\{ \.OwnerEmail \}\}/g, data.ownerEmail || "");
    html = html.replace(/\{\{ \.InvitationLink \}\}/g, data.invitationLink);
    html = html.replace(/\{\{ \.MemberEmail \}\}/g, data.memberEmail || "");
    html = html.replace(/\{\{ \.Year \}\}/g, new Date().getFullYear().toString());
    html = html.replace(/\{\{ \.LogoURL \}\}/g, logoUrl);
    
    console.log("[EMAIL] Template variables replaced successfully");
    return html;
  } catch (error) {
    console.error("[EMAIL] ❌ Error loading invitation email template:", error);
    // Fallback to inline template if file read fails (layout matches invite.html)
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You have been invited - Spair Money</title>
  <style type="text/css">
    .logo-dark { display: none !important; }
    .logo-light { display: inline-block !important; }
    @media (prefers-color-scheme: dark) {
      .logo-light { display: none !important; }
      .logo-dark { display: inline-block !important; }
      .email-container { background-color: #1a1a1a !important; }
      .email-text { color: #e5e5e5 !important; }
      .email-text-muted { color: #a0a0a0 !important; }
      h1 { color: #ffffff !important; }
      .button { background-color: #7BC85A !important; }
    }
    @media only screen and (max-width: 600px) {
      .email-content { padding: 30px 20px !important; }
      .button { padding: 14px 24px !important; font-size: 16px !important; }
      h1 { font-size: 24px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="email-container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px;">
          <tr>
            <td style="padding: 30px 40px 20px; text-align: left;">
              <img class="logo-light" src="https://app.spair.co/storage/v1/object/public/images/logo-email.png" alt="Spair Money" width="120" height="32" style="height: 32px; width: auto;" />
              <img class="logo-dark" src="https://app.spair.co/storage/v1/object/public/images/logo-email-darkmode.png" alt="Spair Money" width="120" height="32" style="height: 32px; width: auto;" />
            </td>
          </tr>
          <tr>
            <td class="email-content" style="padding: 0 40px 40px;">
              <h1 style="margin: 0 0 20px; color: #1a1a1a; font-size: 28px; font-weight: 700; line-height: 1.3;">You have been invited</h1>
              <p class="email-text" style="margin: 0 0 16px; color: #4a4a4a; font-size: 16px; line-height: 1.5;">Hi ${data.memberName || "there"},</p>
              <p class="email-text" style="margin: 0 0 24px; color: #4a4a4a; font-size: 16px; line-height: 1.5;"><strong>${data.ownerName}</strong> (${data.ownerEmail}) has invited you to join their household on Spair Money.</p>
              <p class="email-text" style="margin: 0 0 24px; color: #4a4a4a; font-size: 16px; line-height: 1.5;">As a household member, you'll be able to view and manage shared finances, including transactions, budgets, and goals.</p>
              <div style="text-align: left; margin: 0 0 24px;">
                <a href="${data.invitationLink}" class="button" style="display: inline-block; padding: 14px 32px; background-color: #7BC85A; color: #16161B; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Accept Invitation</a>
              </div>
              <p class="email-text-muted" style="margin: 0 0 16px; color: #8a8a8a; font-size: 14px; line-height: 1.5;">Or copy and paste this link into your browser:</p>
              <p class="email-text-muted" style="margin: 0 0 24px; color: #8a8a8a; font-size: 14px; line-height: 1.5; word-break: break-all;">${data.invitationLink}</p>
              <p class="email-text-muted" style="margin: 0 0 16px; color: #8a8a8a; font-size: 14px; line-height: 1.5;">If you didn't expect this invitation, you can safely ignore this email.</p>
              <p class="email-text" style="margin: 0; color: #4a4a4a; font-size: 16px; line-height: 1.5;">Best regards,<br>Spair Money</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; background-color: #f9f9f9; text-align: center; border-top: 1px solid #e5e5e5; border-radius: 0 0 8px 8px;">
              <p style="margin: 0 0 8px; color: #8a8a8a; font-size: 12px; line-height: 1.5;">This message was sent to ${data.memberEmail || ""}. If you have questions or complaints, please contact us.</p>
              <p style="margin: 0; color: #8a8a8a; font-size: 12px;">© ${new Date().getFullYear()} Spair Money. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }
}

export async function sendCheckoutPendingEmail(data: CheckoutPendingEmailData): Promise<void> {
  console.log("[EMAIL] sendCheckoutPendingEmail called with:", {
    to: data.to,
    planName: data.planName,
    trialEndDate: data.trialEndDate,
    signupUrl: data.signupUrl,
  });
  
  const resend = getResend();
  
  if (!resend) {
    console.warn("[EMAIL] ❌ RESEND_API_KEY not configured. Email will not be sent.");
    console.warn("[EMAIL] RESEND_API_KEY value:", process.env.RESEND_API_KEY ? "SET (but Resend not initialized)" : "NOT SET");
    return;
  }

  console.log("[EMAIL] ✅ Resend initialized successfully");

  const appUrl = data.appUrl || process.env.NEXT_PUBLIC_APP_URL || "https://spair.co";
  // Always use noreply@spair.co as the sender with "Spair Money" as display name
  const finalFromEmail = "Spair Money <noreply@spair.co>";

  console.log("[EMAIL] Email configuration:", {
    from: finalFromEmail,
    to: data.to,
    appUrl,
  });
  console.log("[EMAIL] Final from email value:", JSON.stringify(finalFromEmail));

  // Format trial end date
  let trialInfo = "";
  if (data.trialEndDate) {
    const trialEnd = new Date(data.trialEndDate);
    const formattedDate = trialEnd.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    trialInfo = `Your 30-day trial is active and will end on ${formattedDate}.`;
  } else {
    trialInfo = "Your subscription is now active.";
  }

  console.log("[EMAIL] Trial info:", trialInfo);

  try {
    console.log("[EMAIL] Sending email via Resend...");
    const emailPayload = {
      from: finalFromEmail,
      to: data.to,
      subject: `Complete your Spair Money account setup`,
      html: getCheckoutPendingEmailTemplate({
        planName: data.planName,
        trialInfo,
        signupUrl: data.signupUrl,
      }),
    };
    console.log("[EMAIL] Checkout pending email payload (from field):", JSON.stringify(emailPayload.from));
    const result = await resend.emails.send(emailPayload);

    console.log("[EMAIL] Resend API response:", {
      hasError: !!result.error,
      hasData: !!result.data,
      error: result.error,
      data: result.data,
    });

    if (result.error) {
      const errorMessage = result.error.message || JSON.stringify(result.error);
      console.error("[EMAIL] ❌ Resend API error:", result.error);
      console.error("[EMAIL] Error details:", {
        message: result.error.message,
        name: result.error.name,
        statusCode: (result.error as Error & { statusCode?: number })?.statusCode,
      });
      throw new Error(`Resend API error: ${errorMessage}`);
    } else {
      console.log("[EMAIL] ✅ Checkout pending email sent successfully to:", data.to);
      console.log("[EMAIL] Email ID:", result.data?.id);
    }
  } catch (error) {
    console.error("[EMAIL] ❌ Exception sending checkout pending email:", error);
    if (error instanceof Error) {
      console.error("[EMAIL] Error message:", error.message);
      console.error("[EMAIL] Error stack:", error.stack);
    }
    // Don't throw - we don't want email failures to break the webhook flow
  }
}

function getCheckoutPendingEmailTemplate(data: {
  planName: string;
  trialInfo: string;
  signupUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Complete your Spair Money account setup</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background-color: #7BC85A; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Spair Money</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 24px; font-weight: 600;">Complete your account setup</h2>
              
              <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Great news! Your subscription to the <strong>${data.planName}</strong> plan has been successfully created.
              </p>
              
              <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                ${data.trialInfo}
              </p>
              
              <p style="margin: 0 0 30px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                To start using Spair Money, please complete your account setup by creating your password. This will only take a minute!
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="text-align: center; padding: 20px 0;">
                    <a href="${data.signupUrl}" style="display: inline-block; padding: 14px 32px; background-color: #7BC85A; color: #16161B; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Complete Account Setup</a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0; color: #8a8a8a; font-size: 14px; line-height: 1.6;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 10px 0 0; color: #7BC85A; font-size: 14px; word-break: break-all;">
                ${data.signupUrl}
              </p>
              
              <div style="margin: 30px 0 0; padding: 20px; background-color: #f9f9f9; border-radius: 6px; border-left: 4px solid #7BC85A;">
                <p style="margin: 0 0 10px; color: #1a1a1a; font-size: 14px; font-weight: 600;">What's next?</p>
                <ul style="margin: 0; padding-left: 20px; color: #4a4a4a; font-size: 14px; line-height: 1.8;">
                  <li>Create your account password</li>
                  <li>Access all pro features</li>
                  <li>Start tracking your finances</li>
                  <li>You'll only be charged after your 30-day trial ends. Cancel anytime.</li>
                </ul>
              </div>
              
              <p style="margin: 30px 0 0; color: #8a8a8a; font-size: 12px; line-height: 1.6;">
                If you didn't initiate this subscription, please contact our support team.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f9f9f9; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #8a8a8a; font-size: 12px;">
                © ${new Date().getFullYear()} Spair Money. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function sendPasswordResetEmail(data: PasswordResetEmailData): Promise<void> {
  console.log("[EMAIL] sendPasswordResetEmail called with:", {
    to: data.to,
    userName: data.userName,
    hasResetLink: !!data.resetLink,
    appUrl: data.appUrl,
  });

  const resend = getResend();
  
  if (!resend) {
    const apiKeyStatus = process.env.RESEND_API_KEY ? "SET (but Resend not initialized)" : "NOT SET";
    console.error("[EMAIL] ❌ RESEND_API_KEY not configured. Email will not be sent.");
    console.error("[EMAIL] RESEND_API_KEY status:", apiKeyStatus);
    throw new Error("RESEND_API_KEY not configured. Cannot send password reset email.");
  }
  
  console.log("[EMAIL] ✅ Resend initialized successfully");

  // Always use noreply@spair.co as the sender with "Spair Money" as display name
  const finalFromEmail = "Spair Money <noreply@spair.co>";

  console.log("[EMAIL] Sending email from:", finalFromEmail, "to:", data.to);
  console.log("[EMAIL] Final from email value:", JSON.stringify(finalFromEmail));

  try {
    console.log("[EMAIL] Preparing to send password reset email via Resend API...");
    const emailPayload = {
      from: finalFromEmail,
      to: data.to,
      subject: "Reset your password - Spair Money",
      html: getPasswordResetEmailTemplate({
        userName: data.userName,
        resetLink: data.resetLink,
        userEmail: data.to,
      }),
    };
    console.log("[EMAIL] Email payload (from field):", JSON.stringify(emailPayload.from));
    const result = await resend.emails.send(emailPayload);

    console.log("[EMAIL] Resend API response received:", {
      hasError: !!result.error,
      hasData: !!result.data,
      error: result.error ? {
        message: result.error.message,
        name: result.error.name,
      } : null,
      emailId: result.data?.id,
    });

    if (result.error) {
      const errorMessage = result.error.message || JSON.stringify(result.error);
      
      // Check if it's a domain verification or testing limitation error
      const isDomainError = errorMessage.includes("validation_error") || 
          errorMessage.includes("domain") ||
          errorMessage.includes("not verified");
      const isTestingLimitation = errorMessage.includes("You can only send testing emails to your own email address");
      
      if (isDomainError || isTestingLimitation) {
        const warningMessage = `
⚠️  Resend Domain Verification Required:
The password reset email could not be sent automatically.
This is because the domain spair.co is not verified in Resend.

📋 The password reset link is: ${data.resetLink}

You can manually share this link with the user if needed.

🔧 To enable email sending:
1. Go to https://resend.com/domains
2. Add and verify the domain: spair.co
3. Configure DNS records (SPF, DKIM, DMARC) as instructed by Resend
4. Wait for domain verification (may take a few hours)

Once verified, emails will be sent from: noreply@spair.co
        `;
        console.warn("[EMAIL]", warningMessage);
        throw new Error(`Email not sent - domain verification required. Reset link: ${data.resetLink}`);
      } else {
        console.error("[EMAIL] ❌ Resend API error:", result.error);
        console.error("[EMAIL] Error details:", JSON.stringify(result.error, null, 2));
        throw new Error(`Resend API error: ${errorMessage}`);
      }
    } else {
      console.log("[EMAIL] ✅ Password reset email sent successfully to:", data.to);
      console.log("[EMAIL] Email ID:", result.data?.id);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error("[EMAIL] ❌ Exception caught while sending password reset email:", error);
    if (error instanceof Error) {
      console.error("[EMAIL] Error message:", error.message);
      console.error("[EMAIL] Error stack:", error.stack);
    }
    
    // Check if it's a domain verification or testing limitation error
    if (errorMessage.includes("validation_error") || 
        errorMessage.includes("domain") ||
        errorMessage.includes("not verified") ||
        errorMessage.includes("Resend testing limitations") ||
        errorMessage.includes("domain verification required")) {
      console.warn(`
⚠️  Resend Domain Verification Required:
The password reset email could not be sent automatically.
This is because the domain spair.co is not verified in Resend.

📋 The password reset link is: ${data.resetLink}

You can manually share this link with the user if needed.

🔧 To enable email sending:
1. Go to https://resend.com/domains
2. Add and verify the domain: spair.co
3. Configure DNS records (SPF, DKIM, DMARC) as instructed by Resend
4. Wait for domain verification (may take a few hours)

Once verified, emails will be sent from: noreply@spair.co
      `);
    }
    
    // Re-throw the error so the caller knows the email wasn't sent
    throw error;
  }
}

function getPasswordResetEmailTemplate(data: {
  userName?: string;
  resetLink: string;
  userEmail?: string;
}): string {
  try {
    const templatePath = path.join(process.cwd(), 'email-templates/password-reset.html');
    console.log("[EMAIL] Loading password reset template from:", templatePath);
    
    let html = fs.readFileSync(templatePath, 'utf-8');
    console.log("[EMAIL] Template loaded successfully, length:", html.length);

    const logoUrl = getLogoUrl();

    // Replace template variables
    html = html.replace(/\{\{ if \.Name \}\} \{\{ \.Name \}\}\{\{ end \}\}/g, data.userName || "");
    html = html.replace(/\{\{ \.ConfirmationURL \}\}/g, data.resetLink);
    html = html.replace(/\{\{ \.Email \}\}/g, data.userEmail || "");
    html = html.replace(/\{\{ \.Year \}\}/g, new Date().getFullYear().toString());
    html = html.replace(/\{\{ \.LogoURL \}\}/g, logoUrl);
    
    console.log("[EMAIL] Template variables replaced successfully");
    return html;
  } catch (error) {
    console.error("[EMAIL] ❌ Error loading password reset email template:", error);
    // Fallback to inline template if file read fails
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - Spair Money</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px;">
          <tr>
            <td style="padding: 30px 40px 20px; text-align: left;">
              <img src="${getLogoUrl()}" alt="Spair Money" style="height: 32px; width: auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px;">
              <h1 style="margin: 0 0 20px; color: #1a1a1a; font-size: 28px; font-weight: 700; line-height: 1.3;">
                Reset your password
              </h1>
              
              <p style="margin: 0 0 16px; color: #4a4a4a; font-size: 16px; line-height: 1.5;">
                Hi${data.userName ? ` ${data.userName}` : ""},
              </p>
              
              <p style="margin: 0 0 24px; color: #4a4a4a; font-size: 16px; line-height: 1.5;">
                We received a request to reset your password. Click the button below to create a new password:
              </p>
              
              <div style="text-align: left; margin: 0 0 24px;">
                <a href="${data.resetLink}" style="display: inline-block; padding: 14px 32px; background-color: #7BC85A; color: #16161B; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Reset Password
                </a>
              </div>
              
              <p style="margin: 0 0 16px; color: #8a8a8a; font-size: 14px; line-height: 1.5;">
                Or copy and paste this link into your browser:
              </p>
              
              <p style="margin: 0 0 24px; color: #8a8a8a; font-size: 14px; line-height: 1.5; word-break: break-all;">
                ${data.resetLink}
              </p>
              
              <p style="margin: 0 0 16px; color: #8a8a8a; font-size: 14px; line-height: 1.5;">
                This link will expire in 1 hour for security reasons. If you didn't request a password reset, you can safely ignore this email.
              </p>
              
              <p style="margin: 0 0 24px; color: #8a8a8a; font-size: 14px; line-height: 1.5;">
                For your security, we recommend choosing a strong, unique password that you haven't used elsewhere.
              </p>
              
              <p style="margin: 0; color: #4a4a4a; font-size: 16px; line-height: 1.5;">
                Best regards,<br>
                Spair Money
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; background-color: #f9f9f9; text-align: center; border-top: 1px solid #e5e5e5; border-radius: 0 0 8px 8px;">
              <p style="margin: 0 0 8px; color: #8a8a8a; font-size: 12px; line-height: 1.5;">
                This message was sent to ${data.userEmail || ""}. If you have questions or complaints, please contact us.
              </p>
              <p style="margin: 0; color: #8a8a8a; font-size: 12px;">
                © ${new Date().getFullYear()} Spair Money. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }
}

export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<void> {
  const resend = getResend();
  
  if (!resend) {
    console.warn("RESEND_API_KEY not configured. Email will not be sent.");
    return;
  }

  // Sender display name (From header) – always "Naor from Spair Money"
  const senderDisplayName = "Naor from Spair Money";
  // Name used in email body and signature – default "Naor Tartarotti"
  const founderName = data.founderName || "Naor Tartarotti";

  // Use founder's email as the sender so replies go directly to the founder
  // Default to naor@spair.co if FOUNDER_EMAIL is not configured
  const founderEmail = process.env.FOUNDER_EMAIL || "naor@spair.co";
  const finalFromEmail = `${senderDisplayName} <${founderEmail}>`;

  console.log("[EMAIL] Welcome email - Final from email value:", JSON.stringify(finalFromEmail));

  try {
    const emailPayload = {
      from: finalFromEmail,
      to: data.to,
      subject: `Welcome to Spair Money!`,
      html: getWelcomeEmailTemplate({
        founderName,
        email: data.to,
      }),
    };
    console.log("[EMAIL] Welcome email payload (from field):", JSON.stringify(emailPayload.from));
    const result = await resend.emails.send(emailPayload);

    if (result.error) {
      const errorMessage = result.error.message || JSON.stringify(result.error);
      console.error("Resend API error:", result.error);
      throw new Error(`Resend API error: ${errorMessage}`);
    } else {
      console.log("✅ Welcome email sent successfully to:", data.to);
    }
  } catch (error) {
    console.error("Error sending welcome email:", error);
    // Don't throw - we don't want email failures to break the user flow
  }
}

function getWelcomeEmailTemplate(data: {
  founderName: string;
  email: string;
}): string {
  try {
    const templatePath = path.join(process.cwd(), 'email-templates/welcome.html');
    let html = fs.readFileSync(templatePath, 'utf-8');

    const logoUrl = getLogoUrl();
    
    // Replace variables
    html = html.replace(/\{\{ \.FounderName \}\}/g, data.founderName);
    html = html.replace(/\{\{ \.Email \}\}/g, data.email);
    html = html.replace(/\{\{ \.Year \}\}/g, new Date().getFullYear().toString());
    html = html.replace(/\{\{ \.LogoURL \}\}/g, logoUrl);
    
    return html;
  } catch (error) {
    console.error("Error reading welcome email template:", error);
    // Fallback to inline template
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Spair Money</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px;">
          <tr>
            <td style="padding: 30px 40px 20px; text-align: left;">
              <img src="${getLogoUrl()}" alt="Spair Money" style="height: 32px; width: auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px;">
              <h1 style="margin: 0 0 20px; color: #1a1a1a; font-size: 28px; font-weight: 700; line-height: 1.3;">
                Welcome to Spair Money!
              </h1>
              <p style="margin: 0 0 16px; color: #4a4a4a; font-size: 16px; line-height: 1.5;">
                Hi,
              </p>
              <p style="margin:0 0 16px; color: #4a4a4a; font-size: 16px; line-height: 1.5;">
                I'm ${data.founderName}, founder of Spair Money.
              </p>
              <p style="margin:0 0 16px; color: #4a4a4a; font-size: 16px; line-height: 1.5;">
                I hope you take full advantage of these 30 days to explore the platform and that it helps you organize your financial life, whether individually or as a family.
              </p>
              <p style="margin:0 0 16px; color: #4a4a4a; font-size: 16px; line-height: 1.5;">
                I created this platform with the goal of moving away from spreadsheets. I focused on building something that made sense to me, and I decided to make it a product available to everyone.
              </p>
              <p style="margin:0 0 24px; color: #4a4a4a; font-size: 16px; line-height: 1.5;">
                Your feedback is very welcome! If you have any questions, suggestions, or just want to share your experience, feel free to reply to this email. I read and respond to every message personally.
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0;">
                <tr>
                  <td style="padding-right: 16px; vertical-align: top;">
                    <img src="https://dvshwrtzazoetkbzxolv.supabase.co/storage/v1/object/public/images/founder-avatar.jpeg" alt="${data.founderName}" style="width: 64px; height: 64px; border-radius: 50%; display: block;" />
                  </td>
                  <td style="vertical-align: top;">
                    <p style="margin:0; color: #4a4a4a; font-size: 16px; line-height: 1.5;">
                      Best regards,<br>
                      ${data.founderName}<br>
                      <span style="color: #8a8a8a; font-size: 14px;">Founder, Spair Money</span>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; background-color: #f9f9f9; text-align: center; border-top: 1px solid #e5e5e5; border-radius: 0 0 8px 8px;">
              <p style="margin: 0 0 8px; color: #8a8a8a; font-size: 12px; line-height: 1.5;">
                This message was sent to ${data.email}. If you have questions or complaints, please contact us.
              </p>
              <p style="margin: 0; color: #8a8a8a; font-size: 12px;">
                © ${new Date().getFullYear()} Spair Money. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }
}

export async function sendAccountRemovedEmail(data: AccountRemovedEmailData): Promise<void> {
  const resend = getResend();

  if (!resend) {
    console.warn("[EMAIL] RESEND_API_KEY not configured. Account removed email will not be sent.");
    return;
  }

  const finalFromEmail = "Spair Money <noreply@spair.co>";

  try {
    const emailPayload = {
      from: finalFromEmail,
      to: data.to,
      subject: "We're sad to see you go 💚",
      html: getAccountRemovedEmailTemplate({
        userName: data.userName,
        email: data.to,
      }),
    };
    const result = await resend.emails.send(emailPayload);

    if (result.error) {
      const errorMessage = result.error.message || JSON.stringify(result.error);
      console.error("[EMAIL] Error sending account removed email:", result.error);
      throw new Error(`Resend API error: ${errorMessage}`);
    }
    console.log("[EMAIL] Account removed confirmation email sent to:", data.to);
  } catch (error) {
    console.error("[EMAIL] Error sending account removed email:", error);
    // Don't throw - account deletion must complete even if email fails
  }
}

function getAccountRemovedEmailTemplate(data: {
  userName?: string;
  email: string;
}): string {
  try {
    const templatePath = path.join(process.cwd(), "email-templates/account-removed.html");
    let html = fs.readFileSync(templatePath, "utf-8");

    const userName = data.userName?.trim() || "there";
    const logoUrl = getLogoUrl();

    html = html.replace(/\{\{ \.UserName \}\}/g, userName);
    html = html.replace(/\{\{ \.Email \}\}/g, data.email);
    html = html.replace(/\{\{ \.Year \}\}/g, new Date().getFullYear().toString());
    html = html.replace(/\{\{ \.LogoURL \}\}/g, logoUrl);

    return html;
  } catch (error) {
    console.error("[EMAIL] Error reading account-removed email template:", error);
    // Fallback: same layout as password-reset and welcome (logo, table, footer)
    const userName = (data.userName?.trim() || "there").replace(/</g, "&lt;");
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>We're sad to see you go - Spair Money</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px;">
          <tr>
            <td style="padding: 30px 40px 20px; text-align: left;">
              <img src="${getLogoUrl()}" alt="Spair Money" style="height: 32px; width: auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px;">
              <h1 style="margin: 0 0 20px; color: #1a1a1a; font-size: 28px; font-weight: 700; line-height: 1.3;">
                We're sad to see you go 💚
              </h1>
              <p style="margin: 0 0 16px; color: #4a4a4a; font-size: 16px; line-height: 1.5;">
                Hi ${userName},
              </p>
              <p style="margin: 0 0 16px; color: #4a4a4a; font-size: 16px; line-height: 1.5;">
                Your Spair Money account has been permanently deleted, just as you requested.
              </p>
              <p style="margin: 0 0 16px; color: #4a4a4a; font-size: 16px; line-height: 1.5;">
                We won't pretend — we're a little sad to see you go.
              </p>
              <p style="margin: 0 0 16px; color: #4a4a4a; font-size: 16px; line-height: 1.5;">
                Everything connected to your account has been removed from our system.
              </p>
              <p style="margin: 0 0 16px; color: #4a4a4a; font-size: 16px; line-height: 1.5;">
                If this wasn't you or you changed your mind, please reach out as soon as possible at <a href="mailto:support@spair.co" style="color: #7BC85A; text-decoration: none;">support@spair.co</a> and we'll do our best to help.
              </p>
              <p style="margin: 0; color: #4a4a4a; font-size: 16px; line-height: 1.5;">
                Thank you for being part of Spair Money, even if just for a while.<br>
                You'll always be welcome back.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; background-color: #f9f9f9; text-align: center; border-top: 1px solid #e5e5e5; border-radius: 0 0 8px 8px;">
              <p style="margin: 0 0 8px; color: #8a8a8a; font-size: 12px; line-height: 1.5;">
                This message was sent to ${data.email}. If you have questions or complaints, please contact us.
              </p>
              <p style="margin: 0; color: #8a8a8a; font-size: 12px;">
                © ${new Date().getFullYear()} Spair Money. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }
}

const NEW_SIGNUP_NOTIFICATION_TO = "hello@spair.co";

export async function sendNewSignupNotificationEmail(data: NewSignupNotificationData): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.warn("[EMAIL] RESEND_API_KEY not configured. New signup notification will not be sent.");
    return;
  }
  const finalFromEmail = "Spair Money <noreply@spair.co>";
  try {
    const html = getNewSignupNotificationTemplate(data);
    const result = await resend.emails.send({
      from: finalFromEmail,
      to: NEW_SIGNUP_NOTIFICATION_TO,
      subject: `New signup: ${data.userEmail}`,
      html,
    });
    if (result.error) {
      console.error("[EMAIL] New signup notification error:", result.error);
      return;
    }
    console.log("[EMAIL] New signup notification sent to", NEW_SIGNUP_NOTIFICATION_TO);
  } catch (error) {
    console.error("[EMAIL] Error sending new signup notification:", error);
  }
}

function getNewSignupNotificationTemplate(data: NewSignupNotificationData): string {
  const userName = (data.userName ?? "—").toString().replace(/</g, "&lt;");
  const userEmail = data.userEmail.replace(/</g, "&lt;");
  const source = (data.signupSource ?? "email").replace(/</g, "&lt;");
  const date = new Date().toISOString();
  const year = new Date().getFullYear();
  const logoUrl = getLogoUrl();
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>New signup - Spair Money</title></head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr><td align="center" style="padding: 40px 20px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px;">
        <tr><td style="padding: 30px 40px 20px; text-align: left;"><img src="${logoUrl}" alt="Spair Money" style="height: 32px; width: auto;" /></td></tr>
        <tr><td style="padding: 0 40px 40px;">
          <h1 style="margin: 0 0 20px; color: #1a1a1a; font-size: 28px; font-weight: 700;">New signup</h1>
          <p style="margin: 0 0 8px; color: #4a4a4a; font-size: 16px;"><strong>Email:</strong> ${userEmail}</p>
          <p style="margin: 0 0 8px; color: #4a4a4a; font-size: 16px;"><strong>Name:</strong> ${userName}</p>
          <p style="margin: 0 0 8px; color: #4a4a4a; font-size: 16px;"><strong>Source:</strong> ${source}</p>
          <p style="margin: 0; color: #4a4a4a; font-size: 16px;"><strong>Date:</strong> ${date}</p>
        </td></tr>
        <tr><td style="padding: 20px 40px; background-color: #f9f9f9; text-align: center; border-top: 1px solid #e5e5e5; border-radius: 0 0 8px 8px;">
          <p style="margin: 0; color: #8a8a8a; font-size: 12px;">© ${year} Spair Money. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

export async function sendPaymentFailedEmail(data: PaymentFailedEmailData): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.warn("[EMAIL] RESEND_API_KEY not configured. Payment failed email will not be sent.");
    return;
  }
  const finalFromEmail = "Spair Money <noreply@spair.co>";
  try {
    const result = await resend.emails.send({
      from: finalFromEmail,
      to: data.to,
      subject: "Payment failed – update your payment method",
      html: getPaymentFailedEmailTemplate(data),
    });
    if (result.error) {
      console.error("[EMAIL] Payment failed email error:", result.error);
      return;
    }
    console.log("[EMAIL] Payment failed email sent to:", data.to);
  } catch (error) {
    console.error("[EMAIL] Error sending payment failed email:", error);
  }
}

function getPaymentFailedEmailTemplate(data: PaymentFailedEmailData): string {
  const userName = (data.userName?.trim() || "there").replace(/</g, "&lt;");
  const billingUrl = data.billingUrl.replace(/"/g, "&quot;");
  const year = new Date().getFullYear();
  const logoUrl = getLogoUrl();
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Payment failed - Spair Money</title></head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr><td align="center" style="padding: 40px 20px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px;">
        <tr><td style="padding: 30px 40px 20px;"><img src="${logoUrl}" alt="Spair Money" style="height: 32px; width: auto;" /></td></tr>
        <tr><td style="padding: 0 40px 40px;">
          <h1 style="margin: 0 0 20px; color: #1a1a1a; font-size: 28px; font-weight: 700;">Payment failed</h1>
          <p style="margin: 0 0 16px; color: #4a4a4a; font-size: 16px; line-height: 1.5;">Hi ${userName},</p>
          <p style="margin: 0 0 16px; color: #4a4a4a; font-size: 16px; line-height: 1.5;">We couldn't process your last payment for your Spair Money subscription. Please update your payment method so you don't lose access.</p>
          <p style="margin: 0 0 24px;"><a href="${billingUrl}" style="display: inline-block; padding: 12px 24px; background-color: #7BC85A; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600;">Update payment method</a></p>
          <p style="margin: 0; color: #4a4a4a; font-size: 16px;">If you have questions, contact us at <a href="mailto:hello@spair.co" style="color: #7BC85A;">hello@spair.co</a>.</p>
        </td></tr>
        <tr><td style="padding: 20px 40px; background-color: #f9f9f9; text-align: center; border-top: 1px solid #e5e5e5; border-radius: 0 0 8px 8px;">
          <p style="margin: 0; color: #8a8a8a; font-size: 12px;">© ${year} Spair Money. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

export async function sendSubscriptionCancelledEmail(data: SubscriptionCancelledEmailData): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.warn("[EMAIL] RESEND_API_KEY not configured. Subscription cancelled email will not be sent.");
    return;
  }
  const finalFromEmail = "Spair Money <noreply@spair.co>";
  try {
    const result = await resend.emails.send({
      from: finalFromEmail,
      to: data.to,
      subject: "Your Spair Money subscription has been cancelled",
      html: getSubscriptionCancelledEmailTemplate(data),
    });
    if (result.error) {
      console.error("[EMAIL] Subscription cancelled email error:", result.error);
      return;
    }
    console.log("[EMAIL] Subscription cancelled email sent to:", data.to);
  } catch (error) {
    console.error("[EMAIL] Error sending subscription cancelled email:", error);
  }
}

function getSubscriptionCancelledEmailTemplate(data: SubscriptionCancelledEmailData): string {
  const userName = (data.userName?.trim() || "there").replace(/</g, "&lt;");
  const year = new Date().getFullYear();
  const logoUrl = getLogoUrl();
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Subscription cancelled - Spair Money</title></head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr><td align="center" style="padding: 40px 20px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px;">
        <tr><td style="padding: 30px 40px 20px;"><img src="${logoUrl}" alt="Spair Money" style="height: 32px; width: auto;" /></td></tr>
        <tr><td style="padding: 0 40px 40px;">
          <h1 style="margin: 0 0 20px; color: #1a1a1a; font-size: 28px; font-weight: 700;">Subscription cancelled</h1>
          <p style="margin: 0 0 16px; color: #4a4a4a; font-size: 16px; line-height: 1.5;">Hi ${userName},</p>
          <p style="margin: 0 0 16px; color: #4a4a4a; font-size: 16px; line-height: 1.5;">Your Spair Money subscription has been cancelled. You'll keep access until the end of your current billing period.</p>
          <p style="margin: 0; color: #4a4a4a; font-size: 16px;">We're sorry to see you go. If you change your mind, you can resubscribe anytime from your account settings.</p>
        </td></tr>
        <tr><td style="padding: 20px 40px; background-color: #f9f9f9; text-align: center; border-top: 1px solid #e5e5e5; border-radius: 0 0 8px 8px;">
          <p style="margin: 0; color: #8a8a8a; font-size: 12px;">© ${year} Spair Money. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

export async function sendTrialEndingEmail(data: TrialEndingEmailData): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.warn("[EMAIL] RESEND_API_KEY not configured. Trial ending email will not be sent.");
    return;
  }
  const finalFromEmail = "Spair Money <noreply@spair.co>";
  try {
    const result = await resend.emails.send({
      from: finalFromEmail,
      to: data.to,
      subject: data.daysLeft <= 2 ? "Your Spair Money trial ends in 2 days" : "Your Spair Money trial ends in 7 days",
      html: getTrialEndingEmailTemplate(data),
    });
    if (result.error) {
      console.error("[EMAIL] Trial ending email error:", result.error);
      return;
    }
    console.log("[EMAIL] Trial ending email sent to:", data.to);
  } catch (error) {
    console.error("[EMAIL] Error sending trial ending email:", error);
  }
}

function getTrialEndingEmailTemplate(data: TrialEndingEmailData): string {
  const userName = (data.userName?.trim() || "there").replace(/</g, "&lt;");
  const trialEndStr = data.trialEndDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const appUrl = (data.appUrl || process.env.NEXT_PUBLIC_APP_URL || "https://spair.co").replace(/\/$/, "");
  const billingUrl = `${appUrl}/settings/billing`;
  const year = new Date().getFullYear();
  const logoUrl = getLogoUrl();
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Trial ending - Spair Money</title></head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr><td align="center" style="padding: 40px 20px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px;">
        <tr><td style="padding: 30px 40px 20px;"><img src="${logoUrl}" alt="Spair Money" style="height: 32px; width: auto;" /></td></tr>
        <tr><td style="padding: 0 40px 40px;">
          <h1 style="margin: 0 0 20px; color: #1a1a1a; font-size: 28px; font-weight: 700;">Your trial ends in ${data.daysLeft} day${data.daysLeft === 1 ? "" : "s"}</h1>
          <p style="margin: 0 0 16px; color: #4a4a4a; font-size: 16px; line-height: 1.5;">Hi ${userName},</p>
          <p style="margin: 0 0 16px; color: #4a4a4a; font-size: 16px; line-height: 1.5;">Your Spair Money trial ends on ${trialEndStr}. To keep full access, add a payment method and we'll start your subscription when the trial ends.</p>
          <p style="margin: 0 0 24px;"><a href="${billingUrl}" style="display: inline-block; padding: 12px 24px; background-color: #7BC85A; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600;">Manage subscription</a></p>
          <p style="margin: 0; color: #4a4a4a; font-size: 16px;">If you have questions, reply to this email or contact us at <a href="mailto:hello@spair.co" style="color: #7BC85A;">hello@spair.co</a>.</p>
        </td></tr>
        <tr><td style="padding: 20px 40px; background-color: #f9f9f9; text-align: center; border-top: 1px solid #e5e5e5; border-radius: 0 0 8px 8px;">
          <p style="margin: 0; color: #8a8a8a; font-size: 12px;">© ${year} Spair Money. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

export async function sendRenewalSuccessEmail(data: RenewalSuccessEmailData): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.warn("[EMAIL] RESEND_API_KEY not configured. Renewal success email will not be sent.");
    return;
  }
  const finalFromEmail = "Spair Money <noreply@spair.co>";
  try {
    const result = await resend.emails.send({
      from: finalFromEmail,
      to: data.to,
      subject: "Your Spair Money subscription was renewed",
      html: getRenewalSuccessEmailTemplate(data),
    });
    if (result.error) {
      console.error("[EMAIL] Renewal success email error:", result.error);
      return;
    }
    console.log("[EMAIL] Renewal success email sent to:", data.to);
  } catch (error) {
    console.error("[EMAIL] Error sending renewal success email:", error);
  }
}

function getRenewalSuccessEmailTemplate(data: RenewalSuccessEmailData): string {
  const userName = (data.userName?.trim() || "there").replace(/</g, "&lt;");
  const amount = data.amountFormatted ?? "—";
  const periodEnd = data.periodEnd ?? "—";
  const appUrl = (data.appUrl || process.env.NEXT_PUBLIC_APP_URL || "https://spair.co").replace(/\/$/, "");
  const year = new Date().getFullYear();
  const logoUrl = getLogoUrl();
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Subscription renewed - Spair Money</title></head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr><td align="center" style="padding: 40px 20px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px;">
        <tr><td style="padding: 30px 40px 20px;"><img src="${logoUrl}" alt="Spair Money" style="height: 32px; width: auto;" /></td></tr>
        <tr><td style="padding: 0 40px 40px;">
          <h1 style="margin: 0 0 20px; color: #1a1a1a; font-size: 28px; font-weight: 700;">Subscription renewed</h1>
          <p style="margin: 0 0 16px; color: #4a4a4a; font-size: 16px; line-height: 1.5;">Hi ${userName},</p>
          <p style="margin: 0 0 16px; color: #4a4a4a; font-size: 16px; line-height: 1.5;">Your Spair Money subscription was successfully renewed. Amount: ${amount}. Next billing date: ${periodEnd}.</p>
          <p style="margin: 0; color: #4a4a4a; font-size: 16px;">You can manage your subscription anytime in <a href="${appUrl}/settings/billing" style="color: #7BC85A;">Settings → Billing</a>.</p>
        </td></tr>
        <tr><td style="padding: 20px 40px; background-color: #f9f9f9; text-align: center; border-top: 1px solid #e5e5e5; border-radius: 0 0 8px 8px;">
          <p style="margin: 0; color: #8a8a8a; font-size: 12px;">© ${year} Spair Money. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

export async function sendInviteAcceptedEmail(data: InviteAcceptedEmailData): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.warn("[EMAIL] RESEND_API_KEY not configured. Invite accepted email will not be sent.");
    return;
  }
  const finalFromEmail = "Spair Money <noreply@spair.co>";
  try {
    const result = await resend.emails.send({
      from: finalFromEmail,
      to: data.to,
      subject: `${data.accepterName} accepted your Spair Money invitation`,
      html: getInviteAcceptedEmailTemplate(data),
    });
    if (result.error) {
      console.error("[EMAIL] Invite accepted email error:", result.error);
      return;
    }
    console.log("[EMAIL] Invite accepted email sent to:", data.to);
  } catch (error) {
    console.error("[EMAIL] Error sending invite accepted email:", error);
  }
}

function getInviteAcceptedEmailTemplate(data: InviteAcceptedEmailData): string {
  const ownerName = data.ownerName.replace(/</g, "&lt;");
  const accepterName = data.accepterName.replace(/</g, "&lt;");
  const accepterEmail = data.accepterEmail.replace(/</g, "&lt;");
  const householdName = (data.householdName ?? "your household").replace(/</g, "&lt;");
  const year = new Date().getFullYear();
  const logoUrl = getLogoUrl();
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Invitation accepted - Spair Money</title></head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr><td align="center" style="padding: 40px 20px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px;">
        <tr><td style="padding: 30px 40px 20px;"><img src="${logoUrl}" alt="Spair Money" style="height: 32px; width: auto;" /></td></tr>
        <tr><td style="padding: 0 40px 40px;">
          <h1 style="margin: 0 0 20px; color: #1a1a1a; font-size: 28px; font-weight: 700;">Invitation accepted</h1>
          <p style="margin: 0 0 16px; color: #4a4a4a; font-size: 16px; line-height: 1.5;">Hi ${ownerName},</p>
          <p style="margin: 0 0 16px; color: #4a4a4a; font-size: 16px; line-height: 1.5;"><strong>${accepterName}</strong> (${accepterEmail}) has accepted your invitation to join ${householdName} on Spair Money.</p>
          <p style="margin: 0; color: #4a4a4a; font-size: 16px;">They now have access to the household. You can manage members in your account settings.</p>
        </td></tr>
        <tr><td style="padding: 20px 40px; background-color: #f9f9f9; text-align: center; border-top: 1px solid #e5e5e5; border-radius: 0 0 8px 8px;">
          <p style="margin: 0; color: #8a8a8a; font-size: 12px;">© ${year} Spair Money. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

export async function sendContactConfirmationEmail(data: ContactConfirmationEmailData): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.warn("[EMAIL] RESEND_API_KEY not configured. Contact confirmation email will not be sent.");
    return;
  }
  const finalFromEmail = "Spair Money <noreply@spair.co>";
  try {
    const result = await resend.emails.send({
      from: finalFromEmail,
      to: data.to,
      subject: "We received your message – Spair Money",
      html: getContactConfirmationEmailTemplate(data),
    });
    if (result.error) {
      console.error("[EMAIL] Contact confirmation email error:", result.error);
      return;
    }
    console.log("[EMAIL] Contact confirmation email sent to:", data.to);
  } catch (error) {
    console.error("[EMAIL] Error sending contact confirmation email:", error);
  }
}

function getContactConfirmationEmailTemplate(data: ContactConfirmationEmailData): string {
  const name = data.name.replace(/</g, "&lt;");
  const subject = data.subject.replace(/</g, "&lt;");
  const year = new Date().getFullYear();
  const logoUrl = getLogoUrl();
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>We received your message - Spair Money</title></head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr><td align="center" style="padding: 40px 20px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px;">
        <tr><td style="padding: 30px 40px 20px;"><img src="${logoUrl}" alt="Spair Money" style="height: 32px; width: auto;" /></td></tr>
        <tr><td style="padding: 0 40px 40px;">
          <h1 style="margin: 0 0 20px; color: #1a1a1a; font-size: 28px; font-weight: 700;">We received your message</h1>
          <p style="margin: 0 0 16px; color: #4a4a4a; font-size: 16px; line-height: 1.5;">Hi ${name},</p>
          <p style="margin: 0 0 16px; color: #4a4a4a; font-size: 16px; line-height: 1.5;">Thanks for getting in touch. We've received your message regarding &ldquo;${subject}&rdquo; and will get back to you as soon as we can.</p>
          <p style="margin: 0; color: #4a4a4a; font-size: 16px;">If your matter is urgent, you can also email us at <a href="mailto:hello@spair.co" style="color: #7BC85A;">hello@spair.co</a>.</p>
        </td></tr>
        <tr><td style="padding: 20px 40px; background-color: #f9f9f9; text-align: center; border-top: 1px solid #e5e5e5; border-radius: 0 0 8px 8px;">
          <p style="margin: 0; color: #8a8a8a; font-size: 12px;">© ${year} Spair Money. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

export async function sendNewContactNotificationEmail(data: NewContactNotificationData): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.warn("[EMAIL] RESEND_API_KEY not configured. New contact notification will not be sent.");
    return;
  }
  const finalFromEmail = "Spair Money <noreply@spair.co>";
  try {
    const name = data.fromName.replace(/</g, "&lt;");
    const email = data.fromEmail.replace(/</g, "&lt;");
    const subject = data.subject.replace(/</g, "&lt;");
    const message = data.message.replace(/</g, "&lt;").replace(/\n/g, "<br>");
    const year = new Date().getFullYear();
    const logoUrl = getLogoUrl();
    const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>New contact - Spair Money</title></head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr><td align="center" style="padding: 40px 20px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px;">
        <tr><td style="padding: 30px 40px 20px;"><img src="${logoUrl}" alt="Spair Money" style="height: 32px; width: auto;" /></td></tr>
        <tr><td style="padding: 0 40px 40px;">
          <h1 style="margin: 0 0 20px; color: #1a1a1a; font-size: 28px; font-weight: 700;">New contact form submission</h1>
          <p style="margin: 0 0 8px; color: #4a4a4a; font-size: 16px;"><strong>From:</strong> ${name} &lt;${email}&gt;</p>
          <p style="margin: 0 0 8px; color: #4a4a4a; font-size: 16px;"><strong>Subject:</strong> ${subject}</p>
          <p style="margin: 0 0 16px; color: #4a4a4a; font-size: 16px;"><strong>Message:</strong></p>
          <p style="margin: 0 0 16px; color: #4a4a4a; font-size: 16px; line-height: 1.5;">${message}</p>
        </td></tr>
        <tr><td style="padding: 20px 40px; background-color: #f9f9f9; text-align: center; border-top: 1px solid #e5e5e5; border-radius: 0 0 8px 8px;">
          <p style="margin: 0; color: #8a8a8a; font-size: 12px;">© ${year} Spair Money. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
    const result = await resend.emails.send({
      from: finalFromEmail,
      to: NEW_SIGNUP_NOTIFICATION_TO,
      subject: `New contact: ${data.subject}`,
      html,
    });
    if (result.error) {
      console.error("[EMAIL] New contact notification error:", result.error);
      return;
    }
    console.log("[EMAIL] New contact notification sent to", NEW_SIGNUP_NOTIFICATION_TO);
  } catch (error) {
    console.error("[EMAIL] Error sending new contact notification:", error);
  }
}

export async function sendPasswordChangedEmail(data: PasswordChangedEmailData): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.warn("[EMAIL] RESEND_API_KEY not configured. Password changed email will not be sent.");
    return;
  }
  const finalFromEmail = "Spair Money <noreply@spair.co>";
  try {
    const result = await resend.emails.send({
      from: finalFromEmail,
      to: data.to,
      subject: "Your Spair Money password was changed",
      html: getPasswordChangedEmailTemplate(data),
    });
    if (result.error) {
      console.error("[EMAIL] Password changed email error:", result.error);
      return;
    }
    console.log("[EMAIL] Password changed email sent to:", data.to);
  } catch (error) {
    console.error("[EMAIL] Error sending password changed email:", error);
  }
}

function getPasswordChangedEmailTemplate(data: PasswordChangedEmailData): string {
  const userName = (data.userName?.trim() || "there").replace(/</g, "&lt;");
  const year = new Date().getFullYear();
  const logoUrl = getLogoUrl();
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Password changed - Spair Money</title></head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr><td align="center" style="padding: 40px 20px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px;">
        <tr><td style="padding: 30px 40px 20px;"><img src="${logoUrl}" alt="Spair Money" style="height: 32px; width: auto;" /></td></tr>
        <tr><td style="padding: 0 40px 40px;">
          <h1 style="margin: 0 0 20px; color: #1a1a1a; font-size: 28px; font-weight: 700;">Password changed</h1>
          <p style="margin: 0 0 16px; color: #4a4a4a; font-size: 16px; line-height: 1.5;">Hi ${userName},</p>
          <p style="margin: 0 0 16px; color: #4a4a4a; font-size: 16px; line-height: 1.5;">Your Spair Money password was recently changed. If you made this change, you can ignore this email.</p>
          <p style="margin: 0; color: #4a4a4a; font-size: 16px;">If you didn't change your password, please contact us immediately at <a href="mailto:hello@spair.co" style="color: #7BC85A;">hello@spair.co</a>.</p>
        </td></tr>
        <tr><td style="padding: 20px 40px; background-color: #f9f9f9; text-align: center; border-top: 1px solid #e5e5e5; border-radius: 0 0 8px 8px;">
          <p style="margin: 0; color: #8a8a8a; font-size: 12px;">© ${year} Spair Money. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}
