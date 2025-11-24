# Plaid Security Questionnaire - Form Responses

**Quick copy-paste responses for the Plaid security questionnaire form.**

---

## Question 1: Information Security Contact Information

**Response Format for Plaid Form (using bullets):**

- **Name:** Naor Tartarotti
- **Title:** Founder / Information Security Officer
- **Email:** naor@sparefinance.com
- **Group Email:** security@sparefinance.com (monitored regularly)

**Alternative Contact (if form allows):**
- **Email:** legal@sparefinance.com (for legal and compliance matters)

**Additional Notes (if form has a notes/comments field):**
- The security@sparefinance.com email address is actively monitored and serves as the primary point of contact for all security-related inquiries, including those from Plaid's compliance team
- For urgent security matters, please use this email address
- This group email is checked regularly to ensure timely responses to security inquiries

---

## Question 2: Information Security Policy and Procedures

**Answer:** Yes - We have a documented policy, procedures, and an operational information security program that is continuously matured

**Response (if form has a text/comments field):**

Our organization has documented information security policies and procedures that are operationalized to identify, mitigate, and monitor information security risks relevant to our business. Our security framework includes:

- **Row Level Security (RLS):** 160+ database policies protecting 38+ tables to ensure data isolation between users and households
- **Content Security Policy (CSP):** Strict CSP headers configured in Next.js to prevent XSS attacks
- **Rate Limiting:** API endpoint protection to prevent abuse and DDoS attacks
- **Data Encryption:** Sensitive data encrypted at rest using AES-256-GCM encryption; all data in transit encrypted using TLS 1.2+
- **Secure Headers:** HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and Permissions-Policy headers
- **Authentication & Authorization:** Supabase Auth with email verification and password hashing; Role-based access control (RBAC) with household member permissions
- **Security Logging:** Audit trail for critical actions and security events
- **Input Validation:** All user inputs validated before processing to prevent injection attacks
- **Secure Development Practices:** Secure coding standards, dependency management, and security best practices

