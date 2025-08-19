'use client';

import { useState, useEffect } from 'react';
import { Problem } from '@/app/types';
import { X, ChevronDown, ChevronRight, Code2, Clock, Zap, Copy, Check, ZoomIn, ZoomOut, RotateCcw, FileText } from 'lucide-react';
import { useTheme } from '@/app/hooks/useTheme';

interface NotesData {
  problemName: string;
  generalNotes: string; // General notes/important text section
  approaches: {
    id: string;
    name: string;
    codes: { [language: string]: string }; // Store code for each language
    currentLanguage: string;
    timeComplexity: string;
    spaceComplexity: string;
    isExpanded: boolean;
  }[];
}

interface NotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  problem: Problem | null;
  onSave: (problemId: string, notesData: NotesData) => void;
  onOpenIDE?: (problem: Problem, code: string, language: string) => void;
  fullPageMode?: boolean;
}

const DEFAULT_APPROACHES = [
  { 
    id: '1', 
    name: 'Solution 1: Brute Force', 
    codes: {}, // Empty object to store code for each language
    currentLanguage: 'javascript',
    timeComplexity: '', 
    spaceComplexity: '',
    isExpanded: false
  },
  { 
    id: '2', 
    name: 'Solution 2: Better Solution', 
    codes: {}, // Empty object to store code for each language
    currentLanguage: 'javascript',
    timeComplexity: '', 
    spaceComplexity: '',
    isExpanded: false
  },
  { 
    id: '3', 
    name: 'Solution 3: Best Solution', 
    codes: {}, // Empty object to store code for each language
    currentLanguage: 'javascript',
    timeComplexity: '', 
    spaceComplexity: '',
    isExpanded: false
  }
];

const PROGRAMMING_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' }
];

