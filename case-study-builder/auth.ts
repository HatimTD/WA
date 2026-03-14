import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { authConfig } from './auth.config';
import prisma from '@/lib/prisma';
import type { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import type { Provider } from 'next-auth/providers';
import { waAutoAssignSubsidiaryFromNetSuite } from '@/lib/actions/waUserSubsidiaryActions';

const providers: Provider[] = [
  Google({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    authorization: {
      params: {
        prompt: 'consent',
        access_type: 'offline',
        response_type: 'code',
        // Domain restriction is configured in Google Cloud Console
      },
    },
  }),
];

// Credentials provider for pre-defined accounts (email + password login)
providers.push(
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = (credentials.email as string).toLowerCase().trim();
        const password = credentials.password as string;

        // Check database for users with credentials accounts
        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            accounts: {
              where: {
                provider: 'credentials',
              },
            },
          },
        });

        if (!user || !user.accounts || user.accounts.length === 0) {
          return null;
        }

        // Verify password (stored in access_token field)
        const account = user.accounts[0];
        if (!account.access_token) {
          return null;
        }

        const isValid = await bcrypt.compare(password, account.access_token);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    })
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: 'jwt' },
  providers,
  callbacks: {
    async signIn() {
      // All providers allowed (Google OAuth + credentials for pre-defined accounts)
      // Domain restriction enforced in Google Cloud Console
      return true;
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      if (token.role && session.user) {
        session.user.role = token.role as Role;
      }
      if (token.region && session.user) {
        session.user.region = token.region as string;
      }
      if (token.totalPoints !== undefined && session.user) {
        session.user.totalPoints = token.totalPoints as number;
      }
      // Ensure name is preserved from token
      if (token.name && session.user) {
        session.user.name = token.name as string;
      }
      // Add subsidiaries and regions to session
      if (token.subsidiaries && session.user) {
        session.user.subsidiaries = token.subsidiaries as Array<{ id: string; name: string; region: string }>;
      }
      if (token.regions && session.user) {
        session.user.regions = token.regions as string[];
      }
      return session;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        // Fetch user data AND subsidiaries in parallel (both essential for session)
        const [dbUser, userSubsidiaries] = await Promise.all([
          prisma.user.findUnique({
            where: { id: user.id },
            select: { id: true, role: true, region: true, totalPoints: true, name: true, email: true, ssoUid: true },
          }),
          prisma.waUserSubsidiary.findMany({
            where: { userId: user.id },
            select: { subsidiary: { select: { id: true, name: true, region: true } } },
          }),
        ]);

        if (dbUser) {
          token.role = dbUser.role;
          token.region = dbUser.region;
          token.totalPoints = dbUser.totalPoints;
          token.name = dbUser.name || user.name;

          // Set subsidiaries from parallel fetch
          const subsidiaries = userSubsidiaries.map((us) => ({
            id: us.subsidiary.id, name: us.subsidiary.name, region: us.subsidiary.region,
          }));
          token.subsidiaries = subsidiaries;
          token.regions = [...new Set(subsidiaries.map((s) => s.region))];

          // NetSuite sync runs in background - don't block the OAuth callback
          // This prevents Vercel function timeout on cold starts
          const userId = dbUser.id;
          const userEmail = dbUser.email;
          const userSsoUid = dbUser.ssoUid;
          const userName = dbUser.name;

          if (userEmail) {
            // Fire and forget - don't await
            (async () => {
              try {
                const nsEmployee = await prisma.waNetsuiteEmployee.findUnique({
                  where: { email: userEmail.toLowerCase().trim() },
                  select: {
                    netsuiteInternalId: true,
                    firstname: true,
                    middlename: true,
                    lastname: true,
                    subsidiarynohierarchy: true,
                  },
                });

                if (nsEmployee) {
                  const updateData: Record<string, string> = {};
                  if (!userSsoUid && nsEmployee.netsuiteInternalId) {
                    updateData.ssoUid = nsEmployee.netsuiteInternalId;
                  }
                  if (!userName && nsEmployee.firstname) {
                    updateData.name = [nsEmployee.firstname, nsEmployee.middlename, nsEmployee.lastname]
                      .filter(Boolean).join(' ');
                  }
                  if (Object.keys(updateData).length > 0) {
                    await prisma.user.update({ where: { id: userId }, data: updateData });
                  }
                  if (nsEmployee.netsuiteInternalId && nsEmployee.subsidiarynohierarchy) {
                    await waAutoAssignSubsidiaryFromNetSuite(userId, nsEmployee.netsuiteInternalId);
                  }
                }
              } catch {
                // Non-critical - sync will happen on next login
              }
            })();
          }

          // Subsidiaries already fetched in parallel above
        }
      }

      // Handle session updates
      if (trigger === 'update' && session) {
        token = { ...token, ...session.user };
      }

      // Refresh role and points from DB periodically (every 60s)
      // This ensures admin role changes take effect without re-login
      // while avoiding a DB query on every single request
      if (token.sub && !user) {
        const now = Date.now();
        const lastRefresh = (token.lastRoleRefresh as number) || 0;
        const REFRESH_INTERVAL_MS = 60_000; // 60 seconds

        if (now - lastRefresh > REFRESH_INTERVAL_MS) {
          try {
            const freshUser = await prisma.user.findUnique({
              where: { id: token.sub },
              select: { role: true, totalPoints: true, userRoles: { select: { role: true } } },
            });
            if (freshUser) {
              // Use highest priority role from userRoles (ADMIN > APPROVER > others)
              const allRoles = freshUser.userRoles?.map(ur => ur.role) || [freshUser.role];
              if (allRoles.includes('ADMIN')) {
                token.role = 'ADMIN';
              } else if (allRoles.includes('APPROVER')) {
                token.role = 'APPROVER';
              } else {
                token.role = freshUser.role;
              }
              token.totalPoints = freshUser.totalPoints;
              token.lastRoleRefresh = now;
            }
          } catch {
            // Continue with cached token values
          }
        }
      }

      return token;
    },
  },
});
