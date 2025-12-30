import { useState } from 'react';
import type { Group, User } from '../types';
import { SupportModal } from '../components/SupportModal';
import { Heart } from 'lucide-react';

interface AddExpenseViewProps {
  isDarkTheme: boolean;
  selectedGroup: Group | null;
  currentUser: User | null;
  friends: User[];
  memberCache: Record<string, User>;
  selectedParticipants: string[];
  setSelectedParticipants: (ids: string[]) => void;
  setView: (view: string) => void;
  isEditMode: boolean;
  cancelEditExpense: () => void;
  expenseDesc: string;
  setExpenseDesc: (value: string) => void;
  expenseAmount: string;
  setExpenseAmount: (value: string) => void;
  selectedPayer: string;
  setSelectedPayer: (value: string) => void;
  splitMode: 'equal' | 'unequal';
  setSplitMode: (mode: 'equal' | 'unequal') => void;
  customSplits: Record<string, string>;
  setCustomSplits: (splits: Record<string, string>) => void;
  handleAddExpense: () => Promise<void> | void;
}

export function AddExpenseView(props: AddExpenseViewProps) {
  const {
    isDarkTheme,
    selectedGroup,
    currentUser,
    friends,
    memberCache,
    selectedParticipants,
    setSelectedParticipants,
    setView,
    isEditMode,
    cancelEditExpense,
    expenseDesc,
    setExpenseDesc,
    expenseAmount,
    setExpenseAmount,
    selectedPayer,
    setSelectedPayer,
    splitMode,
    setSplitMode,
    customSplits,
    setCustomSplits,
    handleAddExpense,
  } = props;

  const [showSupportModal, setShowSupportModal] = useState(false);

  let availableMembers: User[] = [];

  if (selectedGroup) {
    availableMembers = selectedGroup.members.map((memberId) => {
      if (memberId === currentUser?.id && currentUser) {
        return currentUser;
      }
      const friend = friends.find((f) => f.id === memberId);
      if (friend) return friend;
      const cached = memberCache[memberId];
      if (cached) return cached;
      return {
        id: memberId,
        name: '',
        email: '',
        createdAt: '',
      };
    });
  } else {
    availableMembers = currentUser ? [currentUser, ...friends] : friends;
  }

  const handleSelectAll = () => {
    if (selectedParticipants.length === availableMembers.length) {
      setSelectedParticipants([]);
    } else {
      setSelectedParticipants(availableMembers.map((m) => m.id));
    }
  };

  const allSelected = selectedParticipants.length === availableMembers.length && availableMembers.length > 0;

  return (
    <div className={`min-h-screen ${isDarkTheme ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <nav
        className={`p-3 sm:p-4 shadow-lg ${
          isDarkTheme ? 'bg-gradient-to-r from-purple-700 to-cyan-700 text-white' : 'bg-teal-500 text-white'
        }`}
      >
        <div className="max-w-4xl mx-auto flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => (isEditMode ? cancelEditExpense() : setView(selectedGroup ? 'groupDetail' : 'dashboard'))}
            className={`p-2 rounded ${isDarkTheme ? 'hover:bg-cyan-700' : 'hover:bg-teal-600'}`}
          >
            ← Back
          </button>
          <h1 className="text-lg sm:text-2xl font-bold">{isEditMode ? 'Edit Expense' : 'Add Expense'}</h1>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className={`rounded-lg shadow p-4 sm:p-6 ${isDarkTheme ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
          {selectedGroup && (
            <div className={`mb-4 p-3 border rounded-lg ${isDarkTheme ? 'bg-cyan-900/20 border-cyan-500/30' : 'bg-teal-50 border-teal-200'}`}>
              <p className={`text-sm ${isDarkTheme ? 'text-cyan-300' : 'text-teal-800'}`}>
                <strong>Group:</strong> {selectedGroup.name}
              </p>
            </div>
          )}

          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className={`block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${isDarkTheme ? 'text-gray-200' : 'text-gray-900'}`}>
                Description
              </label>
              <input
                type="text"
                value={expenseDesc}
                onChange={(e) => setExpenseDesc(e.target.value)}
                className={`w-full px-3 sm:px-4 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:border-transparent ${
                  isDarkTheme
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-cyan-500'
                    : 'border-gray-300 focus:ring-teal-500'
                }`}
                placeholder="e.g., Dinner at restaurant"
              />
            </div>

            <div>
              <label className={`block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${isDarkTheme ? 'text-gray-200' : 'text-gray-900'}`}>
                Amount (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                className={`w-full px-3 sm:px-4 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:border-transparent ${
                  isDarkTheme
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-cyan-500'
                    : 'border-gray-300 focus:ring-teal-500'
                }`}
                placeholder="₹0.00"
              />
            </div>

            <div>
              <label className={`block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${isDarkTheme ? 'text-gray-200' : 'text-gray-900'}`}>
                Paid By
              </label>
              <select
                value={selectedPayer}
                onChange={(e) => setSelectedPayer(e.target.value)}
                className={`w-full px-3 sm:px-4 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:border-transparent ${
                  isDarkTheme
                    ? 'bg-gray-700 border-gray-600 text-white focus:ring-cyan-500'
                    : 'border-gray-300 focus:ring-teal-500'
                }`}
              >
                <option value="">Select payer</option>
                {availableMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.id === currentUser?.id ? 'You' : member.name || (member.email ? member.email.split('@')[0] : 'Unknown User')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 mb-2">
                <label className={`block text-xs sm:text-sm font-medium ${isDarkTheme ? 'text-gray-200' : 'text-gray-900'}`}>
                  Split Between
                </label>
                <button
                  onClick={handleSelectAll}
                  className={`text-xs sm:text-sm font-medium self-start ${isDarkTheme ? 'text-cyan-400 hover:text-cyan-300' : 'text-teal-600 hover:text-teal-700'}`}
                >
                  {allSelected ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className={`mb-2 sm:mb-3 flex gap-1.5 sm:gap-2 p-1 rounded-lg ${isDarkTheme ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <button
                  onClick={() => {
                    setSplitMode('equal');
                    setCustomSplits({});
                  }}
                  className={`flex-1 py-1.5 sm:py-2 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition ${
                    splitMode === 'equal'
                      ? isDarkTheme
                        ? 'bg-cyan-600 text-white shadow'
                        : 'bg-white text-teal-600 shadow'
                      : isDarkTheme
                        ? 'text-gray-300 hover:text-white'
                        : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Split Equally
                </button>
                <button
                  onClick={() => setSplitMode('unequal')}
                  className={`flex-1 py-1.5 sm:py-2 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition ${
                    splitMode === 'unequal'
                      ? isDarkTheme
                        ? 'bg-cyan-600 text-white shadow'
                        : 'bg-white text-teal-600 shadow'
                      : isDarkTheme
                        ? 'text-gray-300 hover:text-white'
                        : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Split Unequally
                </button>
              </div>

              <div
                className={`space-y-1.5 sm:space-y-2 border rounded-lg p-2 sm:p-3 max-h-80 sm:max-h-96 overflow-y-auto ${
                  isDarkTheme ? 'border-gray-600 bg-gray-700/50' : 'border-gray-300'
                }`}
              >
                {availableMembers.length === 0 ? (
                  <p className={`text-xs sm:text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>No members available</p>
                ) : (
                  availableMembers.map((member) => (
                    <div
                      key={member.id}
                      className={`border-b last:border-0 pb-1.5 sm:pb-2 last:pb-0 ${isDarkTheme ? 'border-gray-600' : 'border-gray-100'}`}
                    >
                      <label
                        className={`flex items-center gap-2 cursor-pointer p-1.5 sm:p-2 rounded ${isDarkTheme ? 'hover:bg-gray-600' : 'hover:bg-gray-50'}`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedParticipants.includes(member.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedParticipants([...selectedParticipants, member.id]);
                              if (splitMode === 'unequal' && expenseAmount) {
                                const existingSplits = selectedParticipants.reduce(
                                  (sum, id) => sum + parseFloat(customSplits[id] || '0'),
                                  0
                                );
                                const remaining = parseFloat(expenseAmount) - existingSplits;
                                setCustomSplits({
                                  ...customSplits,
                                  [member.id]: remaining > 0 ? remaining.toFixed(2) : '0',
                                });
                              }
                            } else {
                              setSelectedParticipants(selectedParticipants.filter((id) => id !== member.id));
                              if (splitMode === 'unequal') {
                                const newSplits = { ...customSplits };
                                delete newSplits[member.id];
                                setCustomSplits(newSplits);
                              }
                            }
                          }}
                          className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-600 flex-shrink-0"
                        />
                        <span className="flex-1 text-xs sm:text-sm truncate">
                          {member.id === currentUser?.id
                            ? 'You'
                            : member.name || (member.email ? member.email.split('@')[0] : 'Unknown User')}
                        </span>

                        {splitMode === 'unequal' && selectedParticipants.includes(member.id) && (
                          <input
                            type="number"
                            step="0.01"
                            value={customSplits[member.id] || ''}
                            onChange={(e) =>
                              setCustomSplits({
                                ...customSplits,
                                [member.id]: e.target.value,
                              })
                            }
                            onClick={(e) => e.stopPropagation()}
                            className="w-20 sm:w-24 px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded focus:ring-2 focus:ring-teal-500"
                            placeholder="₹0.00"
                          />
                        )}
                      </label>
                    </div>
                  ))
                )}
              </div>

              {selectedParticipants.length > 0 && expenseAmount && (
                <div className={`mt-2 p-2 sm:p-2.5 rounded text-xs sm:text-sm ${isDarkTheme ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  {splitMode === 'equal' ? (
                    <p className={isDarkTheme ? 'text-gray-300' : 'text-gray-600'}>
                      Each person pays:{' '}
                      <span className={`font-semibold ${isDarkTheme ? 'text-cyan-400' : 'text-gray-800'}`}>
                        ₹{(parseFloat(expenseAmount) / selectedParticipants.length).toFixed(2)}
                      </span>
                    </p>
                  ) : (
                    <div className="space-y-1">
                      <p className={`font-medium ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>Custom split:</p>
                      {(() => {
                        const totalSplit = selectedParticipants.reduce(
                          (sum, id) => sum + parseFloat(customSplits[id] || '0'),
                          0
                        );
                        const remaining = parseFloat(expenseAmount) - totalSplit;
                        return (
                          <>
                            <p className={isDarkTheme ? 'text-gray-400' : 'text-gray-600'}>
                              Total assigned:{' '}
                              <span className={`font-semibold ${isDarkTheme ? 'text-cyan-400' : 'text-gray-800'}`}>
                                ₹{totalSplit.toFixed(2)}
                              </span>
                            </p>
                            {Math.abs(remaining) > 0.01 && (
                              <p
                                className={`font-semibold ${
                                  remaining > 0
                                    ? isDarkTheme
                                      ? 'text-orange-400'
                                      : 'text-orange-600'
                                    : isDarkTheme
                                    ? 'text-red-400'
                                    : 'text-red-600'
                                }`}
                              >
                                {remaining > 0 ? 'Remaining' : 'Over'}: ₹{Math.abs(remaining).toFixed(2)}
                              </p>
                            )}
                            {Math.abs(remaining) <= 0.01 && (
                              <p className={`font-semibold ${isDarkTheme ? 'text-green-400' : 'text-green-600'}`}>
                                ✓ Split matches total
                              </p>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Support Message */}
            <div
              className={`p-3 rounded-lg border ${
                isDarkTheme
                  ? 'bg-gradient-to-r from-pink-900/30 to-red-900/30 border-pink-700'
                  : 'bg-gradient-to-r from-pink-50 to-red-50 border-pink-200'
              }`}
            >
              <button
                onClick={() => setShowSupportModal(true)}
                className={`w-full flex items-center justify-center gap-2 text-sm ${
                  isDarkTheme ? 'text-pink-300 hover:text-pink-200' : 'text-pink-700 hover:text-pink-800'
                } transition`}
              >
                <Heart className="w-4 h-4 fill-current" />
                <span>Like tracking expenses? Support us to keep SmartSplit free!</span>
              </button>
            </div>

            <button
              onClick={handleAddExpense}
              disabled={selectedParticipants.length === 0}
              className={`w-full py-2.5 sm:py-3 rounded-lg transition font-semibold text-sm sm:text-base ${
                selectedParticipants.length === 0
                  ? isDarkTheme
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : isDarkTheme
                    ? 'bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white'
                    : 'bg-teal-500 text-white hover:bg-teal-600'
              }`}
            >
              {isEditMode ? 'Update Expense' : 'Add Expense'}
            </button>

            {isEditMode && (
              <button
                onClick={cancelEditExpense}
                className="w-full bg-gray-300 text-gray-700 py-2.5 sm:py-3 rounded-lg hover:bg-gray-400 transition font-semibold text-sm sm:text-base"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Support Modal */}
        <SupportModal
          isDarkTheme={isDarkTheme}
          isOpen={showSupportModal}
          onClose={() => setShowSupportModal(false)}
          context="expense"
        />
      </div>
    </div>
  );
}
