import { DefaultSession } from 'next-auth';
import { Role } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: Role;
      region?: string;
      totalPoints?: number;
    } & DefaultSession['user'];
  }

  interface User {
    role: Role;
    region?: string;
    totalPoints?: number;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: Role;
    region?: string;
    totalPoints?: number;
  }
}
