'use client';

import { Problem, Category, NewProblemForm, Stats } from '@/app/types';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FirebaseService } from '@/app/lib/firebaseService';
import { useAuth } from '@/app/contexts/AuthContext';

interface DSAContextType {
  categories: Category[];
  stats: Stats;
  addProblem: (problem: NewProblemForm) => Promise<void>;
  updateProblem: (problemId: string, updates: Partial<Problem>) => Promise<void>;
  toggleProblemCompletion: (problemId: string) => Promise<void>;
  deleteProblem: (problemId: string) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  searchProblems: (query: string) => Problem[];
  refreshData: () => Promise<void>;
  isLoading: boolean;
}

const DSAContext = createContext<DSAContextType | undefined>(undefined);

export const useDSAContext = () => {
  const context = useContext(DSAContext);
  if (!context) {
    throw new Error('useDSAContext must be used within a DSAProvider');
  }
  return context;
};

interface DSAProviderProps {
  children: ReactNode;
}

export const DSAProvider = ({ children }: DSAProviderProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Real-time data subscription
  useEffect(() => {
    if (!user) {
      setCategories([]);
      return;
    }

    setIsLoading(true);
    
    // Set up real-time listener
    const unsubscribe = FirebaseService.onCategoriesChange(user.id, (updatedCategories) => {
      setCategories(updatedCategories);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const refreshData = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const updatedCategories = await FirebaseService.getCategories(user.id);
      setCategories(updatedCategories);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addProblem = async (problemData: NewProblemForm): Promise<void> => {
    if (!user) {
      console.error('❌ Cannot add problem: No user logged in');
      alert('Please log in to add problems');
      return;
    }

    console.log('🔄 Adding problem to Firebase...');
    
    try {
      setIsLoading(true);
      await FirebaseService.addProblem(user.id, problemData);
      // Real-time listener will update the UI automatically
    } catch (error) {
      console.error('❌ Error adding problem:', error);
      alert('An error occurred while adding the problem.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateProblem = async (problemId: string, updates: Partial<Problem>): Promise<void> => {
    if (!user) return;
    
    try {
      await FirebaseService.updateProblem(user.id, problemId, updates);
      // Real-time listener will update the UI automatically
    } catch (error) {
      console.error('❌ Error updating problem:', error);
      alert('An error occurred while updating the problem.');
    }
  };

  const toggleProblemCompletion = async (problemId: string): Promise<void> => {
    if (!user) return;
    
    try {
      await FirebaseService.toggleProblemCompletion(user.id, problemId);
      // Real-time listener will update the UI automatically
    } catch (error) {
      console.error('❌ Error toggling problem completion:', error);
      alert('An error occurred while updating the problem.');
    }
  };

  const deleteProblem = async (problemId: string): Promise<void> => {
    if (!user) return;
    
    try {
      await FirebaseService.deleteProblem(user.id, problemId);
      // Real-time listener will update the UI automatically
    } catch (error) {
      console.error('❌ Error deleting problem:', error);
      alert('An error occurred while deleting the problem.');
    }
  };

  const deleteCategory = async (categoryId: string): Promise<void> => {
    if (!user) return;
    
    try {
      await FirebaseService.deleteCategory(user.id, categoryId);
      // Real-time listener will update the UI automatically
    } catch (error) {
      console.error('❌ Error deleting category:', error);
      alert('An error occurred while deleting the category.');
    }
  };

  const searchProblems = (query: string): Problem[] => {
    const lowercaseQuery = query.toLowerCase();
    const allProblems: Problem[] = [];
    
    categories.forEach(category => {
      Object.values(category.problems).forEach((difficultyGroup: Problem[]) => {
        difficultyGroup.forEach((problem: Problem) => {
          if (
            problem.title.toLowerCase().includes(lowercaseQuery) ||
            problem.description.toLowerCase().includes(lowercaseQuery) ||
            problem.tags.some((tag: string) => tag.toLowerCase().includes(lowercaseQuery))
          ) {
            allProblems.push(problem);
          }
        });
      });
    });
    
    return allProblems;
  };

  const stats: Stats = {
    totalProblems: categories.reduce((total, category) => {
      return total + 
        category.problems.Easy.length + 
        category.problems.Medium.length + 
        category.problems.Hard.length;
    }, 0),
    completedProblems: categories.reduce((total, category) => {
      return total + 
        category.problems.Easy.filter(p => p.completed).length +
        category.problems.Medium.filter(p => p.completed).length +
        category.problems.Hard.filter(p => p.completed).length;
    }, 0),
    easyCompleted: categories.reduce((total, category) => {
      return total + category.problems.Easy.filter(p => p.completed).length;
    }, 0),
    mediumCompleted: categories.reduce((total, category) => {
      return total + category.problems.Medium.filter(p => p.completed).length;
    }, 0),
    hardCompleted: categories.reduce((total, category) => {
      return total + category.problems.Hard.filter(p => p.completed).length;
    }, 0),
    streakDays: 0, // TODO: Calculate streak
    lastSolvedDate: undefined // TODO: Get last solved date
  };

  return (
    <DSAContext.Provider
      value={{
        categories,
        stats,
        addProblem,
        updateProblem,
        toggleProblemCompletion,
        deleteProblem,
        deleteCategory,
        searchProblems,
        refreshData,
        isLoading
      }}
    >
      {children}
    </DSAContext.Provider>
  );
};
