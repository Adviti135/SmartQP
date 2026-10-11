# SmartQP
SmartQP is an intelligent, modern web application designed to help educators create balanced and structured examination question papers effortlessly. By adhering to Bloom's Taxonomy and specific course blueprints, SmartQP ensures that generated exams are high-quality, academically sound, and strictly regulated.
## ✨ Features
- **Intelligent Paper Generation**: Automatically generate 100-mark question papers (5 modules, 20 marks each) based on the selected Subject and Difficulty Profile.
- **Strict Bloom's Taxonomy Enforcement**:
  - **Easy (L1-L2)**: Prioritizes *Remember* and *Understand* questions.
  - **Medium (L3)**: Prioritizes *Apply* questions.
  - **Hard (L4-L5)**: Prioritizes *Analyze* and *Evaluate* questions.
  - **Balanced (L1-L5)**: Evenly distributes cognitive load across the paper.
  - *Note: L6 (Create) questions are strictly excluded from automated generation.*
- **Automated PDF Extraction & Import**: Upload multiple past question paper PDFs simultaneously. The system extracts questions, intelligently estimates Bloom's Levels and Course Outcomes (COs), detects duplicates, and bulk-imports them into your Question Bank.
- **Robust Validation**: Dynamically validates the availability of eligible questions in the Question Bank before generation, ensuring no strict blueprint constraints are silently broken.
- **Export to PDF**: Preview generated papers in a clean, print-ready layout and export them directly to PDF.
- **Secure Authentication**: Built-in support for Email/Password login and Google OAuth via Firebase Authentication.
## 🛠️ Technology Stack
**Frontend:**
- [React 18](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) (Build Tool)
- [Tailwind CSS](https://tailwindcss.com/) (Styling)
- [Lucide React](https://lucide.dev/) (Icons)
- [pdf.js](https://mozilla.github.io/pdf.js/) (Local PDF text extraction)
**Backend / Services:**
- [Firebase Authentication](https://firebase.google.com/docs/auth) (Google & Email/Password Auth)
- [FastAPI](https://fastapi.tiangolo.com/) + Python (API Layer)
- SQLite / SQLAlchemy (Database)
## 🚀 Getting Started
