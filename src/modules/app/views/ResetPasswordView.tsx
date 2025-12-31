import { IndianRupee, Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageToggle } from '../../../components/LanguageToggle';

interface ResetPasswordViewProps {
  isDarkTheme: boolean;
  toggleTheme: () => void;
  newPassword: string;
  setNewPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  handleUpdatePassword: () => void;
  passwordUpdated: boolean;
}

export function ResetPasswordView(props: ResetPasswordViewProps) {
  const { t } = useTranslation();
  const {
    isDarkTheme,
    toggleTheme,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    handleUpdatePassword,
    passwordUpdated,
  } = props;

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 ${
        isDarkTheme
          ? 'bg-gradient-to-br from-purple-900 via-blue-900 to-cyan-900'
          : 'bg-gradient-to-br from-teal-400 to-blue-500'
      }`}
    >
      <div className="fixed top-2 right-2 sm:top-4 sm:right-4 flex gap-2 z-50">
        <button
          onClick={toggleTheme}
          className={`p-2 sm:p-3 rounded-full shadow-lg transition-all ${
            isDarkTheme
              ? 'bg-cyan-500 text-gray-900 hover:bg-cyan-400'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          title={t('nav.switchToDark')}
        >
          {isDarkTheme ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
        </button>
        <LanguageToggle isDarkTheme={isDarkTheme} />
      </div>

      <div
        className={`rounded-lg shadow-2xl p-4 sm:p-8 w-full max-w-md ${
          isDarkTheme
            ? 'bg-gradient-to-br from-gray-900 to-gray-800 border border-cyan-500/30'
            : 'bg-white'
        }`}
      >
        <div className="text-center mb-8">
          <IndianRupee className={`w-16 h-16 mx-auto mb-2 ${isDarkTheme ? 'text-cyan-400' : 'text-teal-500'}`} />
          <h1
            className={`text-3xl font-bold ${
              isDarkTheme
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400'
                : 'text-gray-800'
            }`}
          >
            {t('auth.setNewPassword')}
          </h1>
        </div>

        <div className="space-y-4">
          {passwordUpdated ? (
            <div
              className={`p-3 border rounded-lg ${
                isDarkTheme
                  ? 'bg-green-900/30 border-green-500/50 text-green-200'
                  : 'bg-green-50 border-green-200 text-green-800'
              }`}
            >
              <p className="text-sm">
                ✅ {t('auth.passwordUpdated')}
              </p>
            </div>
          ) : (
            <>
              <input
                type="password"
                placeholder={t('auth.newPassword')}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                  isDarkTheme
                    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:ring-cyan-500'
                    : 'border-gray-300 focus:ring-teal-500'
                }`}
              />
              <input
                type="password"
                placeholder={t('auth.confirmPassword')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleUpdatePassword()}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                  isDarkTheme
                    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:ring-cyan-500'
                    : 'border-gray-300 focus:ring-teal-500'
                }`}
              />

              <button
                onClick={handleUpdatePassword}
                className={`w-full py-2 rounded-lg transition font-semibold ${
                  isDarkTheme
                    ? 'bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white'
                    : 'bg-teal-500 hover:bg-teal-600 text-white'
                }`}
              >
                {t('auth.updatePassword')}
              </button>
            </>
          )}
        </div>

        <div className={`text-center mt-6 pt-4 border-t ${isDarkTheme ? 'border-gray-700' : 'border-gray-200'}`}>
          <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
            Developed & designed with <span className="text-red-500">❤</span> by S3 (Sandeep Nitharwal)
          </p>
        </div>
      </div>
    </div>
  );
}
