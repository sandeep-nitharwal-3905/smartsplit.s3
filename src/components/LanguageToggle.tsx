import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface LanguageToggleProps {
  isDarkTheme?: boolean;
  className?: string;
}

export function LanguageToggle({ isDarkTheme = false, className = '' }: LanguageToggleProps) {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(newLang);
  };

  const currentLanguageLabel = i18n.language === 'en' ? 'EN' : 'हि';

  return (
    <button
      onClick={toggleLanguage}
      className={`flex items-center gap-2 p-2 sm:p-3 rounded-full shadow-lg transition-all ${
        isDarkTheme
          ? 'bg-cyan-500 text-gray-900 hover:bg-cyan-400'
          : 'bg-white text-gray-700 hover:bg-gray-100'
      } ${className}`}
      title={i18n.language === 'en' ? 'Switch to Hindi' : 'अंग्रेज़ी में बदलें'}
    >
      <Languages className="w-4 h-4 sm:w-5 sm:h-5" />
      <span className="text-xs sm:text-sm font-semibold">{currentLanguageLabel}</span>
    </button>
  );
}
