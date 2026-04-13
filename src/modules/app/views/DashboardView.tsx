import { useEffect, useState } from 'react';
import { ArrowLeftRight, Bell, Link as LinkIcon, LogOut, MessageSquare, Moon, Sun, User, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Expense, Group, User as AppUser } from '../types';

interface CelebrationParticle {
  id: number;
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
  kind: 'flower' | 'spark';
}

interface BlessingDrop {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  rotation: number;
  message: string;
}

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
  setShowFeedbackModal: (value: boolean) => void;
  isAdmin: boolean;
  pushSupported: boolean;
  pushEnabled: boolean;
  onTogglePushNotifications: () => Promise<void>;
}

export function DashboardView(props: DashboardViewProps) {
  const { t, i18n } = useTranslation();
  const devotionalMessages = [
    'Jay Sharee Khatu Shyam',
    'Jay Sawaliya Saith ki Jay',
    'Jay Shree Ram',
    'Jay Shree Hanuman',
  ];
  const normalizedLanguage = (i18n.resolvedLanguage || i18n.language || 'en').toLowerCase();
  const isEnglish = normalizedLanguage.startsWith('en');
  const [isBlessingOpen, setIsBlessingOpen] = useState(false);
  const [celebrationParticles, setCelebrationParticles] = useState<CelebrationParticle[]>([]);
  const [blessingDrops, setBlessingDrops] = useState<BlessingDrop[]>([]);
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
    showJoinLinkModal,
    setShowJoinLinkModal,
    joinGroupId,
    setJoinGroupId,
    handleJoinGroup,
    setShowFeedbackModal,
    isAdmin,
    pushSupported,
    pushEnabled,
    onTogglePushNotifications,
  } = props;

  const createCelebrationParticles = (): CelebrationParticle[] =>
    Array.from({ length: 18 }, (_, index) => ({
      id: Date.now() + index,
      left: Math.random() * 92 + 4,
      top: Math.random() * 70 + 12,
      size: Math.floor(Math.random() * 7) + 6,
      delay: Math.floor(Math.random() * 650),
      duration: Math.floor(Math.random() * 1100) + 900,
      kind: index % 3 === 0 ? 'flower' : 'spark',
    }));

  const createBlessingDrops = (): BlessingDrop[] =>
    Array.from({ length: 14 }, (_, index) => ({
      id: Date.now() + 100 + index,
      left: Math.random() * 90 + 5,
      delay: Math.floor(Math.random() * 1200),
      duration: Math.floor(Math.random() * 2200) + 3400,
      size: Math.floor(Math.random() * 8) + 14,
      rotation: Math.floor(Math.random() * 30) - 15,
      message: devotionalMessages[Math.floor(Math.random() * devotionalMessages.length)],
    }));

  const triggerBlessingCelebration = () => {
    setIsBlessingOpen(true);
    setCelebrationParticles(createCelebrationParticles());
    setBlessingDrops(createBlessingDrops());
  };

  const dismissBlessingCelebration = () => {
    setIsBlessingOpen(false);
    setCelebrationParticles([]);
    setBlessingDrops([]);
  };

  useEffect(() => {
    if (!isBlessingOpen) return;

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        dismissBlessingCelebration();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isBlessingOpen]);

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
      {isBlessingOpen && (
        <div
          className="fixed inset-0 z-[70] overflow-hidden cursor-pointer"
          onClick={dismissBlessingCelebration}
          role="button"
          aria-label="Close blessing celebration"
          title="Click anywhere to close"
        >
          <style>
            {`@keyframes dashboardBlessingRainDrop { 0% { transform: translateY(-16vh) rotate(0deg); opacity: 0; } 12% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateY(110vh) rotate(8deg); opacity: 0; } }
              @keyframes dashboardFirecrackerPulse { 0% { transform: scale(0.5); opacity: 0; } 30% { opacity: 1; } 100% { transform: scale(1.8); opacity: 0; } }`}
          </style>
          <div className="absolute inset-0 bg-gradient-to-b from-amber-100/65 via-white/20 to-rose-100/65 backdrop-blur-[2px]" />

          {celebrationParticles.map((particle) => (
            <div
              key={particle.id}
              className="absolute pointer-events-none"
              style={{
                left: `${particle.left}%`,
                top: `${particle.top}%`,
                animationDelay: `${particle.delay}ms`,
              }}
            >
              {particle.kind === 'spark' ? (
                <div
                  className="rounded-full bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400 shadow-lg shadow-amber-300/60"
                  style={{
                    width: `${particle.size}px`,
                    height: `${particle.size}px`,
                    animation: `dashboardFirecrackerPulse ${particle.duration}ms ease-out infinite`,
                  }}
                />
              ) : (
                <div className="relative animate-bounce" style={{ animationDuration: `${particle.duration}ms` }}>
                  <span className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-pink-300/90" />
                  <span className="absolute left-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-rose-300/90" />
                  <span className="absolute right-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-fuchsia-300/90" />
                  <span className="absolute bottom-0 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-pink-200/90" />
                  <span className="block h-2.5 w-2.5 rounded-full bg-amber-300/90" />
                </div>
              )}
            </div>
          ))}

          {blessingDrops.map((drop) => (
            <div
              key={drop.id}
              className="absolute pointer-events-none"
              style={{
                left: `${drop.left}%`,
                top: '-14vh',
                animation: `dashboardBlessingRainDrop ${drop.duration}ms linear ${drop.delay}ms forwards`,
              }}
            >
              <div
                className="rounded-full border border-orange-200/70 bg-white/85 px-4 py-2 font-bold text-orange-700 shadow-lg backdrop-blur-sm"
                style={{ fontSize: `${drop.size}px`, transform: `rotate(${drop.rotation}deg)` }}
              >
                {drop.message}
              </div>
            </div>
          ))}

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative w-40 sm:w-48 md:w-56 rounded-3xl border border-amber-300/50 bg-white/30 p-2 shadow-2xl backdrop-blur-[1px] opacity-45">
              <img
                src="/KhatuShyam.png"
                alt="Khatu Shyam"
                className="w-full rounded-2xl border border-amber-100/70 shadow-sm"
              />
              <div className="absolute -inset-3 -z-10 rounded-3xl bg-gradient-to-r from-amber-300/25 via-rose-300/15 to-orange-300/25 blur-2xl" />
            </div>
          </div>

          <div className="absolute left-1/2 top-8 -translate-x-1/2 rounded-full border border-amber-300/80 bg-white/95 px-5 py-2 text-xs sm:text-sm font-semibold text-slate-700 shadow-lg pointer-events-none">
            Celebration mode. Click anywhere to close.
          </div>
        </div>
      )}

      <nav
        className={`p-3 sm:p-4 shadow-lg ${
          isDarkTheme ? 'bg-gradient-to-r from-purple-900 to-cyan-900' : 'bg-teal-500'
        } text-white`}
      >
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <button
            type="button"
            onClick={triggerBlessingCelebration}
            className="group relative flex cursor-pointer items-center rounded-xl border border-transparent px-2 py-1 text-lg sm:text-2xl font-bold transition hover:border-white/40 hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            title="Tap for blessings"
            aria-label="Show random blessing celebration"
          >
            {t('common.appName')}
            <span className="absolute -right-2 -top-2 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm transition group-hover:scale-105">
              Tap
            </span>
            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 animate-ping rounded-full bg-rose-300" />
          </button>
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded transition ${isDarkTheme ? 'hover:bg-cyan-700' : 'hover:bg-teal-600'}`}
              title={isDarkTheme ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkTheme ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
            <button
              onClick={() => i18n.changeLanguage(isEnglish ? 'hi' : 'en')}
              className={`px-2 py-1 rounded transition text-xs font-semibold ${isDarkTheme ? 'hover:bg-cyan-700 bg-cyan-600' : 'hover:bg-teal-600 bg-teal-400'}`}
              title="Change Language / भाषा बदलें"
            >
              {isEnglish ? 'हि' : 'EN'}
            </button>
            <button
              onClick={() => setView('profile')}
              className={`flex items-center gap-2 px-3 py-2 rounded transition ${
                isDarkTheme ? 'hover:bg-cyan-700' : 'hover:bg-teal-600'
              }`}
              title="View Profile"
            >
              <User className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none hidden sm:inline">
                {currentUser?.name}
              </span>
            </button>
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
              <div className="font-bold text-lg">{t('addGroup.createGroup')}</div>
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
              <div className="font-bold text-lg">{t('dashboard.joinGroup')}</div>
              <div className="text-xs opacity-90">Enter group ID or link</div>
            </div>
          </button>

          {pushSupported && !pushEnabled && (
            <button
              onClick={onTogglePushNotifications}
              className={`sm:col-span-2 p-4 rounded-lg shadow-lg transition-all flex items-center justify-center gap-3 text-white ${
                isDarkTheme
                  ? 'bg-gradient-to-r from-cyan-700 to-blue-700 hover:from-cyan-600 hover:to-blue-600'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600'
              }`}
            >
              <Bell className="w-6 h-6" />
              <div className="text-left">
                <div className="font-bold text-base sm:text-lg">Enable mobile notifications</div>
                <div className="text-xs opacity-90">Get expense alerts even when the app is closed.</div>
              </div>
            </button>
          )}

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
              {t('dashboard.welcomeTitle')}
            </h3>
            <p
              className={`text-xs sm:text-sm mb-1.5 sm:mb-2 ${isDarkTheme ? 'text-cyan-200' : 'text-blue-800'}`}
            >
              {t('dashboard.welcomeDescription')}
            </p>
            <ul className={`text-xs sm:text-sm space-y-1 ml-4 list-disc ${isDarkTheme ? 'text-cyan-100' : 'text-blue-700'}`}>
              <li>
                <strong>{t('dashboard.createGroupLabel')}</strong> {t('dashboard.createGroupDesc')}
              </li>
              <li>
                <strong>{t('dashboard.joinGroupLabel')}</strong> {t('dashboard.joinGroupDesc')}
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
            {userBalanceEntries.length === 0 ? (
              <p className={`text-sm sm:text-base ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>All settled up!</p>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {userBalanceEntries.map(([key, amount]) => {
                  // New keys use '->' as delimiter; fall back to '-' for any legacy keys
                  const [fromId, toId] = key.includes('->') ? key.split('->') : key.split('-');
                  return (
                    <div
                      key={key}
                      className={`p-2.5 sm:p-3 rounded ${isDarkTheme ? 'bg-gray-700' : 'bg-gray-50'}`}
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 mb-2">
                        <span className={`text-xs sm:text-sm ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                          {fromId === currentUser?.id 
                            ? `${t('dashboard.youOwe')} ${getUserName(toId)}`
                            : `${getUserName(fromId)} ${t('dashboard.owesYou')}`
                          }
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
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={() => setShowFeedbackModal(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition font-medium ${
              isDarkTheme
                ? 'bg-gray-800 hover:bg-gray-700 text-cyan-400 border border-gray-700'
                : 'bg-white hover:bg-gray-50 text-teal-600 border border-gray-300 shadow-sm'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Send Feedback
          </button>
          
          {isAdmin && (
            <button
              onClick={() => setView('admin')}
              className={`text-xs underline ${
                isDarkTheme ? 'text-gray-500 hover:text-gray-400' : 'text-gray-500 hover:text-gray-600'
              }`}
            >
              Admin Panel
            </button>
          )}
          
          <p className={`text-xs sm:text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
            Developed & designed with <span className="text-red-500">❤</span> by S3 (Sandeep Nitharwal)
          </p>
        </div>
      </footer>
    </div>
  );
}
