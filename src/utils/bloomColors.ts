export const BLOOM_LABELS: Record<number, string> = {
  1: 'L1 Remember',
  2: 'L2 Understand',
  3: 'L3 Apply',
  4: 'L4 Analyse',
  5: 'L5 Evaluate',
  6: 'L6 Create',
};

export const BLOOM_COLORS: Record<number, string> = {
  1: 'bg-gray-100 text-gray-700',
  2: 'bg-blue-100 text-blue-700',
  3: 'bg-green-100 text-green-700',
  4: 'bg-yellow-100 text-yellow-700',
  5: 'bg-orange-100 text-orange-700',
  6: 'bg-red-100 text-red-700',
};

export const DIFFICULTY_BLOOM: Record<string, string> = {
  easy: 'Prefers L1–L2 (Remember/Understand)',
  moderate: 'Prefers L3–L4 (Apply/Analyse)',
  difficult: 'Prefers L5–L6 (Evaluate/Create)',
};

export const BLUEPRINT = {
  modulesCount: 5,
  marksPerModule: 20,
  totalMarks: 100,
  slots: [
    { label: 'Part A – Q1', marks: 5 },
    { label: 'Part A – Q2', marks: 5 },
    { label: 'Part B', marks: 10 },
  ],
};
