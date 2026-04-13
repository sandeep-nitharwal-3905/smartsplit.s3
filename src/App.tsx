import { useState, useEffect, useRef } from 'react';
import HomePage from './components/HomePage';
import { NotificationToast } from './modules/app/components/NotificationToast';
import { FeedbackModal } from './modules/app/components/FeedbackModal';
import { AddExpenseView } from './modules/app/views/AddExpenseView';
import { AddFriendView } from './modules/app/views/AddFriendView';
import { AddGroupView } from './modules/app/views/AddGroupView';
import { DashboardView } from './modules/app/views/DashboardView';
import { GroupDetailView } from './modules/app/views/GroupDetailView';
import { LoginView } from './modules/app/views/LoginView';
import { ResetPasswordView } from './modules/app/views/ResetPasswordView';
import { ManageMembersView } from './modules/app/views/ManageMembersView';
import { UserProfileView } from './modules/app/views/UserProfileView';
import { AdminPanelView } from './modules/app/views/AdminPanelView';
import type { Group, User, Expense, Notification } from './modules/app/types';
import { onAuthStateChange, signUpUser, signInUser, logoutUser, signInWithGoogle, getCurrentUser, resetPassword, updatePassword } from './modules/auth/authService';
import {
  createGroup as createSupabaseGroup,
  getUserGroups,
  createExpense as createSupabaseExpense,
  updateExpense as updateSupabaseExpense,
  getGroupExpenses,
  getUserExpenses,
  deleteExpense as deleteSupabaseExpense,
  createSettlement as createSupabaseSettlement,
  getUserByEmail,
  getUsers,
  addFriend as addSupabaseFriend,
  getUserFriends,
  getGroup,
  updateGroup,
  deleteGroup as deleteSupabaseGroup,
  onUserGroupsChange,
  onGroupExpensesChange,
  onUserExpensesChange,
  upsertProfile,
  submitFeedback,
  getAllFeedbacks,
  isAdmin as checkIsAdmin,
  type Feedback,
  upsertPushSubscription,
  deletePushSubscription,
} from './modules/data';
import { supabase } from './modules/supabase/client';
import {
  getExistingPushSubscription,
  isInstalledPwa,
  isPushSupported,
  subscribeToPush,
} from './modules/push/pwaPush';

