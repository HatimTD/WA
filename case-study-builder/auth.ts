import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { authConfig } from './auth.config';
import prisma from '@/lib/prisma';
import type { Role } from '@prisma/client';

const providers = [
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

// Add credentials provider in development mode only
if (process.env.NODE_ENV === 'development') {
  providers.push(
    Credentials({
      name: 'Dev Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Check dev credentials
        if (
          credentials.email === 'tidihatim@gmail.com' &&
          credentials.password === 'Godofwar@3'
        ) {
          // Find or create the dev user
          let user = await prisma.user.findUnique({
            where: { email: 'tidihatim@gmail.com' },
          });

          if (!user) {
            user = await prisma.user.create({
              data: {
                email: 'tidihatim@gmail.com',
                name: 'Dev User',
                role: 'CONTRIBUTOR',
                emailVerified: new Date(),
              },
            });
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        }

        return null;
      },
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  providers,
  callbacks: {
    async signIn({ user, account, profile }) {
      // Allow dev user in development mode
      if (process.env.NODE_ENV === 'development' && user.email === 'tidihatim@gmail.com') {
        return true;
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
