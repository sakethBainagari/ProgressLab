import { Problem } from '@/app/types';
import { CheckCircle2, Circle, ExternalLink, FileText, Code2, Trash2, Plus } from 'lucide-react';

interface ProblemTableProps {
  problems: Problem[];
  onToggleCompletion: (id: string) => Promise<void>;
  onDeleteProblem?: (id: string) => Promise<void>;
  onNotesClick?: (problem: Problem) => void;
  selectedCategory: string | null;
  selectedDifficulty: string | null;
  searchQuery: string;
}

export const ProblemTable = ({ 
  problems, 
  onToggleCompletion, 
  onDeleteProblem, 
  onNotesClick,
  selectedCategory,
  selectedDifficulty,
  searchQuery
}: ProblemTableProps) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-700 bg-green-100 border-green-300';
      case 'Medium': return 'text-yellow-700 bg-yellow-100 border-yellow-300';
      case 'Hard': return 'text-red-700 bg-red-100 border-red-300';
      default: return 'text-gray-700 bg-gray-100 border-gray-300';
    }
  };

  if (problems.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No problems found</h3>
        <p className="text-gray-600">Start by adding your first problem</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm">
      {/* Table Header */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-12 gap-3 px-6 py-4 text-sm font-semibold text-gray-900">
          <div className="col-span-1 text-center">Status</div>
          <div className="col-span-4">Problem</div>
          <div className="col-span-1 text-center">Practice</div>
          <div className="col-span-1 text-center">IDE</div>
          <div className="col-span-2 text-center">Notes</div>
          <div className="col-span-2 text-center">Difficulty</div>
          <div className="col-span-1 text-center">Actions</div>
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-gray-200">
        {problems.map((problem) => (
          <div key={problem.id}>
            {/* Main Row */}
            <div className={`grid grid-cols-12 gap-3 px-6 py-4 hover:bg-gray-50 transition-colors items-center`}>
              {/* Status */}
              <div className="col-span-1 flex justify-center">
                <button
                  onClick={() => onToggleCompletion(problem.id)}
                  className="transition-colors hover:scale-110"
                >
                  {problem.completed ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  ) : (
                    <Circle className="w-6 h-6 text-gray-400 hover:text-green-600" />
                  )}
                </button>
              </div>

              {/* Problem Name */}
              <div className="col-span-4">
                <div className="text-left text-gray-900 w-full">
                  <div className="font-medium mb-1">{problem.title}</div>
                  {problem.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {problem.tags.slice(0, 3).map((tag: string) => (
                        <span
                          key={tag}
                          className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {problem.tags.length > 3 && (
                        <span className="text-xs text-gray-500">+{problem.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Practice */}
              <div className="col-span-1 flex justify-center">
                {problem.url ? (
                  <a
                    href={problem.url.startsWith('http') ? problem.url : `https://${problem.url}`}
                    target="_blank"
                    rel="noopener"
                    className="flex items-center justify-center w-9 h-9 bg-orange-100 hover:bg-orange-200 text-orange-600 rounded-lg transition-colors"
                    title="Open problem link"
                    onClick={(e) => {
                      // Ensure immediate navigation
                      e.preventDefault();
                      if (problem.url) {
                        const url = problem.url.startsWith('http') ? problem.url : `https://${problem.url}`;
                        window.open(url, '_blank', 'noopener');
                      }
                    }}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                ) : (
                  <div className="w-9 h-9 flex items-center justify-center text-gray-300">-</div>
                )}
              </div>

              {/* IDE */}
              <div className="col-span-1 flex justify-center">
                <button
                  onClick={() => {
                    const ideUrl = `/ide?problemId=${problem.id}`;
                    window.open(ideUrl, '_blank');
                  }}
                  className="flex items-center justify-center w-9 h-9 bg-purple-100 hover:bg-purple-200 text-purple-600 rounded-lg transition-colors"
                  title="Open in IDE"
                >
                  <Code2 className="w-4 h-4" />
                </button>
              </div>

              {/* Notes */}
              <div className="col-span-2 flex justify-center">
                <button
                  onClick={() => {
                    const notesUrl = `/notes?problemId=${problem.id}`;
                    window.open(notesUrl, '_blank');
                  }}
                  className="flex items-center justify-center w-8 h-8 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full transition-colors"
                  title="Open Notes in New Tab"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Difficulty */}
              <div className="col-span-2 flex justify-center">
                <span className={`px-4 py-2 text-sm rounded-full border font-semibold min-w-[80px] text-center ${getDifficultyColor(problem.difficulty)}`}>
                  {problem.difficulty}
                </span>
              </div>

              {/* Actions */}
              <div className="col-span-1 flex justify-center">
                {onDeleteProblem && (
                  <button
                    onClick={() => onDeleteProblem(problem.id)}
                    className="flex items-center justify-center w-9 h-9 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                    title="Delete problem"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
