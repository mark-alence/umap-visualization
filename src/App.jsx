/**
 * UMAP Interactive Tutorial
 * Main Application Component
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Sparkles,
  GitBranch,
  Network,
  Zap,
  Gamepad2,
  AlertTriangle,
} from 'lucide-react';

import Section1 from './components/sections/Section1';
import Section2 from './components/sections/Section2';
import Section3 from './components/sections/Section3';
import Section4 from './components/sections/Section4';
import Section5 from './components/sections/Section5';
import Section6 from './components/sections/Section6';

import './index.css';

const SECTIONS = [
  {
    id: 1,
    title: 'What Problem Does UMAP Solve?',
    shortTitle: 'The Problem',
    icon: Sparkles,
    description: 'Understanding dimensionality reduction',
    component: Section1,
  },
  {
    id: 2,
    title: 'Local vs Global Structure',
    shortTitle: 'Local/Global',
    icon: GitBranch,
    description: 'The n_neighbors parameter',
    component: Section2,
  },
  {
    id: 3,
    title: 'Building the Graph',
    shortTitle: 'Graph Building',
    icon: Network,
    description: 'k-NN, normalization, symmetrization',
    component: Section3,
  },
  {
    id: 4,
    title: 'The Embedding',
    shortTitle: 'Optimization',
    icon: Zap,
    description: 'Gradient descent optimization',
    component: Section4,
  },
  {
    id: 5,
    title: 'Interactive Playground',
    shortTitle: 'Playground',
    icon: Gamepad2,
    description: 'Experiment with datasets',
    component: Section5,
  },
  {
    id: 6,
    title: 'Pitfalls & Interpretation',
    shortTitle: 'Pitfalls',
    icon: AlertTriangle,
    description: 'Common mistakes to avoid',
    component: Section6,
  },
];

function ProgressIndicator({ currentSection, totalSections, onSectionClick }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: totalSections }).map((_, i) => (
        <button
          key={i}
          onClick={() => onSectionClick(i)}
          className={`transition-all ${
            i === currentSection
              ? 'w-8 h-2 bg-blue-500 rounded-full'
              : i < currentSection
              ? 'w-2 h-2 bg-green-500 rounded-full hover:bg-green-400'
              : 'w-2 h-2 bg-slate-600 rounded-full hover:bg-slate-500'
          }`}
          title={SECTIONS[i].shortTitle}
        />
      ))}
    </div>
  );
}

function Sidebar({ currentSection, onSectionClick, isOpen, onClose }) {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-72 bg-slate-900 border-r border-slate-800 z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Network className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white">UMAP Tutorial</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {SECTIONS.map((section, i) => {
            const Icon = section.icon;
            const isActive = i === currentSection;
            const isCompleted = i < currentSection;

            return (
              <button
                key={section.id}
                onClick={() => {
                  onSectionClick(i);
                  onClose();
                }}
                className={`w-full flex items-start gap-3 p-3 rounded-lg transition-all text-left ${
                  isActive
                    ? 'bg-blue-600/20 border border-blue-500/50 text-white'
                    : isCompleted
                    ? 'bg-green-900/20 border border-green-600/30 text-green-400 hover:bg-green-900/30'
                    : 'bg-slate-800/50 border border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${
                  isActive
                    ? 'bg-blue-600'
                    : isCompleted
                    ? 'bg-green-600/50'
                    : 'bg-slate-700'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {i + 1}. {section.shortTitle}
                  </div>
                  <div className="text-xs opacity-60 truncate">
                    {section.description}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Credits */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
          <p className="text-xs text-slate-500 text-center">
            Built with React, D3, Three.js & umap-js
          </p>
        </div>
      </div>
    </>
  );
}

function App() {
  const [currentSection, setCurrentSection] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const contentRef = useRef(null);

  const handleSectionChange = useCallback((index) => {
    setCurrentSection(index);
    // Scroll to top of content
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const handlePrevSection = () => {
    if (currentSection > 0) {
      handleSectionChange(currentSection - 1);
    }
  };

  const handleNextSection = () => {
    if (currentSection < SECTIONS.length - 1) {
      handleSectionChange(currentSection + 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' && currentSection < SECTIONS.length - 1) {
        handleSectionChange(currentSection + 1);
      } else if (e.key === 'ArrowLeft' && currentSection > 0) {
        handleSectionChange(currentSection - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSection, handleSectionChange]);

  const CurrentComponent = SECTIONS[currentSection].component;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      {/* Sidebar */}
      <Sidebar
        currentSection={currentSection}
        onSectionClick={handleSectionChange}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-3">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-slate-400 hover:text-white"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="hidden sm:flex items-center gap-2 text-sm">
                <span className="text-slate-500">Section {currentSection + 1} of {SECTIONS.length}:</span>
                <span className="text-white font-medium">{SECTIONS[currentSection].title}</span>
              </div>
            </div>

            <ProgressIndicator
              currentSection={currentSection}
              totalSections={SECTIONS.length}
              onSectionClick={handleSectionChange}
            />
          </div>
        </header>

        {/* Content */}
        <main
          ref={contentRef}
          className="flex-1 overflow-y-auto"
        >
          <div className="max-w-5xl mx-auto px-4 py-8 lg:px-8">
            <CurrentComponent isActive={true} />
          </div>
        </main>

        {/* Footer Navigation */}
        <footer className="sticky bottom-0 z-30 bg-slate-900/95 backdrop-blur border-t border-slate-800 px-4 py-3">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <button
              onClick={handlePrevSection}
              disabled={currentSection === 0}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700
                         disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-800
                         text-white rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">
                {currentSection > 0 ? SECTIONS[currentSection - 1].shortTitle : 'Previous'}
              </span>
            </button>

            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span className="hidden sm:inline">Use</span>
              <kbd className="px-2 py-1 bg-slate-800 rounded text-xs">←</kbd>
              <kbd className="px-2 py-1 bg-slate-800 rounded text-xs">→</kbd>
              <span className="hidden sm:inline">to navigate</span>
            </div>

            <button
              onClick={handleNextSection}
              disabled={currentSection === SECTIONS.length - 1}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500
                         disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600
                         text-white rounded-lg transition-colors"
            >
              <span className="hidden sm:inline">
                {currentSection < SECTIONS.length - 1 ? SECTIONS[currentSection + 1].shortTitle : 'Next'}
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
