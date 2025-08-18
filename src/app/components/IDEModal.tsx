'use client';

import { useState, useEffect, useRef } from 'react';
import { Problem } from '@/app/types';
import { executeCode, simulateCodeExecution, LANGUAGE_IDS } from '@/app/lib/codeExecution';
import Editor from '@monaco-editor/react';
import AIChat from './AIChat';
import { 
  X, 
  Play, 
  Save, 
  RotateCcw, 
  Code2,
  Settings,
  Maximize2,
  Minimize2,
  Copy,
  Download,
  MessageSquare
} from 'lucide-react';

interface IDEModalProps {
  isOpen: boolean;
  onClose: () => void;
  problem: Problem | null;
  onSaveCode?: (problemId: string, code: string, language: string) => void;
  fullPageMode?: boolean;
}

const PROGRAMMING_LANGUAGES = [
  { 
    value: 'javascript', 
    label: 'JavaScript', 
    monacoLang: 'javascript',
    icon: 'JS',
    defaultCode: 'console.log("Hello, World!");',
    judgeId: 63 
  },
  { 
    value: 'python', 
    label: 'Python', 
    monacoLang: 'python',
    icon: 'PY',
    defaultCode: 'print("Hello, World!")', 
    judgeId: 71 
  },
  { 
    value: 'java', 
    label: 'Java', 
    monacoLang: 'java',
    icon: 'JAVA',
    defaultCode: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}', 
    judgeId: 62 
  },
  { 
    value: 'cpp', 
    label: 'C++', 
    monacoLang: 'cpp',
    icon: 'C++',
    defaultCode: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}', 
    judgeId: 54 
  },
  { 
    value: 'c', 
    label: 'C', 
    monacoLang: 'c',
    icon: 'C',
    defaultCode: '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}', 
    judgeId: 50 
  }
];

// Available themes for the editor
const THEMES = [
  { value: 'vs-dark', label: 'Dark', icon: '🌙' },
  { value: 'light', label: 'Light', icon: '☀️' }
];