export default function ExpenseSplitApp() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState('home');
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  // All expenses involving the current user (participant or payer)
  // used on dashboard / overall balances.
  const [expenses, setExpenses] = useState<Expense[]>([]);
  // Expenses for the currently selected group (used on group detail)
  const [groupExpenses, setGroupExpenses] = useState<Expense[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Auth states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetPasswordSent, setResetPasswordSent] = useState(false);
  const [showResetPasswordForm, setShowResetPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordUpdated, setPasswordUpdated] = useState(false);

  // Expense form states
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [selectedPayer, setSelectedPayer] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [splitMode, setSplitMode] = useState<'equal' | 'unequal'>('equal');
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});

  // Group form states
  const [groupName, setGroupName] = useState('');
  const [groupMembers, setGroupMembers] = useState<string[]>([]);
  const [tempMemberEmail, setTempMemberEmail] = useState('');

  // Friend form state
  const [friendEmail, setFriendEmail] = useState('');
  const [memberCache, setMemberCache] = useState<Record<string, User>>({});
  
  // Group join states
  const [showJoinLinkModal, setShowJoinLinkModal] = useState(false);
  const [joinGroupId, setJoinGroupId] = useState('');

  // Group created success modal
  const [showGroupCreatedModal, setShowGroupCreatedModal] = useState(false);
  const [createdGroupId, setCreatedGroupId] = useState('');

  // Notification states
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const hasHydratedUserExpensesRef = useRef(false);
  const knownUserExpenseIdsRef = useRef<Set<string>>(new Set());

  // Edit expense states
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Edit group states
  const [isEditingGroupName, setIsEditingGroupName] = useState(false);
  const [editGroupName, setEditGroupName] = useState('');

  // Theme state
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const toggleTheme = () => {
    setIsDarkTheme(prev => {
      const next = !prev;
      try {
        localStorage.setItem('theme', next ? 'dark' : 'light');
      } catch {}
      return next;
    });
  };
  useEffect(() => {
    try {
      const stored = localStorage.getItem('theme');
      if (stored) setIsDarkTheme(stored === 'dark');
    } catch {}
  }, []);

  // Reset password sent state when modal is closed
  useEffect(() => {
    if (!showForgotPassword) {
      setResetPasswordSent(false);
    }
  }, [showForgotPassword]);

  // Feedback states
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    calculateBalances();
  }, [expenses, groupExpenses, selectedGroup, currentUser]);

  // Realtime updates for user's groups
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = onUserGroupsChange(currentUser.id, (updatedGroups) => {
      setGroups(updatedGroups as Group[]);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser]);

  // Realtime updates for user's expenses (all contexts)
  useEffect(() => {
    if (!currentUser) return;

    hasHydratedUserExpensesRef.current = false;
    knownUserExpenseIdsRef.current = new Set();

    const unsubscribe = onUserExpensesChange(currentUser.id, (updatedExpenses, changeMeta) => {
      const updated = updatedExpenses as Expense[];
      const nextIds = new Set(updated.map((e) => e.id));

      setExpenses(updated);
      loadUsersFromExpenses(updated);

      // Avoid firing toasts for the initial hydration snapshot.
      if (!hasHydratedUserExpensesRef.current) {
        hasHydratedUserExpensesRef.current = true;
        knownUserExpenseIdsRef.current = nextIds;
        return;
      }

      const previousIds = knownUserExpenseIdsRef.current;
      const newlyAdded = updated.filter((e) => !previousIds.has(e.id));
      knownUserExpenseIdsRef.current = nextIds;

      if (changeMeta?.eventType === 'INSERT' && newlyAdded.length > 0) {
        newlyAdded
          .filter((expense) => expense.createdBy !== currentUser.id)
          .slice(0, 2)
          .forEach((expense) => {
            const groupName = groups.find((g) => g.id === expense.groupId)?.name;
            const payerName = getUserName(expense.paidBy);
            addNotification({
              type: 'expense',
              message: `${payerName} added \"${expense.description}\" (Rs.${expense.amount.toFixed(2)})${groupName ? ` in ${groupName}` : ''}`,
            });
          });
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser, groups, memberCache, friends]);

  // Realtime updates for group expenses (when viewing a specific group)
  useEffect(() => {
    if (!selectedGroup) return;

    const unsubscribe = onGroupExpensesChange(selectedGroup.id, (updatedExpenses) => {
      setGroupExpenses(updatedExpenses as Expense[]);
      loadUsersFromExpenses(updatedExpenses as Expense[]);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [selectedGroup]);

  // Load expenses when selectedGroup changes
  useEffect(() => {
    if (selectedGroup) {
      loadGroupExpenses();
    } else if (currentUser && view === 'dashboard') {
      loadUserExpenses();
    }
  }, [selectedGroup, currentUser, view]);

  // Check if user is admin
  useEffect(() => {
    if (currentUser) {
      checkIsAdmin(currentUser.id).then(setIsAdmin);
    } else {
      setIsAdmin(false);
    }
  }, [currentUser]);

  useEffect(() => {
    setPushSupported(isPushSupported());
  }, []);

  useEffect(() => {
    const syncPushStatus = async () => {
      if (!currentUser || !isPushSupported()) {
        setPushEnabled(false);
        return;
      }

      try {
        const subscription = await getExistingPushSubscription();
        setPushEnabled(Boolean(subscription));
      } catch (error) {
        console.error('Failed to read push subscription:', error);
        setPushEnabled(false);
      }
    };

    syncPushStatus();
  }, [currentUser]);

  // Load feedbacks for admin
  useEffect(() => {
    if (isAdmin && view === 'admin') {
      loadFeedbacks();
    }
  }, [isAdmin, view]);

  // Authentication effect
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initAuth = async () => {
      try {
        const handleAuthUser = async (authUser: any | null) => {
          if (authUser) {
            const user: User = {
              id: authUser.uid,
              email: authUser.email || '',
              name: authUser.displayName || authUser.email?.split('@')[0] || 'User',
              createdAt: authUser.metadata.creationTime
            };

            setCurrentUser(user);

            // Load user data
            await loadUserData(user.id);
            await loadFriends(user.id);

            // Check for pending join parameter from sessionStorage
            try {
              const pendingJoin = sessionStorage.getItem('pendingJoin');
              if (pendingJoin) {
                sessionStorage.removeItem('pendingJoin');
                // Restore the join parameter to URL so the existing join handler picks it up
                const currentParams = new URLSearchParams(window.location.search);
                currentParams.set('join', pendingJoin);
                const newUrl = `${window.location.pathname}?${currentParams.toString()}${window.location.hash}`;
                window.history.replaceState(null, '', newUrl);
              }
            } catch (error) {
              console.error('Error restoring join parameter:', error);
            }

            navigateTo('dashboard');
            setLoading(false);
          } else {
            setCurrentUser(null);
            setGroups([]);
            setFriends([]);
            setExpenses([]);
            setGroupExpenses([]);
            navigateTo('home');
            setLoading(false);
          }
        };

        // 1) Check for an existing session/user on initial load (including OAuth redirect)
        try {
          const existingUser = await getCurrentUser();
          if (existingUser) {
            await handleAuthUser(existingUser);
          }
        } catch (e) {
          console.warn('Error getting current user on init:', e);
        }

        // 2) Subscribe to future auth state changes
        unsubscribe = onAuthStateChange(async (authUser) => {
          await handleAuthUser(authUser);
        });
      } catch (error) {
        console.error('Error initializing auth:', error);
        setLoading(false);
      }
    };

    initAuth();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Detect password reset from email link
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setShowResetPasswordForm(true);
      setView('login');
    }
  }, []);

  // Handle browser/mobile back button with hash-based routing
  useEffect(() => {
    const handleHashChange = () => {
      // While auth is still initializing, don't touch the hash.
      // Supabase needs to read and clear its own access_token hash first.
      if (loading) {
        return;
      }

      const rawHash = window.location.hash.replace('#', '');

      // Ignore Supabase auth hashes like #access_token=... or #error_description=...
      if (
        rawHash.startsWith('access_token') ||
        rawHash.startsWith('error_description') ||
        rawHash.startsWith('type=recovery')
      ) {
        return;
      }

      const hash = rawHash || 'home';
      
      // Map hash to view and handle state cleanup
      if (hash === 'login') {
        setView('login');
      } else if (hash === 'dashboard') {
        setView('dashboard');
      } else if (hash === 'profile') {
        setView('profile');
      } else if (hash === 'admin') {
        setView('admin');
      } else if (hash === 'groupDetail') {
        setView('groupDetail');
      } else if (hash === 'addExpense') {
        setView('addExpense');
      } else if (hash === 'addGroup') {
        setView('addGroup');
      } else if (hash === 'addFriend') {
        setView('addFriend');
      } else if (hash === 'manageGroupMembers') {
        setView('manageGroupMembers');
      } else if (hash === 'home') {
        // Clear sensitive state when going to home
        setSelectedGroup(null);
        setExpenses([]);
        setGroupExpenses([]);
        setView('home');
      } else {
        // For completely unknown hashes (that aren't Supabase-related),
        // normalize back to home.
        window.location.hash = 'home';
      }
    };

    // Handle initial load (after auth has had a chance to run once)
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [loading]);

  // Navigation helper to change hash (and thus view)
  const navigateTo = (newView: string) => {
    // When navigating to login from home page, preserve join parameter
    if (newView === 'login' && view === 'home') {
      try {
        const params = new URLSearchParams(window.location.search);
        const joinParam = params.get('join');
        if (joinParam) {
          sessionStorage.setItem('pendingJoin', joinParam);
        }
      } catch (error) {
        console.error('Error storing join parameter:', error);
      }
    }
    window.location.hash = newView;
  };

  // Handle invite links like ?join=<groupId>
  useEffect(() => {
    if (!currentUser) return;

    try {
      const search = window.location.search;
      if (!search) return;

      const params = new URLSearchParams(search);
      const joinParam = params.get('join');

      if (joinParam) {
        setJoinGroupId(joinParam);
        setShowJoinLinkModal(true);

        if (view !== 'dashboard') {
          navigateTo('dashboard');
        }

        // Clean the URL so the modal doesn't reopen unnecessarily
        params.delete('join');
        const newSearch = params.toString();
        const newUrl = `${window.location.pathname}${newSearch ? `?${newSearch}` : ''}${window.location.hash}`;
        window.history.replaceState(null, '', newUrl);
      }
    } catch (error) {
      console.error('Error handling join link:', error);
    }
  }, [currentUser, view]);

  const loadUserData = async (userId?: string) => {
    const uid = userId || currentUser?.id;
    if (!uid) return;
    
    try {
      const userGroups = await getUserGroups(uid);
      setGroups(userGroups as Group[]);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadFriends = async (userId?: string) => {
    const uid = userId || currentUser?.id;
    if (!uid) return;
    
    try {
      const userFriends = await getUserFriends(uid);
      setFriends(userFriends as User[]);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const loadUsersFromExpenses = async (expenseList: Expense[]) => {
    const userIds = new Set<string>();
    expenseList.forEach(expense => {
      userIds.add(expense.paidBy);
      expense.participants.forEach(p => userIds.add(p));
    });

    const cache = { ...memberCache };
    for (const userId of userIds) {
      if (!cache[userId] && userId !== currentUser?.id) {
        try {
          const users = await getUsers([userId]);
          if (users && users.length > 0) {
            cache[userId] = users[0] as User;
          }
        } catch (error) {
          console.error('Error loading user:', userId, error);
        }
      }
    }
    setMemberCache(cache);
  };

  const loadGroupMembers = async (group: Group) => {
    if (!group || !group.members || group.members.length === 0) return;
    
    const cache = { ...memberCache };
    const memberIdsToLoad = group.members.filter(
      memberId => memberId !== currentUser?.id && !cache[memberId] && !friends.find(f => f.id === memberId)
    );

    if (memberIdsToLoad.length === 0) return;

    try {
      const users = await getUsers(memberIdsToLoad);
      users.forEach(user => {
        cache[user.id] = user as User;
      });
      setMemberCache(cache);
    } catch (error) {
      console.error('Error loading group members:', error);
    }
  };

  const loadUserExpenses = async () => {
    if (!currentUser) return;
    
    try {
      const userExpenses = await getUserExpenses(currentUser.id);
      const normalizedExpenses = userExpenses as Expense[];
      setExpenses(normalizedExpenses);
      hasHydratedUserExpensesRef.current = true;
      knownUserExpenseIdsRef.current = new Set(normalizedExpenses.map((expense) => expense.id));
      await loadUsersFromExpenses(normalizedExpenses);
    } catch (error) {
      console.error('Error loading user expenses:', error);
    }
  };

  const loadGroupExpenses = async () => {
    if (!selectedGroup) return;
    
    try {
      const groupExpenses = await getGroupExpenses(selectedGroup.id);
      setGroupExpenses(groupExpenses as Expense[]);
      
      // Load user data for all participants in expenses
      await loadUsersFromExpenses(groupExpenses as Expense[]);
      
      // Also load group member profiles
      await loadGroupMembers(selectedGroup);
    } catch (error) {
      console.error('Error loading expenses:', error);
    }
  };

  const calculateBalances = () => {
    const balanceMap: Record<string, number> = {};
    const relevantExpenses = selectedGroup
      ? groupExpenses
      : expenses;

    relevantExpenses.forEach((expense) => {
      const payer = expense.paidBy;
      const participants = expense.participants;
      const getParticipantShare = (participantId: string): number => {
        if (expense.splitAmounts && expense.splitAmounts[participantId] != null) {
          return expense.splitAmounts[participantId];
        }
        return expense.amount / participants.length;
      };

      participants.forEach((participantId) => {
        if (participantId !== payer) {
          const shareAmount = getParticipantShare(participantId);
          // Use a delimiter that does not appear inside UUIDs
          // so we can safely split it later.
          const key = `${participantId}->${payer}`;
          const reverseKey = `${payer}->${participantId}`;

          if (balanceMap[reverseKey]) {
            balanceMap[reverseKey] -= shareAmount;
            if (Math.abs(balanceMap[reverseKey]) < 0.01) {
              delete balanceMap[reverseKey];
            }
          } else {
            balanceMap[key] = (balanceMap[key] || 0) + shareAmount;
          }
        }
      });
    });

    setBalances(balanceMap);
  };

  const addNotification = (payload: Omit<Notification, 'id' | 'timestamp'>) => {
    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const notification: Notification = {
      id,
      message: payload.message,
      type: payload.type,
      timestamp: Date.now(),
      variant: payload.variant,
    };

    setNotifications((prev) => [notification, ...prev].slice(0, 5));

    window.setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 6000);
  };

  const notifySuccess = (message: string, type: Notification['type'] = 'group') => {
    addNotification({ type, message, variant: 'success' });
  };

  const notifyError = (message: string, type: Notification['type'] = 'group') => {
    addNotification({ type, message, variant: 'error' });
  };

  const notify = (message: string, variant: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    addNotification({ type: 'group', message, variant });
  };

  const normalizeEmail = (value: string) => value.trim().toLowerCase();

  const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

  // Auth handlers
  const handleAuth = async () => {
    if (!email || !password) {
      notifyError('Please fill in all fields');
      return;
    }

    if (isSignUp && !name) {
      notifyError('Please enter your name');
      return;
    }

    try {
      if (isSignUp) {
        await signUpUser(email, password, name);
        setEmailVerificationSent(true);
        notifySuccess('Account created! Please check your email to verify your account.', 'group');
      } else {
        await signInUser(email, password);
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      notifyError(error.message || 'Authentication failed');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      // Supabase OAuth redirects to Google and back
      // Auth state change will be handled automatically on redirect
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      notifyError(error.message || 'Google sign-in failed');
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      notifyError('Please enter your email address');
      return;
    }

    try {
      await resetPassword(email);
      setResetPasswordSent(true);
      notifySuccess('Password reset email sent. Check your inbox.', 'group');
    } catch (error: any) {
      console.error('Password reset error:', error);
      notifyError(error.message || 'Failed to send password reset email');
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      notifyError('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      notifyError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      notifyError('Password must be at least 6 characters long');
      return;
    }

    try {
      await updatePassword(newPassword);
      setPasswordUpdated(true);
      setNewPassword('');
      setConfirmPassword('');
      
      // After 2 seconds, close the form and navigate to dashboard
      setTimeout(() => {
        setShowResetPasswordForm(false);
        setPasswordUpdated(false);
        navigateTo('dashboard');
      }, 2000);
    } catch (error: any) {
      console.error('Password update error:', error);
      notifyError(error.message || 'Failed to update password');
    }
  };


  const handleLogout = async () => {
    try {
      if (currentUser && isPushSupported()) {
        const existingSubscription = await getExistingPushSubscription();
        if (existingSubscription) {
          await deletePushSubscription(currentUser.id, existingSubscription.endpoint);
          await existingSubscription.unsubscribe();
          setPushEnabled(false);
        }
      }

      await logoutUser();
    } catch (error: any) {
      console.error('Logout error:', error);
      notifyError(error.message || 'Logout failed');
    }
  };

  const handleEnablePushNotifications = async () => {
    if (!currentUser) return;

    if (!isPushSupported()) {
      notifyError('Push notifications are not supported on this device/browser.');
      return;
    }

    if (!isInstalledPwa()) {
      const proceed = confirm('For best reliability on mobile, install SmartSplit as a PWA first. Continue enabling notifications now?');
      if (!proceed) return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        notifyError('Notification permission is required to receive alerts.');
        return;
      }

      const subscription = await subscribeToPush();
      await upsertPushSubscription(currentUser.id, subscription);
      setPushEnabled(true);

      notifySuccess('Push notifications enabled on this device.', 'group');
    } catch (error: any) {
      console.error('Failed to enable push notifications:', error);
      notifyError(error?.message || 'Failed to enable push notifications');
    }
  };

  const sendExpensePushNotification = async (expense: {
    description: string;
    amount: number;
    groupId: string | null;
  }, recipientUserIds: string[]) => {
    if (!currentUser || recipientUserIds.length === 0) return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) return;

      const groupName = expense.groupId
        ? groups.find((group) => group.id === expense.groupId)?.name || 'your group'
        : 'SmartSplit';

      await fetch('/api/push-notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          recipientUserIds,
          title: 'New expense added',
          body: `${currentUser.name} added \"${expense.description}\" (Rs.${expense.amount.toFixed(2)}) in ${groupName}.`,
          url: expense.groupId ? '/#groupDetail' : '/#dashboard',
        }),
      });
    } catch (error) {
      console.error('Failed to trigger expense push notifications:', error);
    }
  };

  const handleSubmitFeedback = async (feedbackData: { message: string; rating?: number }) => {
    const result = await submitFeedback(feedbackData);
    if (result.success) {
      notifySuccess('Thank you for your feedback!', 'group');
    } else {
      notifyError(result.error || 'Failed to submit feedback');
    }
  };

  const loadFeedbacks = async () => {
    const feedbackList = await getAllFeedbacks();
    setFeedbacks(feedbackList);
  };

  const handleAddGroup = async () => {
    if (!groupName.trim()) {
      notifyError('Please enter a group name');
      return;
    }

    if (!currentUser) return;

    try {
      const newGroup = {
        name: groupName,
        members: [currentUser.id, ...groupMembers],
        createdBy: currentUser.id,
        createdAt: new Date().toISOString()
      };

      const docRef = await createSupabaseGroup(newGroup);
      const createdGroup = { id: docRef.id, ...newGroup } as Group;
      
      setGroups([...groups, createdGroup]);
      setGroupName('');
      setGroupMembers([]);
      setCreatedGroupId(docRef.id);
      setShowGroupCreatedModal(true);
    } catch (error: any) {
      console.error('Error creating group:', error);
      notifyError(error.message || 'Failed to create group');
    }
  };

  const handleAddFriend = async () => {
    const email = normalizeEmail(friendEmail);
    if (!email) {
      notifyError('Please enter an email address');
      return;
    }

    if (!currentUser) return;

    try {
      const friendUser = await getUserByEmail(email);
      
      if (!friendUser) {
        notifyError('User not found. Make sure they have an account.');
        return;
      }

      if (friendUser.id === currentUser.id) {
        notifyError('You cannot add yourself as a friend');
        return;
      }

      if (friends.some(f => f.id === friendUser.id)) {
        notifyError('This user is already your friend');
        return;
      }

      await addSupabaseFriend(currentUser.id, friendUser.id);
      setFriends([...friends, friendUser as User]);
      setFriendEmail('');
      navigateTo('dashboard');
      notifySuccess('Friend added successfully!', 'group');
    } catch (error: any) {
      console.error('Error adding friend:', error);
      notifyError(error.message || 'Failed to add friend');
    }
  };

  const handleAddExpense = async () => {
    if (!expenseDesc.trim() || !expenseAmount || !selectedPayer || selectedParticipants.length === 0) {
      notifyError('Please fill in all fields');
      return;
    }

    const amount = parseFloat(expenseAmount);
    if (isNaN(amount) || amount <= 0) {
      notifyError('Please enter a valid amount');
      return;
    }

    if (!currentUser) return;

    let splitAmounts: Record<string, number> | undefined;
    
    if (splitMode === 'unequal') {
      splitAmounts = {};
      let totalCustom = 0;
      
      for (const participantId of selectedParticipants) {
        const customAmount = parseFloat(customSplits[participantId] || '0');
        if (isNaN(customAmount) || customAmount < 0) {
          notifyError('Please enter valid amounts for all participants');
          return;
        }
        splitAmounts[participantId] = customAmount;
        totalCustom += customAmount;
      }
      
      if (Math.abs(totalCustom - amount) > 0.01) {
        notifyError(`Split amounts (₹${totalCustom.toFixed(2)}) must equal the total (₹${amount.toFixed(2)})`);
        return;
      }
    }

    try {
      if (isEditMode && editingExpense) {
        // Update expense
        const updatedExpense = {
          description: expenseDesc,
          amount,
          paidBy: selectedPayer,
          participants: selectedParticipants,
          splitAmounts
        };

        await updateSupabaseExpense(editingExpense.id, updatedExpense);
        // Always reload from Supabase so we get the
        // latest splits/participants and keep everything
        // in sync with the backend source of truth.
        if (selectedGroup) {
          await loadGroupExpenses();
        } else if (currentUser) {
          await loadUserExpenses();
        }
        
        cancelEditExpense();
        notifySuccess('Expense updated successfully!', 'expense');
      } else {
        // Create new expense
        const newExpense = {
          description: expenseDesc,
          amount,
          paidBy: selectedPayer,
          participants: selectedParticipants,
          groupId: selectedGroup?.id || null,
          createdAt: new Date().toISOString(),
          createdBy: currentUser.id,
          splitAmounts
        };

        const docRef = await createSupabaseExpense(newExpense);
        const createdExpense = { id: docRef.id, ...newExpense } as Expense;

        const recipientUserIds = Array.from(
          new Set([...selectedParticipants, selectedPayer].filter((userId) => userId !== currentUser.id))
        );

        void sendExpensePushNotification(createdExpense, recipientUserIds);

        if (selectedGroup) {
          setGroupExpenses([...groupExpenses, createdExpense]);
        } else {
          setExpenses([...expenses, createdExpense]);
        }
        
        // Reset form
        setExpenseDesc('');
        setExpenseAmount('');
        setSelectedPayer('');
        setSelectedParticipants([]);
        setSplitMode('equal');
        setCustomSplits({});

        addNotification({
          type: 'expense',
          message: 'Expense added successfully. Associated members will be notified.',
          variant: 'success',
        });
        
        window.history.back();
        notifySuccess('Expense added successfully!', 'expense');
      }
    } catch (error: any) {
      console.error('Error with expense:', error);
      notifyError(error.message || 'Failed to save expense');
    }
  };

  const handleSettleUp = async (fromId: string, toId: string, amount: number) => {
    try {
      const settlement = {
        from: fromId,
        to: toId,
        amount,
        groupId: selectedGroup?.id || null,
        settledAt: new Date().toISOString()
      };
      
      await createSupabaseSettlement(settlement);
      
      // Create a settlement expense where the debtor (fromId) pays the creditor (toId)
      // This is recorded as an expense paid by the debtor with only the creditor as participant
      // This effectively cancels out the debt
      const newExpense = {
        description: `Settlement: ${getUserName(fromId)} paid ${getUserName(toId)}`,
        amount: amount,
        paidBy: fromId,
        participants: [toId], // Only the creditor is the participant (receiver)
        groupId: selectedGroup?.id || null,
        createdAt: new Date().toISOString(),
        createdBy: fromId,
        isSettlement: true
      };
      
      const docRef = await createSupabaseExpense(newExpense);
      const createdExpense = { id: docRef.id, ...newExpense } as Expense;

      if (selectedGroup) {
        setGroupExpenses([...groupExpenses, createdExpense]);
      } else {
        setExpenses([...expenses, createdExpense]);
      }
      
      // Reload expenses to ensure everything is up to date
      if (selectedGroup) {
        await loadGroupExpenses();
      } else {
        await loadUserExpenses();
      }
      
      notifySuccess('Settlement recorded successfully!', 'settlement');
    } catch (error) {
      console.error('Error settling up:', error);
      notifyError('Failed to settle up');
    }
  };

  const getUserName = (userId: string) => {
    if (userId === currentUser?.id) return 'You';
    
    // Check in friends first
    const friend = friends.find(u => u.id === userId);
    if (friend && friend.name) return friend.name;
    
    // Check in memberCache (for group members)
    const cachedMember = memberCache[userId];
    if (cachedMember && cachedMember.name) return cachedMember.name;
    
    // Return email if available, otherwise Unknown
    if (friend?.email) return friend.email.split('@')[0];
    if (cachedMember?.email) return cachedMember.email.split('@')[0];
    
    return 'Unknown User';
  };

  const formatDateTime = (dateInput: any) => {
    if (!dateInput) return 'Unknown date';
    
    let date: Date;
    
    // Handle Firebase Timestamp object
    if (dateInput.toDate && typeof dateInput.toDate === 'function') {
      date = dateInput.toDate();
    } 
    // Handle string format: "23 November 2025 at 21:47:07 UTC+5:30"
    else if (typeof dateInput === 'string') {
      const firebaseMatch = dateInput.match(/(\d+)\s+(\w+)\s+(\d+)\s+at\s+(\d+):(\d+):(\d+)/);
      if (firebaseMatch) {
        const [, day, monthName, year, hours, minutes, seconds] = firebaseMatch;
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                            'July', 'August', 'September', 'October', 'November', 'December'];
        const month = monthNames.indexOf(monthName);
        
        if (month !== -1) {
          date = new Date(parseInt(year), month, parseInt(day), 
                         parseInt(hours), parseInt(minutes), parseInt(seconds));
        } else {
          date = new Date(dateInput);
        }
      } else {
        // Try standard Date parsing (ISO format)
        date = new Date(dateInput);
      }
    } 
    // Handle Date object or timestamp
    else {
      date = new Date(dateInput);
    }
    
    // Check if date is invalid
    if (isNaN(date.getTime())) return 'Invalid date';
    
    const now = new Date();

    // Format date and time
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');

    // Show year only if different from current year
    const dateStr = year === now.getFullYear() 
      ? `${month} ${day}`
      : `${month} ${day}, ${year}`;
    
    return `${dateStr} at ${displayHours}:${displayMinutes} ${ampm}`;
  };

  const deleteExpense = async (expenseId: string) => {
    try {
      await deleteSupabaseExpense(expenseId);
      if (selectedGroup) {
        setGroupExpenses(groupExpenses.filter(e => e.id !== expenseId));
      } else {
        setExpenses(expenses.filter(e => e.id !== expenseId));
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      notifyError('Failed to delete expense');
    }
  };

  const startEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsEditMode(true);
    setExpenseDesc(expense.description);
    setExpenseAmount(expense.amount.toString());
    setSelectedPayer(expense.paidBy);
    setSelectedParticipants(expense.participants);
    
    if (expense.splitAmounts) {
      setSplitMode('unequal');
      const splits: Record<string, string> = {};
      Object.entries(expense.splitAmounts).forEach(([id, amount]) => {
        splits[id] = amount.toString();
      });
      setCustomSplits(splits);
    } else {
      setSplitMode('equal');
      setCustomSplits({});
    }
    
    navigateTo('addExpense');
  };

  const cancelEditExpense = () => {
    setEditingExpense(null);
    setIsEditMode(false);
    setExpenseDesc('');
    setExpenseAmount('');
    setSelectedPayer('');
    setSelectedParticipants([]);
    setSplitMode('equal');
    setCustomSplits({});
    window.history.back();
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      return;
    }
    
    try {
      await deleteSupabaseGroup(groupId);
      setGroups(groups.filter(g => g.id !== groupId));
      setSelectedGroup(null);
      setGroupExpenses([]);
      navigateTo('dashboard');
      notifySuccess('Group deleted successfully', 'group');
    } catch (error) {
      console.error('Error deleting group:', error);
      notifyError('Failed to delete group');
    }
  };

  const handleRenameGroup = async (newName: string) => {
    if (!selectedGroup || !newName.trim()) return;

    await updateGroup(selectedGroup.id, { name: newName });
    setSelectedGroup({ ...selectedGroup, name: newName });
    setGroups(groups.map((g) => (g.id === selectedGroup.id ? { ...g, name: newName } : g)));
  };

  const handleJoinGroup = async () => {
    const groupId = joinGroupId.trim();
    if (!groupId) {
      notifyError('Please enter a group ID');
      return;
    }

    if (!isUuid(groupId)) {
      notifyError('Please enter a valid group ID');
      return;
    }
    
    if (!currentUser) return;
    
    try {
      const groupData = await getGroup(groupId);
      
      if (!groupData) {
        notifyError('Group not found. Please check the group ID.');
        return;
      }
      
      const group = groupData as Group;
      
      // Check if already a member
      if (group.members.includes(currentUser.id)) {
        notifyError('You are already a member of this group');
        return;
      }
      
      // Add user to group
      const updatedMembers = [...group.members, currentUser.id];
      await updateGroup(groupId, { members: updatedMembers });
      
      // Update local state
      await loadUserData();
      setJoinGroupId('');
      setShowJoinLinkModal(false);
      notifySuccess(`Successfully joined ${group.name}!`, 'group');
    } catch (error) {
      console.error('Error joining group:', error);
      notifyError('Failed to join group');
    }
  };

  const copyGroupLink = (groupId: string) => {
    const link = `${window.location.origin}?join=${groupId}`;
    navigator.clipboard.writeText(link).then(() => {
      notifySuccess('Group link copied to clipboard!', 'group');
    }).catch(() => {
      notifyError('Failed to copy link. Group ID: ' + groupId);
    });
  };

  const copyGroupId = (groupId: string) => {
    navigator.clipboard.writeText(groupId).then(() => {
      notifySuccess('Group ID copied to clipboard!', 'group');
    }).catch(() => {
      notifyError('Failed to copy. Group ID: ' + groupId);
    });
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleUpdateProfile = async (newName: string) => {
    if (!currentUser) return;
    
    try {
      await upsertProfile({
        id: currentUser.id,
        email: currentUser.email,
        name: newName,
        createdAt: currentUser.createdAt,
      });
      
      setCurrentUser({ ...currentUser, name: newName });
      notifySuccess('Profile updated successfully!', 'group');
    } catch (error) {
      console.error('Error updating profile:', error);
      notifyError('Failed to update profile');
      throw error;
    }
  };

  // Loading screen
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkTheme ? 'bg-gradient-to-br from-purple-900 via-blue-900 to-cyan-900' : 'bg-gradient-to-br from-teal-400 to-blue-500'}`}>
        <div className={`text-2xl font-semibold ${isDarkTheme ? 'text-cyan-400' : 'text-white'}`}>Loading...</div>
      </div>
    );
  }

  // Home Page View (before login)
  if (view === 'home') {
    return (
      <>
        <HomePage onGetStarted={() => navigateTo('login')} />
        <NotificationToast notifications={notifications} isDarkTheme={isDarkTheme} onClose={removeNotification} />
      </>
    );
  }

  // Reset Password View (from email link)
  if (showResetPasswordForm) {
    return (
      <>
        <ResetPasswordView
          isDarkTheme={isDarkTheme}
          toggleTheme={toggleTheme}
          newPassword={newPassword}
          setNewPassword={setNewPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          handleUpdatePassword={handleUpdatePassword}
          passwordUpdated={passwordUpdated}
        />
        <NotificationToast notifications={notifications} isDarkTheme={isDarkTheme} onClose={removeNotification} />
      </>
    );
  }

  // Login/Signup View
  if (view === 'login') {
    return (
      <>
        <LoginView
          isDarkTheme={isDarkTheme}
          toggleTheme={toggleTheme}
          onBackToHome={() => navigateTo('home')}
          isSignUp={isSignUp}
          setIsSignUp={setIsSignUp}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          name={name}
          setName={setName}
          emailVerificationSent={emailVerificationSent}
          handleAuth={handleAuth}
          handleGoogleSignIn={handleGoogleSignIn}
          handleForgotPassword={handleForgotPassword}
          showForgotPassword={showForgotPassword}
          setShowForgotPassword={setShowForgotPassword}
          resetPasswordSent={resetPasswordSent}
        />
        <NotificationToast notifications={notifications} isDarkTheme={isDarkTheme} onClose={removeNotification} />
      </>
    );
  }

  // Dashboard View
  if (view === 'dashboard') {
    return (
      <>
        <DashboardView
          isDarkTheme={isDarkTheme}
          toggleTheme={toggleTheme}
          currentUser={currentUser}
          groups={groups}
          friends={friends}
          balances={balances}
          expenses={expenses}
          setView={navigateTo}
          setSelectedGroup={(group) => {
            setSelectedGroup(group);
            setIsEditingGroupName(false);
            setEditGroupName('');
          }}
          handleLogout={handleLogout}
          handleSettleUp={handleSettleUp}
          getUserName={getUserName}
          formatDateTime={formatDateTime}
          startEditExpense={startEditExpense}
          deleteExpense={deleteExpense}
          copyGroupLink={copyGroupLink}
          copyGroupId={copyGroupId}
          showJoinLinkModal={showJoinLinkModal}
          setShowJoinLinkModal={setShowJoinLinkModal}
          joinGroupId={joinGroupId}
          setJoinGroupId={setJoinGroupId}
          handleJoinGroup={handleJoinGroup}
          setShowFeedbackModal={setShowFeedbackModal}
          isAdmin={isAdmin}
          pushSupported={pushSupported}
          pushEnabled={pushEnabled}
          onEnablePushNotifications={handleEnablePushNotifications}
        />
        {showFeedbackModal && (
          <FeedbackModal
            isDarkTheme={isDarkTheme}
            onClose={() => setShowFeedbackModal(false)}
            onSubmit={handleSubmitFeedback}
            currentUser={currentUser}
          />
        )}
        <NotificationToast notifications={notifications} isDarkTheme={isDarkTheme} onClose={removeNotification} />
      </>
    );
  }

  // Admin Panel View
  if (view === 'admin') {
    if (!isAdmin) {
      // Redirect non-admin users
      navigateTo('dashboard');
      return null;
    }
    
    return (
      <>
        <AdminPanelView
          isDarkTheme={isDarkTheme}
          feedbacks={feedbacks}
          setView={navigateTo}
          formatDateTime={formatDateTime}
          onDeleteFeedback={loadFeedbacks}
          notify={notify}
        />
        <NotificationToast notifications={notifications} isDarkTheme={isDarkTheme} onClose={removeNotification} />
      </>
    );
  }

  // User Profile View
  if (view === 'profile') {
    return (
      <>
        <UserProfileView
          isDarkTheme={isDarkTheme}
          currentUser={currentUser}
          setView={navigateTo}
          onUpdateProfile={handleUpdateProfile}
        />
        <NotificationToast notifications={notifications} isDarkTheme={isDarkTheme} onClose={removeNotification} />
      </>
    );
  }

  // Group Detail View
  if (view === 'groupDetail' && selectedGroup) {
    return (
      <>
        <GroupDetailView
          isDarkTheme={isDarkTheme}
          currentUser={currentUser}
          selectedGroup={selectedGroup}
          balances={balances}
          expenses={groupExpenses}
          getUserName={getUserName}
          formatDateTime={formatDateTime}
          handleSettleUp={handleSettleUp}
          startEditExpense={startEditExpense}
          deleteExpense={deleteExpense}
          handleLogout={handleLogout}
          onBack={() => {
            setGroupExpenses([]);
            setSelectedGroup(null);
            setIsEditingGroupName(false);
            setEditGroupName('');
            window.history.back();
          }}
          onAddExpense={() => {
            if (selectedGroup) loadGroupMembers(selectedGroup);
            navigateTo('addExpense');
          }}
          onManageMembers={() => navigateTo('manageGroupMembers')}
          onCopyGroupLink={copyGroupLink}
          onCopyGroupId={copyGroupId}
          onDeleteGroup={handleDeleteGroup}
          isEditingGroupName={isEditingGroupName}
          editGroupName={editGroupName}
          setIsEditingGroupName={setIsEditingGroupName}
          setEditGroupName={setEditGroupName}
          onRenameGroup={handleRenameGroup}
        />
        <NotificationToast notifications={notifications} isDarkTheme={isDarkTheme} onClose={removeNotification} />
      </>
    );
  }

  // Add Group View
  if (view === 'addGroup') {
    return (
      <>
        <AddGroupView
          isDarkTheme={isDarkTheme}
          groupName={groupName}
          setGroupName={setGroupName}
          friends={friends}
          groupMembers={groupMembers}
          setGroupMembers={setGroupMembers}
          handleAddGroup={handleAddGroup}
          showGroupCreatedModal={showGroupCreatedModal}
          createdGroupId={createdGroupId}
          copyGroupLink={copyGroupLink}
          copyGroupId={copyGroupId}
          setShowGroupCreatedModal={setShowGroupCreatedModal}
          setView={navigateTo}
          onBack={() => window.history.back()}
        />
        <NotificationToast notifications={notifications} isDarkTheme={isDarkTheme} onClose={removeNotification} />
      </>
    );
  }

  // Manage Group Members View
  if (view === 'manageGroupMembers' && selectedGroup) {
    return (
      <>
        <ManageMembersView
          isDarkTheme={isDarkTheme}
          friends={friends}
          selectedGroup={selectedGroup}
          currentUser={currentUser}
          memberCache={memberCache}
          setMemberCache={setMemberCache}
          groups={groups}
          setGroups={setGroups}
          setSelectedGroup={(group) => {
            setSelectedGroup(group);
            if (group) loadGroupMembers(group);
            setIsEditingGroupName(false);
            setEditGroupName('');
          }}
          setFriends={setFriends}
          tempMemberEmail={tempMemberEmail}
          setTempMemberEmail={setTempMemberEmail}
          getUserByEmail={getUserByEmail}
          updateGroup={updateGroup}
          onBack={() => window.history.back()}
          notify={notify}
        />
        <NotificationToast notifications={notifications} isDarkTheme={isDarkTheme} onClose={removeNotification} />
      </>
    );
  }

  // Add Friend View
  if (view === 'addFriend') {
    return (
      <>
        <AddFriendView
          isDarkTheme={isDarkTheme}
          friendEmail={friendEmail}
          setFriendEmail={setFriendEmail}
          handleAddFriend={handleAddFriend}
          friends={friends}
          onBack={() => window.history.back()}
        />
        <NotificationToast notifications={notifications} isDarkTheme={isDarkTheme} onClose={removeNotification} />
      </>
    );
  }

  // Add Expense View
  if (view === 'addExpense') {
    return (
      <>
        <AddExpenseView
          isDarkTheme={isDarkTheme}
          selectedGroup={selectedGroup}
          currentUser={currentUser}
          friends={friends}
          memberCache={memberCache}
          selectedParticipants={selectedParticipants}
          setSelectedParticipants={setSelectedParticipants}
          setView={navigateTo}
          isEditMode={isEditMode}
          cancelEditExpense={cancelEditExpense}
          expenseDesc={expenseDesc}
          setExpenseDesc={setExpenseDesc}
          expenseAmount={expenseAmount}
          setExpenseAmount={setExpenseAmount}
          selectedPayer={selectedPayer}
          setSelectedPayer={setSelectedPayer}
          splitMode={splitMode}
          setSplitMode={setSplitMode}
          customSplits={customSplits}
          setCustomSplits={setCustomSplits}
          handleAddExpense={handleAddExpense}
        />
        <NotificationToast notifications={notifications} isDarkTheme={isDarkTheme} onClose={removeNotification} />
      </>
    );
  }

  return (
    <NotificationToast
      notifications={notifications}
      isDarkTheme={isDarkTheme}
      onClose={removeNotification}
    />
  );
}
