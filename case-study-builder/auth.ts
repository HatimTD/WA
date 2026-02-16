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

// Add credentials provider for testing (available in production for testing purposes)
providers.push(
    Credentials({
      name: 'Dev Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('[Auth Debug] Missing credentials');
          return null;
        }

        const email = (credentials.email as string).toLowerCase().trim();
        const password = credentials.password as string;

        // Check environment-based dev credentials (development only)
        const DEV_EMAIL = process.env.DEV_ADMIN_EMAIL;
        const DEV_PASSWORD_HASH = process.env.DEV_ADMIN_PASSWORD_HASH;

        if (process.env.NODE_ENV === 'development' && DEV_EMAIL && DEV_PASSWORD_HASH) {
          const passwordMatch = await bcrypt.compare(password, DEV_PASSWORD_HASH);
          if (email === DEV_EMAIL && passwordMatch) {
            let user = await prisma.user.findUnique({
              where: { email: DEV_EMAIL },
            });

            if (!user) {
              user = await prisma.user.create({
                data: {
                  email: DEV_EMAIL,
                  name: 'Dev Admin',
                  role: 'ADMIN',
                  emailVerified: new Date(),
                },
              });
            }

            return {
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.image,
              role: user.role,
            };
          }
        }

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
    async signIn({ user, account, profile }) {
      // Allow dev admin account in development
      const DEV_EMAIL = process.env.DEV_ADMIN_EMAIL;
      if (process.env.NODE_ENV === 'development' && DEV_EMAIL && user.email === DEV_EMAIL) {
        return true;
      }

      // Allow credentials provider for testing
      if (account?.provider === 'credentials') {
        return true;
      }

      // Domain restriction is configured in Google Cloud Console
      // All authenticated Google users are allowed
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
                // Update user's ssoUid if not set (NetSuite employee ID)
                if (!dbUser.ssoUid && nsEmployee.netsuiteInternalId) {
                  await prisma.user.update({
                    where: { id: dbUser.id },
                    data: { ssoUid: nsEmployee.netsuiteInternalId },
                  });
                }

                // Update user's name from NetSuite if not set
                if (!dbUser.name && nsEmployee.firstname) {
                  const fullName = [
                    nsEmployee.firstname,
                    nsEmployee.middlename,
                    nsEmployee.lastname,
                  ]
                    .filter(Boolean)
                    .join(' ');

                  await prisma.user.update({
                    where: { id: dbUser.id },
                    data: { name: fullName },
                  });

                  token.name = fullName;
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

      return token;
    },
  },
});
