import { ArrowLeft, Mail, User as UserIcon, Save } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { User } from '../types';

interface UserProfileViewProps {
  isDarkTheme: boolean;
  currentUser: User | null;
  setView: (view: string) => void;
  onUpdateProfile: (name: string) => Promise<void>;
}

export function UserProfileView({
  isDarkTheme,
  currentUser,
  setView,
  onUpdateProfile,
}: UserProfileViewProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser?.name || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    
    try {
      setIsSaving(true);
      await onUpdateProfile(name.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setName(currentUser?.name || '');
    setIsEditing(false);
  };

  return (
    <div className={`min-h-screen ${isDarkTheme ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <nav
        className={`p-3 sm:p-4 shadow-lg ${
          isDarkTheme ? 'bg-gradient-to-r from-purple-900 to-cyan-900' : 'bg-teal-500'
        } text-white`}
      >
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button
            onClick={() => setView('dashboard')}
            className={`p-2 rounded transition ${
              isDarkTheme ? 'hover:bg-cyan-700' : 'hover:bg-teal-600'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg sm:text-2xl font-bold">{t('profile.userProfile')}</h1>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <div
          className={`p-6 sm:p-8 rounded-xl shadow-lg ${
            isDarkTheme ? 'bg-gray-800 text-white' : 'bg-white'
          }`}
        >
          {/* Profile Avatar */}
          <div className="flex justify-center mb-6">
            <div
              className={`w-24 h-24 rounded-full flex items-center justify-center ${
                isDarkTheme
                  ? 'bg-gradient-to-br from-purple-600 to-cyan-600'
                  : 'bg-gradient-to-br from-teal-400 to-teal-600'
              }`}
            >
              <UserIcon className="w-12 h-12 text-white" />
            </div>
          </div>

          {/* User Information */}
          <div className="space-y-6">
            {/* Name Field */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDarkTheme ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                <UserIcon className="w-4 h-4 inline mr-2" />
                {t('profile.name')}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full p-3 rounded-lg border ${
                    isDarkTheme
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-cyan-500'
                      : 'bg-white border-gray-300 focus:border-teal-500'
                  } focus:outline-none focus:ring-2 ${
                    isDarkTheme ? 'focus:ring-cyan-500' : 'focus:ring-teal-500'
                  }`}
                  placeholder="Enter your name"
                />
              ) : (
                <div
                  className={`p-3 rounded-lg ${
                    isDarkTheme ? 'bg-gray-700' : 'bg-gray-100'
                  }`}
                >
                  {currentUser?.name}
                </div>
              )}
            </div>

            {/* Email Field (Read-only) */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDarkTheme ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                <Mail className="w-4 h-4 inline mr-2" />
                {t('profile.email')}
              </label>
              <div
                className={`p-3 rounded-lg ${
                  isDarkTheme ? 'bg-gray-700' : 'bg-gray-100'
                }`}
              >
                {currentUser?.email}
              </div>
              <p
                className={`text-xs mt-1 ${
                  isDarkTheme ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                Email cannot be changed
              </p>
            </div>

            {/* Member Since */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDarkTheme ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Member Since
              </label>
              <div
                className={`p-3 rounded-lg ${
                  isDarkTheme ? 'bg-gray-700' : 'bg-gray-100'
                }`}
              >
                {currentUser?.createdAt
                  ? new Date(currentUser.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'N/A'}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={isSaving || !name.trim()}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition ${
                      isDarkTheme
                        ? 'bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700'
                        : 'bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700'
                    } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <Save className="w-5 h-5" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
                      isDarkTheme
                        ? 'bg-gray-700 hover:bg-gray-600'
                        : 'bg-gray-200 hover:bg-gray-300'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition ${
                    isDarkTheme
                      ? 'bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700'
                      : 'bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700'
                  } text-white`}
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
