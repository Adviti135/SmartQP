import React, { useState } from 'react';
import { Upload, FileText, Check, AlertCircle, X, Sparkles } from 'lucide-react';
import { Modal } from './Modal';
import { Question } from '../types';
import { createQuestion } from '../api';
import { useToast } from '../context/ToastContext';
import {
  ExtractedQuestion,
  SAMPLE_PDF_SETS,
  extractQuestionsFromMultiplePDFs,
  parseQuestionsFromText,
} from '../utils/pdfExtractor';
import { BloomBadge } from './BloomBadge';

interface PdfQuestionImportProps {
  isOpen: boolean;
  onClose: () => void;
  onQuestionsImported: (newQuestions: Question[]) => void;
}

export const PdfQuestionImport: React.FC<PdfQuestionImportProps> = ({
  isOpen,
  onClose,
  onQuestionsImported,
}) => {
  const { addToast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [extractedQuestions, setExtractedQuestions] = useState<ExtractedQuestion[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [subject, setSubject] = useState('Data Structures');
  const [importing, setImporting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArr = Array.from(e.target.files).filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
      setSelectedFiles(prev => [...prev, ...filesArr]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const loadSamplePdf = (sampleIndex: number) => {
    const sample = SAMPLE_PDF_SETS[sampleIndex];
    if (!sample) return;

    const sampleExtracted: ExtractedQuestion[] = sample.questions.map((q, idx) => ({
      ...q,
      tempId: `sample_${sampleIndex}_${idx}_${Date.now()}`,
      sourceFile: sample.fileName,
    }));

    setExtractedQuestions(prev => {
      const combined = [...prev, ...sampleExtracted];
      setSelectedIndices(new Set(combined.map((_, i) => i)));
      return combined;
    });

    addToast(`Extracted ${sampleExtracted.length} questions from ${sample.fileName}`, 'info');
  };

  const handleStartExtraction = async () => {
    if (selectedFiles.length === 0 && extractedQuestions.length === 0) {
      addToast('Please select at least one PDF file or sample PDF', 'error');
      return;
    }

    if (selectedFiles.length > 0) {
      setExtracting(true);
      try {
        const { questions } = await extractQuestionsFromMultiplePDFs(selectedFiles, subject);
        setExtractedQuestions(prev => {
          const newTotal = [...prev, ...questions];
          setSelectedIndices(new Set(newTotal.map((_, i) => i)));
          return newTotal;
        });
        setSelectedFiles([]);
        addToast(`Extracted ${questions.length} questions successfully!`, 'success');
      } catch (err) {
        addToast('Error extracting questions from PDF files', 'error');
      } finally {
        setExtracting(false);
      }
    }
  };

  const toggleSelectAll = () => {
    if (selectedIndices.size === extractedQuestions.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(extractedQuestions.map((_, i) => i)));
    }
  };

  const toggleSelect = (index: number) => {
    setSelectedIndices(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleImportSelected = async () => {
    const toImport = extractedQuestions.filter((_, i) => selectedIndices.has(i));
    if (toImport.length === 0) {
      addToast('No questions selected for import', 'error');
      return;
    }

    setImporting(true);
    try {
      const createdList: Question[] = [];
      for (const item of toImport) {
        const created = await createQuestion({
          subject: item.subject || subject,
          module: item.module,
          topic: item.topic,
          text: item.text,
          marks: item.marks,
          bloomLevel: item.bloomLevel,
          bloomLevelAI: item.bloomLevelAI,
          courseOutcome: item.courseOutcome,
          questionType: item.questionType,
        });
        createdList.push(created);
      }

      onQuestionsImported(createdList);
      addToast(`Successfully imported ${createdList.length} questions into Question Bank!`, 'success');
      resetAndClose();
    } catch (err) {
      addToast('Failed to import questions', 'error');
    } finally {
      setImporting(false);
    }
  };

  const resetAndClose = () => {
    setSelectedFiles([]);
    setExtractedQuestions([]);
    setSelectedIndices(new Set());
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={resetAndClose} title="Extract & Import Questions from Multiple PDFs" size="xl">
      <div className="space-y-5">
        {/* Subject & Upload Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Target Subject</label>
            <select
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white font-medium text-gray-800 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Data Structures">Data Structures</option>
              <option value="Operating Systems">Operating Systems</option>
            </select>
          </div>

          {/* Preset Sample PDFs */}
          <div>
            <span className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Or Try Demo PDFs:</span>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_PDF_SETS.map((sample, idx) => (
                <button
                  key={sample.fileName}
                  onClick={() => loadSamplePdf(idx)}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-indigo-50 text-indigo-700 font-medium rounded-lg border border-indigo-200 hover:bg-indigo-100"
                >
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  {sample.fileName.split('_')[0]} PDF
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dropzone for PDFs */}
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-indigo-500 transition-colors bg-white">
          <input
            type="file"
            accept=".pdf"
            multiple
            id="pdf-upload-input"
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="pdf-upload-input" className="cursor-pointer flex flex-col items-center gap-2">
            <Upload className="w-10 h-10 text-indigo-600 mb-1" />
            <p className="text-sm font-semibold text-gray-800">
              Click or drag & drop multiple PDF question paper files here
            </p>
            <p className="text-xs text-gray-500">Supports .pdf files with questions, marks, and unit topics</p>
          </label>
        </div>

        {/* Uploaded Files list */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Selected PDF Files ({selectedFiles.length})</h4>
            <div className="flex flex-wrap gap-2">
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-indigo-50 text-indigo-900 text-xs px-3 py-1.5 rounded-lg border border-indigo-100">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span className="font-medium max-w-[180px] truncate">{file.name}</span>
                  <button onClick={() => removeFile(idx)} className="text-indigo-400 hover:text-indigo-700">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="pt-2">
              <button
                onClick={handleStartExtraction}
                disabled={extracting}
                className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {extracting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Extracting Questions from PDFs...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Extract Questions from {selectedFiles.length} PDF{selectedFiles.length > 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Extracted Questions Table */}
        {extractedQuestions.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="select-all-ext"
                  checked={selectedIndices.size === extractedQuestions.length && extractedQuestions.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <label htmlFor="select-all-ext" className="text-sm font-semibold text-gray-700">
                  Select All Extracted Questions ({selectedIndices.size}/{extractedQuestions.length})
                </label>
              </div>
              <span className="text-xs text-gray-500 font-medium">Ready to import without editing</span>
            </div>

            <div className="max-h-[300px] overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100">
              {extractedQuestions.map((q, idx) => {
                const isSelected = selectedIndices.has(idx);
                return (
                  <div
                    key={q.tempId}
                    onClick={() => toggleSelect(idx)}
                    className={`p-3 text-sm flex items-start gap-3 cursor-pointer transition-colors ${
                      isSelected ? 'bg-indigo-50/50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="mt-1 rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-semibold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                          Mod {q.module}
                        </span>
                        <span className="font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                          {q.marks} Marks
                        </span>
                        <BloomBadge level={q.bloomLevel} />
                        <span className="text-gray-400 font-mono text-[11px] truncate max-w-[150px]">
                          [{q.sourceFile}]
                        </span>
                      </div>
                      <p className="text-gray-800 font-medium leading-snug">{q.text}</p>
                      <div className="flex gap-4 text-xs text-gray-500 pt-0.5">
                        <span>Topic: <strong className="text-gray-700">{q.topic}</strong></span>
                        <span>CO: <strong className="text-gray-700">{q.courseOutcome}</strong></span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-gray-200 pt-4 mt-4">
          <button
            onClick={resetAndClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleImportSelected}
            disabled={importing || selectedIndices.size === 0}
            className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
          >
            {importing ? 'Importing...' : `Import ${selectedIndices.size} Selected Questions`}
          </button>
        </div>
      </div>
    </Modal>
  );
};
