'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDSAContext } from '../context/DSAContext';
import { useAuth, ProtectedRoute } from '../contexts/AuthContext';
import { ArrowLeft } from 'lucide-react';
import { Problem } from '../types';

// Import the NotesModal content (we'll reuse the component logic)
import { NotesModal } from '../components/NotesModal';
import { UserProfileModal } from '../components/UserProfileModal';

export default function NotesPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <div className="text-sm text-gray-600">Loading Notes...</div>
        </div>
      </div>}>
        <NotesPageContent />
      </Suspense>
    </ProtectedRoute>
  );
}

function NotesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const problemId = searchParams.get('problemId');
  const { categories, updateProblem } = useDSAContext();
  const { user } = useAuth();
  
  const [problem, setProblem] = useState<Problem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);

  useEffect(() => {
    console.log('Notes page - problemId:', problemId);
    console.log('Notes page - categories length:', categories.length);
    
    if (!problemId) {
      setError('No problem ID provided');
      setIsLoading(false);
      return;
    }

    if (categories.length > 0) {
      // Find the problem across all categories
      let foundProblem = null;
      for (const category of categories) {
        const allProblems = [
          ...category.problems.Easy,
          ...category.problems.Medium,
          ...category.problems.Hard
        ];
        foundProblem = allProblems.find(p => p.id === problemId);
        if (foundProblem) {
          console.log('Notes page - found problem:', foundProblem);
          setProblem(foundProblem);
          break;
        }
      }
      
      if (!foundProblem) {
        setError('Problem not found');
      }
      setIsLoading(false);
    }
  }, [problemId, categories]);

  const handleBack = () => {
    router.push('/dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <div className="text-sm text-gray-600">Loading problem...</div>
        </div>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-xl text-gray-600 mb-2">{error || 'Problem not found'}</p>
          <p className="text-sm text-gray-500 mb-4">The problem you're looking for doesn't exist or couldn't be loaded.</p>
          <button
            onClick={handleBack}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Back Button */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={handleBack}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </button>
              
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 bg-clip-text text-transparent">
                ProgressLab
              </h1>
              <span className="ml-4 text-sm text-gray-500">Problem Notes</span>
            </div>
            
            <button
              onClick={() => setIsUserProfileOpen(true)}
              className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              title="View Profile"
            >
              <span>Welcome, {user?.name || 'User'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Notes Content - Full Page */}
      <main className="p-0">
        <NotesModal
          isOpen={true}
          onClose={() => {}} // No close functionality in full page mode
          problem={problem}
          onSave={(problemId: string, notesData: any) => {
            updateProblem(problemId, { notes: JSON.stringify(notesData) });
          }}
          onOpenIDE={(problem: any, code: string, language: string) => {
            // Open IDE in a new tab as well
            const ideUrl = `/ide?problemId=${problem.id}&code=${encodeURIComponent(code)}&language=${language}`;
            window.open(ideUrl, '_blank');
          }}
          fullPageMode={true} // We'll add this prop to modify the modal for full page
        />
      </main>

      <UserProfileModal
        isOpen={isUserProfileOpen}
        onClose={() => setIsUserProfileOpen(false)}
      />
    </div>
  );
}
