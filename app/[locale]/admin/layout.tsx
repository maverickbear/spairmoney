/**
 * Root layout for /admin/*. Actual shell (nav, auth) lives in (dashboard)/layout.tsx.
 * This ensures the admin segment is registered so routes like /admin/docs resolve.
 */
export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
