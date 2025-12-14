import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Okta from 'next-auth/providers/okta';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { authConfig } from './auth.config';
import prisma from '@/lib/prisma';
import type { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import type { Provider } from 'next-auth/providers';

const providers: Provider[] = [
  Google({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    authorization: {
      params: {
        prompt: 'consent',
        access_type: 'offline',
        response_type: 'code',
        hd: 'weldingalloys.com', // Restrict to company domain only
      },
    },
  }),
];

// Add Okta SSO provider if configured (BRD 5.1 - SSO Integration)
if (process.env.OKTA_CLIENT_ID && process.env.OKTA_CLIENT_SECRET && process.env.OKTA_ISSUER) {
  providers.push(
    Okta({
      clientId: process.env.OKTA_CLIENT_ID,
      clientSecret: process.env.OKTA_CLIENT_SECRET,
      issuer: process.env.OKTA_ISSUER,
      authorization: {
        params: {
          scope: 'openid email profile',
        },
      },
      profile(profile) {
        // Map Okta profile to our user model
        return {
          id: profile.sub,
          name: profile.name || profile.preferred_username,
          email: profile.email,
          image: profile.picture || null,
          // Okta can pass custom claims for role/region
          role: profile.role || 'CONTRIBUTOR',
          region: profile.region || null,
        };
      },
    })
  );
}

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

        const email = credentials.email as string;
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

      // Allow Okta SSO provider (trusted identity provider)
      if (account?.provider === 'okta') {
        // Okta is a trusted SSO provider - accept users from company domain
        if (user.email?.endsWith('@weldingalloys.com')) {
          return true;
        }
        // Optionally allow all Okta users if SSO is the sole auth method
        // return true;
        return false;
      }

      // Check if email is from weldingalloys.com domain
      if (!user.email?.endsWith('@weldingalloys.com')) {
        return false; // Reject sign-in if not from company domain
      }
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
