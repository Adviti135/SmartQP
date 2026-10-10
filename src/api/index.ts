import axios from 'axios';
import { Question, Paper, Subject, QuestionFilters, GenerateRequest } from '../types';
import {
  MOCK_MODE,
  mockGetSubjects,
  mockGetQuestions,
  mockCreateQuestion,
  mockUpdateQuestion,
  mockDeleteQuestion,
  mockDeleteAllQuestions,
  mockGeneratePaper,
  mockGetPaper,
  mockReplacePaperQuestion,
  mockExportPaper,
} from './mock';

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

const api = axios.create({ baseURL: BASE });

export const getSubjects = async (): Promise<Subject[]> => {
  if (MOCK_MODE) return mockGetSubjects();
  const res = await api.get<Subject[]>('/api/subjects');
  return res.data;
};

export const getQuestions = async (filters?: QuestionFilters): Promise<Question[]> => {
  if (MOCK_MODE) return mockGetQuestions(filters);
  const res = await api.get<Question[]>('/api/questions', { params: filters });
  return res.data;
};

export const createQuestion = async (data: Omit<Question, 'id'>): Promise<Question> => {
  if (MOCK_MODE) return mockCreateQuestion(data);
  const res = await api.post<Question>('/api/questions', data);
  return res.data;
};

export const updateQuestion = async (id: string, data: Partial<Question>): Promise<Question> => {
  if (MOCK_MODE) return mockUpdateQuestion(id, data);
  const res = await api.put<Question>(`/api/questions/${id}`, data);
  return res.data;
};

export const deleteQuestion = async (id: string): Promise<void> => {
  if (MOCK_MODE) { await mockDeleteQuestion(id); return; }
  await api.delete(`/api/questions/${id}`);
};

export const deleteAllQuestions = async (): Promise<void> => {
  if (MOCK_MODE) {
    await mockDeleteAllQuestions();
    return;
  }

  await api.delete('/api/questions');
};

export const generatePaper = async (req: GenerateRequest): Promise<Paper> => {
  if (MOCK_MODE) return mockGeneratePaper(req);
  const res = await api.post<Paper>('/api/papers/generate', req);
  return res.data;
};

export const getPaper = async (id: string): Promise<Paper> => {
  if (MOCK_MODE) return mockGetPaper(id);
  const res = await api.get<Paper>(`/api/papers/${id}`);
  return res.data;
};

export const replacePaperQuestion = async (paperId: string, slot: string, questionId: string): Promise<Paper> => {
  if (MOCK_MODE) return mockReplacePaperQuestion(paperId, slot, questionId);
  const res = await api.post<Paper>(`/api/papers/${paperId}/replace`, { slot, questionId });
  return res.data;
};

export const exportPaper = async (paperId: string): Promise<Blob> => {
  if (MOCK_MODE) return mockExportPaper(paperId);
  const res = await api.get(`/api/papers/${paperId}/export`, { responseType: 'blob' });
  return res.data as Blob;
};
