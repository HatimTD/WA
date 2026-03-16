import { PrismaClient } from '@prisma/client';

// Import the translation action
async function main() {
  const prisma = new PrismaClient();

  // Dynamically import the translation action
  const { waAutoTranslateOnSubmit } = await import('../lib/actions/waTranslationActions');

  const caseStudyId = 'cmko5aiei0001vyrsg6efe1gv';

  console.log('Triggering translation for French case study:', caseStudyId);

  try {
    const result = await waAutoTranslateOnSubmit(caseStudyId);
    console.log('Translation result:', result);

    if (result.wasTranslated) {
      console.log(`✓ Successfully translated from ${result.originalLanguage} to English`);
    } else if (result.originalLanguage === 'en') {
      console.log('Content already in English, no translation needed');
    } else {
      console.log('Translation was not performed:', result.error || 'Unknown reason');
    }

    // Verify the translation was saved
    const caseStudy = await prisma.waCaseStudy.findUnique({
      where: { id: caseStudyId },
      select: {
        originalLanguage: true,
        translationAvailable: true,
        translatedText: true,
      },
    });

    console.log('\nCase study after translation:');
    console.log('- Original Language:', caseStudy?.originalLanguage);
    console.log('- Translation Available:', caseStudy?.translationAvailable);
    console.log('- Has Translated Text:', !!caseStudy?.translatedText);

    if (caseStudy?.translatedText) {
      const parsed = JSON.parse(caseStudy.translatedText);
      console.log('- Translated to:', parsed.language);
      console.log('- Provider:', parsed.provider);
    }
  } catch (error) {
    console.error('Error triggering translation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
