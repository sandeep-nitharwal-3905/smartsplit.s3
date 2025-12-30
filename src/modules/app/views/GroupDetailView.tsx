import { Copy, LogOut, Plus, Share2, Trash2, Users, Heart } from 'lucide-react';
import { useState, useMemo } from 'react';
import type { Expense, Group, User } from '../types';
import { SupportModal } from '../components/SupportModal';

interface GroupDetailViewProps {
  isDarkTheme: boolean;
  currentUser: User | null;
  selectedGroup: Group;
  balances: Record<string, number>;
  expenses: Expense[];
  getUserName: (userId: string) => string;
  formatDateTime: (dateInput: any) => string;
  handleSettleUp: (fromId: string, toId: string, amount: number) => void;
  startEditExpense: (expense: Expense) => void;
  deleteExpense: (expenseId: string) => Promise<void>;
  handleLogout: () => void;
  onBack: () => void;
  onAddExpense: () => void;
  onManageMembers: () => void;
  onCopyGroupLink: (groupId: string) => void;
  onCopyGroupId: (groupId: string) => void;
  onDeleteGroup: (groupId: string) => void;
  isEditingGroupName: boolean;
  editGroupName: string;
  setIsEditingGroupName: (value: boolean) => void;
  setEditGroupName: (value: string) => void;
  onRenameGroup: (newName: string) => Promise<void>;
}

