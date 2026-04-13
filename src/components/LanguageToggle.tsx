import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface LanguageToggleProps {
  isDarkTheme?: boolean;
  className?: string;
}

export function LanguageToggle({ isDarkTheme = false, className = '' }: LanguageToggleProps) {
  const { i18n } = useTranslation();
  const normalizedLanguage = (i18n.resolvedLanguage || i18n.language || 'en').toLowerCase();
  const isEnglish = normalizedLanguage.startsWith('en');

  const toggleLanguage = () => {
    const newLang = isEnglish ? 'hi' : 'en';
    i18n.changeLanguage(newLang);
  };

  const currentLanguageLabel = isEnglish ? 'EN' : 'हि';

  return (
    <button
      onClick={toggleLanguage}
      className={`flex items-center gap-2 p-2 sm:p-3 rounded-full shadow-lg transition-all ${
        isDarkTheme
          ? 'bg-cyan-500 text-gray-900 hover:bg-cyan-400'
          : 'bg-white text-gray-700 hover:bg-gray-100'
      } ${className}`}
      title={isEnglish ? 'Switch to Hindi' : 'अंग्रेज़ी में बदलें'}
      aria-label={isEnglish ? 'Switch language to Hindi' : 'भाषा अंग्रेज़ी में बदलें'}
    >
      <Languages className="w-4 h-4 sm:w-5 sm:h-5" />
      <span className="text-xs sm:text-sm font-semibold">{currentLanguageLabel}</span>
    </button>
  );
}
