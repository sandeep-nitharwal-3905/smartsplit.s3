import { ArrowLeft, MessageSquare, Star, User, Mail, Calendar, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { Feedback } from '../../data/feedbacks';
import { deleteFeedback } from '../../data/feedbacks';

interface AdminPanelViewProps {
  isDarkTheme: boolean;
  feedbacks: Feedback[];
  setView: (view: string) => void;
  formatDateTime: (dateInput: any) => string;
  onDeleteFeedback: () => Promise<void>;
}

export function AdminPanelView({ isDarkTheme, feedbacks, setView, formatDateTime, onDeleteFeedback }: AdminPanelViewProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const handleDeleteFeedback = async (feedbackId: string, userName?: string) => {
    const confirmMessage = `Are you sure you want to delete this feedback${userName ? ` from ${userName}` : ''}?`;
    if (!window.confirm(confirmMessage)) return;

    setDeletingId(feedbackId);
    const result = await deleteFeedback(feedbackId);
    
    if (result.success) {
      await onDeleteFeedback(); // Refresh feedbacks list
    } else {
      alert(`Failed to delete feedback: ${result.error}`);
    }
    setDeletingId(null);
  };

  const averageRating = feedbacks.length > 0
    ? feedbacks.filter(f => f.rating).reduce((sum, f) => sum + (f.rating || 0), 0) / feedbacks.filter(f => f.rating).length
    : 0;

  const ratingCounts = [1, 2, 3, 4, 5].map(rating => 
    feedbacks.filter(f => f.rating === rating).length
  );

  return (
    <div className={`min-h-screen ${isDarkTheme ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <nav
        className={`p-3 sm:p-4 shadow-lg ${
          isDarkTheme ? 'bg-gradient-to-r from-purple-900 to-cyan-900' : 'bg-teal-500'
        } text-white`}
      >
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button
            onClick={() => setView('dashboard')}
            className={`p-2 rounded transition ${isDarkTheme ? 'hover:bg-cyan-700' : 'hover:bg-teal-600'}`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg sm:text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
            Admin Panel - Feedbacks
          </h1>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className={`rounded-lg shadow p-4 sm:p-6 ${isDarkTheme ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
            <div className={`text-3xl font-bold ${isDarkTheme ? 'text-cyan-400' : 'text-teal-600'}`}>
              {feedbacks.length}
            </div>
            <div className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
              Total Feedbacks
            </div>
          </div>

          <div className={`rounded-lg shadow p-4 sm:p-6 ${isDarkTheme ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
            <div className={`text-3xl font-bold flex items-center gap-2 ${isDarkTheme ? 'text-yellow-400' : 'text-yellow-600'}`}>
              {averageRating > 0 ? averageRating.toFixed(1) : 'N/A'}
              {averageRating > 0 && <Star className="w-6 h-6 fill-current" />}
            </div>
            <div className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
              Average Rating
            </div>
          </div>

          <div className={`rounded-lg shadow p-4 sm:p-6 ${isDarkTheme ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
            <div className={`text-3xl font-bold ${isDarkTheme ? 'text-purple-400' : 'text-purple-600'}`}>
              {feedbacks.filter(f => f.rating && f.rating >= 4).length}
            </div>
            <div className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
              Positive Ratings (4-5 ⭐)
            </div>
          </div>
        </div>

        {/* Rating Distribution */}
        {feedbacks.filter(f => f.rating).length > 0 && (
          <div className={`rounded-lg shadow p-4 sm:p-6 mb-6 ${isDarkTheme ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
            <h2 className={`text-lg font-bold mb-4 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
              Rating Distribution
            </h2>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = ratingCounts[rating - 1];
                const percentage = feedbacks.filter(f => f.rating).length > 0
                  ? (count / feedbacks.filter(f => f.rating).length) * 100
                  : 0;
                return (
                  <div key={rating} className="flex items-center gap-3">
                    <div className={`flex items-center gap-1 w-16 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                      <span>{rating}</span>
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    </div>
                    <div className="flex-1 h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className={`w-12 text-sm text-right ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                      {count}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Feedbacks List */}
        <div className={`rounded-lg shadow p-4 sm:p-6 ${isDarkTheme ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
          <h2 className={`text-lg sm:text-xl font-bold mb-4 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
            All Feedbacks
          </h2>

          {feedbacks.length === 0 ? (
            <p className={`text-center py-8 ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
              No feedbacks received yet.
            </p>
          ) : (
            <div className="space-y-4">
              {feedbacks.map((feedback) => (
                <div
                  key={feedback.id}
                  className={`p-4 rounded-lg border relative ${
                    isDarkTheme ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-full ${isDarkTheme ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <User className={`w-5 h-5 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`} />
                      </div>
                      <div>
                        <div className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                          {feedback.user_name || 'Anonymous'}
                        </div>
                        {feedback.user_email && (
                          <div className={`text-sm flex items-center gap-1 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                            <Mail className="w-3 h-3" />
                            {feedback.user_email}
                          </div>
                        )}
                        <div className={`text-xs flex items-center gap-1 mt-1 ${isDarkTheme ? 'text-gray-500' : 'text-gray-500'}`}>
                          <Calendar className="w-3 h-3" />
                          {formatDateTime(feedback.created_at)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {feedback.rating && (
                        <div className="flex items-center gap-1">
                          {[...Array(feedback.rating)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          ))}
                          {[...Array(5 - feedback.rating)].map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${isDarkTheme ? 'text-gray-600' : 'text-gray-300'}`} />
                          ))}
                        </div>
                      )}
                      <button
                        onClick={() => handleDeleteFeedback(feedback.id, feedback.user_name)}
                        disabled={deletingId === feedback.id}
                        className={`p-2 rounded-lg transition ${
                          isDarkTheme 
                            ? 'hover:bg-red-900/30 text-red-400 hover:text-red-300' 
                            : 'hover:bg-red-100 text-red-600 hover:text-red-700'
                        } ${deletingId === feedback.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="Delete feedback"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className={`whitespace-pre-wrap ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                    {feedback.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
