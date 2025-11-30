import Script from "next/script";
import { createServiceRoleClient } from "@/src/infrastructure/database/supabase-server";

async function getGoogleTagId(): Promise<string | null> {
  try {
    const supabase = createServiceRoleClient();
    const { data: settings } = await supabase
      .from("SystemSettings")
      .select("seoSettings")
      .eq("id", "default")
      .single();

    if (settings?.seoSettings?.googleTagId) {
      return settings.seoSettings.googleTagId;
    }
  } catch (error) {
    console.error("Error fetching Google Tag ID:", error);
  }
  return null;
}

export async function GoogleTag() {
  const googleTagId = await getGoogleTagId();

  if (!googleTagId) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${googleTagId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${googleTagId}');
        `}
      </Script>
    </>
  );
}

