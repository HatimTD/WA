import { NextRequest, NextResponse } from 'next/server';
import { SAML, ValidateInResponseTo } from '@node-saml/node-saml';
import { encode } from '@auth/core/jwt';
import prisma from '@/lib/prisma';
import { waAutoAssignSubsidiaryFromNetSuite } from '@/lib/actions/waUserSubsidiaryActions';
import { createImmutableAuditLog } from '@/lib/immutable-audit-logger';

/**
 * SAML SSO ACS (Assertion Consumer Service) Endpoint
 * POST /api/auth/saml
 *
 * Receives SAML POST from Google Workspace when user clicks the ICA app
 * in the Google Waffle menu. Validates the assertion, looks up the user,
 * mints a NextAuth-compatible JWT session, and redirects to dashboard.
 *
 * ISO 27001: All SAML login attempts are logged.
 */

function getSamlClient() {
  const cert = process.env.GOOGLE_SAML_CERT;
  if (!cert) {
    throw new Error('GOOGLE_SAML_CERT environment variable not set');
  }

  const appUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL || 'https://ica.welding-alloys.app';

  return new SAML({
    idpCert: cert,
    issuer: 'weldingalloys-ica-app',
    callbackUrl: `${appUrl}/api/auth/saml`,
    validateInResponseTo: ValidateInResponseTo.never, // Required for IdP-initiated SSO (Google sends POST without prior AuthnRequest)
    wantAssertionsSigned: true,
    wantAuthnResponseSigned: false, // Google signs the assertion, not always the outer response
    acceptedClockSkewMs: 5000, // 5 second tolerance for clock drift
    audience: 'weldingalloys-ica-app',
  });
}

export async function POST(request: NextRequest) {
  const appUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL || 'https://ica.welding-alloys.app';
  const isSecure = appUrl.startsWith('https');

  try {
    // 1. Parse the form-encoded POST body from Google
    const formData = await request.formData();
    const SAMLResponse = formData.get('SAMLResponse') as string;
    const RelayState = formData.get('RelayState') as string | null;

    if (!SAMLResponse) {
      console.error('[SAML] Missing SAMLResponse in POST body');
      return NextResponse.redirect(new URL('/login?error=saml_missing_response', appUrl));
    }

    // 2. Validate the SAML response against Google's certificate
    const saml = getSamlClient();
    const { profile } = await saml.validatePostResponseAsync({ SAMLResponse });

    if (!profile || !profile.nameID) {
      console.error('[SAML] No profile or nameID in validated response');
      return NextResponse.redirect(new URL('/login?error=saml_no_profile', appUrl));
    }

    const email = profile.nameID.toLowerCase().trim();
    console.log('[SAML] Validated SSO login for:', email, '| Issuer:', profile.issuer);

    // 3. Look up user in database
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        region: true,
        totalPoints: true,
        image: true,
      },
    });

    if (!user) {
      console.warn('[SAML] User not found in database:', email);
      return NextResponse.redirect(new URL('/login?error=saml_user_not_found', appUrl));
    }

    // 4. Fetch subsidiaries for the token
    const userSubsidiaries = await prisma.waUserSubsidiary.findMany({
      where: { userId: user.id },
      select: { subsidiary: { select: { id: true, name: true, region: true } } },
    });

    const subsidiaries = userSubsidiaries.map((us) => ({
      id: us.subsidiary.id,
      name: us.subsidiary.name,
      region: us.subsidiary.region,
    }));
    const regions = [...new Set(subsidiaries.map((s) => s.region))];

    // 5. Auto-assign subsidiary if user has none (same as OAuth flow)
    if (subsidiaries.length === 0) {
      try {
        const nsEmployee = await prisma.waNetsuiteEmployee.findUnique({
          where: { email },
          select: { netsuiteInternalId: true, subsidiarynohierarchy: true },
        });
        if (nsEmployee?.netsuiteInternalId && nsEmployee?.subsidiarynohierarchy) {
          const assignResult = await waAutoAssignSubsidiaryFromNetSuite(user.id, nsEmployee.netsuiteInternalId);
          if (assignResult.success && assignResult.subsidiary) {
            subsidiaries.push(assignResult.subsidiary);
            regions.push(assignResult.subsidiary.region);
            console.log('[SAML] Auto-assigned subsidiary:', assignResult.subsidiary.name, 'to', email);
          }
        }
      } catch (assignError) {
        console.error('[SAML] Subsidiary auto-assign failed for', email, assignError);
      }
    }

    // 6. Mint a NextAuth-compatible JWT
    const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
    if (!secret) {
      console.error('[SAML] No AUTH_SECRET configured');
      return NextResponse.redirect(new URL('/login?error=saml_config_error', appUrl));
    }

    // Cookie name matches what NextAuth uses
    const cookieName = isSecure
      ? '__Secure-authjs.session-token'
      : 'authjs.session-token';

    const token = await encode({
      token: {
        sub: user.id,
        name: user.name,
        email: user.email,
        picture: user.image,
        role: user.role,
        region: user.region,
        totalPoints: user.totalPoints,
        subsidiaries,
        regions,
      },
      secret,
      salt: cookieName, // Salt must match the cookie name
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    // 7. Set the session cookie and redirect to dashboard
    const redirectUrl = RelayState || '/dashboard';
    const response = NextResponse.redirect(new URL(redirectUrl, appUrl));

    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    console.log('[SAML] Login successful for', email, '→ redirecting to', redirectUrl);

    // 8. Audit log for SAML SSO login (ISO 27001 compliance)
    try {
      await createImmutableAuditLog({
        actionType: 'LOGIN',
        userId: user.id,
        userEmail: email,
        metadata: {
          additionalData: { method: 'SAML_SSO', issuer: profile.issuer },
        },
      });
    } catch (auditError) {
      // Never block login if audit logging fails
      console.error('[SAML] Audit log failed for', email, auditError);
    }

    return response;
  } catch (error) {
    console.error('[SAML] Validation error:', error);
    return NextResponse.redirect(new URL('/login?error=saml_validation_failed', appUrl));
  }
}
