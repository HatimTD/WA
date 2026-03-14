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
        // Fetch full user data from database
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.region = dbUser.region;
          token.totalPoints = dbUser.totalPoints;
          // Ensure name is stored in token
          token.name = dbUser.name || user.name;

          // NetSuite Employee Auto-Sync: Check if email exists in NetSuite employees
          if (dbUser.email) {
            try {
              const nsEmployee = await prisma.waNetsuiteEmployee.findUnique({
                where: { email: dbUser.email.toLowerCase().trim() },
                select: {
                  netsuiteInternalId: true,
                  firstname: true,
                  middlename: true,
                  lastname: true,
                  subsidiarynohierarchy: true,
                },
              });

              if (nsEmployee) {
                // Build a single update for ssoUid and name if needed
                const updateData: Record<string, string> = {};

                if (!dbUser.ssoUid && nsEmployee.netsuiteInternalId) {
                  updateData.ssoUid = nsEmployee.netsuiteInternalId;
                }

                if (!dbUser.name && nsEmployee.firstname) {
                  const fullName = [
                    nsEmployee.firstname,
                    nsEmployee.middlename,
                    nsEmployee.lastname,
                  ]
                    .filter(Boolean)
                    .join(' ');
                  updateData.name = fullName;
                  token.name = fullName;
                }

                if (Object.keys(updateData).length > 0) {
                  await prisma.user.update({
                    where: { id: dbUser.id },
                    data: updateData,
                  });
                }

                // Auto-assign subsidiary from NetSuite (only if exists)
                if (nsEmployee.netsuiteInternalId && nsEmployee.subsidiarynohierarchy) {
                  await waAutoAssignSubsidiaryFromNetSuite(
                    dbUser.id,
                    nsEmployee.netsuiteInternalId
                  );
                }
              }
            } catch (error) {
              console.error('[Auth] NetSuite employee auto-sync error:', error);
              // Continue without failing the login
            }
          }

          // Fetch user's subsidiaries and compute regions
          try {
            const userSubsidiaries = await prisma.waUserSubsidiary.findMany({
              where: { userId: dbUser.id },
              select: {
                subsidiary: {
                  select: {
                    id: true,
                    name: true,
                    region: true,
                  },
                },
              },
            });

            const subsidiaries = userSubsidiaries.map((us) => ({
              id: us.subsidiary.id,
              name: us.subsidiary.name,
              region: us.subsidiary.region,
            }));

            const regions = [...new Set(subsidiaries.map((s) => s.region))];

            // Add to token
            token.subsidiaries = subsidiaries;
            token.regions = regions;
          } catch (error) {
            console.error('[Auth] Error fetching subsidiaries:', error);
            token.subsidiaries = [];
            token.regions = [];
          }
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
