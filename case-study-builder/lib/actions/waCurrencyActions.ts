'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import type { Role } from '@prisma/client';

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
 * a helpful "Based on your subsidiary (X) — change if needed" hint. Also
 * returns the user's role so the hint can switch copy for ADMIN/APPROVER
 * users (who intentionally span subsidiaries) versus contributors (where
 * a missing subsidiary is a real data problem).
 */
export async function waGetUserDefaultCurrency(): Promise<{
  currency: string;
  subsidiaryName: string | null;
  source: 'primary' | 'multi' | 'fallback';
  userRole: Role | null;
}> {
  const session = await auth();
  if (!session?.user?.id) {
    return { currency: 'EUR', subsidiaryName: null, source: 'fallback', userRole: null };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        role: true,
        subsidiary: { select: { currencyCode: true, name: true } },
        userSubsidiaries: {
          take: 1,
          select: {
            subsidiary: { select: { currencyCode: true, name: true } },
          },
        },
      },
    });

    const userRole = user?.role ?? null;

    if (user?.subsidiary?.currencyCode) {
      return {
        currency: user.subsidiary.currencyCode,
        subsidiaryName: user.subsidiary.name,
        source: 'primary',
        userRole,
      };
    }
    const first = user?.userSubsidiaries?.[0]?.subsidiary;
    if (first?.currencyCode) {
      return {
        currency: first.currencyCode,
        subsidiaryName: first.name,
        source: 'multi',
        userRole,
      };
    }

    return { currency: 'EUR', subsidiaryName: null, source: 'fallback', userRole };
  } catch (err) {
    console.error('[waGetUserDefaultCurrency] lookup failed:', err);
  }

  return { currency: 'EUR', subsidiaryName: null, source: 'fallback', userRole: null };
}
