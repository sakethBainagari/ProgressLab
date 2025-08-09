'use client';

import React, { useState } from 'react';
import { useDSAContext } from '../context/DSAContext';
import { useAuth } from '../contexts/AuthContext';
import { FirebaseService } from '../lib/firebaseService';

export function StreakTestPanel() {
  const { categories } = useDSAContext();
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  if (!user) return null;

  // Get all completed problems
  const allProblems = categories.flatMap(category => [
    ...category.problems.Easy,
    ...category.problems.Medium,
    ...category.problems.Hard
  ]);
  
  const completedProblems = allProblems.filter(p => p.completed && p.completedAt);

  // Test function to mark a problem as completed today
  const markProblemCompletedToday = async () => {
    if (allProblems.length === 0) {
      alert('No problems available. Add some problems first!');
      return;
    }

    const incompleteProblem = allProblems.find(p => !p.completed);
    if (!incompleteProblem) {
      alert('All problems are already completed!');
      return;
    }

    try {
      await FirebaseService.updateProblem(user.id, incompleteProblem.id, {
        completed: true,
        completedAt: new Date() // Today
      });
      alert(`Marked "${incompleteProblem.title}" as completed today!`);
    } catch (error) {
      console.error('Error marking problem as completed:', error);
      alert('Error updating problem');
    }
  };

  // Test function to mark a problem as completed yesterday
  const markProblemCompletedYesterday = async () => {
    if (allProblems.length === 0) {
      alert('No problems available. Add some problems first!');
      return;
    }

    const incompleteProblem = allProblems.find(p => !p.completed);
    if (!incompleteProblem) {
      alert('All problems are already completed!');
      return;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    try {
      await FirebaseService.updateProblem(user.id, incompleteProblem.id, {
        completed: true,
        completedAt: yesterday
      });
      alert(`Marked "${incompleteProblem.title}" as completed yesterday!`);
    } catch (error) {
      console.error('Error marking problem as completed:', error);
      alert('Error updating problem');
    }
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors text-sm"
        >
          🧪 Streak Test
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-xl p-4 w-80">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800">🧪 Streak Testing Panel</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700 text-lg"
        >
          ×
        </button>
      </div>

      <div className="space-y-3">
        <div className="text-xs text-gray-600">
          <div>Total problems: {allProblems.length}</div>
          <div>Completed: {completedProblems.length}</div>
          <div>With completedAt: {completedProblems.filter(p => p.completedAt).length}</div>
        </div>

        {completedProblems.length > 0 && (
          <div className="text-xs text-gray-600">
            <div className="font-medium mb-1">Recent completions:</div>
            {completedProblems
              .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
              .slice(0, 3)
              .map(p => (
                <div key={p.id} className="text-xs">
                  • {p.title} - {new Date(p.completedAt!).toLocaleDateString()}
                </div>
              ))
            }
          </div>
        )}

        <div className="space-y-2">
          <button
            onClick={markProblemCompletedToday}
            className="w-full bg-green-600 text-white px-3 py-2 rounded text-xs hover:bg-green-700 transition-colors"
          >
            Mark Problem Complete (Today)
          </button>
          
          <button
            onClick={markProblemCompletedYesterday}
            className="w-full bg-blue-600 text-white px-3 py-2 rounded text-xs hover:bg-blue-700 transition-colors"
          >
            Mark Problem Complete (Yesterday)
          </button>
        </div>

        <div className="text-xs text-gray-500 border-t pt-2">
          💡 Use these buttons to test streak calculation. Check your profile after each action.
        </div>
      </div>
    </div>
  );
}
