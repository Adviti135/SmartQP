import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ToastProvider } from './context/ToastContext';
import { ToastContainer } from './components/ToastContainer';
import { Dashboard } from './pages/Dashboard';
import { QuestionBank } from './pages/QuestionBank';
import { GeneratePaper } from './pages/GeneratePaper';
import { PaperView } from './pages/PaperView';

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/questions" element={<QuestionBank />} />
            <Route path="/generate" element={<GeneratePaper />} />
            <Route path="/papers/:id" element={<PaperView />} />
          </Routes>
        </Layout>
        <ToastContainer />
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
