import { useState, useEffect } from "react";

type Question = {
  sub_question?: string;
  text?: string;
  marks?: number;
  bloom?: string;
  co?: string;
};

type QuestionOption = {
  question_number: string | number;
  questions: Question[];
  total_marks: number;
};

type PaperModule = {
  module: number;
  options: QuestionOption[];
  total_marks: number;
};

type GeneratedPaper = {
  total_marks: number;
  paper: PaperModule[];
};

const API_URL = "http://127.0.0.1:8000";

import { generatePaper, getSubjects } from "../api";
import { Paper, Subject, DifficultyProfile, Conflict } from "../types";

export default function GeneratePaper() {
  const [paper, setPaper] = useState<GeneratedPaper | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [difficulty, setDifficulty] = useState<DifficultyProfile>("balanced");
  const [generatedDifficulty, setGeneratedDifficulty] = useState("");
  const [conflicts, setConflicts] = useState<Conflict[]>([]);

  // Load subjects on mount
  useEffect(() => {
    getSubjects().then(res => {
      setSubjects(res);
      if (res.length > 0) setSelectedSubject(res[0].id);
    }).catch(console.error);
  }, []);

  async function handleGeneratePaper() {
    setLoading(true);
    setError("");
    setPaper(null);

    try {
      if (!selectedSubject) throw new Error("Please select a subject.");
      
      const responsePaper = await generatePaper({ 
        subject: selectedSubject, 
        difficultyProfile: difficulty 
      });

      setGeneratedDifficulty(responsePaper.difficultyProfile || difficulty);
      setConflicts(responsePaper.conflicts || []);

      // Transform backend Paper into GeneratedPaper format
      const generatedModules: PaperModule[] = responsePaper.sections.map((sec) => {
        const groupedOptions: Record<string, Question[]> = {};
        let optionMarks: Record<string, number> = {};

        sec.questions.forEach((pq) => {
          const match = pq.questionNumber.match(/^(\d+)([a-zA-Z]*)$/);
          if (match) {
            const [_, num, sub] = match;
            if (!groupedOptions[num]) {
              groupedOptions[num] = [];
              optionMarks[num] = 0;
            }
            groupedOptions[num].push({
              sub_question: sub,
              text: pq.question.text,
              marks: pq.marks,
              bloom: pq.question.bloomLevel.toString(),
              co: pq.question.courseOutcome,
            });
            optionMarks[num] += pq.marks;
          }
        });

        const options: QuestionOption[] = Object.keys(groupedOptions).map(num => ({
          question_number: num,
          questions: groupedOptions[num],
          total_marks: optionMarks[num]
        }));

        return {
          module: sec.module,
          options: options,
          total_marks: sec.totalMarks,
        };
      });

      setPaper({
        total_marks: responsePaper.totalMarks,
        paper: generatedModules
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not generate the question paper."
      );
    } finally {
      setLoading(false);
    }
  }

  function printPaper() {
    window.print();
  }

  return (
    <div className="smartqp-page">
      <style>{`
        .smartqp-page {
          min-height: 100vh;
          padding: 24px;
          background: #f1f3f5;
          color: #111;
          font-family: Arial, Helvetica, sans-serif;
        }

        .smartqp-actions {
          max-width: 850px;
          margin: 0 auto 20px;
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .smartqp-button {
          padding: 12px 20px;
          border: 0;
          border-radius: 6px;
          background: #1d4ed8;
          color: white;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
        }

        .smartqp-button:disabled {
          opacity: 0.6;
          cursor: wait;
        }

        .smartqp-paper {
          box-sizing: border-box;
          width: 210mm;
          max-width: 100%;
          min-height: 297mm;
          margin: 0 auto;
          padding: 17mm 18mm;
          background: white;
          box-shadow: 0 2px 12px #0002;
          font-family: "Times New Roman", Times, serif;
          font-size: 12pt;
          line-height: 1.4;
          overflow-wrap: anywhere;
        }

        .smartqp-header {
          text-align: center;
          border-bottom: 1px solid #222;
          padding-bottom: 12px;
          margin-bottom: 16px;
        }

        .smartqp-header h1 {
          margin: 0 0 7px;
          font-size: 15pt;
          text-transform: uppercase;
        }

        .smartqp-header p {
          margin: 4px 0;
        }

        .smartqp-details {
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px 20px;
          margin: 14px 0;
          font-weight: bold;
        }

        .smartqp-note {
          margin: 16px 0 20px;
        }

        .smartqp-module {
          margin: 20px 0 24px;
        }

        .smartqp-module-title {
          margin-bottom: 12px;
          padding-bottom: 5px;
          border-bottom: 1px solid #777;
          text-align: center;
          font-size: 13pt;
          font-weight: bold;
          text-transform: uppercase;
        }

        .smartqp-option {
          margin: 12px 0;
        }

        .smartqp-option-heading {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin: 12px 0 10px;
          font-weight: bold;
        }

        .smartqp-question {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          margin: 8px 0;
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .smartqp-sub-label {
          flex: 0 0 28px;
        }

        .smartqp-question-text {
          flex: 1;
          min-width: 0;
          white-space: pre-wrap;
        }

        .smartqp-marks {
          flex: 0 0 45px;
          text-align: right;
          white-space: nowrap;
        }

        .smartqp-or {
          margin: 16px 0;
          text-align: center;
          font-weight: bold;
          letter-spacing: 1px;
        }

        .smartqp-total {
          margin-top: 24px;
          padding-top: 10px;
          border-top: 1px solid #777;
          text-align: right;
          font-weight: bold;
        }

        .smartqp-error,
        .smartqp-empty {
          max-width: 850px;
          margin: 20px auto;
          padding: 16px;
          background: white;
          border-radius: 6px;
          overflow-wrap: anywhere;
        }

        .smartqp-error {
          color: #b91c1c;
        }

        @page {
          size: A4 portrait;
          margin: 12mm;
        }

        @media print {
          body * {
            visibility: hidden;
          }

          .smartqp-paper,
          .smartqp-paper * {
            visibility: visible;
          }

          .smartqp-page {
            min-height: 0;
            margin: 0;
            padding: 0;
            background: white !important;
          }

          .smartqp-actions,
          .smartqp-error,
          .smartqp-empty {
            display: none !important;
          }

          .smartqp-paper {
            width: 100%;
            max-width: none;
            min-height: 0;
            margin: 0;
            padding: 0;
            box-shadow: none;
            font-size: 11pt;
            line-height: 1.3;
          }

          .smartqp-header,
          .smartqp-module-title,
          .smartqp-option-heading,
          .smartqp-question,
          .smartqp-or,
          .smartqp-total {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .smartqp-module {
            margin-top: 16px;
          }
        }
      `}</style>

      <div className="smartqp-actions">
        {subjects.length > 0 && !paper && (
          <>
            <select 
              className="smartqp-button" 
              style={{ backgroundColor: "white", color: "black", border: "1px solid #ccc" }}
              value={selectedSubject} 
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              {subjects.map(s => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
            <select 
              className="smartqp-button" 
              style={{ backgroundColor: "white", color: "black", border: "1px solid #ccc" }}
              value={difficulty} 
              onChange={(e) => setDifficulty(e.target.value as DifficultyProfile)}
            >
              <option value="easy">Easy (L1-L2)</option>
              <option value="medium">Medium (L3)</option>
              <option value="hard">Hard (L4-L5)</option>
              <option value="balanced">Balanced (L1-L5)</option>
            </select>
          </>
        )}

        <button
          type="button"
          className="smartqp-button"
          onClick={handleGeneratePaper}
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate Question Paper"}
        </button>

        {paper && (
          <button
            type="button"
            className="smartqp-button"
            onClick={() => setPaper(null)}
            style={{ backgroundColor: "#ef4444" }}
          >
            Reset
          </button>
        )}

        {paper && (
          <button
            type="button"
            className="smartqp-button"
            onClick={printPaper}
          >
            Print / Save as PDF
          </button>
        )}
      </div>

      {error && <div className="smartqp-error">{error}</div>}

      {conflicts.length > 0 && (
        <div className="smartqp-error" style={{ backgroundColor: '#fffbeb', color: '#b45309', border: '1px solid #fcd34d' }}>
          <strong>Warning: Insufficient Questions</strong>
          <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
            {conflicts.map((c, i) => (
              <li key={i}>{c.message}</li>
            ))}
          </ul>
        </div>
      )}

      {!paper && !loading && !error && (
        <div className="smartqp-empty">
          Click <strong>Generate Question Paper</strong> to create your paper.
        </div>
      )}

      {paper && (
        <main className="smartqp-paper">
          <header className="smartqp-header">
            <h1>Visvesvaraya Technological University</h1>
            <p>MODEL QUESTION PAPER</p>
            <p>Subject: __________________________</p>
            <p>Semester: __________ &nbsp; Subject Code: __________</p>
            <p style={{ marginTop: '8px', fontStyle: 'italic' }}>
              Difficulty: <span style={{ textTransform: 'capitalize' }}>{generatedDifficulty}</span>
            </p>
          </header>

          <div className="smartqp-details">
            <span>Time: 3 Hours</span>
            <span>Maximum Marks: {paper.total_marks}</span>
          </div>

          <p className="smartqp-note">
            <strong>Note:</strong> Answer one full question from each module.
          </p>

          {paper.paper.map((module) => (
            <section className="smartqp-module" key={module.module}>
              <div className="smartqp-module-title">
                MODULE {module.module}
              </div>

              {module.options.map((option, optionIndex) => (
                <div
                  className="smartqp-option"
                  key={`${module.module}-${option.question_number}`}
                >
                  <div className="smartqp-option-heading">
                    <span>Q. {option.question_number}</span>
                    <span>{option.total_marks} Marks</span>
                  </div>

                  {option.questions.map((question, questionIndex) => (
                    <div
                      className="smartqp-question"
                      key={`${option.question_number}-${question.sub_question ?? questionIndex}`}
                    >
                      <span className="smartqp-sub-label">
                        ({question.sub_question || String.fromCharCode(97 + questionIndex)})
                      </span>

                      <span className="smartqp-question-text">
                        {question.text}
                      </span>

                      <span className="smartqp-marks">
                        [{question.marks ?? 0}]
                      </span>
                    </div>
                  ))}

                  {optionIndex < module.options.length - 1 && (
                    <div className="smartqp-or">OR</div>
                  )}
                </div>
              ))}
            </section>
          ))}

          <div className="smartqp-total">
            Maximum Marks: {paper.total_marks}
          </div>
        </main>
      )}
    </div>
  );
}