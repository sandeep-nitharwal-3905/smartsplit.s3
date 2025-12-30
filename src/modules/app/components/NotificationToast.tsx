import { ArrowLeftRight, IndianRupee, Users, X } from 'lucide-react';
import type { Notification } from '../types';

interface NotificationToastProps {
  notifications: Notification[];
  isDarkTheme: boolean;
  onClose: (id: string) => void;
}

export function NotificationToast({ notifications, isDarkTheme, onClose }: NotificationToastProps) {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-2 sm:top-4 right-2 sm:right-4 z-50 space-y-1.5 sm:space-y-2 w-[calc(100vw-1rem)] sm:w-auto max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`rounded-lg shadow-lg p-3 sm:p-4 flex items-start gap-2 sm:gap-3 animate-slide-in border-l-4 ${
            isDarkTheme ? 'bg-gray-800 border-cyan-500' : 'bg-white border-teal-500'
          }`}
        >
          <div className="flex-shrink-0">
            {notification.type === 'expense' && (
              <IndianRupee className={`w-4 h-4 sm:w-5 sm:h-5 ${isDarkTheme ? 'text-cyan-400' : 'text-teal-500'}`} />
            )}
            {notification.type === 'settlement' && (
              <ArrowLeftRight className={`w-4 h-4 sm:w-5 sm:h-5 ${isDarkTheme ? 'text-green-400' : 'text-green-500'}`} />
            )}
            {notification.type === 'group' && (
              <Users className={`w-4 h-4 sm:w-5 sm:h-5 ${isDarkTheme ? 'text-blue-400' : 'text-blue-500'}`} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-xs sm:text-sm break-words ${isDarkTheme ? 'text-gray-200' : 'text-gray-800'}`}>
              {notification.message}
            </p>
          </div>
          <button
            onClick={() => onClose(notification.id)}
            className={`flex-shrink-0 ${isDarkTheme ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
