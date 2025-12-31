import { useTranslation } from 'react-i18next';
import type { User } from '../types';

interface AddFriendViewProps {
  isDarkTheme: boolean;
  friendEmail: string;
  setFriendEmail: (value: string) => void;
  handleAddFriend: () => Promise<void> | void;
  friends: User[];
  onBack: () => void;
}

export function AddFriendView(props: AddFriendViewProps) {
  const { t } = useTranslation();
  const { isDarkTheme, friendEmail, setFriendEmail, handleAddFriend, friends, onBack } = props;

  return (
    <div className={`min-h-screen ${isDarkTheme ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <nav
        className={`p-3 sm:p-4 shadow-lg ${
          isDarkTheme ? 'bg-gradient-to-r from-purple-700 to-cyan-700 text-white' : 'bg-teal-500 text-white'
        }`}
      >
        <div className="max-w-4xl mx-auto flex items-center gap-2 sm:gap-4">
          <button onClick={onBack} className={`p-2 rounded ${isDarkTheme ? 'hover:bg-cyan-700' : 'hover:bg-teal-600'}`}>
            ← {t('common.back')}
          </button>
          <h1 className="text-lg sm:text-2xl font-bold">{t('friend.addFriend')}</h1>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-3 sm:p-4 md:p-6">
        <div className={`rounded-lg shadow p-3 sm:p-4 md:p-6 ${isDarkTheme ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
          <div
            className={`mb-3 sm:mb-4 p-2.5 sm:p-3 border rounded-lg ${
              isDarkTheme ? 'bg-blue-900/20 border-blue-500/30' : 'bg-blue-50 border-blue-200'
            }`}
          >
            <p className={`text-xs sm:text-sm ${isDarkTheme ? 'text-blue-300' : 'text-blue-800'}`}>
              💡 Add friends here to quickly include them when creating groups. You can also add people directly by
              email when creating a group.
            </p>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className={`block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${isDarkTheme ? 'text-gray-200' : 'text-gray-900'}`}>
                {t('friend.friendEmail')}
              </label>
              <input
                type="email"
                value={friendEmail}
                onChange={(e) => setFriendEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddFriend()}
                className={`w-full px-3 sm:px-4 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:border-transparent ${
                  isDarkTheme
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-cyan-500'
                    : 'border-gray-300 focus:ring-teal-500'
                }`}
                placeholder="friend@example.com"
              />
            </div>

            <button
              onClick={handleAddFriend}
              className={`w-full py-2.5 sm:py-3 rounded-lg transition font-semibold text-sm sm:text-base ${
                isDarkTheme
                  ? 'bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white'
                  : 'bg-teal-500 text-white hover:bg-teal-600'
              }`}
            >
              {t('friend.addFriend')}
            </button>
          </div>

          <div className="mt-4 sm:mt-6">
            <h3 className={`font-semibold mb-2 sm:mb-3 text-sm sm:text-base ${isDarkTheme ? 'text-gray-200' : 'text-gray-900'}`}>
              {t('dashboard.myFriends')}
            </h3>
            {friends.length === 0 ? (
              <p className={`text-sm sm:text-base ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                {t('dashboard.noFriends')}
              </p>
            ) : (
              <div className="space-y-1.5 sm:space-y-2">
                {friends.map((friend) => (
                  <div key={friend.id} className={`p-2.5 sm:p-3 border rounded ${isDarkTheme ? 'border-gray-600 bg-gray-700' : 'border-gray-200'}`}>
                    <p className={`font-medium text-sm sm:text-base truncate ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                      {friend.name}
                    </p>
                    <p className={`text-xs sm:text-sm truncate ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                      {friend.email}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
