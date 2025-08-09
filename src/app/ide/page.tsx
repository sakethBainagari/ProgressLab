'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDSAContext } from '../context/DSAContext';
import { useAuth, ProtectedRoute } from '../contexts/AuthContext';
import { ArrowLeft } from 'lucide-react';
import { Problem } from '../types';

// Import the IDEModal content (we'll reuse the component logic)
import { IDEModal } from '../components/IDEModal';
import { UserProfileModal } from '../components/UserProfileModal';

export default function IDEPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <div className="text-sm text-gray-600">Loading IDE...</div>
        </div>
      </div>}>
        <IDEPageContent />
      </Suspense>
    </ProtectedRoute>
  );
}

function IDEPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const problemId = searchParams.get('problemId');
  const initialCode = searchParams.get('code');
  const initialLanguage = searchParams.get('language');
  const { categories, updateProblem } = useDSAContext();
  const { user } = useAuth();
  
  const [problem, setProblem] = useState<Problem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);

  useEffect(() => {
    console.log('IDE page - problemId:', problemId);
    console.log('IDE page - categories length:', categories.length);
    
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
          console.log('IDE page - found problem:', foundProblem);
          // If we have initial code and language from URL, use them
          if (initialCode && initialLanguage) {
            setProblem({
              ...foundProblem,
              code: decodeURIComponent(initialCode),
              language: initialLanguage
            });
          } else {
            setProblem(foundProblem);
          }
          break;
        }
      }
      
      if (!foundProblem) {
        setError('Problem not found');
      }
      setIsLoading(false);
    }
  }, [problemId, categories, initialCode, initialLanguage]);

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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleBack}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Problem Not Found</h2>
          <p className="text-gray-600 mb-4">The requested problem could not be found.</p>
          <button
            onClick={handleBack}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
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
              <span className="ml-4 text-sm text-gray-500">Online IDE</span>
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

      {/* IDE Content - Full Page */}
      <main className="p-0">
        <IDEModal
          isOpen={true}
          onClose={() => {}} // No close functionality in full page mode
          problem={problem}
          onSaveCode={(problemId: string, code: string, language: string) => {
            updateProblem(problemId, { code, language });
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
