import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import EditCaseStudyForm from '@/components/edit-case-study-form';
import { Decimal } from '@prisma/client/runtime/library';

type Props = {
  params: Promise<{ id: string }>;
};

/**
 * Convert Decimal fields to numbers for client component serialization
 */
function waSerializeForClient<T extends Record<string, unknown>>(obj: T | null): T | null {
  if (!obj) return null;

  const serialized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value instanceof Decimal) {
      serialized[key] = value.toNumber();
    } else if (value instanceof Date) {
      serialized[key] = value.toISOString();
    } else {
      serialized[key] = value;
    }
  }
  return serialized as T;
}

export default async function EditCasePage({ params }: Props) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const { id } = await params;

  const caseStudy = await prisma.waCaseStudy.findUnique({
    where: { id },
  });

  if (!caseStudy) {
    notFound();
  }

  // Fetch WPS data if it's a TECH or STAR case
  let wpsData = null;
  if (caseStudy.type === 'TECH' || caseStudy.type === 'STAR') {
    wpsData = await prisma.waWeldingProcedure.findUnique({
      where: { caseStudyId: id },
    });
  }

  // Fetch Cost Calculator data if it's a STAR case
  let costCalcData = null;
  if (caseStudy.type === 'STAR') {
    costCalcData = await prisma.waCostCalculator.findUnique({
      where: { caseStudyId: id },
    });
  }

  // Check if user is authorized to edit
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  // Only the contributor or an approver can edit
  if (caseStudy.contributorId !== session.user.id && user?.role !== 'APPROVER') {
    redirect('/dashboard/my-cases');
  }

  // Only allow editing of DRAFT, SUBMITTED, or REJECTED case studies
  // Approvers can edit any status
  // Contributors can edit their own DRAFT/SUBMITTED/REJECTED cases
  if (
    user?.role !== 'APPROVER' &&
    caseStudy.status !== 'DRAFT' &&
    caseStudy.status !== 'SUBMITTED' &&
    caseStudy.status !== 'REJECTED'
  ) {
    redirect(`/dashboard/cases/${id}?message=cannot_edit`);
  }

  // Serialize Decimal and Date fields for client component
  const serializedCaseStudy = waSerializeForClient(caseStudy);
  const serializedWpsData = waSerializeForClient(wpsData);
  const serializedCostCalcData = waSerializeForClient(costCalcData);

  return (
    <EditCaseStudyForm
      caseStudy={serializedCaseStudy as typeof caseStudy}
      wpsData={serializedWpsData as typeof wpsData}
      costCalcData={serializedCostCalcData as typeof costCalcData}
    />
  );
}
