import { ArrowLeft, IndianRupee, Moon, Sun } from 'lucide-react';

interface LoginViewProps {
  isDarkTheme: boolean;
  toggleTheme: () => void;
  onBackToHome: () => void;
  isSignUp: boolean;
  setIsSignUp: (value: boolean) => void;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  name: string;
  setName: (value: string) => void;
  emailVerificationSent: boolean;
  handleAuth: () => void;
  handleGoogleSignIn: () => void;
}

export function LoginView(props: LoginViewProps) {
  const {
    isDarkTheme,
    toggleTheme,
    onBackToHome,
    isSignUp,
    setIsSignUp,
    email,
    setEmail,
    password,
    setPassword,
    name,
    setName,
    emailVerificationSent,
    handleAuth,
    handleGoogleSignIn,
  } = props;

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 ${
        isDarkTheme
          ? 'bg-gradient-to-br from-purple-900 via-blue-900 to-cyan-900'
          : 'bg-gradient-to-br from-teal-400 to-blue-500'
      }`}
    >
      <button
        onClick={onBackToHome}
        className={`fixed top-2 left-2 sm:top-4 sm:left-4 p-2 sm:p-3 rounded-full shadow-lg transition-all z-50 ${
          isDarkTheme
            ? 'bg-cyan-500 text-gray-900 hover:bg-cyan-400'
            : 'bg-white text-gray-700 hover:bg-gray-100'
        }`}
        title="Back to Home"
      >
        <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>

      <button
        onClick={toggleTheme}
        className={`fixed top-2 right-2 sm:top-4 sm:right-4 p-2 sm:p-3 rounded-full shadow-lg transition-all z-50 ${
          isDarkTheme
            ? 'bg-cyan-500 text-gray-900 hover:bg-cyan-400'
            : 'bg-white text-gray-700 hover:bg-gray-100'
        }`}
        title={isDarkTheme ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {isDarkTheme ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
      </button>

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
            SmartSplit
          </h1>
          <p className={isDarkTheme ? 'text-gray-400' : 'text-gray-600'}>Split expenses with friends</p>
        </div>

        <div className="space-y-4">
          {isSignUp && (
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                isDarkTheme
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:ring-cyan-500'
                  : 'border-gray-300 focus:ring-teal-500'
              }`}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
              isDarkTheme
                ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:ring-cyan-500'
                : 'border-gray-300 focus:ring-teal-500'
            }`}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
              isDarkTheme
                ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:ring-cyan-500'
                : 'border-gray-300 focus:ring-teal-500'
            }`}
          />

          {emailVerificationSent && (
            <div
              className={`p-3 border rounded-lg ${
                isDarkTheme
                  ? 'bg-cyan-900/30 border-cyan-500/50 text-cyan-200'
                  : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}
            >
              <p className="text-sm">
                📧 Verification email sent! Please check your inbox or spam folder and verify your email before
                logging in.
              </p>
            </div>
          )}

          <button
            onClick={handleAuth}
            className={`w-full py-2 rounded-lg transition font-semibold ${
              isDarkTheme
                ? 'bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white'
                : 'bg-teal-500 hover:bg-teal-600 text-white'
            }`}
          >
            {isSignUp ? 'Sign Up' : 'Log In'}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className={`w-full border-t ${isDarkTheme ? 'border-gray-600' : 'border-gray-300'}`} />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className={`px-2 ${isDarkTheme ? 'bg-gradient-to-br from-gray-900 to-gray-800 text-gray-400' : 'bg-white text-gray-500'}`}>
                OR
              </span>
            </div>
          </div>

          <button
            onClick={handleGoogleSignIn}
            className={`w-full py-2 px-4 border rounded-lg transition font-semibold flex items-center justify-center gap-2 ${
              isDarkTheme
                ? 'bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>
        </div>

        <p className={`text-center mt-4 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className={`ml-2 font-semibold hover:underline ${isDarkTheme ? 'text-cyan-400' : 'text-teal-500'}`}
          >
            {isSignUp ? 'Log In' : 'Sign Up'}
          </button>
        </p>

        <div className={`text-center mt-6 pt-4 border-t ${isDarkTheme ? 'border-gray-700' : 'border-gray-200'}`}>
          <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
            Developed & designed with <span className="text-red-500">❤</span> by S3
          </p>
        </div>
      </div>
    </div>
  );
}
