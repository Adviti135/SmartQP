
import React, { useEffect, useState, useCallback } from 'react';
import {
  Search, Plus, Edit2, Trash2, AlertTriangle, CheckCircle,
  ChevronLeft, ChevronRight, Database, Upload, FileText, X,
  Loader2, Check
} from 'lucide-react';

import {
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  deleteAllQuestions,
  getSubjects
} from '../api';

import { Question, QuestionFilters, Subject } from '../types';
import {
  extractQuestionsFromMultiplePDFs,
  ExtractedQuestion
} from '../utils/pdfExtractor';

import { BloomBadge } from '../components/BloomBadge';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { TableSkeleton } from '../components/Skeleton';
import { useToast } from '../context/ToastContext';
import { BLOOM_LABELS } from '../utils/bloomColors';

const PAGE_SIZE = 20;

const EMPTY_FORM: Omit<Question, 'id'> = {
  subject: 'Data Structures',
  module: 1,
  topic: '',
  text: '',
  marks: 5,
  bloomLevel: 2,
  bloomLevelAI: 2,
  courseOutcome: 'CO1',
  questionType: 'Short Answer',
};

type ReviewQuestion = ExtractedQuestion & {
  selected: boolean;
};

export const QuestionBank: React.FC = () => {
  const { addToast } = useToast();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<QuestionFilters>({});
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editQuestion, setEditQuestion] = useState<Question | null>(null);
  const [form, setForm] = useState<Omit<Question, 'id'>>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null);

  // PDF upload and review state
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [reviewQuestions, setReviewQuestions] = useState<ReviewQuestion[]>([]);
  const [pdfSubject, setPdfSubject] = useState('Data Structures');
  const [uploadError, setUploadError] = useState('');
  const [uploadMessage, setUploadMessage] = useState('');

  const fetchQuestions = useCallback(async () => {
    setLoading(true);

    try {
      const result = await getQuestions({
        ...filters,
        search: search || undefined,
      });

      setQuestions(result);
      setPage(1);
    } catch {
      addToast('Failed to load questions', 'error');
    } finally {
      setLoading(false);
    }
  }, [filters, search, addToast]);

  useEffect(() => {
    void fetchQuestions();
  }, [fetchQuestions]);

  useEffect(() => {
    getSubjects()
      .then(setSubjects)
      .catch(() => {
        // Subject filtering remains usable if the subject endpoint is unavailable.
      });
  }, []);

  const totalPages = Math.max(1, Math.ceil(questions.length / PAGE_SIZE));
  const paged = questions.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const openAdd = () => {
    setEditQuestion(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (q: Question) => {
    setEditQuestion(q);
    setForm({
      subject: q.subject,
      module: q.module,
      topic: q.topic,
      text: q.text,
      marks: q.marks,
      bloomLevel: q.bloomLevel,
      bloomLevelAI: q.bloomLevelAI,
      courseOutcome: q.courseOutcome,
      questionType: q.questionType,
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!form.topic.trim()) errors.topic = 'Topic is required';
    if (!form.text.trim()) errors.text = 'Question text is required';
    if (!form.courseOutcome.trim()) {
      errors.courseOutcome = 'Course outcome is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);

    try {
      if (editQuestion) {
        const updated = await updateQuestion(editQuestion.id, form);
        setQuestions(prev =>
          prev.map(q => q.id === updated.id ? updated : q)
        );
        addToast('Question updated successfully', 'success');
      } else {
        const created = await createQuestion(form);
        setQuestions(prev => [created, ...prev]);
        addToast('Question added successfully', 'success');
      }

      setModalOpen(false);
      void fetchQuestions();
    } catch {
      addToast('Failed to save question', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (q: Question) => {
    try {
      await deleteQuestion(q.id);
      setQuestions(prev => prev.filter(item => item.id !== q.id));
      addToast('Question deleted', 'success');
    } catch {
      addToast('Failed to delete question', 'error');
    } finally {
      setDeleteTarget(null);
    }
  };
  const handleClearAllQuestions = async () => {
    const confirmed = window.confirm(
      'Delete ALL existing questions? This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      await deleteAllQuestions();
      setQuestions([]);
      setPage(1);
      addToast('All existing questions deleted', 'success');
    } catch {
      addToast('Failed to delete questions', 'error');
    }
  };
  const handleConfirmAI = async (q: Question) => {
    try {
      const updated = await updateQuestion(q.id, {
        bloomLevel: q.bloomLevelAI,
      });

      setQuestions(prev =>
        prev.map(item => item.id === updated.id ? updated : item)
      );

      addToast('AI Bloom level confirmed', 'success');
    } catch {
      addToast('Failed to update Bloom level', 'error');
    }
  };

  const setFilter = (
    key: keyof QuestionFilters,
    value: string | number | undefined
  ) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value,
    }));
  };

  // Select PDF files, allowing multiple documents in one upload.
  const handleFilesSelected = (fileList: FileList | null) => {
    if (!fileList) return;

    const selected = Array.from(fileList);
    const invalid = selected.filter(
      file => file.type !== 'application/pdf' &&
        !file.name.toLowerCase().endsWith('.pdf')
    );

    if (invalid.length > 0) {
      setUploadError('Please select PDF files only.');
      return;
    }

    setPdfFiles(prev => {
      const combined = [...prev, ...selected];
      const unique = new Map(
        combined.map(file => [
          `${file.name}-${file.size}-${file.lastModified}`,
          file,
        ])
      );
      return Array.from(unique.values());
    });

    setUploadError('');
    setUploadMessage('');
  };

  const removePdf = (index: number) => {
    setPdfFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Extract candidate questions from all selected PDFs.

  const handleExtract = async () => {
    if (pdfFiles.length === 0) {
      setUploadError('Choose at least one PDF first.');
      return;
    }

    setExtracting(true);
    setUploadError('');
    setUploadMessage('');

    try {
      const result = await extractQuestionsFromMultiplePDFs(
        pdfFiles,
        pdfSubject,
        questions
      );

      const newQuestions = result.questions.filter(
        question => !question.isDuplicate
      );

      if (newQuestions.length === 0) {
        setUploadMessage(
          'No new questions to add. All extracted questions are already in the Question Bank.'
        );
        return;
      }

      let importedCount = 0;
      const failed: string[] = [];

      for (const question of newQuestions) {
        const payload: Omit<Question, 'id'> = {
          subject: question.subject || pdfSubject,
          module: question.module,
          topic: question.topic || 'General',
          text: question.text.trim(),
          marks: question.marks,
          bloomLevel: question.bloomLevel,
          bloomLevelAI: question.bloomLevelAI,
          courseOutcome: question.courseOutcome,
          questionType: question.questionType || 'Short Answer',
        };

        try {
          await createQuestion(payload);
          importedCount++;
        } catch {
          failed.push(question.text);
        }
      }

      await fetchQuestions();

      if (failed.length > 0) {
        setUploadError(
          `${importedCount} question(s) added. ${failed.length} could not be saved.`
        );
      } else {
        setUploadMessage(
          `Successfully added ${importedCount} new question(s) to the Question Bank.`
        );
        setPdfFiles([]);
      }
    } catch (error) {
      setUploadError(
        error instanceof Error
          ? error.message
          : 'PDF extraction failed.'
      );
    } finally {
      setExtracting(false);
    }
  };


  const updateReviewQuestion = (
    index: number,
    changes: Partial<ReviewQuestion>
  ) => {
    setReviewQuestions(prev =>
      prev.map((question, i) =>
        i === index ? { ...question, ...changes } : question

      )
    );
  };

  // Save only teacher-reviewed selected questions.
  const handleImportReviewed = async () => {
    const selected = reviewQuestions.filter(question => question.selected);

    if (selected.length === 0) {
      setUploadError('Select at least one question to import.');
      return;
    }

    const invalid = selected.find(
      question =>
        !question.text.trim() ||
        !question.topic.trim() ||
        !question.courseOutcome.trim() ||
        !Number.isFinite(question.marks) ||
        question.marks <= 0
    );

    if (invalid) {
      setUploadError(
        'Each selected question needs text, topic, positive marks, and a course outcome.'
      );
      return;
    }

    setImporting(true);
    setUploadError('');

    let importedCount = 0;
    const failed: string[] = [];

    for (const question of selected) {
      // Only send fields supported by the Question API.
      const payload: Omit<Question, 'id'> = {
        subject: question.subject || pdfSubject,
        module: question.module,
        topic: question.topic.trim(),
        text: question.text.trim(),
        marks: question.marks,
        bloomLevel: question.bloomLevel,
        bloomLevelAI: question.bloomLevelAI,
        courseOutcome: question.courseOutcome.trim(),
        questionType: question.questionType || 'Short Answer',
      };

      try {
        await createQuestion(payload);
        importedCount++;
      } catch {
        failed.push(question.text);
      }
    }

    setImporting(false);

    if (importedCount > 0) {
      addToast(
        `${importedCount} reviewed question(s) imported`,
        'success'
      );
      await fetchQuestions();
    }

    if (failed.length > 0) {
      setUploadError(
        `${failed.length} question(s) could not be saved. Please check your backend/API configuration.`
      );
    } else {
      setUploadMessage(
        `Successfully imported ${importedCount} question(s). You can now find them in the Question Bank below.`
      );
      setReviewQuestions([]);
      setPdfFiles([]);
    }
  };

  const selectedCount = reviewQuestions.filter(q => q.selected).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Question Bank</h1>
          <p className="mt-1 text-sm text-gray-500">
            Upload source PDFs, review extracted questions, and manage your bank.
          </p>
        </div>

        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Add Question
        </button>
      </div>

      {/* Multiple PDF upload */}
      <section className="space-y-4 rounded-xl border border-indigo-100 bg-white p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-indigo-50 p-3">
            <Upload className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Upload source PDFs
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Upload a question bank, model paper, or previous-year papers together.
              Review the extracted information before importing it.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label
              htmlFor="pdfSubject"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Subject for this batch
            </label>
            <select
              id="pdfSubject"
              value={pdfSubject}
              onChange={event => setPdfSubject(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option>Data Structures</option>
              <option>Operating Systems</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="pdfUpload"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Select PDF files
            </label>
            <input
              id="pdfUpload"
              type="file"
              accept=".pdf,application/pdf"
              multiple
              onChange={event => {
                handleFilesSelected(event.target.files);
                event.target.value = '';
              }}
              className="block w-full rounded-lg border border-gray-300 p-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:font-medium file:text-indigo-700"
            />
          </div>
        </div>

        {pdfFiles.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">
              Selected documents ({pdfFiles.length})
            </p>

            {pdfFiles.map((file, index) => (
              <div
                key={`${file.name}-${file.size}-${file.lastModified}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 p-3"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <FileText className="h-5 w-5 shrink-0 text-red-500" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-800">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removePdf(index)}
                  aria-label={`Remove ${file.name}`}
                  className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {uploadError && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {uploadError}
          </p>
        )}

        {uploadMessage && (
          <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
            {uploadMessage}
          </p>
        )}

        <button
          type="button"
          onClick={handleExtract}
          disabled={extracting || pdfFiles.length === 0}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {extracting
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <FileText className="h-4 w-4" />}
          {extracting ? 'Extracting questions...' : 'Extract questions for review'}
        </button>
      </section>

      {/* Review extracted candidates before importing */}
      {reviewQuestions.length > 0 && (
        <section className="space-y-4 rounded-xl border border-amber-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Review extracted questions
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Check the extracted text and metadata. CO and Bloom level suggestions
                should be verified against your official syllabus and blueprint.
              </p>
            </div>

            <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
              {selectedCount} selected
            </span>
          </div>

          <div className="space-y-4">
            {reviewQuestions.map((question, index) => (
              <article
                key={question.tempId}
                className="space-y-3 rounded-lg border border-gray-200 p-4"
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={question.selected}
                    onChange={event =>
                      updateReviewQuestion(index, {
                        selected: event.target.checked,
                      })
                    }
                    aria-label={`Select extracted question ${index + 1}`}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500">
                      Source: {question.sourceFile}
                    </p>
                    <label className="mt-2 block text-sm font-medium text-gray-700">
                      Question text
                    </label>
                    <textarea
                      value={question.text}
                      onChange={event =>
                        updateReviewQuestion(index, {
                          text: event.target.value,
                        })
                      }
                      rows={3}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      Topic
                    </label>
                    <input
                      value={question.topic}
                      onChange={event =>
                        updateReviewQuestion(index, {
                          topic: event.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      Module
                    </label>
                    <select
                      value={question.module}
                      onChange={event =>
                        updateReviewQuestion(index, {
                          module: Number(event.target.value),
                        })
                      }
                      className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm"
                    >
                      {[1, 2, 3, 4, 5].map(module => (
                        <option key={module} value={module}>
                          Module {module}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      Marks
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={question.marks}
                      onChange={event =>
                        updateReviewQuestion(index, {
                          marks: Number(event.target.value),
                        })
                      }
                      className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      Course Outcome
                    </label>
                    <input
                      value={question.courseOutcome}
                      onChange={event =>
                        updateReviewQuestion(index, {
                          courseOutcome: event.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      Bloom level
                    </label>
                    <select
                      value={question.bloomLevel}
                      onChange={event => {
                        const level = Number(event.target.value);
                        updateReviewQuestion(index, {
                          bloomLevel: level,
                          bloomLevelAI: level,
                        });
                      }}
                      className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm"
                    >
                      {[1, 2, 3, 4, 5, 6].map(level => (
                        <option key={level} value={level}>
                          L{level} — {BLOOM_LABELS[level]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      Question type
                    </label>
                    <select
                      value={question.questionType}
                      onChange={event =>
                        updateReviewQuestion(index, {
                          questionType: event.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm"
                    >
                      <option>Short Answer</option>
                      <option>Long Answer</option>
                      <option>Problem Solving</option>
                      <option>Descriptive</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      Extraction confidence
                    </label>
                    <p className="rounded-lg bg-gray-50 px-2 py-2 text-sm text-gray-700">
                      {Math.round(question.confidence * 100)}% — review required
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setReviewQuestions(prev =>
                prev.map(question => ({
                  ...question,
                  selected: true,
                }))
              )}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
            >
              Select all
            </button>

            <button
              type="button"
              onClick={() => setReviewQuestions(prev =>
                prev.map(question => ({
                  ...question,
                  selected: false,
                }))
              )}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
            >
              Clear selection
            </button>

            <button
              type="button"
              onClick={handleImportReviewed}
              disabled={importing || selectedCount === 0}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            >
              {importing
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Check className="h-4 w-4" />}
              {importing ? 'Importing...' : `Import ${selectedCount} reviewed question(s)`}
            </button>
          </div>
        </section>
      )}

      {/* Search and filters */}
      <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search questions..."
            value={search}
            onChange={event => setSearch(event.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Search questions"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={filters.subject ?? ''}
            onChange={event => setFilter('subject', event.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
            aria-label="Filter by subject"
          >
            <option value="">All Subjects</option>
            {subjects.map(subject => (
              <option key={subject.id} value={subject.name}>
                {subject.name}
              </option>
            ))}
          </select>

          <select
            value={filters.module ?? ''}
            onChange={event => setFilter(
              'module',
              event.target.value ? Number(event.target.value) : undefined
            )}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
            aria-label="Filter by module"
          >
            <option value="">All Modules</option>
            {[1, 2, 3, 4, 5].map(module => (
              <option key={module} value={module}>Module {module}</option>
            ))}
          </select>

          <select
            value={filters.marks ?? ''}
            onChange={event => setFilter(
              'marks',
              event.target.value ? Number(event.target.value) : undefined
            )}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
            aria-label="Filter by marks"
          >
            <option value="">All Marks</option>
            {[2, 5, 6, 8, 10, 15, 20].map(marks => (
              <option key={marks} value={marks}>{marks} Marks</option>
            ))}
          </select>

          <select
            value={filters.bloomLevel ?? ''}
            onChange={event => setFilter(
              'bloomLevel',
              event.target.value ? Number(event.target.value) : undefined
            )}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
            aria-label="Filter by Bloom level"
          >
            <option value="">All Bloom Levels</option>
            {[1, 2, 3, 4, 5, 6].map(level => (
              <option key={level} value={level}>
                {BLOOM_LABELS[level]}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Existing question table */}
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {loading ? (
          <div className="p-6"><TableSkeleton rows={6} /></div>
        ) : paged.length === 0 ? (
          <div className="py-16 text-center">
            <Database className="mx-auto mb-3 h-12 w-12 text-gray-300" />
            <p className="font-medium text-gray-500">No questions found</p>
            <p className="mt-1 text-sm text-gray-400">
              Try adjusting filters, uploading PDFs, or adding a question.
            </p>
            <button
              onClick={openAdd}
              className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
            >
              Add Question
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    'ID', 'Mod', 'Topic', 'Question', 'Marks',
                    'Bloom (AI / Approved)', 'CO', 'Type', 'Actions',
                  ].map(heading => (
                    <th
                      key={heading}
                      className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {paged.map(question => (
                  <tr
                    key={question.id}
                    className={`hover:bg-gray-50 ${question.isDuplicate ? 'bg-orange-50' : ''
                      }`}
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-gray-500">
                        {question.id.slice(0, 6)}
                      </span>
                      {question.isDuplicate && (
                        <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-orange-100 px-1.5 py-0.5 text-xs font-medium text-orange-700">
                          <AlertTriangle className="h-3 w-3" />
                          Dup
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-600">
                      M{question.module}
                    </td>
                    <td
                      className="max-w-[120px] truncate px-4 py-3 text-sm text-gray-700"
                      title={question.topic}
                    >
                      {question.topic}
                    </td>
                    <td className="max-w-xs px-4 py-3 text-sm text-gray-800">
                      <p className="line-clamp-2" title={question.text}>
                        {question.text}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                        {question.marks}m
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-400">AI:</span>
                          <BloomBadge level={question.bloomLevelAI} />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-400">★:</span>
                          <BloomBadge level={question.bloomLevel} />
                        </div>

                        {question.bloomLevelAI !== question.bloomLevel && (
                          <button
                            onClick={() => handleConfirmAI(question)}
                            className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800"
                            aria-label={`Confirm AI Bloom suggestion L${question.bloomLevelAI}`}
                          >
                            <CheckCircle className="h-3 w-3" />
                            Confirm AI
                          </button>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-600">
                      {question.courseOutcome}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                      {question.questionType}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(question)}
                          aria-label="Edit question"
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(question)}
                          aria-label="Delete question"
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
          <p className="text-sm text-gray-700">
            Showing {questions.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}
            {' '}to {Math.min(page * PAGE_SIZE, questions.length)}
            {' '}of {questions.length} results
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => setPage(current => Math.max(1, current - 1))}
              disabled={page === 1}
              className="rounded-lg border border-gray-300 p-1.5 disabled:opacity-50"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage(current => Math.min(totalPages, current + 1))}
              disabled={page === totalPages}
              className="rounded-lg border border-gray-300 p-1.5 disabled:opacity-50"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Add/Edit question modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editQuestion ? 'Edit Question' : 'Add Question'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Subject
              </label>
              <select
                value={form.subject}
                onChange={event => setForm({
                  ...form,
                  subject: event.target.value,
                })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value="Data Structures">Data Structures</option>
                <option value="Operating Systems">Operating Systems</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Module
              </label>
              <select
                value={form.module}
                onChange={event => setForm({
                  ...form,
                  module: Number(event.target.value),
                })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                {[1, 2, 3, 4, 5].map(module => (
                  <option key={module} value={module}>Module {module}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Topic
            </label>
            <input
              value={form.topic}
              onChange={event => setForm({ ...form, topic: event.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
            {formErrors.topic && (
              <p className="mt-1 text-xs text-red-500">{formErrors.topic}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Question Text
            </label>
            <textarea
              value={form.text}
              onChange={event => setForm({ ...form, text: event.target.value })}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
            {formErrors.text && (
              <p className="mt-1 text-xs text-red-500">{formErrors.text}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Marks
              </label>
              <input
                type="number"
                min={1}
                value={form.marks}
                onChange={event => setForm({
                  ...form,
                  marks: Number(event.target.value),
                })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Bloom Level
              </label>
              <select
                value={form.bloomLevel}
                onChange={event => setForm({
                  ...form,
                  bloomLevel: Number(event.target.value),
                  bloomLevelAI: Number(event.target.value),
                })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                {[1, 2, 3, 4, 5, 6].map(level => (
                  <option key={level} value={level}>
                    {BLOOM_LABELS[level]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Course Outcome (CO)
              </label>
              <input
                value={form.courseOutcome}
                onChange={event => setForm({
                  ...form,
                  courseOutcome: event.target.value,
                })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
              {formErrors.courseOutcome && (
                <p className="mt-1 text-xs text-red-500">
                  {formErrors.courseOutcome}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Question Type
              </label>
              <select
                value={form.questionType}
                onChange={event => setForm({
                  ...form,
                  questionType: event.target.value,
                })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                <option>Short Answer</option>
                <option>Long Answer</option>
                <option>Problem Solving</option>
                <option>Descriptive</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-gray-300 px-4 py-2"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-white disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) void handleDelete(deleteTarget);
        }}
        title="Delete Question"
        message="Are you sure you want to delete this question? This action cannot be undone."
        isDestructive
        confirmLabel="Delete"
      />
    </div>
  );
};
