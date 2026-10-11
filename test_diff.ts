import { mockGeneratePaper } from './src/api/mock';

async function run() {
  const diffs = ['easy', 'medium', 'hard', 'balanced'] as const;
  for (const diff of diffs) {
    const p = await mockGeneratePaper({ subject: 'Data Structures', difficultyProfile: diff });
    let hasL6 = false;
    p.sections.forEach(s => s.questions.forEach(q => {
      if (q.question.bloomLevel >= 6) hasL6 = true;
    }));
    console.log(`Diff: ${diff}, valid: ${p.isValid}, hasL6: ${hasL6}, conflicts: ${p.conflicts.length}`);
  }
}
run().catch(console.error);