export function GroupDetailView(props: GroupDetailViewProps) {
  const {
    isDarkTheme,
    currentUser,
    selectedGroup,
    balances,
    expenses,
    getUserName,
    formatDateTime,
    handleSettleUp,
    startEditExpense,
    deleteExpense,
    handleLogout,
    onBack,
    onAddExpense,
    onManageMembers,
    onCopyGroupLink,
    onCopyGroupId,
    onDeleteGroup,
    isEditingGroupName,
    editGroupName,
    setIsEditingGroupName,
    setEditGroupName,
    onRenameGroup,
  } = props;

  const [showSupportModal, setShowSupportModal] = useState(false);

  // Helper to detect settlement-only expenses created via "Settle Up"
  const isSettlementExpense = (expense: Expense) => {
    if (expense.isSettlement) return true;

    const desc = expense.description?.trim().toLowerCase() || '';
    // Treat as a settlement only when it matches the exact prefix
    // pattern we generate in handleSettleUp (e.g. "Settlement: A paid B")
    return desc.startsWith('settlement:') || desc.startsWith('settle up:');
  };

  // Calculate total expenses for this group (excluding settlements) - memoized
  const totalGroupExpenses = useMemo(
    () =>
      expenses
        .filter((expense) => !isSettlementExpense(expense))
        .reduce((sum, expense) => sum + Number(expense.amount), 0),
    [expenses]
  );

  // Only show balances that involve the current user (either owes or will receive)
  const balanceEntries = Object.entries(balances);
  const userBalanceEntries = currentUser
    ? balanceEntries.filter(([key]) => {
        const [fromId, toId] = key.includes('->') ? key.split('->') : key.split('-');
        return fromId === currentUser.id || toId === currentUser.id;
      })
    : balanceEntries;

  return (
    <div className={`min-h-screen ${isDarkTheme ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <nav
        className={`p-3 sm:p-4 shadow-lg ${
          isDarkTheme
            ? 'bg-gradient-to-r from-purple-700 to-cyan-700 text-white'
            : 'bg-teal-500 text-white'
        }`}
      >
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-4 flex-1">
            <button onClick={onBack} className={`p-2 rounded ${isDarkTheme ? 'hover:bg-cyan-700' : 'hover:bg-teal-600'}`}>
              ← Back
            </button>
            {isEditingGroupName ? (
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <input
                  type="text"
                  value={editGroupName}
                  onChange={(e) => setEditGroupName(e.target.value)}
                  className={`flex-1 px-3 py-1 text-sm sm:text-base border border-white rounded text-white focus:outline-none focus:ring-2 focus:ring-white ${
                    isDarkTheme ? 'bg-cyan-600 placeholder-cyan-200' : 'bg-teal-600 placeholder-teal-200'
                  }`}
                  placeholder="Group name"
                />
                <button
                  onClick={async () => {
                    if (editGroupName.trim()) {
                      await onRenameGroup(editGroupName);
                      setIsEditingGroupName(false);
                    }
                  }}
                  className={`text-white p-1 rounded text-sm ${isDarkTheme ? 'hover:bg-cyan-600' : 'hover:bg-teal-600'}`}
                >
                  ✓
                </button>
                <button
                  onClick={() => {
                    setIsEditingGroupName(false);
                    setEditGroupName(selectedGroup.name);
                  }}
                  className={`text-white p-1 rounded text-sm ${isDarkTheme ? 'hover:bg-cyan-600' : 'hover:bg-teal-600'}`}
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-bold truncate">{selectedGroup.name}</h1>
                <button
                  onClick={() => {
                    setEditGroupName(selectedGroup.name);
                    setIsEditingGroupName(true);
                  }}
                  className={`p-1 rounded ${isDarkTheme ? 'hover:bg-cyan-700' : 'hover:bg-teal-600'}`}
                  title="Edit group name"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
          <button onClick={handleLogout} className={`p-2 rounded ${isDarkTheme ? 'hover:bg-cyan-700' : 'hover:bg-teal-600'}`}>
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
          <button
            onClick={onAddExpense}
            className={`flex-1 min-w-[140px] text-white py-2 sm:py-3 px-3 sm:px-4 rounded-lg transition font-semibold flex items-center justify-center gap-2 ${
              isDarkTheme
                ? 'bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700'
                : 'bg-teal-500 hover:bg-teal-600'
            }`}
          >
            <Plus className="w-5 h-5" />
            Add Expense
          </button>

          <button
            onClick={onManageMembers}
            className={`text-white py-2 sm:py-3 px-3 sm:px-4 rounded-lg transition font-semibold flex items-center gap-1 sm:gap-2 ${
              isDarkTheme ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-500 hover:bg-purple-600'
            }`}
            title="Manage members"
          >
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Members</span>
          </button>

          <button
            onClick={() => onCopyGroupLink(selectedGroup.id)}
            className={`text-white py-2 sm:py-3 px-3 sm:px-4 rounded-lg transition font-semibold flex items-center gap-1 sm:gap-2 ${
              isDarkTheme ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
            }`}
            title="Share group link"
          >
            <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Share</span>
          </button>

          <button
            onClick={() => onCopyGroupId(selectedGroup.id)}
            className={`text-white py-2 sm:py-3 px-3 sm:px-4 rounded-lg transition font-semibold flex items-center gap-1 sm:gap-2 ${
              isDarkTheme ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-500 hover:bg-gray-600'
            }`}
            title="Copy group ID"
          >
            <Copy className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">ID</span>
          </button>

          {selectedGroup.createdBy === currentUser?.id && (
            <button
              onClick={() => onDeleteGroup(selectedGroup.id)}
              className={`text-white py-2 sm:py-3 px-3 sm:px-4 rounded-lg transition font-semibold flex items-center gap-1 sm:gap-2 ${
                isDarkTheme ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'
              }`}
              title="Delete group"
            >
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          )}
        </div>

        {/* Support Banner */}
        {totalGroupExpenses > 0 && (
          <div
            className={`p-4 rounded-lg border ${
              isDarkTheme
                ? 'bg-gradient-to-r from-pink-900/20 to-red-900/20 border-pink-700/50'
                : 'bg-gradient-to-r from-pink-50 to-red-50 border-pink-200'
            }`}
          >
            <button
              onClick={() => setShowSupportModal(true)}
              className={`w-full flex flex-col sm:flex-row items-center justify-center gap-2 text-sm sm:text-base ${
                isDarkTheme ? 'text-pink-300 hover:text-pink-200' : 'text-pink-700 hover:text-pink-800'
              } transition`}
            >
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 fill-current" />
                <span className="font-medium">
                  Total expenses in this group: ₹{totalGroupExpenses.toFixed(2)}
                </span>
              </div>
              <span className="text-xs sm:text-sm">
                • Support us to keep tracking your expenses easy!
              </span>
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className={`rounded-lg shadow p-3 sm:p-4 md:p-6 ${isDarkTheme ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
            <h2 className={`text-lg sm:text-xl font-bold mb-3 sm:mb-4 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
              Group Balances
            </h2>
            {userBalanceEntries.length === 0 ? (
              <p className={`text-sm sm:text-base ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>All settled up!</p>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {userBalanceEntries.map(([key, amount]) => {
                  // New keys use '->' as delimiter; fall back to '-' for any legacy keys
                  const [fromId, toId] = key.includes('->') ? key.split('->') : key.split('-');
                  return (
                    <div key={key} className={`p-2.5 sm:p-3 rounded ${isDarkTheme ? 'bg-gray-700' : 'bg-gray-50'}`}>
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

          <div className={`rounded-lg shadow p-6 ${isDarkTheme ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
            <h2 className={`text-xl font-bold mb-4 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>Recent Expenses</h2>
            {expenses.length === 0 ? (
              <p className={isDarkTheme ? 'text-gray-400' : 'text-gray-500'}>No expenses yet.</p>
            ) : (
              <div className="space-y-2">
                {expenses.map((expense) => {
                  const userShare =
                    currentUser && expense.participants.includes(currentUser.id)
                      ? expense.splitAmounts && expense.splitAmounts[expense.participants[0]] !== undefined
                        ? expense.splitAmounts[currentUser.id] || 0
                        : expense.amount / expense.participants.length
                      : 0;

                  const isPayer = expense.paidBy === currentUser?.id;

                  return (
                    <div
                      key={expense.id}
                      className={`p-3 border rounded ${isDarkTheme ? 'border-gray-600 bg-gray-700/50' : 'border-gray-200'}`}
                    >
                      <div className="flex justify-between items-start gap-2 sm:gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-semibold truncate ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                            {expense.description}
                          </h3>
                          <div
                            className={`flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm ${
                              isDarkTheme ? 'text-gray-400' : 'text-gray-600'
                            }`}
                          >
                            <span>Paid by {getUserName(expense.paidBy)}</span>
                            <span className="hidden sm:inline">•</span>
                            <span className={`text-xs sm:text-sm ${isDarkTheme ? 'text-gray-500' : 'text-gray-500'}`}>
                              {formatDateTime(expense.createdAt)}
                            </span>
                          </div>

                          <div className="mt-1.5 sm:mt-2 space-y-1">
                            {isPayer ? (
                              <div className="text-xs sm:text-sm">
                                <span className={`font-medium ${isDarkTheme ? 'text-green-400' : 'text-green-600'}`}>
                                  You paid: ₹{expense.amount.toFixed(2)}
                                </span>
                                {expense.participants.length > 1 && (
                                  <span className={isDarkTheme ? 'text-gray-400' : 'text-gray-600'}>
                                    {' '}
                                    (Your share: ₹{userShare.toFixed(2)})
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="text-xs sm:text-sm">
                                <span className={`font-medium ${isDarkTheme ? 'text-orange-400' : 'text-orange-600'}`}>
                                  Your share: ₹{userShare.toFixed(2)}
                                </span>
                                <span className={isDarkTheme ? 'text-gray-400' : 'text-gray-600'}>
                                  {' '}
                                  of ₹{expense.amount.toFixed(2)}
                                </span>
                              </div>
                            )}
                          </div>

                          {expense.splitAmounts && (
                            <div className={`mt-1 text-xs ${isDarkTheme ? 'text-gray-500' : 'text-gray-500'}`}>
                              <span className="font-medium">Custom split:</span>
                              <span className="block sm:inline">
                                {expense.participants.map((pId, idx) => (
                                  <span key={pId}>
                                    {idx > 0 && ', '}
                                    {getUserName(pId)}: ₹{expense.splitAmounts![pId].toFixed(2)}
                                  </span>
                                ))}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 flex-shrink-0 self-start">
                          <button onClick={() => startEditExpense(expense)} className="p-1 hover:bg-blue-100 rounded" title="Edit expense">
                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button onClick={() => deleteExpense(expense.id)} className="p-1 hover:bg-red-100 rounded" title="Delete expense">
                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Support Modal */}
      <SupportModal
        isDarkTheme={isDarkTheme}
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(false)}
        context="group"
        totalAmount={totalGroupExpenses}
      />
    </div>
  );
}
