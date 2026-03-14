import { handlers } from '@/auth';

// Allow more time for OAuth callback (Prisma cold start + DB operations)
export const maxDuration = 30;

export const { GET, POST } = handlers;
