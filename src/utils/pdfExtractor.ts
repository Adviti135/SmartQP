
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import type { Question } from '../types';

GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export interface ExtractedQuestion extends Omit<Question, 'id'> {
  tempId: string;
  sourceFile: string;
  confidence: number;
  questionNumber?: string;
  isDuplicate?: boolean;
  duplicateOf?: string;
}

export const SAMPLE_PDF_SETS: {
  fileName: string;
  size: string;
  pageCount: number;
  questions: ExtractedQuestion[];
}[] = [];

type QuestionMetadata = {
  marks?: number;
  bloomLevel?: number;
  courseOutcome?: string;
};

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/inter[\s-]*process/g, 'interprocess')
    .replace(/[^a-z0-9]/g, '');
}

function similarity(a: string, b: string): number {
  const first = normalizeText(a);
  const second = normalizeText(b);

  if (!first || !second) return 0;
  if (first === second) return 1;

  const pairs = (value: string) => {
    const result = new Map<string, number>();

    for (let i = 0; i < value.length - 1; i++) {
      const pair = value.slice(i, i + 2);
      result.set(pair, (result.get(pair) || 0) + 1);
    }

    return result;
  };

  const left = pairs(first);
  const right = pairs(second);
  let overlap = 0;

  for (const [pair, count] of left) {
    overlap += Math.min(count, right.get(pair) || 0);
  }

  const total =
    [...left.values()].reduce((a, b) => a + b, 0) +
    [...right.values()].reduce((a, b) => a + b, 0);

  return total ? (2 * overlap) / total : 0;
}

/**
 * Extract real text from a PDF using PDF.js.
 * Groups text items by their vertical position and
 * preserves their order within each row.
 */
export async function extractTextFromPDFFile(
  file: File
): Promise<string> {
  const data = await file.arrayBuffer();
  const pdf = await getDocument({ data }).promise;
  const allPages: string[] = [];

  for (
    let pageNumber = 1;
    pageNumber <= pdf.numPages;
    pageNumber++
  ) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();

    const rows = new Map<number, { x: number; text: string }[]>();

    for (const item of content.items) {
      if (!('str' in item) || !item.str.trim()) continue;

      const x = item.transform[4];
      const y = Math.round(item.transform[5]);

      if (!rows.has(y)) rows.set(y, []);

      rows.get(y)!.push({
        x,
        text: item.str.trim(),
      });
    }

    const pageLines = [...rows.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([, items]) =>
        items
          .sort((a, b) => a.x - b.x)
          .map(item => item.text)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim()
      )
      .filter(Boolean);

    allPages.push(pageLines.join('\n'));
  }

  return allPages.join('\n');
}

function extractMetadata(text: string): QuestionMetadata {
  const result: QuestionMetadata = {};

  // Table format: question text, marks, CO, Bloom level.
  // Example: "Explain arrays. 5 CO1 L2 — Understand"
  const tableMatch = text.match(
    /\s+(\d{1,2})\s+(CO\s*\d+)\s+L\s*([1-6])(?:\s*[—–-]\s*(?:Remember|Understand|Apply|Analyze|Analyse|Evaluate|Create))?\s*$/i
  );

  if (tableMatch) {
    result.marks = Number(tableMatch[1]);
    result.courseOutcome = tableMatch[2]
      .replace(/\s+/g, '')
      .toUpperCase();
    result.bloomLevel = Number(tableMatch[3]);

    return result;
  }

  const co = text.match(/\bCO\s*(\d+)\b/i);
  const bloom = text.match(/\bL\s*([1-6])\b/i);
  const marks = text.match(/\b(\d{1,2})\s*(?:marks?|m)\b/i);

  if (co) result.courseOutcome = `CO${co[1]}`;
  if (bloom) result.bloomLevel = Number(bloom[1]);
  if (marks) result.marks = Number(marks[1]);

  return result;
}

function inferBloomLevel(text: string): number {
  const lower = text.toLowerCase();

  if (/\b(design|create|formulate|devise)\b/.test(lower)) return 6;
  if (/\b(critique|justify|assess|evaluate)\b/.test(lower)) return 5;
  if (/\b(compare|differentiate|analyze|analyse|distinguish)\b/.test(lower)) return 4;
  if (/\b(calculate|solve|apply|implement|construct|write an algorithm)\b/.test(lower)) return 3;
  if (/\b(explain|describe|discuss|illustrate|outline)\b/.test(lower)) return 2;
  if (/\b(define|list|state|name|what is|mention)\b/.test(lower)) return 1;

  return 2;
}

function inferSubject(
  text: string,
  defaultSubject: string
): string {
  if (
    /\b(operating system|system calls|process states|deadlock|paging|semaphore|disk scheduling|bankers algorithm|cpu scheduling)\b/i.test(
      text
    )
  ) {
    return 'Operating Systems';
  }

  return defaultSubject;
}

