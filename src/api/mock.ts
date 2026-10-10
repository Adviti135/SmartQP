// MOCK data service for SmartExam
// Toggle MOCK_MODE to false to use the real FastAPI backend
export const MOCK_MODE = true;

import { Question, Paper, Subject, QuestionFilters, GenerateRequest } from '../types';

const delay = (ms = 300) => new Promise(res => setTimeout(res, ms));

// MOCK: 12 realistic Data Structures questions
export const MOCK_QUESTIONS: Question[] = [
  {
    id: 'q001',
    subject: 'Data Structures',
    module: 1,
    topic: 'Arrays and Pointers',
    text: 'Explain the concept of dynamic memory allocation using malloc() and free() with suitable examples.',
    marks: 10,
    bloomLevel: 2,
    bloomLevelAI: 4, // MOCK: AI disagrees with teacher
    courseOutcome: 'CO1',
    questionType: 'Long Answer',
    isDuplicate: false,
  },
  {
    id: 'q002',
    subject: 'Data Structures',
    module: 1,
    topic: 'Arrays and Pointers',
    text: 'Define array. List the advantages and disadvantages of arrays over linked lists.',
    marks: 5,
    bloomLevel: 2,
    bloomLevelAI: 2,
    courseOutcome: 'CO1',
    questionType: 'Short Answer',
    isDuplicate: false,
  },
  {
    id: 'q003',
    subject: 'Data Structures',
    module: 1,
    topic: 'Arrays and Pointers',
    text: 'Describe the advantages and disadvantages of using arrays as a data structure.', // MOCK: semantic duplicate of q002
    marks: 5,
    bloomLevel: 2,
    bloomLevelAI: 2,
    courseOutcome: 'CO1',
    questionType: 'Short Answer',
    isDuplicate: true,
    duplicateOf: 'q002',
  },
  {
    id: 'q004',
    subject: 'Data Structures',
    module: 2,
    topic: 'Stacks',
    text: 'Implement a stack using arrays. Write push, pop and display operations with suitable algorithm.',
    marks: 10,
    bloomLevel: 3,
    bloomLevelAI: 3,
    courseOutcome: 'CO2',
    questionType: 'Long Answer',
    isDuplicate: false,
  },
  {
    id: 'q005',
    subject: 'Data Structures',
    module: 2,
    topic: 'Queues',
    text: 'What is a circular queue? Explain its operations with diagrams.',
    marks: 5,
    bloomLevel: 2,
    bloomLevelAI: 2,
    courseOutcome: 'CO2',
    questionType: 'Short Answer',
    isDuplicate: false,
  },
  {
    id: 'q006',
    subject: 'Data Structures',
    module: 2,
    topic: 'Queues',
    text: 'Convert the infix expression (A+B)*C-D/E to postfix using a stack.',
    marks: 5,
    bloomLevel: 3,
    bloomLevelAI: 3,
    courseOutcome: 'CO2',
    questionType: 'Short Answer',
    isDuplicate: false,
  },
  {
    id: 'q007',
    subject: 'Data Structures',
    module: 3,
    topic: 'Linked Lists',
    text: 'Write an algorithm to insert a node at the beginning, middle and end of a singly linked list.',
    marks: 10,
    bloomLevel: 3,
    bloomLevelAI: 3,
    courseOutcome: 'CO3',
    questionType: 'Long Answer',
    isDuplicate: false,
  },
  {
    id: 'q008',
    subject: 'Data Structures',
    module: 3,
    topic: 'Linked Lists',
    text: 'Compare singly linked list, doubly linked list and circular linked list with examples.',
    marks: 5,
    bloomLevel: 4,
    bloomLevelAI: 4,
    courseOutcome: 'CO3',
    questionType: 'Short Answer',
    isDuplicate: false,
  },
  {
    id: 'q009',
    subject: 'Data Structures',
    module: 3,
    topic: 'Linked Lists',
    text: 'Differentiate between a stack and a queue. Give real-world applications of each.',
    marks: 5,
    bloomLevel: 4,
    bloomLevelAI: 5,
    courseOutcome: 'CO3',
    questionType: 'Short Answer',
    isDuplicate: false,
  },
  {
    id: 'q010',
    subject: 'Data Structures',
    module: 4,
    topic: 'Trees',
    text: 'Explain Binary Search Tree (BST). Write algorithms for insertion, deletion and traversal.',
    marks: 10,
    bloomLevel: 3,
    bloomLevelAI: 3,
    courseOutcome: 'CO4',
    questionType: 'Long Answer',
    isDuplicate: false,
  },
  {
    id: 'q011',
    subject: 'Data Structures',
    module: 4,
    topic: 'Trees',
    text: 'What is an AVL tree? Explain rotations with suitable examples.',
    marks: 5,
    bloomLevel: 2,
    bloomLevelAI: 2,
    courseOutcome: 'CO4',
    questionType: 'Short Answer',
    isDuplicate: false,
  },
  {
    id: 'q012',
    subject: 'Data Structures',
    module: 5,
    topic: 'Sorting',
    text: 'Implement Quick Sort algorithm. Trace it on the array [5,3,8,1,9,2] and analyse its time complexity.',
    marks: 10,
    bloomLevel: 4,
    bloomLevelAI: 4,
    courseOutcome: 'CO5',
    questionType: 'Long Answer',
    isDuplicate: false,
  },
  {
    id: 'q013',
    subject: 'Data Structures',
    module: 5,
    topic: 'Hashing',
    text: 'Explain hash functions and collision resolution techniques with examples.',
    marks: 5,
    bloomLevel: 2,
    bloomLevelAI: 2,
    courseOutcome: 'CO5',
    questionType: 'Short Answer',
    isDuplicate: false,
  },
  // MOCK: Operating Systems questions
  {
    id: 'q101',
    subject: 'Operating Systems',
    module: 1,
    topic: 'OS Concepts',
    text: 'Define Operating System. Explain its functions and types with examples.',
    marks: 10,
    bloomLevel: 2,
    bloomLevelAI: 2,
    courseOutcome: 'CO1',
    questionType: 'Long Answer',
    isDuplicate: false,
  },
  {
    id: 'q102',
    subject: 'Operating Systems',
    module: 2,
    topic: 'Process Management',
    text: 'Explain the concept of process scheduling. Compare FCFS, SJF and Round Robin algorithms.',
    marks: 10,
    bloomLevel: 4,
    bloomLevelAI: 4,
    courseOutcome: 'CO2',
    questionType: 'Long Answer',
    isDuplicate: false,
  },
  {
    id: 'q103',
    subject: 'Operating Systems',
    module: 3,
    topic: 'Memory Management',
    text: 'Explain paging and segmentation with diagrams.',
    marks: 10,
    bloomLevel: 3,
    bloomLevelAI: 3,
    courseOutcome: 'CO3',
    questionType: 'Long Answer',
    isDuplicate: false,
  },
  {
    id: 'q104',
    subject: 'Operating Systems',
    module: 3,
    topic: 'Memory Management',
    text: 'What is virtual memory? Explain demand paging.',
    marks: 5,
    bloomLevel: 2,
    bloomLevelAI: 2,
    courseOutcome: 'CO3',
    questionType: 'Short Answer',
    isDuplicate: false,
  },
  {
    id: 'q105',
    subject: 'Operating Systems',
    module: 4,
    topic: 'File Systems',
    text: 'Describe file allocation methods: contiguous, linked and indexed.',
    marks: 10,
    bloomLevel: 3,
    bloomLevelAI: 3,
    courseOutcome: 'CO4',
    questionType: 'Long Answer',
    isDuplicate: false,
  },
  {
    id: 'q106',
    subject: 'Operating Systems',
    module: 5,
    topic: 'Deadlocks',
    text: 'Explain Banker\'s Algorithm for deadlock avoidance with an example.',
    marks: 10,
    bloomLevel: 4,
    bloomLevelAI: 4,
    courseOutcome: 'CO5',
    questionType: 'Long Answer',
    isDuplicate: false,
  },
];

