'use client';

import { useState, useMemo } from 'react';
import { useDSAContext } from '../context/DSAContext';
import { useAuth, ProtectedRoute } from '../contexts/AuthContext';
import { CategoryList } from '../components/CategoryList';
import { SearchBar } from '../components/SearchBar';
import { ProblemTable } from '../components/ProblemTable';
import { AddProblemModal } from '../components/AddProblemModal';
import { NotesModal } from '../components/NotesModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { UserProfileModal } from '../components/UserProfileModal';
import { Problem } from '../types';
import { LogOut, User, Plus } from 'lucide-react';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { categories, toggleProblemCompletion, searchProblems, addProblem, deleteProblem, deleteCategory, updateProblem } = useDSAContext();
  const { user, logout } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'deleteCategory' | 'deleteProblem';
    id: string;
    name: string;
  } | null>(null);

  // Debug authentication state
  console.log('🧑‍💻 Current authentication state:');
  console.log('User object:', user);
  console.log('User ID:', user?.id);
  console.log('User email:', user?.email);

  const filteredProblems = useMemo(() => {
    let problems: Problem[] = [];
    
    if (searchQuery.trim()) {
      problems = searchProblems(searchQuery);
    } else if (selectedCategory && selectedDifficulty) {
      const category = categories.find(c => c.id === selectedCategory);
      problems = category ? category.problems[selectedDifficulty as 'Easy' | 'Medium' | 'Hard'] : [];
    } else if (selectedCategory) {
      const category = categories.find(c => c.id === selectedCategory);
      problems = category ? [
        ...category.problems.Easy,
        ...category.problems.Medium,
        ...category.problems.Hard
      ] : [];
    } else {
      // All Problems view - get all problems from all categories
      problems = categories.flatMap(category => [
        ...category.problems.Easy,
        ...category.problems.Medium,
        ...category.problems.Hard
      ]);
    }

    // Sort by creation date (oldest first)
    return problems.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [categories, selectedCategory, selectedDifficulty, searchQuery, searchProblems]);

  const stats = useMemo(() => {
    const allProblems = categories.flatMap(category => [
      ...category.problems.Easy,
      ...category.problems.Medium,
      ...category.problems.Hard
    ]);
    
    const completed = allProblems.filter(p => p.completed).length;
    const total = allProblems.length;
    
    const easy = {
      total: categories.reduce((sum, cat) => sum + cat.problems.Easy.length, 0),
      completed: categories.reduce((sum, cat) => sum + cat.problems.Easy.filter(p => p.completed).length, 0)
    };
    
    const medium = {
      total: categories.reduce((sum, cat) => sum + cat.problems.Medium.length, 0),
      completed: categories.reduce((sum, cat) => sum + cat.problems.Medium.filter(p => p.completed).length, 0)
    };
    
    const hard = {
      total: categories.reduce((sum, cat) => sum + cat.problems.Hard.length, 0),
      completed: categories.reduce((sum, cat) => sum + cat.problems.Hard.filter(p => p.completed).length, 0)
    };

    return {
      totalProblems: total,
      solvedProblems: completed,
      progressPercentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      easy,
      medium,
      hard
    };
  }, [categories]);

  const handleNotesClick = (problem: Problem) => {
    setSelectedProblem(problem);
    setIsNotesModalOpen(true);
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleRandomProblem = () => {
    let availableProblems: Problem[] = [];

    if (selectedCategory) {
      // If a category is selected, get problems only from that category
      const category = categories.find(c => c.id === selectedCategory);
      if (category) {
        if (selectedDifficulty) {
          // If both category and difficulty are selected, get problems from that specific difficulty
          availableProblems = category.problems[selectedDifficulty as 'Easy' | 'Medium' | 'Hard'];
        } else {
          // If only category is selected, get all problems from that category
          availableProblems = [
            ...category.problems.Easy,
            ...category.problems.Medium,
            ...category.problems.Hard
          ];
        }
      }
    } else {
      // If no category is selected (All Problems view), get problems from all categories
      availableProblems = categories.flatMap(category => [
        ...category.problems.Easy,
        ...category.problems.Medium,
        ...category.problems.Hard
      ]);
    }

    if (availableProblems.length === 0) {
      return; // No problems available in the selected scope
    }

    // Select a random problem from the available problems
    const randomIndex = Math.floor(Math.random() * availableProblems.length);
    const randomProblem = availableProblems[randomIndex];

    // Set search to show only the random problem (keep current filters intact)
    setSearchQuery(randomProblem.title);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (category) {
      setConfirmAction({
        type: 'deleteCategory',
        id: categoryId,
        name: category.name
      });
      setIsConfirmModalOpen(true);
    }
  };

  const handleDeleteProblem = async (problemId: string) => {
    // Find the problem across all categories
    let problemName = '';
    for (const category of categories) {
      const allProblems = [
        ...category.problems.Easy,
        ...category.problems.Medium,
        ...category.problems.Hard
      ];
      const problem = allProblems.find(p => p.id === problemId);
      if (problem) {
        problemName = problem.title;
        break;
      }
    }

    if (problemName) {
      setConfirmAction({
        type: 'deleteProblem',
        id: problemId,
        name: problemName
      });
      setIsConfirmModalOpen(true);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;

    try {
      if (confirmAction.type === 'deleteCategory') {
        await deleteCategory(confirmAction.id);
        // Reset selections if the deleted category was selected
        if (selectedCategory === confirmAction.id) {
          setSelectedCategory(null);
          setSelectedDifficulty(null);
        }
      } else if (confirmAction.type === 'deleteProblem') {
        await deleteProblem(confirmAction.id);
      }
    } catch (error) {
      console.error('Delete operation failed:', error);
    } finally {
      setConfirmAction(null);
    }
  };

  const handleCancelConfirm = () => {
    setIsConfirmModalOpen(false);
    setConfirmAction(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 bg-clip-text text-transparent">
                ProgressLab
              </h1>
              <span className="ml-4 text-sm text-gray-500">Dashboard</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Problem
              </button>
              
              <button
                onClick={() => setIsUserProfileOpen(true)}
                className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                title="View Profile"
              >
                <User className="h-4 w-4" />
                <span>Welcome, {user?.name || 'User'}</span>
              </button>
              
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <CategoryList
              categories={categories}
              selectedCategory={selectedCategory}
              selectedDifficulty={selectedDifficulty}
              onCategorySelect={setSelectedCategory}
              onDifficultySelect={setSelectedDifficulty}
              onDeleteCategory={handleDeleteCategory}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="mb-6">
              <SearchBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onClearFilters={() => {
                  setSelectedCategory(null);
                  setSelectedDifficulty(null);
                  setSearchQuery('');
                }}
                hasActiveFilters={!!selectedCategory || !!selectedDifficulty || !!searchQuery.trim()}
                onRandomProblem={handleRandomProblem}
              />
            </div>

            <ProblemTable
              problems={filteredProblems}
              onToggleCompletion={toggleProblemCompletion}
              onNotesClick={handleNotesClick}
              onDeleteProblem={handleDeleteProblem}
              selectedCategory={selectedCategory}
              selectedDifficulty={selectedDifficulty}
              searchQuery={searchQuery}
            />
          </div>
        </div>
      </main>

      {/* Modals */}
      <AddProblemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={addProblem}
        categories={categories.map(cat => cat.name)}
      />

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={handleCancelConfirm}
        onConfirm={handleConfirmAction}
        title={confirmAction?.type === 'deleteCategory' ? 'Delete Category' : 'Delete Problem'}
        message={
          confirmAction?.type === 'deleteCategory'
            ? `Are you sure you want to delete the "${confirmAction.name}" category and all its problems? This action cannot be undone.`
            : `Are you sure you want to delete the problem "${confirmAction?.name}"? This action cannot be undone.`
        }
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      <UserProfileModal
        isOpen={isUserProfileOpen}
        onClose={() => setIsUserProfileOpen(false)}
      />

      <NotesModal
        isOpen={isNotesModalOpen}
        onClose={() => {
          setIsNotesModalOpen(false);
          setSelectedProblem(null);
        }}
        problem={selectedProblem}
  onSave={(problemId: string, notesData: unknown) => {
          // Handle saving notes - you can implement this based on your needs
          console.log('Saving notes for problem:', problemId, notesData);
        }}
      />
    </div>
  );
}
