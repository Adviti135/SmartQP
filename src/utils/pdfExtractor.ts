
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

  // Dice similarity based on character pairs.
  const pairs = (s: string) => {
    const result = new Map<string, number>();
    for (let i = 0; i < s.length - 1; i++) {
      const pair = s.slice(i, i + 2);
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

  const total = [...left.values()].reduce((a, b) => a + b, 0) +
    [...right.values()].reduce((a, b) => a + b, 0);

  return total ? (2 * overlap) / total : 0;
}

/**
 * Extract text while preserving PDF line boundaries when available.
 */
export async function extractTextFromPDFFile(file: File): Promise<string> {
  const data = await file.arrayBuffer();
  const pdf = await getDocument({ data: new Uint8Array(data) }).promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();

    let pageText = '';
    let previousY: number | undefined;

    for (const item of content.items) {
      if (!('str' in item)) continue;

      const currentY = item.transform?.[5];

      if (
        previousY !== undefined &&
        currentY !== undefined &&
        Math.abs(currentY - previousY) > 3
      ) {
        pageText += '\n';
      } else if (pageText && !pageText.endsWith('\n')) {
        pageText += ' ';
      }

      pageText += item.str;

      if ('hasEOL' in item && item.hasEOL) {
        pageText += '\n';
      }

      if (currentY !== undefined) previousY = currentY;
    }

    pages.push(pageText);
  }

  return pages.join('\n');
}

type QuestionMetadata = {
  marks?: number;
  bloomLevel?: number;
  courseOutcome?: string;
};

function extractMetadata(text: string): QuestionMetadata {
  const result: QuestionMetadata = {};

  // Example: "8 L2 CO1", "8 L3 CO2"
  const combined = text.match(
    /\b(\d{1,2})\s+L([1-6])\s+(CO\d+)\b/i
  );

  if (combined) {
    result.marks = Number(combined[1]);
    result.bloomLevel = Number(combined[2]);
    result.courseOutcome = combined[3].toUpperCase();
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

function inferSubject(text: string, defaultSubject: string): string {
  if (
    /\b(operating system|system calls|process states|deadlock|paging|semaphore|disk scheduling|bankers algorithm|cpu scheduling)\b/i.test(text)
  ) {
    return 'Operating Systems';
  }

  return defaultSubject;
}

function cleanQuestionText(text: string): string {
  return text
    .replace(/^\s*(?:(?:question|q)\s*)?\d+\s*[.)]\s*[a-z]\s*[.)]\s*/i, '')
    .replace(/^\s*(?:\([a-z]\)|[a-z]\s*[.)])\s*/i, '')
    .replace(/\s+/g, ' ')
    .replace(/\b(?:USN|BCS\d{3})\b/gi, '')
    .replace(/\b\d{1,2}\s*of\s*\d{1,2}\b/gi, '')
    .trim();
}

/**
 * Supports VTU labels such as:
 * 1 a. question...
 * 1 b. question...
 * 3 c. question...
 * 4 a. question...
 *
 * If the PDF extractor has flattened all lines, the question-label
 * pattern still lets us split most numbered subquestions.
 */
