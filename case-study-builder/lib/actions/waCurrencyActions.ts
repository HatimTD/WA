'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * Resolve the default currency for the signed-in user, based on their
 * subsidiary's `currencyCode`. Used to pre-fill the currency picker on the
 * "create case study" wizard so contributors don't have to remember which
 * currency their subsidiary trades in (they can still override). Edit forms
 * keep the case's saved currency and only fall back here when absent.
 *
 * Resolution order:
 *   1. user.subsidiary.currencyCode (primary subsidiary)
 *   2. first userSubsidiaries[].subsidiary.currencyCode (multi-assignment)
 *   3. 'EUR' (application default)
 *
 * Returns the code plus the subsidiary name when found so the UI can show
 * a helpful "Based on your subsidiary (X) — change if needed" hint.
 */
export async function waGetUserDefaultCurrency(): Promise<{
  currency: string;
  subsidiaryName: string | null;
  source: 'primary' | 'multi' | 'fallback';
}> {
  const session = await auth();
  if (!session?.user?.id) {
    return { currency: 'EUR', subsidiaryName: null, source: 'fallback' };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        subsidiary: { select: { currencyCode: true, name: true } },
        userSubsidiaries: {
          take: 1,
          select: {
            subsidiary: { select: { currencyCode: true, name: true } },
          },
        },
      },
    });

    if (user?.subsidiary?.currencyCode) {
      return {
        currency: user.subsidiary.currencyCode,
        subsidiaryName: user.subsidiary.name,
        source: 'primary',
      };
    }
    const first = user?.userSubsidiaries?.[0]?.subsidiary;
    if (first?.currencyCode) {
      return {
        currency: first.currencyCode,
        subsidiaryName: first.name,
        source: 'multi',
      };
    }
  } catch (err) {
    console.error('[waGetUserDefaultCurrency] lookup failed:', err);
  }

  return { currency: 'EUR', subsidiaryName: null, source: 'fallback' };
}