export const IDEModal = ({ isOpen, onClose, problem, onSaveCode, fullPageMode = false }: IDEModalProps) => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [output, setOutput] = useState('');
  const [input, setInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);
  const [consoleHistory, setConsoleHistory] = useState<string[]>([]);
  const [inputQueue, setInputQueue] = useState<string[]>([]);
  const [useRealExecution, setUseRealExecution] = useState(true);
  const [theme, setTheme] = useState('vs-dark');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [showAIChat, setShowAIChat] = useState(true);
  const editorRef = useRef(null);

  useEffect(() => {
    if (problem) {
      setCode(problem.code || getDefaultCode(problem.language || 'python'));
      setLanguage(problem.language || 'python');
    } else {
      setCode(getDefaultCode('python'));
      setLanguage('python');
    }
  }, [problem]);

  const getCurrentLanguage = () => {
    return PROGRAMMING_LANGUAGES.find(l => l.value === language) || PROGRAMMING_LANGUAGES[1];
  };

  const getDefaultCode = (lang: string) => {
    return PROGRAMMING_LANGUAGES.find(l => l.value === lang)?.defaultCode || '';
  };

  const handleEditorDidMount = (editor: unknown, monaco: unknown) => {
    editorRef.current = editor;
    
    // Configure Monaco Editor options for smooth experience
    editor.updateOptions({
      fontSize: fontSize,
      fontFamily: 'JetBrains Mono, Fira Code, Monaco, Consolas, monospace',
      fontLigatures: true,
      lineHeight: 1.6,
      letterSpacing: 0.5,
      smoothScrolling: true,
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
      minimap: { enabled: true, scale: 1 },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      automaticLayout: true,
      formatOnPaste: true,
      formatOnType: true,
      suggestOnTriggerCharacters: true,
      quickSuggestions: true,
      tabCompletion: 'on',
      acceptSuggestionOnEnter: 'on',
      bracketPairColorization: { enabled: true },
      guides: { bracketPairs: true, indentation: true },
      renderWhitespace: 'selection',
      renderLineHighlight: 'gutter',
      occurrencesHighlight: 'singleFile',
      selectionHighlight: true,
      foldingHighlight: true,
      unfoldOnClickAfterEndOfLine: true,
      showUnused: true,
      padding: { top: 10, bottom: 10 }
    });

    // Add custom keybindings
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleRun();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const downloadCode = () => {
    const currentLang = getCurrentLanguage();
    const filename = `main.${currentLang.value === 'python' ? 'py' : currentLang.value === 'java' ? 'java' : currentLang.value === 'cpp' ? 'cpp' : currentLang.value === 'c' ? 'c' : 'js'}`;
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    // Always set to default code when switching languages to avoid cross-language code confusion
    setCode(getDefaultCode(newLanguage));
    setOutput(''); // Clear output when switching languages
  };

  const handleRun = async () => {
    setIsRunning(true);
    setOutput('');
    setConsoleHistory([]);
    setIsWaitingForInput(false);
    setInputQueue([]);
    
    try {
      // Check if code requires input
      const requiresInput = code.includes('input(') || 
                           code.includes('scanf') || 
                           code.includes('Scanner') || 
                           code.includes('cin >>') ||
                           code.includes('nextInt()') ||
                           code.includes('nextLine()') ||
                           code.includes('next()');

      if (useRealExecution) {
        // Real API execution using Piston API
        const languageKey = LANGUAGE_IDS[language as keyof typeof LANGUAGE_IDS];
        if (!languageKey) {
          setOutput('Language not supported for real execution');
          setIsRunning(false);
          return;
        }

        if (requiresInput) {
          // For programs requiring input, start interactive mode
          setOutput('Program started. Waiting for input...\n');
          setIsWaitingForInput(true);
          setIsRunning(false);
        } else {
          // Execute normally for programs without input
          const result = await executeCode(code, languageKey, '');
          
          if (result?.run?.stdout) {
            setOutput(result.run.stdout.trim());
          } else if (result?.run?.stderr) {
            setOutput(`Error:\n${result.run.stderr}`);
          } else {
            setOutput('No output generated');
          }
          setIsRunning(false);
        }
      } else {
        // Simulate execution with interactive capability
        await new Promise(resolve => setTimeout(resolve, 800));
        
        if (requiresInput) {
          setOutput('Program started. Enter input when prompted:\n');
          setIsWaitingForInput(true);
        } else {
          const result = simulateCodeExecution(code, language);
          setOutput(result);
        }
        setIsRunning(false);
      }
    } catch (error) {
      console.error('Code execution failed:', error);
      setOutput(`Execution Error: ${error instanceof Error ? error.message : 'Unknown error'}\n\nNote: Try switching to Simulation mode if API is unavailable.`);
      setIsRunning(false);
    }
  };

  const handleSave = () => {
    if (problem && onSaveCode) {
      onSaveCode(problem.id, code, language);
    }
  };

  const handleReset = () => {
    setCode(getDefaultCode(language));
    setOutput('');
    setInput('');
    setConsoleHistory([]);
    setInputQueue([]);
    setIsWaitingForInput(false);
  };

  const handleInteractiveInput = async (inputValue: string) => {
    if (!inputValue.trim()) return;
    
    // Add user input to console display
    setOutput(prev => prev + `${inputValue}\n`);
    
    // Execute the program with this input in real-time
    if (useRealExecution) {
      const languageKey = LANGUAGE_IDS[language as keyof typeof LANGUAGE_IDS];
      if (languageKey) {
        try {
          const result = await executeCode(code, languageKey, inputValue);
          
          if (result?.run?.stdout) {
            const stdout = result.run.stdout.trim();
            setOutput(prev => prev + stdout + '\n');
            
            // Check if program is still running and needs more input
            const isStillRunning = stdout.includes('Enter') || 
                                 stdout.includes('Input') || 
                                 stdout.includes(':') ||
                                 !stdout.includes('Hello') && !stdout.includes('Result');
            
            if (!isStillRunning) {
              setIsWaitingForInput(false);
            }
          } else if (result?.run?.stderr) {
            const stderr = result.run.stderr;
            setOutput(prev => prev + `Error:\n${stderr}\n`);
            setIsWaitingForInput(false);
          } else {
            setOutput(prev => prev + 'Program completed.\n');
            setIsWaitingForInput(false);
          }
        } catch (error) {
          setOutput(prev => prev + `Error: ${error}\n`);
          setIsWaitingForInput(false);
        }
      }
    } else {
      // Simulation mode
      await new Promise(resolve => setTimeout(resolve, 300));
      setOutput(prev => prev + `Hello, ${inputValue}!\nProgram completed.\n`);
      setIsWaitingForInput(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className={fullPageMode ? "" : `fixed inset-0 backdrop-blur-sm bg-black/10 flex items-center justify-center z-50 ${isFullscreen ? 'p-0' : 'p-4'}`}
    >
      <div 
        className={`${theme === 'vs-dark' ? 'bg-gray-900' : 'bg-white'} ${fullPageMode ? 'w-full h-screen' : 'rounded-lg'} flex flex-col shadow-2xl transition-all duration-300 ${
          fullPageMode 
            ? 'w-full h-screen rounded-none'
            : isFullscreen 
            ? 'w-full h-full rounded-none' 
            : 'w-full max-w-7xl h-[90vh]'
        }`}
      >
        {/* Clean Header */}
        <div className={`flex items-center justify-between px-4 py-3 ${theme === 'vs-dark' ? 'bg-gray-800 text-white border-b border-gray-700' : 'bg-white text-gray-900 border-b border-gray-200'}`}>
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <Code2 className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-semibold">ProgessLab Compiler</h2>
              <span className={`text-xs ${theme === 'vs-dark' ? 'text-gray-400' : 'text-gray-500'}`}>•</span>
              <span className={`text-xs ${theme === 'vs-dark' ? 'text-gray-400' : 'text-gray-500'} flex items-center`}>
                {getCurrentLanguage().label}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAIChat(!showAIChat)}
              className={`p-2 rounded transition-colors ${
                showAIChat 
                  ? (theme === 'vs-dark' ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white')
                  : (theme === 'vs-dark' ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100')
              }`}
              title={showAIChat ? 'Hide AI Assistant' : 'Show AI Assistant'}
            >
              <MessageSquare className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className={`p-2 rounded ${theme === 'vs-dark' ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            {problem && (
              <button
                onClick={handleSave}
                className="px-3 py-2 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-medium"
                title="Save Code (Ctrl+S)"
              >
                <Save className="w-3 h-3 mr-1 inline" />
                Save
              </button>
            )}
            {!fullPageMode && (
              <button
                onClick={onClose}
                className={`p-2 rounded ${theme === 'vs-dark' ? 'text-gray-400 hover:text-white hover:bg-red-600' : 'text-gray-500 hover:text-gray-700 hover:bg-red-100'}`}
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Simplified Toolbar */}
        <div className={`flex items-center justify-between px-4 py-3 ${theme === 'vs-dark' ? 'bg-gray-800 border-b border-gray-700' : 'bg-gray-50 border-b border-gray-200'}`}>
          <div className="flex items-center space-x-4">
            {/* Language Selector */}
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-medium ${theme === 'vs-dark' ? 'text-gray-300' : 'text-gray-700'}`}>Language:</span>
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className={`px-3 py-2 text-sm rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  theme === 'vs-dark' 
                    ? 'bg-gray-700 text-white border border-gray-600' 
                    : 'bg-white text-black border border-gray-300'
                }`}
                style={{ color: theme === 'vs-dark' ? 'white' : 'black' }}
              >
                {PROGRAMMING_LANGUAGES.map(lang => (
                  <option key={lang.value} value={lang.value} style={{ color: 'black' }}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Theme Toggle */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setTheme(theme === 'vs-dark' ? 'light' : 'vs-dark')}
                className={`flex items-center space-x-2 px-3 py-2 text-sm rounded transition-colors ${
                  theme === 'vs-dark' 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
                title="Toggle Theme"
              >
                {theme === 'vs-dark' ? '☀️' : '🌙'}
                <span>{theme === 'vs-dark' ? 'Light' : 'Dark'}</span>
              </button>
            </div>
                
            {/* Font Size */}
            <div className="flex items-center space-x-2">
              <span className={`text-sm ${theme === 'vs-dark' ? 'text-gray-400' : 'text-gray-600'}`}>Size:</span>
              <input
                type="range"
                min="12"
                max="20"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-20 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
              />
              <span className={`text-sm w-6 ${theme === 'vs-dark' ? 'text-gray-400' : 'text-gray-600'}`}>{fontSize}</span>
            </div>
            
            {/* Real/Sim Toggle */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setUseRealExecution(!useRealExecution)}
                className={`flex items-center space-x-2 px-3 py-2 text-sm rounded transition-colors ${
                  useRealExecution 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : theme === 'vs-dark'
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                title={useRealExecution ? 'Using real code execution' : 'Using simulation mode'}
              >
                <Settings className="w-4 h-4" />
                <span>{useRealExecution ? 'Live' : 'Sim'}</span>
              </button>
            </div>
          </div>
              
          <div className="flex items-center space-x-2">
            {/* Action Buttons */}
            <button
              onClick={copyToClipboard}
              className={`p-2 rounded transition-colors ${
                theme === 'vs-dark' 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
              }`}
              title="Copy Code"
            >
              <Copy className="w-4 h-4" />
            </button>
            
            <button
              onClick={downloadCode}
              className={`p-2 rounded transition-colors ${
                theme === 'vs-dark' 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
              }`}
              title="Download Code"
            >
              <Download className="w-4 h-4" />
            </button>
            
            <button
              onClick={handleReset}
              className={`flex items-center space-x-1 px-3 py-2 text-sm rounded transition-colors ${
                theme === 'vs-dark' 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
              }`}
              title="Reset Code"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
                
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              title="Run Code (Ctrl+Enter)"
            >
              <Play className="w-4 h-4" />
              <span>{isRunning ? 'Running...' : 'Run'}</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className={`flex-1 flex h-0 min-h-0 ${theme === 'vs-dark' ? 'bg-gray-900' : 'bg-white'}`}>
          {/* Code Editor Section */}
          <div className={`${showAIChat ? 'w-1/2' : 'w-2/3'} flex flex-col h-full min-h-0`}>
            {/* File Tab */}
            <div className={`px-4 py-2 ${theme === 'vs-dark' ? 'bg-gray-800 border-b border-gray-700' : 'bg-gray-100 border-b border-gray-200'}`}>
              <div className="flex items-center space-x-2">
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-t text-sm ${
                  theme === 'vs-dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-900 border border-gray-300 border-b-0'
                }`}>
                  <span>main.{getCurrentLanguage().value === 'python' ? 'py' : getCurrentLanguage().value === 'java' ? 'java' : getCurrentLanguage().value === 'cpp' ? 'cpp' : getCurrentLanguage().value === 'c' ? 'c' : 'js'}</span>
                  <div className={`w-2 h-2 rounded-full ml-1 ${theme === 'vs-dark' ? 'bg-white' : 'bg-blue-600'}`}></div>
                </div>
              </div>
            </div>
            
            {/* Monaco Editor */}
            <div className="flex-1">
              <Editor
                height="100%"
                language={getCurrentLanguage().monacoLang}
                theme={theme}
                value={code}
                onChange={(value) => setCode(value || '')}
                onMount={handleEditorDidMount}
                options={{
                  fontSize: fontSize,
                  fontFamily: 'JetBrains Mono, Fira Code, Monaco, Consolas, monospace',
                  fontLigatures: true,
                  lineHeight: 1.6,
                  letterSpacing: 0.5,
                  smoothScrolling: true,
                  cursorBlinking: 'smooth',
                  cursorSmoothCaretAnimation: 'on',
                  minimap: { enabled: true, scale: 1 },
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  automaticLayout: true,
                  formatOnPaste: true,
                  formatOnType: true,
                  suggestOnTriggerCharacters: true,
                  quickSuggestions: true,
                  tabCompletion: 'on',
                  acceptSuggestionOnEnter: 'on',
                  bracketPairColorization: { enabled: true },
                  guides: { bracketPairs: true, indentation: true },
                  renderWhitespace: 'selection',
                  renderLineHighlight: 'gutter',
                  occurrencesHighlight: 'singleFile',
                  selectionHighlight: true,
                  foldingHighlight: true,
                  unfoldOnClickAfterEndOfLine: true,
                  showUnused: true,
                  padding: { top: 15, bottom: 15 }
                }}
                loading={
                  <div className={`flex items-center justify-center h-full ${theme === 'vs-dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
                    <div className="text-center">
                      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <div className="text-sm">Loading Editor...</div>
                    </div>
                  </div>
                }
              />
            </div>
          </div>

          {/* Interactive Console Panel */}
          <div className={`${showAIChat ? 'w-1/4' : 'w-1/3'} flex flex-col h-full min-h-0 ${theme === 'vs-dark' ? 'bg-gray-800 border-l border-gray-700' : 'bg-gray-50 border-l border-gray-200'}`}>
            
            {/* Console Tab */}
            <div className={`px-4 py-2 ${theme === 'vs-dark' ? 'bg-gray-800 border-b border-gray-700' : 'bg-gray-100 border-b border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div className={`flex items-center space-x-2 text-sm ${theme === 'vs-dark' ? 'text-white' : 'text-gray-900'}`}>
                  <span>💻</span>
                  <span>Console</span>
                  {isRunning && (
                    <div className="ml-2 flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-500 text-xs">Running</span>
                    </div>
                  )}
                </div>
                <div className={`text-xs ${theme === 'vs-dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  {useRealExecution ? 'Piston API' : 'Simulation'}
                </div>
              </div>
            </div>
            
            {/* Interactive Console Content */}
            <div className={`flex-1 p-4 overflow-auto ${theme === 'vs-dark' ? 'bg-gray-900' : 'bg-white'}`}>
              <div className="h-full flex flex-col">
                {isRunning ? (
                  <div className="flex items-center space-x-2 text-blue-500 text-sm">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>Executing code...</span>
                  </div>
                ) : (
                  <>
                    <div className={`flex-1 text-sm font-mono whitespace-pre-wrap leading-relaxed ${
                      theme === 'vs-dark' ? 'text-gray-100' : 'text-gray-900'
                    }`}>
                      {output || (
                        <span className={theme === 'vs-dark' ? 'text-gray-500' : 'text-gray-400'}>
                          Click "Run" to execute your code.
                          {'\n\n'}
                          💡 Interactive Console:
                          {'\n'}• Your program will run here
                          {'\n'}• Input prompts will appear when needed
                          {'\n'}• Type your input and press Enter
                          {'\n\n'}
                          🎯 Shortcuts:
                          {'\n'}• Ctrl+Enter: Run code
                          {'\n'}• Ctrl+S: Save code
                        </span>
                      )}
                    </div>
                    
                    {/* Interactive Input Area - Only show when program is waiting for input */}
                    {(isWaitingForInput || (output && !isRunning)) && (
                      <div className={`mt-2 border-t pt-2 ${theme === 'vs-dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm ${theme === 'vs-dark' ? 'text-green-400' : 'text-green-600'}`}>
                            →
                          </span>
                          <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && input.trim()) {
                                e.preventDefault();
                                if (isWaitingForInput) {
                                  handleInteractiveInput(input);
                                } else {
                                  // Add input to output for display
                                  setOutput(prev => prev + '\n→ ' + input);
                                }
                                setInput('');
                              }
                            }}
                            placeholder={isWaitingForInput ? "Enter input value and press Enter..." : "Enter input and press Enter..."}
                            className={`flex-1 px-2 py-1 text-sm font-mono border-none outline-none bg-transparent ${
                              theme === 'vs-dark' ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
                            }`}
                            style={{
                              color: theme === 'vs-dark' ? '#ffffff' : '#1f2937',
                              backgroundColor: 'transparent',
                            }}
                            disabled={isRunning}
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* AI Chat Panel */}
          {showAIChat && (
            <div className="w-1/4 flex flex-col max-h-full h-full overflow-hidden">
              <div className="h-full max-h-full overflow-hidden">
                <AIChat 
                  code={code} 
                  language={language} 
                  problemTitle={problem?.title}
                  theme={theme}
                />
              </div>
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="bg-blue-600 text-white px-4 py-2 text-sm flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="font-medium">🚀 DSA Tracker IDE</span>
            <span>•</span>
            <span>{getCurrentLanguage().label}</span>
            <span>•</span>
            <span>Lines: {code.split('\n').length}</span>
            <span>•</span>
            <span>Characters: {code.length}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              useRealExecution 
                ? 'bg-green-600 text-green-100' 
                : 'bg-gray-600 text-gray-200'
            }`}>
              {useRealExecution ? '● Live Execution' : '○ Simulation'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
