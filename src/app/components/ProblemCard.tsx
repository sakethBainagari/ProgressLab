import { Problem } from '@/app/types';
import { CheckCircle2, Circle, Clock, ExternalLink, Tag, Code, FileText, Eye, EyeOff } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState } from 'react';

interface ProblemCardProps {
  problem: Problem;
  onToggleComplete: (id: string) => void;
  onEdit?: (problem: Problem) => void;
}

export const ProblemCard = ({ problem, onToggleComplete, onEdit }: ProblemCardProps) => {
  const [showCode, setShowCode] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  const difficultyColors = {
    Easy: 'text-green-600 bg-green-50 border-green-200',
    Medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    Hard: 'text-red-600 bg-red-50 border-red-200',
  };

  return (
    <div className={`border rounded-lg p-6 transition-all hover:shadow-md ${
      problem.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <button
            onClick={() => onToggleComplete(problem.id)}
            className="mt-1 transition-colors hover:scale-110"
          >
            {problem.completed ? (
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            ) : (
              <Circle className="w-6 h-6 text-gray-400 hover:text-green-600" />
            )}
          </button>
          
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <h3 className={`text-lg font-semibold ${problem.completed ? 'line-through text-gray-600' : 'text-gray-900'}`}>
                {problem.title}
              </h3>
              <span className={`px-3 py-1 text-sm rounded-full border font-medium ${difficultyColors[problem.difficulty]}`}>
                {problem.difficulty}
              </span>
              {problem.url && (
                <a
                  href={problem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                  title="Open problem link"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
              )}
            </div>
            
            <p className="text-gray-700 text-sm mb-4 leading-relaxed">
              {problem.description}
            </p>
            
            {problem.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {problem.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-md border border-blue-200"
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            )}
            
            {(problem.timeComplexity || problem.spaceComplexity) && (
              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                {problem.timeComplexity && (
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    Time: {problem.timeComplexity}
                  </span>
                )}
                {problem.spaceComplexity && (
                  <span>Space: {problem.spaceComplexity}</span>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center space-x-3 mb-4">
              {problem.code && (
                <button
                  onClick={() => setShowCode(!showCode)}
                  className="flex items-center space-x-1 px-3 py-2 text-sm bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 transition-colors border border-purple-200"
                >
                  <Code className="w-4 h-4" />
                  <span>{showCode ? 'Hide Code' : 'View Code'}</span>
                  {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              )}
              
              {problem.notes && (
                <button
                  onClick={() => setShowNotes(!showNotes)}
                  className="flex items-center space-x-1 px-3 py-2 text-sm bg-orange-50 text-orange-700 rounded-md hover:bg-orange-100 transition-colors border border-orange-200"
                >
                  <FileText className="w-4 h-4" />
                  <span>{showNotes ? 'Hide Notes' : 'View Notes'}</span>
                  {showNotes ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              )}
            </div>

            {/* Code Section */}
            {showCode && problem.code && (
              <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-700">
                    Solution ({problem.language || 'javascript'})
                  </span>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <SyntaxHighlighter
                    language={problem.language || 'javascript'}
                    style={tomorrow}
                    customStyle={{
                      margin: 0,
                      fontSize: '14px',
                      lineHeight: '1.5'
                    }}
                  >
                    {problem.code}
                  </SyntaxHighlighter>
                </div>
              </div>
            )}

            {/* Notes Section */}
            {showNotes && problem.notes && (
              <div className="mb-4 border border-orange-200 rounded-lg bg-orange-50 p-4">
                <h4 className="font-medium text-orange-900 mb-2 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Personal Notes
                </h4>
                <div className="text-sm text-orange-800 whitespace-pre-wrap">
                  {problem.notes}
                </div>
              </div>
            )}
            
            {problem.completedAt && (
              <div className="text-sm text-green-600 font-medium">
                ✅ Completed on {problem.completedAt.toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
        
        {onEdit && (
          <button
            onClick={() => onEdit(problem)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