**Policy Documentation:**
- Security practices are documented in our Privacy Policy (available at https://sparefinance.com/privacy-policy)
- Terms of Service outline security responsibilities (available at https://sparefinance.com/terms-of-service)
- Security measures are reviewed and updated as needed to address new threats and maintain compliance

**Operationalization:**
- Security policies are enforced at the application, database, and infrastructure levels
- Security reviews and updates are conducted as needed, with continuous monitoring through Sentry and security logging
- Security incidents are logged and monitored through Sentry error tracking

---

## Question 3: Access Controls for Production Assets

**Answer:** Select all that apply:

**Definitely Select (Confirmed):**
- ✅ **A defined and documented access control policy is in place**
- ✅ **Role-based access control (RBAC)**
- ✅ **Centralized identity and access management solutions**
- ✅ **Use of OAuth tokens or TLS certificates for non-human authentication**

**Response (if form has a text/comments field):**

**Access Control Policy:**
- Access control policies are documented in our Privacy Policy (https://sparefinance.com/privacy-policy) and Terms of Service (https://sparefinance.com/terms-of-service)
- 160+ Row Level Security (RLS) policies enforce data access controls across 38+ database tables
- All access control policies are operationalized at the application, database, and infrastructure levels

**Role-Based Access Control (RBAC):**
- Implemented via Supabase Auth with user roles: super_admin, admin, member, and owner
- Household member permissions control data sharing between users
- Role-based functions verify access: `isAdmin()`, `getUserRole()`, `can_access_household_data()`
- Database-level RLS policies enforce role-based access automatically

**Centralized Identity and Access Management:**
- Supabase Auth provides centralized identity and access management for all users
- Single sign-on (SSO) through Supabase Auth with email verification
- All authentication flows go through centralized Supabase Auth service
- Session management handled centrally with secure token-based authentication

**OAuth Tokens and TLS Certificates:**
- OAuth tokens used for third-party integrations (Plaid Link, Stripe Payment API)
- TLS 1.2+ certificates used for all connections (client-server, database, third-party APIs)
- API keys for third-party services stored securely in encrypted environment variables
- All service-to-service communications use TLS encryption

**Additional Implementation Details:**
- Production database access restricted to authenticated users only through Supabase Auth
- All API endpoints verify user authentication before processing requests
- Database queries protected by Row Level Security policies that automatically filter data based on user identity and household membership
- Access to production systems limited to authorized personnel only
- Sensitive configuration and API keys stored as encrypted environment variables
- Secure session tokens required for all authenticated requests
- Household data sharing controlled through explicit household member permissions and RLS policies

---

## Question 4: Multi-Factor Authentication (MFA) for Consumers Before Plaid Link

**Answer:** Yes - Non-phishing-resistant multi-factor authentication is performed (e.g., SMS, email, question and answer pairs, etc.)

**Response (if form has a text/comments field):**

Our application requires email verification (OTP - One-Time Password) before users can access the application and use Plaid Link. The authentication flow is as follows:

**Authentication Flow:**
- **User Registration:** Users must sign up with email and password
- **Email Verification (OTP):** Users receive an OTP via email that must be verified before account activation
- **Account Access:** Users cannot access protected features (including Plaid Link) until email is verified
- **Session Management:** Authenticated sessions are managed securely via Supabase Auth

**Implementation:**
- Email verification is mandatory - users cannot access the application without verifying their email
- OTP codes are sent via secure email through Supabase Auth
- Plaid Link is only accessible to authenticated and verified users
- The application uses protected routes that redirect unauthenticated users to login
- Users must complete email verification before accessing any financial features

**Technical Details:**
- Email verification is enforced at the application level
- Protected routes check for verified email status (`email_confirmed_at`) before allowing access
- Plaid Link integration requires both authentication and email verification
- OTP codes are sent via secure email through Supabase Auth
- Email verification serves as the second authentication factor (password + email OTP)

**Note:** Email-based OTP is classified as non-phishing-resistant MFA because email accounts can potentially be compromised. This provides strong security for most use cases, though phishing-resistant methods (biometrics, passkeys, hardware OTP tokens) offer enhanced protection.

---

## Question 5: Multi-Factor Authentication (MFA) for Critical Systems

**Answer:** Yes - Non-phishing-resistant multi-factor authentication is performed (e.g., SMS, email, question and answer pairs, etc.)

**Response (if form has a text/comments field):**

Multi-factor authentication is implemented for access to critical systems that store or process consumer financial data:

**For Production Systems:**
- **Supabase Database:** Access is controlled through Supabase Auth with email verification (OTP)
- **API Endpoints:** All API endpoints require valid authentication tokens obtained after email verification
- **Admin Access:** Administrative access requires authentication and email verification, and is logged
- **Third-Party Services:** Access to third-party services (Plaid, Stripe) uses API keys stored securely in encrypted environment variables

**Authentication Methods:**
- Primary authentication via Supabase Auth (email/password with email verification/OTP)
- Session tokens are required for all API requests
- Database access is restricted to authenticated users through RLS policies
- All sensitive operations require valid user sessions
- Email verification serves as the second factor in the authentication process

**Infrastructure Access:**
- Administrative access to production infrastructure requires authentication
- All access attempts are logged and monitored through Sentry
- API keys for third-party services are stored securely in encrypted environment variables and never exposed in code

**MFA Implementation for Critical Systems:**
- All access to systems storing consumer financial data requires email verification (OTP)
- Database access is protected by Supabase Auth with email verification
- API endpoints require valid authentication tokens (obtained after email verification)
- Administrative functions require authentication and email verification
- Session tokens are required for all operations on financial data

**Note:** Email-based OTP is classified as non-phishing-resistant MFA but provides strong security for protecting access to financial data systems. Supabase Auth supports additional MFA methods (SMS, authenticator apps, hardware tokens) which can be enabled for enhanced security if needed.

---

## Question 6: TLS Encryption for Data in Transit

**Answer:** Yes

**Response (if form has a text/comments field):**

Our organization encrypts all data in-transit between clients and servers using TLS 1.2 or better:

**Implementation:**
- **HTTPS Only:** All client-server communications use HTTPS/TLS
- **Security Headers:** Strict-Transport-Security (HSTS) header configured with `max-age=63072000; includeSubDomains; preload`
- **TLS Configuration:** Our hosting provider (Vercel) automatically provides TLS 1.2+ for all connections
- **API Communications:** All API endpoints are served over HTTPS
- **Database Connections:** All database connections to Supabase use encrypted TLS connections
- **Third-Party Integrations:** All communications with Plaid, Stripe, and other third-party services use TLS encryption

**Technical Configuration:**
- HSTS header: `max-age=63072000; includeSubDomains; preload` (configured in `next.config.ts`)
- All routes enforce HTTPS
- Upgrade insecure requests policy enabled in CSP headers (`upgrade-insecure-requests`)
- Security headers configured in Next.js configuration file

**Verification:**
- Security headers are configured in `next.config.ts` with HSTS enabled
- All external API calls use HTTPS endpoints
- Database connections are encrypted by default through Supabase
- No unencrypted HTTP connections are allowed in production

---

## Question 7: Encryption at Rest for Plaid Data

**Answer:** Yes - We encrypt ALL consumer data retrieved from the Plaid API at-rest

**Response (if form has a text/comments field):**

Our organization encrypts all consumer data received from the Plaid API at rest, not just sensitive PII. This includes account information, transactions, balances, and all other data received from Plaid.

**Implementation:**
- **Database Encryption:** All data stored in Supabase database is encrypted at rest (Supabase provides encryption at rest by default for all data)
- **Sensitive Data Encryption:** Sensitive data such as API tokens and credentials are encrypted using AES-256-GCM encryption before storage
- **Encryption Utilities:** We have custom encryption utilities (`lib/utils/encryption.ts`) for encrypting sensitive data
- **Transaction Data:** Financial transaction data is stored securely with encryption at rest
- **Account Information:** Bank account information received from Plaid is stored in encrypted database tables

**Technical Details:**
- Encryption algorithm: AES-256-GCM (for sensitive tokens and credentials)
- Database-level encryption: Provided by Supabase infrastructure for all data at rest
- Encryption keys are derived from secure environment variables
- Sensitive fields (Plaid access tokens) are encrypted before database insertion
- Decryption only occurs when data is needed for processing
- All Plaid data stored in database benefits from Supabase's encryption at rest

**Data Handling:**
- We never store bank credentials (username, password, PIN) - these are handled exclusively by Plaid
- We only store account information, transactions, and balances received from Plaid API
- All stored Plaid data is encrypted at rest in our database (via Supabase encryption at rest)
- Historical transaction data is retained with encryption at rest after account disconnection
- Plaid access tokens are additionally encrypted using AES-256-GCM before storage

---

## Question 8: Vulnerability Scanning and Management

**Answer:** Select all that apply:

**Definitely Select (Confirmed):**
- ✅ **We patch identified vulnerabilities within a defined SLA**
- ✅ **We actively monitor and address end-of-life (EOL) software in use**

**Response (if form has a text/comments field):**

We actively perform vulnerability management through multiple practices:

**Vulnerability Patching with Defined SLA:**
- Vulnerabilities identified through npm audit and security monitoring are patched according to severity:
  - Critical/High: Immediate patching
  - Medium: Within 7 days
  - Low: Within 30 days
- Security updates are prioritized in development cycles
- Regular dependency updates to patch known vulnerabilities

**End-of-Life (EOL) Software Monitoring:**
- We monitor dependency updates and security advisories for all technologies and frameworks in use
- Regularly update dependencies to address EOL software
- Monitor security advisories for Next.js, React, Supabase, and other core technologies
- Proactive dependency management to prevent EOL software usage

**Current Vulnerability Management Practices:**
- **Dependency Scanning:** We use npm/package.json for dependency management and regularly run `npm audit` to identify vulnerabilities
- **Code Review Process:** Code changes follow secure coding standards and are reviewed before deployment
- **Security Logging:** Security events are logged and monitored through `lib/utils/security-logging.ts`
- **Error Monitoring:** Sentry integration for error tracking and monitoring of security-related issues
- **Secure Coding Practices:** Input validation, SQL injection prevention (via Supabase parameterized queries), XSS protection through CSP headers
- **Security Advisory Monitoring:** We monitor security advisories for used technologies and frameworks

**Vulnerability Management Program:**
1. **Dependency Management:**
   - Regular `npm audit` scans
   - Manual review of security advisories
   - Regular dependency updates

2. **Code Security:**
   - Code changes follow secure coding standards and are reviewed before deployment
   - Secure coding guidelines followed
   - Input validation and sanitization

3. **Monitoring:**
   - Sentry error tracking for security-related errors
   - Security event logging
   - Continuous security monitoring and reviews as needed

4. **Response:**
   - Critical vulnerabilities are patched immediately
   - Security updates are prioritized in development cycles
   - Regular security assessments

**Note:** We perform dependency scanning (npm audit) and code reviews for production assets. For enhanced coverage, we recommend implementing additional automated vulnerability scanning tools (such as Snyk, Dependabot, or GitHub Security Advisories) and formal vulnerability scanning of employee/contractor machines.

---

## Question 9: Privacy Policy

**Answer:** Yes - This policy is displayed to end-users within the application

**Privacy Policy URL:**
https://sparefinance.com/privacy-policy

**Terms of Service URL:**
https://sparefinance.com/terms-of-service

**Response (if form has a text/comments field):**

Our organization has a comprehensive privacy policy for the application where Plaid Link will be deployed. The privacy policy is displayed to end-users within the application:

**Key Privacy Policy Elements:**
- Information collection practices
- How we use collected information
- Data sharing practices (including Plaid integration)
- Data security measures
- User rights and choices
- Data retention and deletion policies
- Third-party service disclosures (Plaid, Stripe)
- Contact information for privacy inquiries

**Plaid-Specific Disclosures:**
Our privacy policy specifically addresses:
- How Plaid is used for bank account connections
- What data we receive from Plaid (account information, transactions, balances)
- That we never store bank credentials (handled by Plaid)
- User's ability to disconnect bank accounts
- Data retention policies for Plaid-sourced data
- Plaid's privacy policy and security certifications (SOC 2 Type 2)

**Policy Accessibility:**
- Privacy policy is publicly accessible at https://sparefinance.com/privacy-policy
- Policy is linked during user registration and signup process
- Policy is accessible from the application footer on all pages
- Policy is linked in Terms of Service acceptance flows
- Policy is reviewed and updated as needed to maintain compliance and address new requirements

---

## Question 10: Consumer Consent for Data Collection

**Answer:** Yes

**Response (if form has a text/comments field):**

Our organization obtains explicit consent from consumers for the collection, processing, and storage of their data in compliance with applicable data privacy laws (GDPR, CCPA, PIPEDA):

**Consent Mechanisms:**
1. **Terms of Service Agreement:** Users must accept Terms of Service during registration (available at https://sparefinance.com/terms-of-service)
2. **Privacy Policy Acknowledgment:** Privacy policy is accessible and linked during signup (available at https://sparefinance.com/privacy-policy)
3. **Explicit Bank Connection Consent:** Users must explicitly authorize bank account connections through Plaid Link
4. **Household Member Consent:** Household members must accept invitations and consent to data sharing
5. **Data Processing Consent:** Users consent to data processing through account creation and service usage

**Implementation:**
- Users cannot create accounts without accepting Terms of Service
- Privacy policy is prominently displayed and linked during registration
- Plaid Link requires explicit user authorization before connecting accounts
- Users can revoke consent by disconnecting bank accounts or deleting their account
- Consent is documented through user account creation and service usage

**User Rights:**
- Users can access their data through account settings
- Users can request data deletion
- Users can disconnect bank accounts at any time
- Users can delete their account and request data removal
- Users can export their data in a portable format

**Consent Withdrawal:**
- Users can disconnect Plaid connections at any time
- Account deletion requests are processed immediately
- Data retention policies are clearly communicated in Privacy Policy

**Policy Review:**
- Privacy Policy and Terms of Service are reviewed periodically to ensure compliance with applicable data privacy laws
- Policies are updated to reflect changes in applicable laws and regulations (GDPR, CCPA, PIPEDA)
- Policy updates are communicated to users through Privacy Policy updates

---

## Question 11: Data Deletion and Retention Policy

**Answer:** Yes

**Response (if form has a text/comments field):**

Our organization has a defined and enforced data deletion and retention policy that complies with applicable data privacy laws (GDPR, CCPA, PIPEDA):

**Retention Policy:**
- **Active Accounts:** Data is retained for as long as the account is active and needed to provide services
- **Account Deletion:** Upon account deletion request, all user data is permanently deleted immediately from production systems (no grace period)
- **Backup Data:** Our database provider (Supabase) maintains automatic backups for disaster recovery. Backup retention is managed by Supabase according to their service terms (typically 7-30 days depending on the service plan). We do not maintain separate backup copies beyond the provider's automatic backup system
- **Security Logs:** Security and audit logs (including account blocks and suspensions) may be retained longer for security and compliance purposes
- **Legal Requirements:** Data may be retained longer if required by law, regulation, or legitimate business purposes (e.g., tax records, dispute resolution)
- **Plaid Data:** Historical transaction data from Plaid is retained after disconnection, but no new data is collected after disconnection

**Deletion Process:**
1. Users can request account deletion through account settings
2. Upon deletion request, all user data is permanently deleted immediately from production systems
3. All related data (transactions, accounts, budgets, goals, subscriptions) is removed from the system
4. Plaid connections are automatically disconnected upon account deletion
5. User account is deleted from authentication system (Supabase Auth)
6. All data deletion is processed through `delete_user_data` SQL function to ensure complete removal
7. Database backups maintained by Supabase follow their retention policies (typically 7-30 days depending on service plan). We do not maintain separate backup copies beyond the provider's automatic backup system

**Compliance:**
- Policy is reviewed periodically to ensure compliance with applicable laws (GDPR, CCPA, PIPEDA for Canadian companies)
- Policy is documented in our Privacy Policy (https://sparefinance.com/privacy-policy)
- Users are informed of retention periods in the Privacy Policy
- Deletion requests are processed immediately upon user request

**Review Process:**
- Data retention and deletion policies are reviewed periodically (at least annually)
- Policies are updated to reflect changes in applicable laws and regulations
- Policy updates are communicated to users through Privacy Policy updates
- Compliance with data protection regulations is maintained

**Legal Compliance:**
- Policy complies with applicable data privacy laws including:
  - GDPR (General Data Protection Regulation)
  - CCPA (California Consumer Privacy Act)
  - PIPEDA (Personal Information Protection and Electronic Documents Act) for Canadian companies
- Retention periods are determined based on legal requirements and business needs
- Users are informed of their rights regarding data deletion
- Account deletion is immediate - all data is permanently removed from the system when a user deletes their account

---

**Last Updated:** February 2025

