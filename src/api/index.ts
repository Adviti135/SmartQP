import axios from 'axios';
import { Question, Paper, Subject, QuestionFilters, GenerateRequest, User } from '../types';
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
  mockLogin,
  mockRegister,
  mockGoogleAuth,
} from './mock';

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

const api = axios.create({ baseURL: BASE });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('examgenius_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export const registerApi = async (username: string, email: string, password: string): Promise<AuthResponse> => {
  if (MOCK_MODE) return mockRegister(username, email, password);
  const res = await api.post<AuthResponse>('/api/auth/register', { username, email, password });
  return res.data;
};

export const loginApi = async (username_or_email: string, password: string): Promise<AuthResponse> => {
  if (MOCK_MODE) return mockLogin(username_or_email, password);
  const res = await api.post<AuthResponse>('/api/auth/login', { username_or_email, password });
  return res.data;
};

export const googleAuthApi = async (id_token: string): Promise<AuthResponse> => {
  if (MOCK_MODE) return mockGoogleAuth(id_token);
  const res = await api.post<AuthResponse>('/api/auth/google', { id_token });
  return res.data;
};

export const getMeApi = async (): Promise<User> => {
  const res = await api.get<User>('/api/auth/me');
  return res.data;
};

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
