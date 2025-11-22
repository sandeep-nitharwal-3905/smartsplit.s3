import { useState, useEffect } from 'react';
import { Users, Plus, DollarSign, LogOut, Trash2, User, ArrowLeftRight } from 'lucide-react';
import { onAuthStateChange, signUpUser, signInUser, logoutUser } from './firebase/auth';
import { 
  createGroup as createFirebaseGroup, 
  getUserGroups, 
  createExpense as createFirebaseExpense,
  getGroupExpenses,
  getUserExpenses,
  deleteExpense as deleteFirebaseExpense,
  createSettlement as createFirebaseSettlement,
  getUserByEmail,
  getUsers
} from './firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db } from './firebase/config';
import { doc, setDoc } from 'firebase/firestore';

// Type definitions
interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

interface Group {
  id: string;
  name: string;
  members: string[];
  createdBy: string;
  createdAt: string;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  participants: string[];
  groupId: string | null;
  createdAt: string;
  createdBy?: string;
  isSettlement?: boolean;
}

export default function ExpenseSplitApp() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState('login');
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Auth states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  // Expense form states
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [selectedPayer, setSelectedPayer] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);

  // Group form states
  const [groupName, setGroupName] = useState('');
  const [groupMembers, setGroupMembers] = useState<string[]>([]);
  const [tempMemberEmail, setTempMemberEmail] = useState('');

  // Friend form state
  const [friendEmail, setFriendEmail] = useState('');
  const [memberCache, setMemberCache] = useState<Record<string, User>>({});

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        const userData: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || '',
          createdAt: firebaseUser.metadata.creationTime || ''
        };
        setCurrentUser(userData);
        setView('dashboard');
        setLoading(false);
      } else {
        setCurrentUser(null);
        setView('login');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadUserData();
      loadUserExpenses();
    }
  }, [currentUser]);

  const loadUserExpenses = async () => {
    if (!currentUser) return;
    try {
      const userExpenses = await getUserExpenses(currentUser.id);
      setExpenses(userExpenses as Expense[]);
    } catch (error) {
      console.error('Error loading expenses:', error);
    }
  };

  useEffect(() => {
    if (selectedGroup) {
      loadGroupExpenses();
      loadGroupMembers();
    }
  }, [selectedGroup]);

  const loadGroupMembers = async () => {
    if (!selectedGroup) return;
    
    try {
      const memberIds = selectedGroup.members.filter(id => id !== currentUser?.id && !memberCache[id]);
      if (memberIds.length > 0) {
        const members = await getUsers(memberIds);
        const newCache = { ...memberCache };
        members.forEach((member: any) => {
          if (member) {
            newCache[member.id] = member as User;
          }
        });
        setMemberCache(newCache);
      }
    } catch (error) {
      console.error('Error loading group members:', error);
    }
  };

  useEffect(() => {
    calculateBalances();
  }, [expenses, friends, selectedGroup]);

  const loadUserData = async () => {
    if (!currentUser) return;
    
    try {
      const userGroups = await getUserGroups(currentUser.id);
      setGroups(userGroups as Group[]);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadGroupExpenses = async () => {
    if (!selectedGroup) return;
    
    try {
      const groupExpenses = await getGroupExpenses(selectedGroup.id);
      setExpenses(groupExpenses as Expense[]);
    } catch (error) {
      console.error('Error loading expenses:', error);
    }
  };

  const calculateBalances = () => {
    const balanceMap: Record<string, number> = {};
    
    const relevantExpenses = selectedGroup 
      ? expenses.filter(e => e.groupId === selectedGroup.id)
      : expenses.filter(e => 
          currentUser && e.participants.includes(currentUser.id) && !e.groupId
        );

    relevantExpenses.forEach(expense => {
      const payer = expense.paidBy;
      const participants = expense.participants;
      const sharePerPerson = expense.amount / participants.length;

      participants.forEach(participantId => {
        if (participantId !== payer) {
          const key = `${participantId}-${payer}`;
          const reverseKey = `${payer}-${participantId}`;

          if (balanceMap[reverseKey]) {
            balanceMap[reverseKey] -= sharePerPerson;
            if (Math.abs(balanceMap[reverseKey]) < 0.01) {
              delete balanceMap[reverseKey];
            }
          } else {
            balanceMap[key] = (balanceMap[key] || 0) + sharePerPerson;
          }
        }
      });
    });

    setBalances(balanceMap);
  };

  const handleAuth = async () => {
    if (!email || !password) {
      alert('Please fill all fields');
      return;
    }
    
    try {
      if (isSignUp) {
        if (!name) {
          alert('Please enter your name');
          return;
        }
        const userCredential = await signUpUser(email, password);
        // Update profile with name
        await updateProfile(userCredential.user, { displayName: name });
        // Create user document in Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email,
          name,
          createdAt: new Date().toISOString()
        });
      } else {
        await signInUser(email, password);
      }
      
      setEmail('');
      setPassword('');
      setName('');
    } catch (error: any) {
      console.error('Auth error:', error);
      alert(error.message || 'Authentication failed');
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setCurrentUser(null);
      setView('login');
      setSelectedGroup(null);
      setGroups([]);
      setExpenses([]);
      setFriends([]);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleAddGroup = async () => {
    if (!groupName) {
      alert('Please enter group name');
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
      
      const docRef = await createFirebaseGroup(newGroup);
      setGroups([...groups, { id: docRef.id, ...newGroup }]);
      setGroupName('');
      setGroupMembers([]);
      setView('dashboard');
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Failed to create group');
    }
  };

  const addMemberToGroup = async () => {
    if (!tempMemberEmail || !currentUser) return;
    
    try {
      const user = await getUserByEmail(tempMemberEmail);
      if (user && user.id !== currentUser.id && !groupMembers.includes(user.id)) {
        setGroupMembers([...groupMembers, user.id]);
        setMemberCache({ ...memberCache, [user.id]: user as User });
        setTempMemberEmail('');
      } else {
        alert('User not found or already added');
      }
    } catch (error) {
      console.error('Error finding user:', error);
      alert('User not found');
    }
  };

  const handleAddFriend = async () => {
    if (!friendEmail) {
      alert('Please enter friend email');
      return;
    }
    
    if (!currentUser) return;
    
    try {
      const friend = await getUserByEmail(friendEmail);
      if (friend && friend.id !== currentUser.id) {
        setFriends([...friends, friend as User]);
        setFriendEmail('');
        setView('dashboard');
      } else {
        alert('Friend not found or invalid email.');
      }
    } catch (error) {
      console.error('Error finding friend:', error);
      alert('Friend not found');
    }
  };

  const handleAddExpense = async () => {
    if (!expenseDesc || !expenseAmount || !selectedPayer || selectedParticipants.length === 0) {
      alert('Please fill all fields and select participants');
      return;
    }
    
    if (!currentUser) return;
    
    try {
      const newExpense = {
        description: expenseDesc,
        amount: parseFloat(expenseAmount),
        paidBy: selectedPayer,
        participants: selectedParticipants,
        groupId: selectedGroup?.id || null,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.id
      };
      
      const docRef = await createFirebaseExpense(newExpense);
      setExpenses([...expenses, { id: docRef.id, ...newExpense }]);
      
      setExpenseDesc('');
      setExpenseAmount('');
      setSelectedPayer('');
      setSelectedParticipants([]);
      setView(selectedGroup ? 'groupDetail' : 'dashboard');
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Failed to add expense');
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
      
      await createFirebaseSettlement(settlement);
      
      const newExpense = {
        description: 'Settlement payment',
        amount,
        paidBy: fromId,
        participants: [fromId, toId],
        groupId: selectedGroup?.id || null,
        createdAt: new Date().toISOString(),
        isSettlement: true
      };
      
      const docRef = await createFirebaseExpense(newExpense);
      setExpenses([...expenses, { id: docRef.id, ...newExpense }]);
    } catch (error) {
      console.error('Error settling up:', error);
      alert('Failed to settle up');
    }
  };

  const getUserName = (userId: string) => {
    if (userId === currentUser?.id) return 'You';
    // Check in friends first
    const friend = friends.find(u => u.id === userId);
    if (friend) return friend.name;
    // Check in memberCache (for group members)
    const cachedMember = memberCache[userId];
    if (cachedMember) return cachedMember.name;
    // Return Unknown as fallback
    return 'Unknown';
  };

  const deleteExpense = async (expenseId: string) => {
    try {
      await deleteFirebaseExpense(expenseId);
      setExpenses(expenses.filter(e => e.id !== expenseId));
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Failed to delete expense');
    }
  };

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  // Login/Signup View
  if (view === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <DollarSign className="w-16 h-16 mx-auto text-teal-500 mb-2" />
            <h1 className="text-3xl font-bold text-gray-800">SplitEasy</h1>
            <p className="text-gray-600">Split expenses with friends</p>
          </div>
          
          <div className="space-y-4">
            {isSignUp && (
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
            <button
              onClick={handleAuth}
              className="w-full bg-teal-500 text-white py-2 rounded-lg hover:bg-teal-600 transition font-semibold"
            >
              {isSignUp ? 'Sign Up' : 'Log In'}
            </button>
          </div>
          
          <p className="text-center mt-4 text-gray-600">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-teal-500 ml-2 font-semibold hover:underline"
            >
              {isSignUp ? 'Log In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    );
  }

  // Dashboard View
  if (view === 'dashboard') {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-teal-500 text-white p-4 shadow-lg">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold">SplitEasy</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm">Welcome, {currentUser?.name}</span>
              <button onClick={handleLogout} className="p-2 hover:bg-teal-600 rounded">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto p-6">
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <button
              onClick={() => setView('addGroup')}
              className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition flex items-center justify-center gap-3"
            >
              <Users className="w-6 h-6 text-teal-500" />
              <span className="font-semibold">Create Group</span>
            </button>
            
            <button
              onClick={() => setView('addFriend')}
              className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition flex items-center justify-center gap-3"
            >
              <User className="w-6 h-6 text-teal-500" />
              <span className="font-semibold">Add Friend</span>
            </button>
            
            <button
              onClick={() => {
                setSelectedGroup(null);
                setView('addExpense');
              }}
              className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition flex items-center justify-center gap-3"
            >
              <Plus className="w-6 h-6 text-teal-500" />
              <span className="font-semibold">Add Expense</span>
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Your Groups
              </h2>
              {groups.length === 0 ? (
                <p className="text-gray-500">No groups yet. Create one to get started!</p>
              ) : (
                <div className="space-y-2">
                  {groups.map(group => (
                    <div
                      key={group.id}
                      onClick={() => {
                        setSelectedGroup(group);
                        setView('groupDetail');
                      }}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition"
                    >
                      <h3 className="font-semibold">{group.name}</h3>
                      <p className="text-sm text-gray-600">{group.members.length} members</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5" />
                Overall Balances
              </h2>
              {Object.keys(balances).length === 0 ? (
                <p className="text-gray-500">All settled up!</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(balances).map(([key, amount]) => {
                    const [fromId, toId] = key.split('-');
                    return (
                      <div key={key} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="text-sm">
                          {getUserName(fromId)} owes {getUserName(toId)}
                        </span>
                        <span className="font-bold text-teal-600">${amount.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Group Detail View
  if (view === 'groupDetail' && selectedGroup) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-teal-500 text-white p-4 shadow-lg">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button onClick={() => setView('dashboard')} className="hover:bg-teal-600 p-2 rounded">
                ← Back
              </button>
              <h1 className="text-2xl font-bold">{selectedGroup.name}</h1>
            </div>
            <button onClick={handleLogout} className="p-2 hover:bg-teal-600 rounded">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto p-6">
          <button
            onClick={() => setView('addExpense')}
            className="mb-6 w-full bg-teal-500 text-white py-3 rounded-lg hover:bg-teal-600 transition font-semibold flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Expense
          </button>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Group Balances</h2>
              {Object.keys(balances).length === 0 ? (
                <p className="text-gray-500">All settled up!</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(balances).map(([key, amount]) => {
                    const [fromId, toId] = key.split('-');
                    return (
                      <div key={key} className="p-3 bg-gray-50 rounded">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm">
                            {getUserName(fromId)} owes {getUserName(toId)}
                          </span>
                          <span className="font-bold text-teal-600">${amount.toFixed(2)}</span>
                        </div>
                        {fromId === currentUser?.id && (
                          <button
                            onClick={() => handleSettleUp(fromId, toId, amount)}
                            className="text-xs bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
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

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Recent Expenses</h2>
              {expenses.length === 0 ? (
                <p className="text-gray-500">No expenses yet.</p>
              ) : (
                <div className="space-y-2">
                  {expenses.map(expense => (
                    <div key={expense.id} className="p-3 border border-gray-200 rounded flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold">{expense.description}</h3>
                        <p className="text-sm text-gray-600">
                          Paid by {getUserName(expense.paidBy)}
                        </p>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <span className="font-bold text-teal-600">${expense.amount.toFixed(2)}</span>
                        <button
                          onClick={() => deleteExpense(expense.id)}
                          className="p-1 hover:bg-red-100 rounded"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
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

  // Add Group View
  if (view === 'addGroup') {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-teal-500 text-white p-4 shadow-lg">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <button onClick={() => setView('dashboard')} className="hover:bg-teal-600 p-2 rounded">
              ← Back
            </button>
            <h1 className="text-2xl font-bold">Create New Group</h1>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Group Name</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder="e.g., Roommates, Trip to Paris"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Add Members (Email)</label>
                <p className="text-xs text-gray-500 mb-2">
                  For demo: Create multiple accounts to add as members
                </p>
                <div className="flex gap-2 mb-2">
                  <input
                    type="email"
                    value={tempMemberEmail}
                    onChange={(e) => setTempMemberEmail(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addMemberToGroup()}
                    placeholder="friend@example.com"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                  <button
                    onClick={addMemberToGroup}
                    className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-1">
                  {groupMembers.map(memberId => {
                    const member = memberCache[memberId] || friends.find(f => f.id === memberId);
                    return (
                      <div key={memberId} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span>{member?.name || 'Unknown'}</span>
                        <button
                          onClick={() => setGroupMembers(groupMembers.filter(id => id !== memberId))}
                          className="text-red-500 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={handleAddGroup}
                className="w-full bg-teal-500 text-white py-3 rounded-lg hover:bg-teal-600 transition font-semibold"
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Add Friend View
  if (view === 'addFriend') {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-teal-500 text-white p-4 shadow-lg">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <button onClick={() => setView('dashboard')} className="hover:bg-teal-600 p-2 rounded">
              ← Back
            </button>
            <h1 className="text-2xl font-bold">Add Friend</h1>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Friend's Email</label>
                <input
                  type="email"
                  value={friendEmail}
                  onChange={(e) => setFriendEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddFriend()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder="friend@example.com"
                />
              </div>

              <button
                onClick={handleAddFriend}
                className="w-full bg-teal-500 text-white py-3 rounded-lg hover:bg-teal-600 transition font-semibold"
              >
                Add Friend
              </button>
            </div>

            <div className="mt-6">
              <h3 className="font-semibold mb-3">Your Friends</h3>
              {friends.length === 0 ? (
                <p className="text-gray-500">No friends added yet.</p>
              ) : (
                <div className="space-y-2">
                  {friends.map(friend => (
                    <div key={friend.id} className="p-3 border border-gray-200 rounded">
                      <p className="font-medium">{friend.name}</p>
                      <p className="text-sm text-gray-600">{friend.email}</p>
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

  // Add Expense View
  if (view === 'addExpense') {
    // Build available members list with proper user data
    let availableMembers: User[] = [];
    
    if (selectedGroup) {
      // For groups, get all members including current user
      availableMembers = selectedGroup.members.map(memberId => {
        if (memberId === currentUser?.id && currentUser) {
          return currentUser;
        }
        return memberCache[memberId] || friends.find(f => f.id === memberId) || {
          id: memberId,
          name: 'Loading...',
          email: '',
          createdAt: ''
        };
      });
    } else {
      // For non-group expenses, show current user and friends
      availableMembers = currentUser ? [currentUser, ...friends] : friends;
    }

    const handleSelectAll = () => {
      if (selectedParticipants.length === availableMembers.length) {
        setSelectedParticipants([]);
      } else {
        setSelectedParticipants(availableMembers.map(m => m.id));
      }
    };

    const allSelected = selectedParticipants.length === availableMembers.length && availableMembers.length > 0;

    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-teal-500 text-white p-4 shadow-lg">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <button 
              onClick={() => setView(selectedGroup ? 'groupDetail' : 'dashboard')} 
              className="hover:bg-teal-600 p-2 rounded"
            >
              ← Back
            </button>
            <h1 className="text-2xl font-bold">Add Expense</h1>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white rounded-lg shadow p-6">
            {selectedGroup && (
              <div className="mb-4 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                <p className="text-sm text-teal-800">
                  <strong>Group:</strong> {selectedGroup.name}
                </p>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <input
                  type="text"
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder="e.g., Dinner at restaurant"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Paid By</label>
                <select
                  value={selectedPayer}
                  onChange={(e) => setSelectedPayer(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Select payer</option>
                  {availableMembers.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.id === currentUser?.id ? 'You' : member.name || member.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium">Split Between</label>
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                  >
                    {allSelected ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="space-y-2 border border-gray-300 rounded-lg p-3 max-h-60 overflow-y-auto">
                  {availableMembers.length === 0 ? (
                    <p className="text-sm text-gray-500">No members available</p>
                  ) : (
                    availableMembers.map(member => (
                      <label key={member.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={selectedParticipants.includes(member.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedParticipants([...selectedParticipants, member.id]);
                            } else {
                              setSelectedParticipants(selectedParticipants.filter(id => id !== member.id));
                            }
                          }}
                          className="w-4 h-4 text-teal-600"
                        />
                        <span className="flex-1">
                          {member.id === currentUser?.id ? 'You' : (member.name || member.email || 'Loading...')}
                        </span>
                      </label>
                    ))
                  )}
                </div>
                {selectedParticipants.length > 0 && expenseAmount && (
                  <p className="text-sm text-gray-600 mt-2">
                    Each person pays: ${(parseFloat(expenseAmount) / selectedParticipants.length).toFixed(2)}
                  </p>
                )}
              </div>

              <button
                onClick={handleAddExpense}
                disabled={selectedParticipants.length === 0}
                className="w-full bg-teal-500 text-white py-3 rounded-lg hover:bg-teal-600 transition font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Add Expense
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}