import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Database, FileText, Plus, TrendingUp, ChevronRight } from 'lucide-react';
import { getSubjects, getQuestions } from '../api';
import { Subject, Question } from '../types';
import { Skeleton } from '../components/Skeleton';
import { useToast } from '../context/ToastContext';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getSubjects(), getQuestions()])
      .then(([s, q]) => { setSubjects(s); setQuestions(q); })
      .catch(() => addToast('Failed to load dashboard data', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const recentPapers = [
    { id: 'paper_001', title: 'Data Structures — Mid-Term', subject: 'Data Structures', date: '2026-10-09', marks: 100 },
    { id: 'paper_002', title: 'OS — End Sem', subject: 'Operating Systems', date: '2026-10-08', marks: 100 },
  ];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-2xl p-8 text-white">
        <div className="flex items-center gap-3 mb-3">
          <BookOpen className="w-10 h-10" />
          <h1 className="text-3xl font-bold">SmartExam</h1>
        </div>
        <p className="text-indigo-100 text-lg">Smart Exam Question Paper Organizer for VTU Engineering</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)
        ) : (
          <>
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-indigo-100 rounded-lg"><Database className="w-5 h-5 text-indigo-600" /></div>
                <span className="text-sm font-medium text-gray-500">Total Questions</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{questions.length}</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 rounded-lg"><FileText className="w-5 h-5 text-green-600" /></div>
                <span className="text-sm font-medium text-gray-500">Papers Generated</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{recentPapers.length}</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 rounded-lg"><TrendingUp className="w-5 h-5 text-purple-600" /></div>
                <span className="text-sm font-medium text-gray-500">Subjects Available</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{subjects.length}</p>
            </div>
          </>
        )}
      </div>

      {/* Quick Generate */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate Question Paper</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label htmlFor="subject-select" className="block text-sm font-medium text-gray-700 mb-1">Select Subject</label>
            <select
              id="subject-select"
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Choose a subject --</option>
              {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => navigate(`/generate${selectedSubject ? `?subject=${encodeURIComponent(selectedSubject)}` : ''}`)}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <Plus className="w-4 h-4" />
              Generate Paper
            </button>
          </div>
        </div>
      </div>

      {/* Recent Papers */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Papers</h2>
        {recentPapers.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>No papers generated yet. Create your first paper!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentPapers.map(p => (
              <div
                key={p.id}
                onClick={() => navigate(`/papers/${p.id}`)}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 cursor-pointer transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900 text-sm">{p.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{p.subject} • {p.date} • {p.marks} marks</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
