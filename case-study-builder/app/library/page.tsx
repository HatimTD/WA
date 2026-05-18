import { redirect } from 'next/navigation';

/**
 * The case study library is NOT public. It lives at /dashboard/library and is
 * reachable by every authenticated role (including VIEWER). This legacy
 * top-level route only forwards to the authenticated library so old links keep
 * working. Authentication is enforced by the proxy/middleware before this
 * component ever runs - an unauthenticated visitor is sent to /login.
 */
export default async function PublicLibraryRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') qs.set(key, value);
  }
  const query = qs.toString();
  redirect(`/dashboard/library${query ? `?${query}` : ''}`);
}
