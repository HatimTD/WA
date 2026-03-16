import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import ApprovalsClient from '@/components/approvals-client';
import type { Metadata } from 'next';


export const metadata: Metadata = {
  title: 'Pending Approvals',
  description: 'Review and approve submitted case studies',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ApprovalsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  // Only Approvers and Admins can access this page
  if (user?.role !== 'APPROVER' && user?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return <ApprovalsClient userId={session.user.id} />;
}
