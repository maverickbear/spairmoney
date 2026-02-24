/**
 * Server-only redirect helper for next-intl.
 * Use this in Server Components instead of redirect() when passing a string path,
 * so locale is resolved automatically.
 */
import { getLocale } from "next-intl/server";
import { redirect as intlRedirect } from "./navigation";

export async function redirectTo(href: string): Promise<never> {
  const locale = await getLocale();
  intlRedirect({ href, locale });
  throw new Error("Redirect should have thrown");
}
