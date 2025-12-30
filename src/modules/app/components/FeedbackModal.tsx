import { useState } from 'react';
import { MessageSquare, Star, X } from 'lucide-react';

interface FeedbackModalProps {
  isDarkTheme: boolean;
  onClose: () => void;
  onSubmit: (feedback: { message: string; rating?: number }) => Promise<void>;
  currentUser: { name?: string; email?: string } | null;
}

export function FeedbackModal({ isDarkTheme, onClose, onSubmit, currentUser }: FeedbackModalProps) {
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        message: message.trim(),
        rating: rating > 0 ? rating : undefined,
      });
      setMessage('');
      setRating(0);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
      <div
        className={`rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-lg ${
          isDarkTheme ? 'bg-gray-800 border border-gray-700' : 'bg-white'
        }`}
      >
        <div className="flex justify-between items-center mb-4">
          <h2
            className={`text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-2 ${
              isDarkTheme ? 'text-white' : 'text-gray-900'
            }`}
          >
            <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
            Send Feedback
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition ${
              isDarkTheme ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className={`text-sm mb-4 ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>
          We'd love to hear your thoughts! Your feedback helps us improve SmartSplit.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rating */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>
              Rate your experience (optional)
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : isDarkTheme
                        ? 'text-gray-600'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>
              Your Feedback <span className="text-red-500">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us what you think..."
              rows={6}
              required
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:border-transparent resize-none ${
                isDarkTheme
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-cyan-500'
                  : 'border-gray-300 focus:ring-teal-500'
              }`}
            />
          </div>

          {/* User info display */}
          {currentUser && (
            <div className={`text-xs ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
              Submitting as: {currentUser.name} ({currentUser.email})
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !message.trim()}
              className={`flex-1 py-2 sm:py-2.5 rounded-lg transition font-semibold text-sm sm:text-base flex items-center justify-center gap-2 ${
                isDarkTheme
                  ? 'bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white disabled:opacity-50 disabled:cursor-not-allowed'
                  : 'bg-teal-500 text-white hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-2 sm:py-2.5 rounded-lg transition font-semibold text-sm sm:text-base ${
                isDarkTheme
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              }`}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
