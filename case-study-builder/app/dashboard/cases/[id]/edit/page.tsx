import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import EditCaseStudyForm from '@/components/edit-case-study-form';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditCasePage({ params }: Props) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const { id } = await params;

  const caseStudy = await prisma.caseStudy.findUnique({
    where: { id },
  });

  if (!caseStudy) {
    notFound();
  }

  // Fetch WPS data if it's a TECH or STAR case
  let wpsData = null;
  if (caseStudy.type === 'TECH' || caseStudy.type === 'STAR') {
    wpsData = await prisma.weldingProcedure.findUnique({
      where: { caseStudyId: id },
    });
  }

  // Fetch Cost Calculator data if it's a STAR case
  let costCalcData = null;
  if (caseStudy.type === 'STAR') {
    costCalcData = await prisma.costCalculator.findUnique({
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

  // Only allow editing of DRAFT or REJECTED case studies
  // Approvers can edit any status
  if (
    user?.role !== 'APPROVER' &&
    caseStudy.status !== 'DRAFT' &&
    caseStudy.status !== 'REJECTED'
  ) {
    redirect(`/dashboard/cases/${id}?message=cannot_edit_submitted`);
  }

  // Pass the original caseStudy - the component will handle conversion internally
  return <EditCaseStudyForm caseStudy={caseStudy} wpsData={wpsData} costCalcData={costCalcData} />;
}