function inferTopic(text: string, module: number): string {
  const patterns: [RegExp, string][] = [
    [/\b(array|sparse matrix|dynamic memory|malloc|calloc|realloc)\b/i, 'Arrays and Memory'],
    [/\b(stack|push|pop|postfix|infix)\b/i, 'Stacks'],
    [/\b(queue|fifo|circular queue|priority queue)\b/i, 'Queues'],
    [/\b(linked list|self-referential|polynomial)\b/i, 'Linked Lists'],
    [/\b(binary tree|bst|search tree|tree traversal|leftist tree)\b/i, 'Trees'],
    [/\b(graph|breadth.first|depth.first|bfs|dfs|adjacency)\b/i, 'Graphs'],
    [/\b(hash|hashing|probing|collision|load factor|rehashing)\b/i, 'Hashing'],
  ];

  for (const [pattern, topic] of patterns) {
    if (pattern.test(text)) return topic;
  }

  return `Module ${module} Topics`;
}

function cleanQuestionText(text: string): string {
  return text
    .replace(
      /^\s*(?:(?:question|q)\s*)?\d{1,3}\s*[.)]\s*/i,
      ''
    )
    .replace(/^\s*\d{1,3}\s+[a-f]\s*[.)]\s*/i, '')
    .replace(/^\s*(?:\([a-f]\)|[a-f][.)])\s*/i, '')
    .replace(/\b(?:USN|BCS\d{3})\b/gi, '')
    .replace(/\b\d{1,2}\s+of\s+\d{1,2}\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parse numbered questions, including VTU table rows:
 * 1 Define a data structure ... 5 CO1 L2 — Understand
 */
export function parseQuestionsFromText(
  text: string,
  fileName: string,
  defaultSubject = 'Data Structures'
): ExtractedQuestion[] {
  const lines = text
    .replace(/\r/g, '\n')
    .split('\n')
    .map(line => line.replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean);

  const questions: ExtractedQuestion[] = [];

  let currentModule = 1;
  let currentNumber = '';
  let buffer: string[] = [];
  let currentMetadata: QuestionMetadata = {};
  let questionCounter = 0;

  const splitTableMetadata = (
    value: string
  ): { text: string; metadata: QuestionMetadata } => {
    const metadata = extractMetadata(value);

    const match = value.match(
      /\s+\d{1,2}\s+CO\s*\d+\s+L\s*[1-6](?:\s*[—–-]\s*(?:Remember|Understand|Apply|Analyze|Analyse|Evaluate|Create))?\s*$/i
    );

    if (!match || match.index === undefined) {
      return { text: value.trim(), metadata: {} };
    }

    return {
      text: value.slice(0, match.index).trim(),
      metadata,
    };
  };

  const flush = () => {
    if (!buffer.length) return;

    const raw = buffer.join(' ').replace(/\s+/g, ' ').trim();
    buffer = [];

    const cleanText = cleanQuestionText(raw);

    if (
      cleanText.length < 15 ||
      /^(module|unit)\s*[-–]?\s*\d+$/i.test(cleanText) ||
      /^(or|time:|max\.?\s*marks)/i.test(cleanText)
    ) {
      currentMetadata = {};
      return;
    }

    const metadata = {
      ...extractMetadata(raw),
      ...currentMetadata,
    };

    const marks = metadata.marks ?? 5;
    const bloomLevel =
      metadata.bloomLevel ?? inferBloomLevel(cleanText);
    const courseOutcome =
      metadata.courseOutcome ?? `CO${currentModule}`;

    questions.push({
      tempId: `${fileName}_${questionCounter++}_${Date.now()}`,
      sourceFile: fileName,
      questionNumber: currentNumber,
      subject: inferSubject(cleanText, defaultSubject),
      module: currentModule,
      topic: inferTopic(cleanText, currentModule),
      text: cleanText,
      marks,
      bloomLevel,
      bloomLevelAI: bloomLevel,
      courseOutcome,
      questionType: marks >= 8 ? 'Long Answer' : 'Short Answer',
      confidence:
        metadata.marks !== undefined &&
          metadata.bloomLevel !== undefined &&
          metadata.courseOutcome !== undefined
          ? 0.95
          : 0.65,
    });

    currentMetadata = {};
  };

  // Supports "1 text", "1. text", "1) text", and "Q1: text".
  const numberedStart =
    /^(?:(?:question|q)\s*)?(\d{1,3})(?:\s*[.):]\s*|\s+)(.+)$/i;

  for (const originalLine of lines) {
    const line = originalLine.trim();

    if (
      /^(?:no\.?\s+)?question\s+(?:marks|text)/i.test(line) ||
      /^bcs\d{3}\s*[—-]/i.test(line) ||
      /^page\s+\d+\s*$/i.test(line) ||
      /^\d+\s+of\s+\d+$/i.test(line) ||
      /^(?:time:|max\.?\s*marks:|third semester|\*{4,})/i.test(line)
    ) {
      continue;
    }

    const moduleMatch = line.match(/^module\s*[-–]?\s*(\d+)/i);

    if (moduleMatch) {
      flush();
      currentModule = Math.min(
        5,
        Math.max(1, Number(moduleMatch[1]))
      );
      currentMetadata = {};
      continue;
    }

    if (/^or$/i.test(line)) {
      flush();
      continue;
    }

    // Do not process a question row as metadata-only.
    const numbered = line.match(numberedStart);

    if (numbered) {
      const number = numbered[1];
      const remainder = numbered[2].trim();

      if (
        /^(?:semester|scheme|question|marks|bloom|co\b)/i.test(
          remainder
        )
      ) {
        continue;
      }

      flush();

      currentNumber = number;
      currentMetadata = {};

      const split = splitTableMetadata(remainder);
      currentMetadata = { ...split.metadata };
      buffer = split.text ? [split.text] : [];

      continue;
    }

    // Standalone metadata is allowed only after a question starts.
    const standaloneMetadata = extractMetadata(line);

    if (
      buffer.length > 0 &&
      (
        standaloneMetadata.marks !== undefined ||
        standaloneMetadata.bloomLevel !== undefined ||
        standaloneMetadata.courseOutcome !== undefined
      )
    ) {
      currentMetadata = {
        ...currentMetadata,
        ...standaloneMetadata,
      };
      continue;
    }

    // A continuation line belongs to the current question.
    if (buffer.length > 0) {
      const split = splitTableMetadata(line);

      if (
        split.metadata.marks !== undefined ||
        split.metadata.bloomLevel !== undefined ||
        split.metadata.courseOutcome !== undefined
      ) {
        currentMetadata = {
          ...currentMetadata,
          ...split.metadata,
        };
      }

      if (split.text) {
        buffer.push(split.text);
      } else if (
        split.metadata.marks === undefined &&
        split.metadata.bloomLevel === undefined &&
        split.metadata.courseOutcome === undefined
      ) {
        buffer.push(line);
      }
    }
  }

  flush();

  // Remove exact duplicates within this PDF.
  const unique: ExtractedQuestion[] = [];
  const seen = new Set<string>();

  for (const question of questions) {
    const key = normalizeText(question.text);

    if (!key || seen.has(key)) continue;

    seen.add(key);
    unique.push(question);
  }

  return unique;
}