export function parseQuestionsFromText(
  text: string,
  fileName: string,
  defaultSubject = 'Data Structures'
): ExtractedQuestion[] {
  const normalized = text
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/(?:^|\n)\s*(?:AD\s*-\s*){2,}/g, '\n');

  const lines = normalized
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  const questions: ExtractedQuestion[] = [];
  let currentModule = 1;
  let currentTopic = 'General';
  let buffer: string[] = [];
  let currentNumber = '';
  let currentMetadata: QuestionMetadata = {};
  let questionCounter = 0;

  const flush = () => {
    if (!buffer.length) return;

    const raw = buffer.join(' ').replace(/\s+/g, ' ').trim();
    buffer = [];

    // Remove trailing metadata/footer noise from the question text.
    const textWithoutMetadata = raw
      .replace(/\b\d{1,2}\s+L[1-6]\s+CO\d+\b/gi, '')
      .replace(/\b\d{1,2}\s+of\s+\d{1,2}\b/gi, '')
      .replace(/\b(?:USN|BCS\d{3})\b/gi, '')
      .replace(/\bVTU-\d{2}-\d{2}-\d{4}\b.*$/i, '')
      .replace(/\b\d{1,2}:\d{2}:\d{2}\s*(?:am|pm)\b/gi, '')
      .trim();

    const cleanText = cleanQuestionText(textWithoutMetadata);

    if (cleanText.length < 15) return;
    if (/^(module|unit)\s*[-–]?\s*\d+$/i.test(cleanText)) return;

    if (/^(or|\*{4,}|m\s*:|time:|max\.?\s*marks)/i.test(cleanText)) return;

    if (/^(process id|process|allocation|max|available|arrival time|burst time)$/i.test(cleanText)) return;
    if (/^\d+\s+of\s+\d+$/i.test(cleanText)) return;

    const metadata = {
      ...extractMetadata(raw),
      ...currentMetadata,
    };

    // Do not infer marks from arbitrary numbers in the question text.
    const marks = metadata.marks ?? 5;
    const bloomLevel = metadata.bloomLevel ?? inferBloomLevel(cleanText);
    const courseOutcome = metadata.courseOutcome ?? `CO${currentModule}`;

    questions.push({
      tempId: `ext_${Date.now()}_${questionCounter++}`,
      sourceFile: fileName,
      questionNumber: currentNumber,
      subject: inferSubject(cleanText, defaultSubject),
      module: currentModule,
      topic: currentTopic,
      text: cleanText,
      marks,
      bloomLevel,
      bloomLevelAI: bloomLevel,
      courseOutcome,
      questionType: marks >= 8 ? 'Long Answer' : 'Short Answer',
      confidence: metadata.marks && metadata.bloomLevel && metadata.courseOutcome
        ? 0.95
        : 0.65,
    });

    currentMetadata = {};
  };

  // Join lines until a recognizable question label is found.
  const questionStart =
    /^(?:(?:question|q)\s*)?(\d{1,2})\s*([.)]?)\s*([a-z])\s*[.)]\s*(.*)$/i;

  const numberedStart =
    /^(?:(?:question|q)\s*)?(\d{1,2})\s*[.)]\s+(.+)$/i;

  for (const originalLine of lines) {
    const line = originalLine.trim();

    const moduleMatch = line.match(/\bmodule\s*[-–]?\s*(\d+)\b/i);
    if (moduleMatch) {
      flush();
      currentModule = Math.min(5, Math.max(1, Number(moduleMatch[1])));
      currentTopic = 'General';
      currentMetadata = {};
      continue;
    }

    if (/^\s*OR\s*$/i.test(line)) {
      flush();
      continue;
    }

    if (/^\s*(?:M\s*:\s*Marks|L\s*:\s*Bloom|C\s*:\s*Course)/i.test(line)) {
      continue;
    }

    // Skip obvious headers and page footers.

    if (/\b(?:USN|BCS\d{3}|VTU-\d{2}-\d{2}-\d{4})\b/i.test(line) || /^\d+\s+of\s+\d+$/i.test(line) || /^(?:time:|max\.?\s*marks:|third semester|\*{4,})/i.test(line)) continue;



    const meta = extractMetadata(line);

    // Some PDF layouts put "8 L2 CO1" on a separate text line.
    if (
      meta.marks !== undefined ||
      meta.bloomLevel !== undefined ||
      meta.courseOutcome !== undefined
    ) {
      if (buffer.length > 0) {
        currentMetadata = { ...currentMetadata, ...meta };
      }
      continue;
    }

    const subquestion = line.match(questionStart);
    if (subquestion) {
      flush();
      currentNumber = `${subquestion[1]}(${subquestion[3].toLowerCase()})`;
      currentMetadata = {};
      buffer = subquestion[4] ? [subquestion[4]] : [];
      continue;
    }

    // Recognize a numbered top-level question, but not tables like "P1 0 9".
    const numbered = line.match(numberedStart);
    if (numbered && /^\d{1,2}$/.test(numbered[1])) {
      flush();
      currentNumber = numbered[1];
      buffer = [numbered[2]];
      currentMetadata = {};
      continue;
    }

    // Standalone subparts: "a. ..." or "b. ..."
    const standalone = line.match(/^([a-f])\s*[.)]\s*(.+)$/i);
    if (standalone && currentNumber) {
      flush();
      currentNumber = `${currentNumber.replace(/\([a-f]\)$/i, '')}(${standalone[1].toLowerCase()})`;
      buffer = [standalone[2]];
      currentMetadata = {};
      continue;
    }

    if (buffer.length > 0) {
      buffer.push(line);
    }
  }

  flush();

  // Remove exact duplicates within this extraction batch.
  const unique: ExtractedQuestion[] = [];

  for (const question of questions) {
    const duplicate = unique.find(
      existing => normalizeText(existing.text) === normalizeText(question.text)
    );

    if (duplicate) continue;

    unique.push(question);
  }

  return unique;
}

/**
 * Extract questions from multiple PDFs.
 *
 * Existing Question Bank questions can be supplied as the third argument.
 * Exact duplicates are flagged and deselected by the Question Bank UI.
 */
export async function extractQuestionsFromMultiplePDFs(
  files: File[],
  subject = 'Data Structures',
  existingQuestions: Question[] = []
): Promise<{
  questions: ExtractedQuestion[];
  summary: {
    fileCount: number;
    questionCount: number;
    duplicateCount: number;
  };
}> {
  const allQuestions: ExtractedQuestion[] = [];
  const failedFiles: string[] = [];

  for (const file of files) {
    try {
      const rawText = await extractTextFromPDFFile(file);

      if (!rawText.trim()) {
        failedFiles.push(file.name);
        continue;
      }

      const extracted = parseQuestionsFromText(rawText, file.name, subject);

      if (extracted.length === 0) {
        failedFiles.push(file.name);
        continue;
      }

      allQuestions.push(...extracted);
    } catch (error) {
      console.error(`Failed to read ${file.name}:`, error);
      failedFiles.push(file.name);
    }
  }

  if (allQuestions.length === 0) {
    throw new Error(
      `No questions could be extracted from: ${failedFiles.join(', ') || 'the selected PDFs'}.`
    );
  }

  // Flag exact and likely duplicates against the existing bank.
  let duplicateCount = 0;

  const checked = allQuestions.map(question => {
    const match = existingQuestions.find(existing => {
      if (existing.subject !== question.subject) return false;
      return similarity(existing.text, question.text) >= 0.9;
    });

    if (match) {
      duplicateCount++;
      return {
        ...question,
        isDuplicate: true,
        duplicateOf: match.id,
      };
    }

    return question;
  });

  return {
    questions: checked,
    summary: {
      fileCount: files.length,
      questionCount: checked.length,
      duplicateCount,
    },
  };
}
