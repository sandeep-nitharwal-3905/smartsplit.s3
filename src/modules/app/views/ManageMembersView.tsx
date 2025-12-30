import type { Group, User } from '../types';

interface ManageMembersViewProps {
  isDarkTheme: boolean;
  friends: User[];
  selectedGroup: Group;
  currentUser: User | null;
  memberCache: Record<string, User>;
  setMemberCache: (cache: Record<string, User>) => void;
  groups: Group[];
  setGroups: (groups: Group[]) => void;
  setSelectedGroup: (group: Group) => void;
  tempMemberEmail: string;
  setTempMemberEmail: (value: string) => void;
  getUserByEmail: (email: string) => Promise<User | null>;
  updateGroup: (groupId: string, payload: Partial<Group>) => Promise<void>;
  onBack: () => void;
}

export function ManageMembersView(props: ManageMembersViewProps) {
  const {
    isDarkTheme,
    friends,
    selectedGroup,
    currentUser,
    memberCache,
    setMemberCache,
    groups,
    setGroups,
    setSelectedGroup,
    tempMemberEmail,
    setTempMemberEmail,
    getUserByEmail,
    updateGroup,
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
          <h1 className="text-lg sm:text-2xl font-bold">Manage Members</h1>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-3 sm:p-4 md:p-6">
        <div className={`rounded-lg shadow p-3 sm:p-4 md:p-6 ${isDarkTheme ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
          <div
            className={`mb-4 p-3 border rounded-lg ${
              isDarkTheme ? 'bg-blue-900/20 border-blue-500/30' : 'bg-blue-50 border-blue-200'
            }`}
          >
            <p className={`text-xs sm:text-sm ${isDarkTheme ? 'text-blue-300' : 'text-blue-800'}`}>
              💡 Add members to your group by selecting from your friends or adding new users by email.
            </p>
          </div>

          {friends.length > 0 && (
            <div className="mb-6">
              <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-gray-200' : 'text-gray-900'}`}>
                Add from Friends
              </label>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {friends.map((friend) => {
                  const isAdded = selectedGroup.members.includes(friend.id);
                  return (
                    <button
                      key={friend.id}
                      onClick={async () => {
                        if (!isAdded) {
                          const updatedMembers = [...selectedGroup.members, friend.id];
                          await updateGroup(selectedGroup.id, { members: updatedMembers });
                          setSelectedGroup({ ...selectedGroup, members: updatedMembers });
                          setGroups(groups.map((g) => (g.id === selectedGroup.id ? { ...g, members: updatedMembers } : g)));
                        }
                      }}
                      disabled={isAdded}
                      className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm transition ${
                        isAdded
                          ? isDarkTheme
                            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : isDarkTheme
                            ? 'bg-cyan-900 text-cyan-200 border-2 border-cyan-500 hover:bg-cyan-800'
                            : 'bg-teal-100 text-teal-700 border-2 border-teal-500 hover:bg-teal-200'
                      }`}
                    >
                      {isAdded ? '✓ Added' : `+ ${friend.name || friend.email}`}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mb-6">
            <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-gray-200' : 'text-gray-900'}`}>
              Add by Email
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                value={tempMemberEmail}
                onChange={(e) => setTempMemberEmail(e.target.value)}
                onKeyPress={async (e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (!tempMemberEmail || !currentUser) return;
                    try {
                      const user = await getUserByEmail(tempMemberEmail);
                      if (!user) {
                        alert('User not found');
                        return;
                      }
                      if (user.id === currentUser.id) {
                        alert('You cannot add yourself');
                        return;
                      }
                      if (selectedGroup.members.includes(user.id)) {
                        alert('User is already in the group');
                        return;
                      }
                      const updatedMembers = [...selectedGroup.members, user.id];
                      await updateGroup(selectedGroup.id, { members: updatedMembers });

                      setMemberCache({ ...memberCache, [user.id]: user as User });

                      const updatedGroup = { ...selectedGroup, members: updatedMembers };
                      setSelectedGroup(updatedGroup);
                      setGroups(groups.map((g) => (g.id === selectedGroup.id ? updatedGroup : g)));
                      setTempMemberEmail('');
                      alert('Member added successfully!');
                    } catch (error) {
                      console.error('Error adding member:', error);
                      alert('Failed to add member. Please try again.');
                    }
                  }
                }}
                placeholder="friend@example.com"
                className={`flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:border-transparent ${
                  isDarkTheme
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-cyan-500'
                    : 'border-gray-300 focus:ring-teal-500'
                }`}
              />
              <button
                onClick={async () => {
                  if (!tempMemberEmail || !currentUser) return;
                  try {
                    const user = await getUserByEmail(tempMemberEmail);
                    if (!user) {
                      alert('User not found');
                      return;
                    }
                    if (user.id === currentUser.id) {
                      alert('You cannot add yourself');
                      return;
                    }
                    if (selectedGroup.members.includes(user.id)) {
                      alert('User is already in the group');
                      return;
                    }
                    const updatedMembers = [...selectedGroup.members, user.id];
                    await updateGroup(selectedGroup.id, { members: updatedMembers });

                    setMemberCache({ ...memberCache, [user.id]: user as User });

                    const updatedGroup = { ...selectedGroup, members: updatedMembers };
                    setSelectedGroup(updatedGroup);
                    setGroups(groups.map((g) => (g.id === selectedGroup.id ? updatedGroup : g)));
                    setTempMemberEmail('');
                    alert('Member added successfully!');
                  } catch (error) {
                    console.error('Error adding member:', error);
                    alert('Failed to add member. Please try again.');
                  }
                }}
                className={`px-4 py-2 rounded-lg text-sm sm:text-base whitespace-nowrap transition ${
                  isDarkTheme
                    ? 'bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white'
                    : 'bg-teal-500 text-white hover:bg-teal-600'
                }`}
              >
                Add
              </button>
            </div>
          </div>

          <div>
            <h3 className={`font-semibold mb-2 sm:mb-3 text-sm sm:text-base ${isDarkTheme ? 'text-gray-200' : 'text-gray-900'}`}>
              Current Members ({selectedGroup.members.length})
            </h3>
            <div className="space-y-1.5 sm:space-y-2">
              {selectedGroup.members.map((memberId) => {
                let member: User;
                if (memberId === currentUser?.id && currentUser) {
                  member = currentUser;
                } else {
                  const friend = friends.find((f) => f.id === memberId);
                  const cached = memberCache[memberId];
                  member = friend || cached || { id: memberId, name: '', email: '', createdAt: '' };
                }
                const isCreator = memberId === selectedGroup.createdBy;
                const isCurrentUser = memberId === currentUser?.id;
                const displayName = isCurrentUser
                  ? currentUser.name
                  : member.name || (member.email ? member.email.split('@')[0] : 'Unknown User');
                return (
                  <div
                    key={memberId}
                    className={`flex justify-between items-center p-2.5 sm:p-3 rounded ${isDarkTheme ? 'bg-gray-700' : 'bg-gray-50'}`}
                  >
                    <div>
                      <p className={`font-medium text-sm sm:text-base truncate ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                        {displayName} {isCurrentUser && '(You)'} {isCreator && '👑'}
                      </p>
                      <p className={`text-xs truncate ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>{member.email}</p>
                    </div>
                    {!isCreator && selectedGroup.createdBy === currentUser?.id && (
                      <button
                        onClick={async () => {
                          if (confirm('Remove this member from the group?')) {
                            const updatedMembers = selectedGroup.members.filter((id) => id !== memberId);
                            await updateGroup(selectedGroup.id, { members: updatedMembers });
                            setSelectedGroup({ ...selectedGroup, members: updatedMembers });
                            setGroups(groups.map((g) => (g.id === selectedGroup.id ? { ...g, members: updatedMembers } : g)));
                          }
                        }}
                        className="text-red-500 text-xs sm:text-sm font-medium hover:text-red-700 flex-shrink-0"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