// MOCK: valid paper for easy/moderate
const MOCK_VALID_PAPER: Paper = {
  id: 'paper_001',
  subject: 'Data Structures',
  title: 'B.E. / B.Tech Degree Examination — Data Structures',
  totalMarks: 100,
  isValid: true,
  conflicts: [],
  createdAt: new Date().toISOString(),
  sections: [
    {
      module: 1,
      totalMarks: 20,
      questions: [
        { questionNumber: '1a', question: MOCK_QUESTIONS[1], marks: 5 },
        { questionNumber: '1b', question: MOCK_QUESTIONS[0], marks: 5 },
        { questionNumber: '1c', question: MOCK_QUESTIONS[0], marks: 10 },
      ],
    },
    {
      module: 2,
      totalMarks: 20,
      questions: [
        { questionNumber: '2a', question: MOCK_QUESTIONS[4], marks: 5 },
        { questionNumber: '2b', question: MOCK_QUESTIONS[5], marks: 5 },
        { questionNumber: '2c', question: MOCK_QUESTIONS[3], marks: 10 },
      ],
    },
    {
      module: 3,
      totalMarks: 20,
      questions: [
        { questionNumber: '3a', question: MOCK_QUESTIONS[7], marks: 5 },
        { questionNumber: '3b', question: MOCK_QUESTIONS[8], marks: 5 },
        { questionNumber: '3c', question: MOCK_QUESTIONS[6], marks: 10 },
      ],
    },
    {
      module: 4,
      totalMarks: 20,
      questions: [
        { questionNumber: '4a', question: MOCK_QUESTIONS[10], marks: 5 },
        { questionNumber: '4b', question: MOCK_QUESTIONS[10], marks: 5 },
        { questionNumber: '4c', question: MOCK_QUESTIONS[9], marks: 10 },
      ],
    },
    {
      module: 5,
      totalMarks: 20,
      questions: [
        { questionNumber: '5a', question: MOCK_QUESTIONS[12], marks: 5 },
        { questionNumber: '5b', question: MOCK_QUESTIONS[12], marks: 5 },
        { questionNumber: '5c', question: MOCK_QUESTIONS[11], marks: 10 },
      ],
    },
  ],
};

