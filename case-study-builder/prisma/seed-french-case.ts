import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding French case study...');

  // Find an existing user to be the contributor
  const contributor = await prisma.user.findFirst({
    where: { role: 'CONTRIBUTOR' },
  });

  if (!contributor) {
    console.error('No contributor found. Please run the main seed first.');
    return;
  }

  // Create a French case study (TECH type with WPS)
  const frenchCaseStudy = await prisma.waCaseStudy.create({
    data: {
      type: 'TECH',
      status: 'SUBMITTED',
      customerName: 'Sidérurgie Lorraine SA',
      industry: 'Steel Production',
      location: 'Metz',
      country: 'France',
      componentWorkpiece: 'Rouleaux de laminage à chaud',
      wearType: ['ABRASION', 'TEMPERATURE'],
      wearSeverities: { ABRASION: 4, TEMPERATURE: 3 },
      baseMetal: 'Acier forgé 42CrMo4',
      generalDimensions: 'Diamètre 800mm x Longueur 2500mm',
      workType: 'WORKSHOP',
      // French content - will trigger auto-translation
      problemDescription: `Les rouleaux de laminage à chaud subissent une usure excessive due aux températures élevées et au contact abrasif avec l'acier chauffé.

Le client rencontrait les problèmes suivants :
- Durée de vie moyenne de seulement 3 mois par rouleau
- Coûts de maintenance élevés avec des arrêts fréquents
- Qualité de surface des produits laminés compromise
- Perte de productivité significative

L'environnement de travail est particulièrement difficile avec des températures atteignant 1100°C et des charges mécaniques importantes.`,
      previousSolution: `Solution précédente : rechargement avec électrode basique standard (AWS A5.5 E7018) suivi d'un traitement thermique post-soudage. Cette approche donnait une dureté insuffisante et une résistance limitée à la chaleur.`,
      previousServiceLife: '3 months',
      competitorName: 'ESAB OK 83.28',
      waProduct: 'HARDFACE HC-O',
      waProductDiameter: '1.6mm',
      waSolution: `La solution Welding Alloys comprenait :

1. Préparation de surface par meulage et préchauffage à 250°C
2. Rechargement avec HARDFACE HC-O en plusieurs passes
3. Contrôle de la température interpasses (max 350°C)
4. Refroidissement lent sous couverture isolante

Le procédé FCAW a été optimisé pour assurer une liaison métallurgique parfaite et minimiser les contraintes résiduelles.`,
      technicalAdvantages: `Avantages techniques :
- Dureté obtenue : 58-62 HRC
- Excellente résistance à l'usure abrasive à haute température
- Bonne résistance aux chocs thermiques
- Facilité d'application avec le procédé FCAW
- Pas de traitement thermique post-soudage nécessaire`,
      expectedServiceLife: '12 months',
      contributorId: contributor.id,
      originalLanguage: 'fr', // Mark as French
      submittedAt: new Date(),
    },
  });

  console.log(`Created French case study: ${frenchCaseStudy.id}`);

  // Create WPS data for this case
  await prisma.waWeldingProcedure.create({
    data: {
      caseStudyId: frenchCaseStudy.id,
      baseMetalType: '42CrMo4',
      baseMetalGrade: 'EN 10083-3',
      baseMetalThickness: '50mm',
      surfacePreparation: 'Grinding',
      waProductName: 'HARDFACE HC-O',
      waProductDiameter: '1.6mm',
      weldingProcess: 'FCAW',
      currentType: 'DC+',
      wireFeedSpeed: '8-10 m/min',
      intensity: '280-320 A',
      voltage: '28-32 V',
      travelSpeed: '25-30 cm/min',
      weldingPosition: 'Flat',
      torchAngle: '15-20°',
      stickOut: '20-25mm',
      preheatTemperature: '250°C',
      interpassTemperature: '350°C max',
      postheatTemperature: 'Slow cooling',
      layerNumbers: 3,
      hardness: '58-62 HRC',
      additionalNotes: 'Procédure validée selon EN ISO 15614-7',
      // Add a sample document reference (this won't be a real URL but shows the structure)
      documents: [
        {
          name: 'WPS_Sidérurgie_Lorraine.pdf',
          type: 'application/pdf',
          size: 245000,
          url: 'https://res.cloudinary.com/demo/raw/upload/sample.pdf'
        }
      ],
    },
  });

  console.log('Created WPS data for French case study');
  console.log(`\nFrench case study ID: ${frenchCaseStudy.id}`);
  console.log('Status: SUBMITTED (will trigger auto-translation when processed)');
  console.log('\nTo test translation, you can:');
  console.log(`1. Visit /dashboard/approvals/${frenchCaseStudy.id}`);
  console.log(`2. Or visit /dashboard/cases/${frenchCaseStudy.id} (as the contributor)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
