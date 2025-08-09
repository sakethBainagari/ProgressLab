import { Stats } from '@/app/types';
import { CheckCircle2, Target, TrendingUp, Calendar } from 'lucide-react';

interface StatsCardProps {
  stats: Stats;
}

export const StatsCard = ({ stats }: StatsCardProps) => {
  const completionRate = stats.totalProblems > 0 
    ? (stats.completedProblems / stats.totalProblems * 100).toFixed(1)
    : '0';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Progress Overview</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-2">
            <Target className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalProblems}</div>
          <div className="text-sm text-gray-600">Total Problems</div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-2">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.completedProblems}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-2">
            <TrendingUp className="w-6 h-6 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{completionRate}%</div>
          <div className="text-sm text-gray-600">Completion Rate</div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mx-auto mb-2">
            <Calendar className="w-6 h-6 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.streakDays}</div>
          <div className="text-sm text-gray-600">Day Streak</div>
        </div>
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Difficulty Breakdown</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">{stats.easyCompleted}</div>
            <div className="text-xs text-gray-600">Easy</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-yellow-600">{stats.mediumCompleted}</div>
            <div className="text-xs text-gray-600">Medium</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-red-600">{stats.hardCompleted}</div>
            <div className="text-xs text-gray-600">Hard</div>
          </div>
        </div>
      </div>
      
      {stats.completedProblems > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-600 mt-1 text-center">
            {stats.completedProblems} of {stats.totalProblems} problems completed
          </div>
        </div>
      )}
    </div>
  );
};