export const NotesModal = ({ isOpen, onClose, problem, onSave, onOpenIDE, fullPageMode = false }: NotesModalProps) => {
  const [notesData, setNotesData] = useState<NotesData>({
    problemName: '',
    generalNotes: '',
    approaches: DEFAULT_APPROACHES
  });
  
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [globalZoomLevel, setGlobalZoomLevel] = useState(100); // Global zoom for solution sections
  const [codeZoomLevel, setCodeZoomLevel] = useState(100); // Code-specific zoom for editors
  const [isComparisonMode, setIsComparisonMode] = useState(false); // Side-by-side comparison
  const [selectedApproachesForComparison, setSelectedApproachesForComparison] = useState<string[]>([]); // IDs of approaches to compare
  const [comparisonLanguage, setComparisonLanguage] = useState('javascript'); // Language for comparison view
  const [individualComparisonLanguages, setIndividualComparisonLanguages] = useState<{[key: string]: string}>({}); // Individual language for each approach in comparison

  useEffect(() => {
    if (problem) {
      // Load existing notes or initialize with defaults
      if (problem.notes) {
        try {
          const parsedNotes = JSON.parse(problem.notes);
          
          // Handle both old and new data formats
          const migratedApproaches = parsedNotes.approaches?.map((approach: Record<string, unknown>) => {
            if (approach.code !== undefined && approach.language !== undefined) {
              // Old format: migrate to new format
              return {
                ...approach,
                codes: { [(approach.language as string)]: approach.code as string },
                currentLanguage: approach.language,
                code: undefined, // Remove old property
                language: undefined // Remove old property
              };
            } else {
              // New format: use as is, but ensure codes object exists
              return {
                ...approach,
                codes: approach.codes || {},
                currentLanguage: approach.currentLanguage || 'javascript'
              };
            }
          }) || DEFAULT_APPROACHES;
          
          setNotesData({
            problemName: parsedNotes.problemName || problem.title,
            generalNotes: parsedNotes.generalNotes || '',
            approaches: migratedApproaches
          });
        } catch (error) {
          // If notes is just plain text, initialize with defaults
          setNotesData({
            problemName: problem.title,
            generalNotes: '',
            approaches: DEFAULT_APPROACHES
          });
        }
      } else {
        setNotesData({
          problemName: problem.title,
          generalNotes: '',
          approaches: DEFAULT_APPROACHES
        });
      }
    }
  }, [problem]);

  // Auto-save effect - runs after state updates
  useEffect(() => {
    if (hasChanges && problem && notesData.problemName) {
      const timeoutId = setTimeout(() => {
        onSave(problem.id, notesData);
        setHasChanges(false);
      }, 500); // Debounce auto-save by 500ms

      return () => clearTimeout(timeoutId);
    }
  }, [notesData, hasChanges, problem, onSave]);

  const updateApproach = (id: string, field: string, value: string | boolean) => {
    setNotesData(prev => ({
      ...prev,
      approaches: prev.approaches.map(approach => {
        if (approach.id === id) {
          // Ensure codes object and currentLanguage exist
          const safeApproach = {
            ...approach,
            codes: approach.codes || {},
            currentLanguage: approach.currentLanguage || 'javascript'
          };
          
          if (field === 'code') {
            // Update code for current language
            return {
              ...safeApproach,
              codes: {
                ...safeApproach.codes,
                [safeApproach.currentLanguage]: value as string
              }
            };
          } else if (field === 'currentLanguage') {
            // Switch language
            return {
              ...safeApproach,
              currentLanguage: value as string
            };
          } else {
            // Update other fields normally
            return { ...safeApproach, [field]: value };
          }
        }
        return approach;
      })
    }));
    
    // Mark that we have changes to save
    setHasChanges(true);
  };

  const toggleApproach = (id: string) => {
    updateApproach(id, 'isExpanded', !notesData.approaches.find(a => a.id === id)?.isExpanded);
  };

  const copyToClipboard = async (code: string, approachId: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(approachId);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const handleZoomIn = () => {
    setGlobalZoomLevel(prev => Math.min(prev + 10, 200)); // Max 200%
  };

  const handleZoomOut = () => {
    setGlobalZoomLevel(prev => Math.max(prev - 10, 50)); // Min 50%
  };

  const resetZoom = () => {
    setGlobalZoomLevel(100);
  };

  const handleCodeZoomIn = () => {
    setCodeZoomLevel(prev => Math.min(prev + 10, 200)); // Max 200%
  };

  const handleCodeZoomOut = () => {
    setCodeZoomLevel(prev => Math.max(prev - 10, 50)); // Min 50%
  };

  const resetCodeZoom = () => {
    setCodeZoomLevel(100);
  };

  const getFontSize = () => {
    const baseFontSize = 14; // Base font size in px
    return (baseFontSize * codeZoomLevel) / 100;
  };

  const getGlobalScale = () => {
    return globalZoomLevel / 100;
  };

  const getLineHeight = () => {
    return 1.6; // Keep consistent line height
  };

  // Helper functions to safely access approach data
  const getCurrentCode = (approach: {
    codes?: Record<string, string>;
    currentLanguage?: string;
  }) => {
    const currentLang = approach.currentLanguage || 'javascript';
    const codes = approach.codes || {};
    return codes[currentLang] || '';
  };

  const getCurrentLanguage = (approach: {
    currentLanguage?: string;
  }) => {
    return approach.currentLanguage || 'javascript';
  };

  // Helper function for comparison mode to get code in selected language
  const getCodeInLanguage = (approach: {
    codes?: Record<string, string>;
  }, language: string) => {
    const codes = approach.codes || {};
    return codes[language] || '';
  };

  // Get individual comparison language for an approach (fallback to global comparison language)
  const getIndividualComparisonLanguage = (approachId: string) => {
    return individualComparisonLanguages[approachId] || comparisonLanguage;
  };

  // Set individual comparison language for an approach
  const setIndividualComparisonLanguage = (approachId: string, language: string) => {
    setIndividualComparisonLanguages(prev => ({
      ...prev,
      [approachId]: language
    }));
  };

  // Toggle comparison mode
  const toggleComparisonMode = () => {
    setIsComparisonMode(!isComparisonMode);
    if (!isComparisonMode) {
      // Select first two approaches by default
      const expandedApproaches = notesData.approaches.filter(a => a.isExpanded).slice(0, 2);
      setSelectedApproachesForComparison(expandedApproaches.map(a => a.id));
    } else {
      setSelectedApproachesForComparison([]);
    }
  };

  // Toggle approach selection for comparison
  const toggleApproachForComparison = (approachId: string) => {
    setSelectedApproachesForComparison(prev => {
      if (prev.includes(approachId)) {
        return prev.filter(id => id !== approachId);
      } else if (prev.length < 3) { // Limit to 3 approaches for comparison
        return [...prev, approachId];
      }
      return prev;
    });
  };

  if (!isOpen || !problem) return null;

  return (
    <div className={fullPageMode ? "" : "fixed inset-0 backdrop-blur-sm bg-black/10 flex items-center justify-center z-50 p-4"}>
      <div className={fullPageMode ? "bg-white w-full h-full flex flex-col" : "bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[95vh] flex flex-col"}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{notesData.problemName}</h2>
            <p className="text-gray-500 text-xs">📝 Problem Notes & Solutions</p>
          </div>
          <div className="flex items-center space-x-3">
            {/* Zoom Controls */}
            <div className="flex items-center space-x-1 bg-white rounded-lg border border-gray-200 p-1">
              <button
                onClick={handleZoomOut}
                className="flex items-center justify-center w-7 h-7 hover:bg-gray-100 rounded transition-colors"
                title="Zoom out (Global)"
                disabled={globalZoomLevel <= 50}
              >
                <ZoomOut className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={resetZoom}
                className="flex items-center justify-center min-w-[3rem] h-7 px-2 hover:bg-gray-100 rounded transition-colors text-xs font-medium text-gray-700"
                title="Reset global zoom"
              >
                {globalZoomLevel}%
              </button>
              <button
                onClick={handleZoomIn}
                className="flex items-center justify-center w-7 h-7 hover:bg-gray-100 rounded transition-colors"
                title="Zoom in (Global)"
                disabled={globalZoomLevel >= 200}
              >
                <ZoomIn className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            
            {/* Comparison Mode Toggle */}
            <button
              onClick={toggleComparisonMode}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
                isComparisonMode 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-blue-50'
              }`}
              title="Toggle side-by-side comparison"
            >
              <Code2 className="w-4 h-4" />
              <span className="text-sm font-medium">
                {isComparisonMode ? 'Exit Compare' : 'Compare'}
              </span>
            </button>
            
            {!fullPageMode && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-white rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-gray-50">
          <div 
            className="max-w-4xl mx-auto p-6 space-y-6 transition-transform duration-200 origin-top"
            style={{ 
              transform: `scale(${getGlobalScale()})`,
              transformOrigin: 'top center'
            }}
          >
            
            {/* General Notes Section */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Important Notes</h3>
                </div>
                <textarea
                  value={notesData.generalNotes}
                  onChange={(e) => {
                    setNotesData(prev => ({
                      ...prev,
                      generalNotes: e.target.value
                    }));
                    setHasChanges(true);
                  }}
                  placeholder="Write important notes, key insights, problem patterns, or anything you want to remember about this problem..."
                  className="w-full h-32 p-4 border border-gray-200 rounded-lg resize-y focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-700 placeholder-gray-400"
                />
              </div>
            </div>
            
            {/* Approaches Section */}
            {!isComparisonMode ? (
              // Regular View
              <div className="space-y-4">
                {notesData.approaches.map((approach, index) => (
                  <div key={approach.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    {/* Approach Header */}
                    <div
                      className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50 cursor-pointer hover:from-gray-100 hover:to-blue-100 transition-colors"
                      onClick={() => toggleApproach(approach.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {approach.isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-blue-600" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-600" />
                          )}
                          <input
                            type="text"
                          value={approach.name}
                          onChange={(e) => {
                            e.stopPropagation();
                            updateApproach(approach.id, 'name', e.target.value);
                          }}
                          className="text-lg font-semibold text-gray-900 bg-transparent border-none outline-none hover:bg-white focus:bg-white px-3 py-2 rounded-lg transition-colors"
                          placeholder="Solution name"
                        />
                      </div>
                      
                      <div className="flex items-center space-x-3 text-sm">
                        {/* Time Complexity Input */}
                        <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                          <Clock className="w-4 h-4 text-orange-500" />
                          <input
                            type="text"
                            value={approach.timeComplexity}
                            onChange={(e) => {
                              e.stopPropagation();
                              updateApproach(approach.id, 'timeComplexity', e.target.value);
                            }}
                            placeholder="Time complexity"
                            className="w-24 text-sm bg-transparent border-none outline-none text-gray-700 placeholder-gray-400"
                            onClick={(e) => e.stopPropagation()}
                          />
                          {approach.timeComplexity && (
                            <Check className="w-4 h-4 text-green-600" />
                          )}
                        </div>

                        {/* Space Complexity Input */}
                        <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                          <Zap className="w-4 h-4 text-purple-500" />
                          <input
                            type="text"
                            value={approach.spaceComplexity}
                            onChange={(e) => {
                              e.stopPropagation();
                              updateApproach(approach.id, 'spaceComplexity', e.target.value);
                            }}
                            placeholder="Space complexity"
                            className="w-24 text-sm bg-transparent border-none outline-none text-gray-700 placeholder-gray-400"
                            onClick={(e) => e.stopPropagation()}
                          />
                          {approach.spaceComplexity && (
                            <Check className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Approach Content */}
                  {approach.isExpanded && (
                    <div className="p-8 space-y-8 bg-white">
                      {/* Code Section */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Code2 className="w-4 h-4 text-blue-600" />
                            </div>
                            <h4 className="text-lg font-semibold text-gray-900">
                              Solution Code
                            </h4>
                          </div>
                          <div className="flex items-center space-x-3">
                            {/* Code-specific zoom controls */}
                            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg border border-gray-300 p-1">
                              <button
                                onClick={handleCodeZoomOut}
                                className="flex items-center justify-center w-6 h-6 hover:bg-white rounded transition-colors"
                                title="Zoom out code"
                                disabled={codeZoomLevel <= 50}
                              >
                                <ZoomOut className="w-3 h-3 text-gray-600" />
                              </button>
                              <button
                                onClick={resetCodeZoom}
                                className="flex items-center justify-center min-w-[2.5rem] h-6 px-1 hover:bg-white rounded transition-colors text-xs font-medium text-gray-700"
                                title="Reset code zoom"
                              >
                                {codeZoomLevel}%
                              </button>
                              <button
                                onClick={handleCodeZoomIn}
                                className="flex items-center justify-center w-6 h-6 hover:bg-white rounded transition-colors"
                                title="Zoom in code"
                                disabled={codeZoomLevel >= 200}
                              >
                                <ZoomIn className="w-3 h-3 text-gray-600" />
                              </button>
                            </div>
                            <button
                              onClick={() => copyToClipboard(getCurrentCode(approach), approach.id)}
                              className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-gray-200"
                              title="Copy code"
                            >
                              {copiedCode === approach.id ? (
                                <>
                                  <Check className="w-4 h-4 text-green-600" />
                                  <span className="text-green-600">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-4 h-4" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                            
                            {/* Run in IDE Button */}
                            {onOpenIDE && (
                              <button
                                onClick={() => {
                                  const currentCode = getCurrentCode(approach);
                                  const currentLanguage = getCurrentLanguage(approach);
                                  if (problem && currentCode.trim()) {
                                    onOpenIDE(problem, currentCode, currentLanguage);
                                  }
                                }}
                                className="flex items-center space-x-2 px-4 py-2 text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                                title="Run in IDE"
                                disabled={!getCurrentCode(approach).trim()}
                              >
                                <Code2 className="w-4 h-4" />
                                <span>Run in IDE</span>
                              </button>
                            )}
                            <select
                              value={getCurrentLanguage(approach)}
                              onChange={(e) => updateApproach(approach.id, 'currentLanguage', e.target.value)}
                              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-black placeholder-black"
                              style={{ color: 'black' }}
                            >
                              {PROGRAMMING_LANGUAGES.map((lang) => (
                                <option key={lang.value} value={lang.value} style={{ color: 'black' }}>
                                  {lang.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        
                        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                          <div className="bg-gray-800 px-4 py-2 flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            </div>
                            <span className="text-xs text-gray-400 font-mono">
                              {PROGRAMMING_LANGUAGES.find(lang => lang.value === getCurrentLanguage(approach))?.label}
                            </span>
                          </div>
                          <div className="relative">
                            <textarea
                              value={getCurrentCode(approach)}
                              onChange={(e) => updateApproach(approach.id, 'code', e.target.value)}
                              placeholder={`Write your ${approach.name.toLowerCase()} in ${PROGRAMMING_LANGUAGES.find(lang => lang.value === getCurrentLanguage(approach))?.label} here...\n\nTip: Use zoom controls to adjust text size for better readability!\nYour code is automatically saved for each language.`}
                              className="w-full h-[500px] p-6 font-mono bg-gray-50 border-none resize-none focus:outline-none focus:bg-white transition-colors text-gray-800"
                              style={{
                                fontFamily: 'JetBrains Mono, Fira Code, "SF Mono", Monaco, Consolas, "Courier New", monospace',
                                fontSize: `${getFontSize()}px`,
                                lineHeight: getLineHeight(),
                                tabSize: 2
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Complexity Analysis */}
                      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100">
                        <div className="flex items-center space-x-2 mb-4">
                          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <Zap className="w-4 h-4 text-indigo-600" />
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900">
                            Complexity Analysis
                          </h4>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                              ⏱️ Time Complexity
                            </label>
                            <input
                              type="text"
                              value={approach.timeComplexity}
                              onChange={(e) => updateApproach(approach.id, 'timeComplexity', e.target.value)}
                              placeholder="e.g., O(n²), O(log n)"
                              className="w-full p-4 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm text-black placeholder-black"
                              style={{ color: 'black' }}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                              💾 Space Complexity
                            </label>
                            <input
                              type="text"
                              value={approach.spaceComplexity}
                              onChange={(e) => updateApproach(approach.id, 'spaceComplexity', e.target.value)}
                              placeholder="e.g., O(1), O(n)"
                              className="w-full p-4 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm text-black placeholder-black"
                              style={{ color: 'black' }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            ) : (
              // Comparison View - Side by Side
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Approach Comparison</h3>
                  <p className="text-sm text-blue-700 mb-3">Select up to 3 approaches to compare side-by-side</p>
                  <div className="flex flex-wrap gap-2">
                    {notesData.approaches.map((approach) => (
                      <button
                        key={approach.id}
                        onClick={() => toggleApproachForComparison(approach.id)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedApproachesForComparison.includes(approach.id)
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-blue-700 border border-blue-300 hover:bg-blue-100'
                        }`}
                      >
                        {approach.name}
                      </button>
                    ))}
                  </div>
                  
                  {/* Language Selector for Comparison */}
                  {selectedApproachesForComparison.length > 0 && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Code2 className="w-4 h-4 text-blue-600" />
                          <label className="text-sm font-medium text-gray-800">
                            Default language for all approaches:
                          </label>
                        </div>
                        <select
                          value={comparisonLanguage}
                          onChange={(e) => {
                            setComparisonLanguage(e.target.value);
                            // Reset individual selections when global language changes
                            setIndividualComparisonLanguages({});
                          }}
                          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm text-black"
                          style={{ color: 'black' }}
                        >
                          {PROGRAMMING_LANGUAGES.map(lang => (
                            <option key={lang.value} value={lang.value} style={{ color: 'black' }}>
                              {lang.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="text-xs text-gray-600 mb-3">
                        💡 Use the global selector above or choose individual languages for each approach below
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            const newLanguages: {[key: string]: string} = {};
                            selectedApproachesForComparison.forEach(id => {
                              newLanguages[id] = comparisonLanguage;
                            });
                            setIndividualComparisonLanguages(newLanguages);
                          }}
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          Apply to All
                        </button>
                        <button
                          onClick={() => setIndividualComparisonLanguages({})}
                          className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                        >
                          Reset Individual
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                {selectedApproachesForComparison.length > 0 && (
                  <div className={`grid gap-4 ${
                    selectedApproachesForComparison.length === 1 ? 'grid-cols-1' : 
                    selectedApproachesForComparison.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
                  }`}>
                    {selectedApproachesForComparison.map((approachId) => {
                      const approach = notesData.approaches.find(a => a.id === approachId);
                      if (!approach) return null;
                      
                      return (
                        <div key={approach.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                          <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 border-b">
                            <h4 className="font-semibold text-gray-900">{approach.name}</h4>
                            <div className="flex items-center space-x-4 mt-2 text-xs">
                              <span className="flex items-center space-x-1">
                                <Clock className="w-3 h-3 text-orange-500" />
                                <span>{approach.timeComplexity || 'Not set'}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Zap className="w-3 h-3 text-purple-500" />
                                <span>{approach.spaceComplexity || 'Not set'}</span>
                              </span>
                            </div>
                            
                            {/* Individual Language Selector */}
                            <div className="mt-3 pt-2 border-t border-gray-200">
                              <div className="flex items-center space-x-2">
                                <Code2 className="w-3 h-3 text-gray-500" />
                                <span className="text-xs font-medium text-gray-600">Language:</span>
                                <select
                                  value={getIndividualComparisonLanguage(approach.id)}
                                  onChange={(e) => setIndividualComparisonLanguage(approach.id, e.target.value)}
                                  className={`text-xs px-2 py-1 border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-black ${
                                    individualComparisonLanguages[approach.id] && individualComparisonLanguages[approach.id] !== comparisonLanguage
                                      ? 'border-green-400 bg-green-50' 
                                      : 'border-gray-300'
                                  }`}
                                  style={{ color: 'black' }}
                                >
                                  {PROGRAMMING_LANGUAGES.map(lang => (
                                    <option key={lang.value} value={lang.value} style={{ color: 'black' }}>
                                      {lang.label}
                                    </option>
                                  ))}
                                </select>
                                {individualComparisonLanguages[approach.id] && individualComparisonLanguages[approach.id] !== comparisonLanguage && (
                                  <span className="text-xs text-green-600 font-medium">Custom</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="p-4">
                            <div className="bg-gray-900 rounded-lg overflow-hidden">
                              <div className="flex items-center justify-between px-4 py-2 bg-gray-800">
                                <span className="text-white text-sm font-medium">
                                  {PROGRAMMING_LANGUAGES.find(l => l.value === getIndividualComparisonLanguage(approach.id))?.label || 'Code'}
                                </span>
                                {!getCodeInLanguage(approach, getIndividualComparisonLanguage(approach.id)) && (
                                  <span className="text-xs text-gray-400">No code in this language</span>
                                )}
                              </div>
                              <pre className="p-4 text-sm text-gray-300 overflow-auto max-h-64">
                                <code>{getCodeInLanguage(approach, getIndividualComparisonLanguage(approach.id)) || `// No ${PROGRAMMING_LANGUAGES.find(l => l.value === getIndividualComparisonLanguage(approach.id))?.label || 'code'} written yet for this approach`}</code>
                              </pre>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
