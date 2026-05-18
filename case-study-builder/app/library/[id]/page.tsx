import { redirect } from 'next/navigation';

/**
 * Legacy public case-study route. The library is not public; forward to the
 * authenticated detail page. The proxy/middleware enforces authentication
 * before this runs, so unauthenticated visitors are sent to /login.
 */
export default async function PublicCaseDetailRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ showOriginal?: string }>;
}) {
  const { id } = await params;
  const { showOriginal } = await searchParams;
  const qs = showOriginal ? `?showOriginal=${encodeURIComponent(showOriginal)}` : '';
  redirect(`/dashboard/library/${id}${qs}`);
}
