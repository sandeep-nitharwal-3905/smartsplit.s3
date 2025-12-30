import { ArrowLeftRight, Link as LinkIcon, LogOut, Moon, Sun, User, Users } from 'lucide-react';
import type { Expense, Group, User as AppUser } from '../types';

interface DashboardViewProps {
  isDarkTheme: boolean;
  toggleTheme: () => void;
  currentUser: AppUser | null;
  groups: Group[];
  friends: AppUser[];
  balances: Record<string, number>;
  expenses: Expense[];
  setView: (view: string) => void;
  setSelectedGroup: (group: Group | null) => void;
  handleLogout: () => void;
  handleSettleUp: (fromId: string, toId: string, amount: number) => void;
  getUserName: (userId: string) => string;
  formatDateTime: (dateInput: any) => string;
  startEditExpense: (expense: Expense) => void;
  deleteExpense: (expenseId: string) => Promise<void>;
  copyGroupLink: (groupId: string) => void;
  copyGroupId: (groupId: string) => void;
  showJoinLinkModal: boolean;
  setShowJoinLinkModal: (value: boolean) => void;
  joinGroupId: string;
  setJoinGroupId: (value: string) => void;
  handleJoinGroup: () => Promise<void>;
}

export function DashboardView(props: DashboardViewProps) {
  const {
    isDarkTheme,
    toggleTheme,
    currentUser,
    groups,
    friends,
    balances,
    expenses,
    setView,
    setSelectedGroup,
    handleLogout,
    handleSettleUp,
    getUserName,
    formatDateTime,
    startEditExpense,
    deleteExpense,
    copyGroupLink,
    copyGroupId,
    showJoinLinkModal,
    setShowJoinLinkModal,
    joinGroupId,
    setJoinGroupId,
    handleJoinGroup,
  } = props;

  return (
    <div className={`min-h-screen ${isDarkTheme ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <nav
        className={`p-3 sm:p-4 shadow-lg ${
          isDarkTheme ? 'bg-gradient-to-r from-purple-900 to-cyan-900' : 'bg-teal-500'
        } text-white`}
      >
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-lg sm:text-2xl font-bold">SmartSplit</h1>
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded transition ${isDarkTheme ? 'hover:bg-cyan-700' : 'hover:bg-teal-600'}`}
              title={isDarkTheme ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkTheme ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
            <span className="text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">Welcome, {currentUser?.name}</span>
            <button
              onClick={handleLogout}
              className={`p-2 rounded ${isDarkTheme ? 'hover:bg-cyan-700' : 'hover:bg-teal-600'}`}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
          <button
            onClick={() => setView('addGroup')}
            className={`p-6 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3 ${
              isDarkTheme
                ? 'bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700'
                : 'bg-gradient-to-r from-teal-500 to-teal-600'
            } text-white`}
          >
            <Users className="w-7 h-7" />
            <div className="text-left">
              <div className="font-bold text-lg">Create Group</div>
              <div className="text-xs opacity-90">Start splitting expenses</div>
            </div>
          </button>

          <button
            onClick={() => setShowJoinLinkModal(true)}
            className={`p-6 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3 ${
              isDarkTheme
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                : 'bg-gradient-to-r from-blue-500 to-blue-600'
            } text-white`}
          >
            <LinkIcon className="w-7 h-7" />
            <div className="text-left">
              <div className="font-bold text-lg">Join Group</div>
              <div className="text-xs opacity-90">Enter group ID or link</div>
            </div>
          </button>
        </div>

        {groups.length === 0 && expenses.length === 0 && (
          <div
            className={`mb-4 sm:mb-6 rounded-lg p-3 sm:p-4 ${
              isDarkTheme ? 'bg-cyan-900/20 border border-cyan-500/30' : 'bg-blue-50 border border-blue-200'
            }`}
          >
            <h3
              className={`font-semibold mb-1.5 sm:mb-2 text-sm sm:text-base ${
                isDarkTheme ? 'text-cyan-300' : 'text-blue-900'
              }`}
            >
              👋 Welcome to SmartSplit!
            </h3>
            <p
              className={`text-xs sm:text-sm mb-1.5 sm:mb-2 ${isDarkTheme ? 'text-cyan-200' : 'text-blue-800'}`}
            >
              Get started by creating a group or joining an existing one:
            </p>
            <ul className={`text-xs sm:text-sm space-y-1 ml-4 list-disc ${isDarkTheme ? 'text-cyan-100' : 'text-blue-700'}`}>
              <li>
                <strong>Create Group:</strong> Perfect for roommates, trips, or shared expenses
              </li>
              <li>
                <strong>Join Group:</strong> Someone shared a group link with you? Join here!
              </li>
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className={`rounded-lg shadow p-3 sm:p-4 md:p-6 ${isDarkTheme ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 mb-3 sm:mb-4">
              <h2
                className={`text-lg sm:text-xl font-bold flex items-center gap-2 ${
                  isDarkTheme ? 'text-white' : 'text-gray-900'
                }`}
              >
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                Your Groups
              </h2>
              <button
                onClick={() => setView('addFriend')}
                className={`text-xs sm:text-sm font-medium flex items-center gap-1 self-start ${
                  isDarkTheme ? 'text-cyan-400 hover:text-cyan-300' : 'text-teal-600 hover:text-teal-700'
                }`}
                title="Manage your friends to easily add them to groups"
              >
                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Friends ({friends.length})
              </button>
            </div>
            {groups.length === 0 ? (
              <p className={`text-sm sm:text-base ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                No groups yet. Create one to get started!
              </p>
            ) : (
              <div className="space-y-1.5 sm:space-y-2">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    onClick={() => {
                      setSelectedGroup(group);
                      setView('groupDetail');
                    }}
                    className={`p-3 sm:p-4 border rounded-lg cursor-pointer transition ${
                      isDarkTheme
                        ? 'border-gray-600 hover:bg-gray-700 hover:border-cyan-500'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <h3 className={`font-semibold text-sm sm:text-base truncate ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                      {group.name}
                    </h3>
                    <p className={`text-xs sm:text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                      {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={`rounded-lg shadow p-3 sm:p-4 md:p-6 ${isDarkTheme ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
            <h2 className={`text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
              <ArrowLeftRight className="w-4 h-4 sm:w-5 sm:h-5" />
              Overall Balances
            </h2>
            {Object.keys(balances).length === 0 ? (
              <p className={`text-sm sm:text-base ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>All settled up!</p>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {Object.entries(balances).map(([key, amount]) => {
                  // New keys use '->' as delimiter; fall back to '-' for any legacy keys
                  const [fromId, toId] = key.includes('->') ? key.split('->') : key.split('-');
                  return (
                    <div
                      key={key}
                      className={`p-2.5 sm:p-3 rounded ${isDarkTheme ? 'bg-gray-700' : 'bg-gray-50'}`}
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 mb-2">
                        <span className={`text-xs sm:text-sm ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                          {getUserName(fromId)} owes {getUserName(toId)}
                        </span>
                        <span className={`font-bold text-sm sm:text-base ${isDarkTheme ? 'text-cyan-400' : 'text-teal-600'}`}>
                          ₹{amount.toFixed(2)}
                        </span>
                      </div>
                      {fromId === currentUser?.id && (
                        <button
                          onClick={() => handleSettleUp(fromId, toId, amount)}
                          className={`text-xs sm:text-sm px-3 py-1 sm:py-1.5 rounded transition ${
                            isDarkTheme
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-green-500 text-white hover:bg-green-600'
                          }`}
                        >
                          Settle Up
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {showJoinLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
          <div
            className={`rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-md ${
              isDarkTheme ? 'bg-gray-800 border border-gray-700' : 'bg-white'
            }`}
          >
            <h2 className={`text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
              Join a Group
            </h2>
            <p className={`text-xs sm:text-sm md:text-base mb-3 sm:mb-4 ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>
              Enter the Group ID to join
            </p>

            <input
              type="text"
              value={joinGroupId}
              onChange={(e) => setJoinGroupId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleJoinGroup()}
              placeholder="Enter Group ID"
              className={`w-full px-3 sm:px-4 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:border-transparent mb-3 sm:mb-4 ${
                isDarkTheme
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-cyan-500'
                  : 'border-gray-300 focus:ring-teal-500'
              }`}
            />

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={handleJoinGroup}
                className={`flex-1 py-2 sm:py-2.5 rounded-lg transition font-semibold text-sm sm:text-base ${
                  isDarkTheme
                    ? 'bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white'
                    : 'bg-teal-500 text-white hover:bg-teal-600'
                }`}
              >
                Join Group
              </button>
              <button
                onClick={() => {
                  setShowJoinLinkModal(false);
                  setJoinGroupId('');
                }}
                className={`flex-1 py-2 sm:py-2.5 rounded-lg transition font-semibold text-sm sm:text-base ${
                  isDarkTheme
                    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                    : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="mt-8 pb-6 text-center">
        <p className={`text-xs sm:text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
          Developed & designed with <span className="text-red-500">❤</span> by Sandeep Nitharwal
        </p>
      </footer>
    </div>
  );
}
