import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, LayoutDashboard, Database, FileText, Menu, X } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { to: '/questions', label: 'Question Bank', icon: <Database className="w-5 h-5" /> },
  { to: '/generate', label: 'Generate Paper', icon: <FileText className="w-5 h-5" /> },
];

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 font-bold text-indigo-600 text-xl">
            <BookOpen className="w-7 h-7" />
            <span>SmartExam</span>
          </Link>
          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(item => (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === item.to
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>
          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            {NAV_ITEMS.map(item => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium ${
                  location.pathname === item.to ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {children}
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-30">
        {NAV_ITEMS.map(item => (
          <Link
            key={item.to}
            to={item.to}
            className={`flex-1 flex flex-col items-center py-2 text-xs gap-1 ${
              location.pathname === item.to ? 'text-indigo-600' : 'text-gray-500'
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
};