// MOCK: paper with conflict for 'difficult' profile
const MOCK_CONFLICT_PAPER: Paper = {
  id: 'paper_002',
  subject: 'Data Structures',
  title: 'B.E. / B.Tech Degree Examination — Data Structures (Difficult)',
  totalMarks: 100,
  isValid: false,
  conflicts: [
    {
      type: 'insufficient_questions',
      module: 3,
      requiredMarks: 10,
      requiredBloomLevel: 5,
      fallback: MOCK_QUESTIONS[6],
      message: 'Not enough L5 (Synthesis) questions in Module 3. Only L3 questions available for 10-mark slot.',
    },
  ],
  createdAt: new Date().toISOString(),
  sections: [
    {
      module: 1,
      totalMarks: 20,
      questions: [
        { questionNumber: '1a', question: MOCK_QUESTIONS[1], marks: 5 },
        { questionNumber: '1b', question: MOCK_QUESTIONS[0], marks: 5 },
        { questionNumber: '1c', question: MOCK_QUESTIONS[0], marks: 10 },
      ],
    },
    {
      module: 2,
      totalMarks: 20,
      questions: [
        { questionNumber: '2a', question: MOCK_QUESTIONS[4], marks: 5 },
        { questionNumber: '2b', question: MOCK_QUESTIONS[5], marks: 5 },
        { questionNumber: '2c', question: MOCK_QUESTIONS[3], marks: 10 },
      ],
    },
    {
      module: 3,
      totalMarks: 20,
      questions: [
        { questionNumber: '3a', question: MOCK_QUESTIONS[7], marks: 5 },
        { questionNumber: '3b', question: MOCK_QUESTIONS[8], marks: 5 },
        {
          questionNumber: '3c',
          question: MOCK_QUESTIONS[6],
          marks: 10,
          conflict: {
            type: 'insufficient_questions',
            module: 3,
            requiredMarks: 10,
            requiredBloomLevel: 5,
            fallback: MOCK_QUESTIONS[6],
            message: 'Not enough L5 questions in Module 3. Using L3 fallback.',
          },
        },
      ],
    },
    {
      module: 4,
      totalMarks: 20,
      questions: [
        { questionNumber: '4a', question: MOCK_QUESTIONS[10], marks: 5 },
        { questionNumber: '4b', question: MOCK_QUESTIONS[10], marks: 5 },
        { questionNumber: '4c', question: MOCK_QUESTIONS[9], marks: 10 },
      ],
    },
    {
      module: 5,
      totalMarks: 20,
      questions: [
        { questionNumber: '5a', question: MOCK_QUESTIONS[12], marks: 5 },
        { questionNumber: '5b', question: MOCK_QUESTIONS[12], marks: 5 },
        { questionNumber: '5c', question: MOCK_QUESTIONS[11], marks: 10 },
      ],
    },
  ],
};