/**
 * Extract questions from multiple PDFs.
 *
 * The optional third argument checks against questions already
 * present in the Question Bank. Existing duplicates are flagged,
 * not silently removed.
 */
export async function extractQuestionsFromMultiplePDFs(
  files: File[],
  subject = 'Data Structures',
  existingQuestions: Question[] = []
): Promise<{
  questions: ExtractedQuestion[];
  summary: { fileCount: number; questionCount: number };
  failedFiles: string[];
}> {
  const allExtracted: ExtractedQuestion[] = [];
  const failedFiles: string[] = [];
  let successfulFiles = 0;

  for (const file of files) {
    try {
      const rawText = await extractTextFromPDFFile(file);

      if (!rawText.trim()) {
        failedFiles.push(`${file.name}: no readable text found`);
        continue;
      }

      const extracted = parseQuestionsFromText(
        rawText,
        file.name,
        subject
      );

      if (extracted.length === 0) {
        failedFiles.push(
          `${file.name}: text was readable, but no questions were recognized`
        );
        continue;
      }

      successfulFiles++;
      allExtracted.push(...extracted);
    } catch (error) {
      const reason =
        error instanceof Error
          ? error.message
          : 'Unknown PDF extraction error';

      failedFiles.push(`${file.name}: ${reason}`);
    }
  }

  if (allExtracted.length === 0) {
    throw new Error(
      `No questions could be extracted from the selected PDFs.\n${failedFiles.join('\n')}`
    );
  }

  // Remove exact duplicates across PDFs in the current batch.
  const batchUnique: ExtractedQuestion[] = [];
  const batchSeen = new Set<string>();

  for (const question of allExtracted) {
    const key = normalizeText(question.text);

    if (!key || batchSeen.has(key)) continue;

    batchSeen.add(key);
    batchUnique.push(question);
  }

  // Flag exact and near-duplicates against the existing bank.
  const checked = batchUnique.map(question => {
    const exactMatch = existingQuestions.find(
      existing =>
        normalizeText(existing.text) === normalizeText(question.text)
    );

    if (exactMatch) {
      return {
        ...question,
        isDuplicate: true,
        duplicateOf: exactMatch.id,
        confidence: 1,
      };
    }

    const nearMatch = existingQuestions.find(
      existing => similarity(existing.text, question.text) >= 0.9
    );

    if (nearMatch) {
      return {
        ...question,
        isDuplicate: true,
        duplicateOf: nearMatch.id,
      };
    }

    return question;
  });

  return {
    questions: checked,
    summary: {
      fileCount: successfulFiles,
      questionCount: checked.length,
    },
    failedFiles,
  };
}
