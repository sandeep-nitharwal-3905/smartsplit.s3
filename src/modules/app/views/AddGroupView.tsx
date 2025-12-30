import { Copy, Share2 } from 'lucide-react';
import type { User } from '../types';

interface AddGroupViewProps {
  isDarkTheme: boolean;
  groupName: string;
  setGroupName: (value: string) => void;
  friends: User[];
  groupMembers: string[];
  setGroupMembers: (members: string[]) => void;
  handleAddGroup: () => Promise<void> | void;
  showGroupCreatedModal: boolean;
  createdGroupId: string;
  copyGroupLink: (groupId: string) => void;
  copyGroupId: (groupId: string) => void;
  setShowGroupCreatedModal: (value: boolean) => void;
  setView: (view: string) => void;
  onBack: () => void;
}

export function AddGroupView(props: AddGroupViewProps) {
  const {
    isDarkTheme,
    groupName,
    setGroupName,
    friends,
    groupMembers,
    setGroupMembers,
    handleAddGroup,
    showGroupCreatedModal,
    createdGroupId,
    copyGroupLink,
    copyGroupId,
    setShowGroupCreatedModal,
    setView,
    onBack,
  } = props;

  return (
    <div className={`min-h-screen ${isDarkTheme ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <nav
        className={`p-3 sm:p-4 shadow-lg ${
          isDarkTheme ? 'bg-gradient-to-r from-purple-700 to-cyan-700 text-white' : 'bg-teal-500 text-white'
        }`}
      >
        <div className="max-w-4xl mx-auto flex items-center gap-2 sm:gap-4">
          <button onClick={onBack} className={`p-2 rounded ${isDarkTheme ? 'hover:bg-cyan-700' : 'hover:bg-teal-600'}`}>
            ← Back
          </button>
          <h1 className="text-lg sm:text-2xl font-bold">Create New Group</h1>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-3 sm:p-4 md:p-6">
        <div className={`rounded-lg shadow p-3 sm:p-4 md:p-6 ${isDarkTheme ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-gray-200' : 'text-gray-900'}`}>
                Group Name
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className={`w-full px-3 sm:px-4 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:border-transparent ${
                  isDarkTheme
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-cyan-500'
                    : 'border-gray-300 focus:ring-teal-500'
                }`}
                placeholder="e.g., Roommates, Trip to Paris"
              />
            </div>

            {friends.length > 0 && (
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-gray-200' : 'text-gray-900'}`}>
                  Add Members (Optional)
                </label>
                <p className={`text-xs mb-2 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                  Select friends to add to this group:
                </p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {friends.map((friend) => {
                    const isAdded = groupMembers.includes(friend.id);
                    return (
                      <button
                        key={friend.id}
                        onClick={() => {
                          if (isAdded) {
                            setGroupMembers(groupMembers.filter((id) => id !== friend.id));
                          } else {
                            setGroupMembers([...groupMembers, friend.id]);
                          }
                        }}
                        className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm transition ${
                          isAdded
                            ? isDarkTheme
                              ? 'bg-cyan-900 text-cyan-200 border-2 border-cyan-500'
                              : 'bg-teal-100 text-teal-700 border-2 border-teal-500'
                            : isDarkTheme
                              ? 'bg-gray-700 text-gray-300 border-2 border-gray-600 hover:border-gray-500'
                              : 'bg-gray-100 text-gray-700 border-2 border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {isAdded && '✓ '}
                        {friend.name || friend.email}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {friends.length === 0 && (
              <div className={`p-3 border rounded-lg ${isDarkTheme ? 'bg-blue-900/20 border-blue-500/30' : 'bg-blue-50 border-blue-200'}`}>
                <p className={`text-xs sm:text-sm ${isDarkTheme ? 'text-blue-300' : 'text-blue-800'}`}>
                  💡 Tip: Add friends first to quickly add them to groups. You can add members after creating the group too!
                </p>
              </div>
            )}

            <button
              onClick={handleAddGroup}
              className={`w-full py-2.5 sm:py-3 rounded-lg transition font-semibold text-sm sm:text-base ${
                isDarkTheme
                  ? 'bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white'
                  : 'bg-teal-500 text-white hover:bg-teal-600'
              }`}
            >
              Create Group
            </button>
          </div>
        </div>
      </div>

      {showGroupCreatedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div
            className={`rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-md ${
              isDarkTheme ? 'bg-gray-800 border border-gray-700' : 'bg-white'
            }`}
          >
            <div className="text-center mb-4">
              <div
                className={`mx-auto w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mb-3 ${
                  isDarkTheme ? 'bg-green-900' : 'bg-green-100'
                }`}
              >
                <svg
                  className={`w-6 h-6 sm:w-8 sm:h-8 ${isDarkTheme ? 'text-green-400' : 'text-green-500'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className={`text-xl sm:text-2xl font-bold mb-2 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                Group Created!
              </h2>
              <p className={`text-sm sm:text-base ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>
                Share this group with others to start splitting expenses
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => copyGroupLink(createdGroupId)}
                className={`w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-lg transition font-semibold text-sm sm:text-base ${
                  isDarkTheme ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                Share Group Link
              </button>

              <button
                onClick={() => copyGroupId(createdGroupId)}
                className={`w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-lg transition font-semibold text-sm sm:text-base ${
                  isDarkTheme ? 'bg-gray-600 text-white hover:bg-gray-700' : 'bg-gray-500 text-white hover:bg-gray-600'
                }`}
              >
                <Copy className="w-4 h-4 sm:w-5 sm:h-5" />
                Copy Group ID
              </button>

              <button
                onClick={() => {
                  setShowGroupCreatedModal(false);
                  setView('dashboard');
                }}
                className={`w-full py-2.5 sm:py-3 rounded-lg transition font-semibold text-sm sm:text-base ${
                  isDarkTheme
                    ? 'bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white'
                    : 'bg-teal-500 text-white hover:bg-teal-600'
                }`}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