let mockQuestions: Question[] = [];

export const mockDeleteAllQuestions = async (): Promise<void> => {
  await delay();
  mockQuestions = [];
};

const mockPapers: Paper[] = [MOCK_VALID_PAPER];

// MOCK API functions
export const mockGetSubjects = async (): Promise<Subject[]> => {
  await delay();
  return [
    { id: 'ds', name: 'Data Structures' },
    { id: 'os', name: 'Operating Systems' },
  ];
};

export const mockGetQuestions = async (filters?: QuestionFilters): Promise<Question[]> => {
  await delay();
  let result = [...mockQuestions];
  if (filters?.subject) result = result.filter(q => q.subject === filters.subject);
  if (filters?.module) result = result.filter(q => q.module === filters.module);
  if (filters?.marks) result = result.filter(q => q.marks === filters.marks);
  if (filters?.bloomLevel) result = result.filter(q => q.bloomLevel === filters.bloomLevel);
  if (filters?.search) {
    const s = filters.search.toLowerCase();
    result = result.filter(q => q.text.toLowerCase().includes(s) || q.topic.toLowerCase().includes(s));
  }
  return result;
};

export const mockCreateQuestion = async (data: Omit<Question, 'id'>): Promise<Question> => {
  await delay();
  const q: Question = { ...data, id: `q${Date.now()}` };
  mockQuestions.push(q);
  return q;
};

export const mockUpdateQuestion = async (id: string, data: Partial<Question>): Promise<Question> => {
  await delay();
  const idx = mockQuestions.findIndex(q => q.id === id);
  if (idx === -1) throw new Error('Question not found');
  mockQuestions[idx] = { ...mockQuestions[idx], ...data };
  return mockQuestions[idx];
};

export const mockDeleteQuestion = async (id: string): Promise<void> => {
  await delay();
  mockQuestions = mockQuestions.filter(q => q.id !== id);
};

export const mockGeneratePaper = async (req: GenerateRequest): Promise<Paper> => {
  await delay(800);
  if (req.difficultyProfile === 'difficult') return MOCK_CONFLICT_PAPER;
  const paper = { ...MOCK_VALID_PAPER, id: `paper_${Date.now()}`, subject: req.subject };
  mockPapers.push(paper);
  return paper;
};

export const mockGetPaper = async (id: string): Promise<Paper> => {
  await delay();
  const p = mockPapers.find(p => p.id === id) ?? MOCK_VALID_PAPER;
  return p;
};

export const mockReplacePaperQuestion = async (paperId: string, _slot: string, _questionId: string): Promise<Paper> => {
  await delay(500);
  return MOCK_VALID_PAPER;
};

export const mockExportPaper = async (_paperId: string): Promise<Blob> => {
  await delay(600);
  // MOCK: return a dummy blob
  const content = `SMARTEXAM - Mock PDF Export\n\nThis is a mock PDF generated by SmartExam.\nIn production this would be a real PDF blob from the backend.`;
  return new Blob([content], { type: 'application/pdf' });
};
