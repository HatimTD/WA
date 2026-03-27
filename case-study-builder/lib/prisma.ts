import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const baseUrl = process.env.POSTGRES_URL ?? '';
const separator = baseUrl.includes('?') ? '&' : '?';
const datasourceUrl = baseUrl.includes('pgbouncer=true')
  ? baseUrl
  : `${baseUrl}${separator}pgbouncer=true&connection_limit=10`;

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasourceUrl,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
