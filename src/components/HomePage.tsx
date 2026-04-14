import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ArrowRight,
  BarChart3,
  Bell,
  Check,
  CheckCircle,
  ChevronRight,
  Clock,
  Globe,
  IndianRupee,
  Lock,
  Menu,
  Shield,
  Smartphone,
  Star,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { LanguageToggle } from './LanguageToggle';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface HomePageProps {
  isAuthenticated: boolean;
  onPrimaryAction: () => void;
}

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

type InstallPlatform = 'ios' | 'android' | 'desktop' | 'other';

const getInstallPlatform = (): InstallPlatform => {
  if (typeof window === 'undefined') return 'other';

  const userAgent = window.navigator.userAgent || '';
  const isIos = /iPad|iPhone|iPod/.test(userAgent) || (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(userAgent);

  if (isIos) return 'ios';
  if (isAndroid) return 'android';
  return 'desktop';
};

const getInstallHelpText = (platform: InstallPlatform, hasPrompt: boolean) => {
  if (hasPrompt) {
    return 'Tap Install PWA to open the browser prompt. If it does not appear, try again after a few seconds.';
  }

  if (platform === 'ios') {
    return 'On iPhone or iPad, tap Share in Safari and then choose Add to Home Screen.';
  }

  if (platform === 'android') {
    return 'On Android, open the browser menu in Chrome or Edge and choose Install app or Add to Home screen.';
  }

  return 'On desktop browsers, open the browser menu and choose Install app, Install SmartSplit, or Create shortcut.';
};

export default function HomePage({ isAuthenticated, onPrimaryAction }: HomePageProps) {
  const checkStandalone = () =>
    window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(() => !checkStandalone());
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [isBlessingOpen, setIsBlessingOpen] = useState(false);
  const [celebrationParticles, setCelebrationParticles] = useState<CelebrationParticle[]>([]);
  const [blessingDrops, setBlessingDrops] = useState<BlessingDrop[]>([]);
  const [redirectSecondsLeft, setRedirectSecondsLeft] = useState(3);
  const onPrimaryActionRef = useRef(onPrimaryAction);
  const { t } = useTranslation();
  const installPlatform = getInstallPlatform();
  const navPrimaryActionLabel = isAuthenticated ? 'Go to Dashboard' : t('nav.getStarted');
  const heroPrimaryActionLabel = isAuthenticated ? 'Go to Dashboard' : 'Start Free Now';
  const ctaPrimaryActionLabel = isAuthenticated ? 'Go to Dashboard' : 'Create Free Account';

  const devotionalMessages = [
    'Jay Sharee Khatu Shyam',
    'Jay Sawaliya Saith ki Jay',
    'Jay Shree Ram',
    'Jay Shree Hanuman',
  ];

  const createCelebrationParticles = (): CelebrationParticle[] =>
    Array.from({ length: 24 }, (_, index) => ({
      id: Date.now() + index,
      left: Math.random() * 92 + 4,
      top: Math.random() * 72 + 12,
      size: Math.floor(Math.random() * 8) + 7,
      delay: Math.floor(Math.random() * 700),
      duration: Math.floor(Math.random() * 1200) + 1100,
      kind: index % 3 === 0 ? 'flower' : 'spark',
    }));

  const createBlessingDrops = (): BlessingDrop[] =>
    Array.from({ length: 18 }, (_, index) => ({
      id: Date.now() + 100 + index,
      left: Math.random() * 90 + 5,
      delay: Math.floor(Math.random() * 1200),
      duration: Math.floor(Math.random() * 2500) + 3800,
      size: Math.floor(Math.random() * 8) + 15,
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
    onPrimaryActionRef.current = onPrimaryAction;
  }, [onPrimaryAction]);

  useEffect(() => {
    if (!isAuthenticated) {
      setRedirectSecondsLeft(3);
      return;
    }

    setRedirectSecondsLeft(3);

    const countdown = window.setInterval(() => {
      setRedirectSecondsLeft((prev) => (prev > 1 ? prev - 1 : 1));
    }, 1000);

    const redirectTimer = window.setTimeout(() => {
      onPrimaryActionRef.current();
    }, 3000);

    return () => {
      window.clearInterval(countdown);
      window.clearTimeout(redirectTimer);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    document.title = 'SmartSplit - Split expenses smarter with friends, groups, and real-time balances';

    const description = 'Track group expenses, split bills fairly, settle faster, and keep every payment transparent with SmartSplit.';
    let descriptionTag = document.querySelector('meta[name="description"]');
    if (!descriptionTag) {
      descriptionTag = document.createElement('meta');
      descriptionTag.setAttribute('name', 'description');
      document.head.appendChild(descriptionTag);
    }
    descriptionTag.setAttribute('content', description);
  }, []);

  useEffect(() => {
    const isStandalone = checkStandalone();
    setShowInstallPrompt(!isStandalone);
    if (isStandalone) return;

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    const handleAppInstalled = () => {
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      setShowInstallHelp(false);
    };

    const handleVisibilityOrFocus = () => {
      if (checkStandalone()) {
        setShowInstallPrompt(false);
        setDeferredPrompt(null);
        setShowInstallHelp(false);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, []);

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

  const handleInstallPwa = async () => {
    if (checkStandalone()) {
      setShowInstallPrompt(false);
      setShowInstallHelp(false);
      return;
    }

    if (!deferredPrompt) {
      setShowInstallHelp((prev) => !prev);
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setShowInstallPrompt(false);
        setShowInstallHelp(false);
      }
    } catch {
      setShowInstallHelp(true);
    }

    setDeferredPrompt(null);
  };

  const highlights = [
    'Real-time group balances',
    'Equal and custom splits',
    'Invite link based groups',
    'Bank-grade auth with Supabase',
  ];

  const testimonials = [
    {
      name: 'Aviral Gupta',
      role: 'Trip Organizer',
      quote: 'We used SmartSplit for a 9-day trip. No arguments, no confusion, every rupee tracked clearly.',
    },
    {
      name: 'Anil Choudhary',
      role: 'Flatmate',
      quote: 'Rent, groceries, electricity - we finally stopped using messy spreadsheets.',
    },
    {
      name: 'Hariom Jaat',
      role: 'College Student',
      quote: 'Fastest expense app I have used. Adding and settling takes seconds.',
    },
  ];

  const faqs = [
    {
      q: 'Is SmartSplit free to use?',
      a: 'Yes. Core features are free, including group expense tracking, split calculations, and settlements.',
    },
    {
      q: 'Can I split expenses unequally?',
      a: 'Yes. Choose equal split or assign custom amounts per participant for any expense.',
    },
    {
      q: 'Can I use SmartSplit on mobile?',
      a: 'Yes. The app is mobile-ready and can be installed as a PWA for a native-like experience.',
    },
    {
      q: 'Is my data secure?',
      a: 'SmartSplit uses authenticated access, row-level access control, and secured backend flows for sensitive actions.',
    },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_#dff6ff_0%,_#f8fffb_45%,_#ffffff_100%)]">
      {isBlessingOpen && (
        <div
          className="fixed inset-0 z-[70] overflow-hidden cursor-pointer"
          onClick={dismissBlessingCelebration}
          role="button"
          aria-label="Close blessing celebration"
          title="Click anywhere to close"
        >
          <style>
            {`@keyframes blessingRainDrop { 0% { transform: translateY(-18vh) rotate(var(--rot)); opacity: 0; } 12% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateY(110vh) rotate(calc(var(--rot) * -1)); opacity: 0; } }
              @keyframes firecrackerPulse { 0% { transform: scale(0.5); opacity: 0; } 30% { opacity: 1; } 100% { transform: scale(1.8); opacity: 0; } }`}
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
                    animation: `firecrackerPulse ${particle.duration}ms ease-out infinite`,
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
                animation: `blessingRainDrop ${drop.duration}ms linear ${drop.delay}ms forwards`,
                ['--rot' as any]: `${drop.rotation}deg`,
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

      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-teal-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              type="button"
              onClick={triggerBlessingCelebration}
              className="group relative flex cursor-pointer items-center gap-2 rounded-xl border border-transparent px-2 py-1 transition hover:border-teal-200 hover:bg-white/80 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
              title="Tap for blessings"
              aria-label="Show random blessing celebration"
            >
              <img src="/logo.png" alt="SmartSplit Logo" className="h-8 w-8 sm:h-10 sm:w-10 transition-transform duration-300 hover:rotate-12" />
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
                {t('common.appName')}
              </span>
              <span className="absolute -right-2 -top-2 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm transition group-hover:scale-105">
                Tap
              </span>
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 animate-ping rounded-full bg-rose-400" />
            </button>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-700 hover:text-teal-600 transition-colors">Features</a>
              <a href="#why-smartsplit" className="text-gray-700 hover:text-teal-600 transition-colors">Why SmartSplit</a>
              <a href="#testimonials" className="text-gray-700 hover:text-teal-600 transition-colors">Reviews</a>
              <a href="#faq" className="text-gray-700 hover:text-teal-600 transition-colors">FAQ</a>
              <LanguageToggle className="" />
              <button
                onClick={onPrimaryAction}
                className="bg-gradient-to-r from-teal-500 to-blue-500 text-white px-6 py-2 rounded-full hover:from-teal-600 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl"
              >
                {navPrimaryActionLabel}
              </button>
            </div>

            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-3">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-gray-700 hover:text-teal-600 transition-colors py-2">Features</a>
              <a href="#why-smartsplit" onClick={() => setMobileMenuOpen(false)} className="block text-gray-700 hover:text-teal-600 transition-colors py-2">Why SmartSplit</a>
              <a href="#testimonials" onClick={() => setMobileMenuOpen(false)} className="block text-gray-700 hover:text-teal-600 transition-colors py-2">Reviews</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="block text-gray-700 hover:text-teal-600 transition-colors py-2">FAQ</a>
              <LanguageToggle className="w-full justify-center" />
              <button
                onClick={onPrimaryAction}
                className="w-full bg-gradient-to-r from-teal-500 to-blue-500 text-white px-6 py-2 rounded-full hover:from-teal-600 hover:to-blue-600 transition-all"
              >
                {navPrimaryActionLabel}
              </button>
            </div>
          )}
        </div>
      </nav>

      <header className="pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {isAuthenticated && (
            <div className="mb-6 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800 shadow-sm sm:flex sm:items-center sm:justify-between sm:text-base">
              <p>
                You are already signed in. Redirecting to dashboard in {redirectSecondsLeft}s.
              </p>
              <button
                onClick={onPrimaryAction}
                className="mt-2 inline-flex items-center rounded-full bg-teal-600 px-4 py-1.5 text-white transition hover:bg-teal-700 sm:mt-0"
              >
                Go Now
              </button>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-white border border-teal-200 text-teal-700 px-4 py-2 rounded-full text-sm font-semibold shadow-sm">
                <Star className="w-4 h-4 fill-current" />
                Trusted by students, roommates, and travelers
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 leading-tight">
                The smartest way to
                <span className="block bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent">
                  split every bill
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-xl">
                SmartSplit makes shared expenses simple: add bills, choose equal or custom splits,
                and instantly see who owes whom with complete transparency.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {highlights.map((item) => (
                  <div key={item} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm font-medium text-slate-700">
                    {item}
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={onPrimaryAction}
                  className="bg-gradient-to-r from-teal-500 to-blue-500 text-white px-8 py-4 rounded-full text-lg font-semibold hover:from-teal-600 hover:to-blue-600 transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 group"
                >
                  {heroPrimaryActionLabel}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="border-2 border-slate-300 text-slate-700 px-8 py-4 rounded-full text-lg font-semibold hover:border-teal-500 hover:text-teal-600 transition-all"
                >
                  See How It Works
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-4 sm:gap-8">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600" />
                  <span className="text-sm sm:text-base text-gray-600">100% Free</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600" />
                  <span className="text-sm sm:text-base text-gray-600">No Credit Card</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600" />
                  <span className="text-sm sm:text-base text-gray-600">Instant Setup</span>
                </div>
              </div>

              {showInstallPrompt && (
                <div className="rounded-3xl border border-teal-200 bg-white/90 p-4 sm:p-5 shadow-lg backdrop-blur-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-teal-500/10 p-2">
                        <Smartphone className="w-5 h-5 text-teal-600" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-base sm:text-lg">Install PWA for a better experience</p>
                        <p className="text-sm sm:text-base text-slate-600">
                          Save SmartSplit to your home screen for faster access and a smoother app-like experience.
                        </p>
                        <p className="mt-1 text-xs sm:text-sm font-medium text-teal-700">
                          Works on iPhone, Android, and desktop browsers.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <button
                        onClick={handleInstallPwa}
                        className="rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800"
                      >
                        {deferredPrompt ? 'Install PWA' : showInstallHelp ? 'Hide install steps' : 'See install steps'}
                      </button>
                      {deferredPrompt && (
                        <button
                          onClick={() => setShowInstallHelp((prev) => !prev)}
                          className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          {showInstallHelp ? 'Hide install steps' : 'How to install'}
                        </button>
                      )}
                    </div>
                  </div>

                  {showInstallHelp && (
                    <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                      <p>{getInstallHelpText(installPlatform, Boolean(deferredPrompt))}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-300 via-teal-300 to-blue-300 rounded-3xl blur-3xl opacity-25" />
              <div className="relative rounded-3xl border border-teal-100 bg-white p-3 shadow-2xl">
                <img
                  src="/Clean_UI_dashboard.png"
                  alt="SmartSplit dashboard showing balances and expenses"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  className="rounded-2xl w-full"
                />
              </div>
              <div className="absolute -bottom-3 left-4 sm:-left-8 rounded-2xl bg-slate-900 text-white px-4 py-3 shadow-xl max-w-[220px] sm:max-w-none">
                <p className="text-xs uppercase tracking-wider text-slate-300">Average setup time</p>
                <p className="text-lg sm:text-xl font-bold">Under 2 minutes</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-slate-500 mb-3">Built for modern shared life</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-sm sm:text-base">
            <div className="rounded-xl bg-slate-50 px-4 py-3 font-semibold text-slate-700">Roommates</div>
            <div className="rounded-xl bg-slate-50 px-4 py-3 font-semibold text-slate-700">Trips</div>
            <div className="rounded-xl bg-slate-50 px-4 py-3 font-semibold text-slate-700">Couples</div>
            <div className="rounded-xl bg-slate-50 px-4 py-3 font-semibold text-slate-700">Teams</div>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 mb-4">
              Everything you need to split money without friction
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Designed for clarity, speed, and trust so your group can focus on life, not calculations.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 to-white p-6 sm:p-8 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Smart group tracking</h3>
              <p className="text-slate-600">Create groups, invite members, and manage every shared bill in one clean timeline.</p>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-6 sm:p-8 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-4">
                <IndianRupee className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Equal and custom splits</h3>
              <p className="text-slate-600">Split instantly by default or assign exact amounts for edge cases like partial orders.</p>
            </div>

            <div className="rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50 to-white p-6 sm:p-8 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-cyan-500 rounded-xl flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Real-time balances</h3>
              <p className="text-slate-600">Know exactly who owes whom after each expense. No spreadsheet math required.</p>
            </div>

            <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-6 sm:p-8 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-violet-500 rounded-xl flex items-center justify-center mb-4">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Mobile notifications</h3>
              <p className="text-slate-600">Get notified for expense updates so your group stays synced even on busy days.</p>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-6 sm:p-8 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Fast by default</h3>
              <p className="text-slate-600">Quick add flows and clean navigation keep your workflow under a minute.</p>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-6 sm:p-8 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Secure architecture</h3>
              <p className="text-slate-600">Auth, access controls, and protected server routes keep sensitive data locked down.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="why-smartsplit" className="py-20 bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-3xl sm:text-5xl font-black mb-6">Why groups choose SmartSplit over alternatives</h2>
              <p className="text-slate-300 text-lg mb-8">
                Built around transparency and speed. Every transaction is visible, every balance is traceable.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3"><Check className="w-5 h-5 mt-1 text-teal-400" />Clear payer and participant mapping on every expense</li>
                <li className="flex items-start gap-3"><Check className="w-5 h-5 mt-1 text-teal-400" />Invite links so new members can join quickly</li>
                <li className="flex items-start gap-3"><Check className="w-5 h-5 mt-1 text-teal-400" />Settlement history for audit and trust</li>
                <li className="flex items-start gap-3"><Check className="w-5 h-5 mt-1 text-teal-400" />PWA support for mobile-first teams</li>
              </ul>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
              <h3 className="text-2xl font-bold mb-6">Performance snapshot</h3>
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-sm mb-1"><span>Average expense entry speed</span><span className="text-teal-300">Very fast</span></div>
                  <div className="h-2 bg-slate-800 rounded-full"><div className="h-2 rounded-full bg-teal-400 w-[92%]" /></div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1"><span>Split transparency</span><span className="text-teal-300">Excellent</span></div>
                  <div className="h-2 bg-slate-800 rounded-full"><div className="h-2 rounded-full bg-cyan-400 w-[95%]" /></div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1"><span>Mobile usability</span><span className="text-teal-300">Excellent</span></div>
                  <div className="h-2 bg-slate-800 rounded-full"><div className="h-2 rounded-full bg-blue-400 w-[93%]" /></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mb-4">
              Start splitting in three simple steps
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Built to remove awkward money conversations from your group life.
            </p>
          </div>

          <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Create your group</h3>
              <p className="text-gray-600 text-base sm:text-lg">Create a trip, flat, or event group and add friends in one tap.</p>
              <div className="mt-6">
                <img
                  src="/Friendly_illustration.png"
                  alt="Create group in SmartSplit"
                  loading="lazy"
                  decoding="async"
                  className="rounded-xl shadow-lg mx-auto w-48 h-48 object-cover"
                />
              </div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Add expenses instantly</h3>
              <p className="text-gray-600 text-base sm:text-lg">Enter payer, amount, and participants. Choose equal or custom splits.</p>
              <div className="mt-6">
                <img
                  src="/Minimalist_abstract.png"
                  alt="Add expenses in SmartSplit"
                  loading="lazy"
                  decoding="async"
                  className="rounded-xl shadow-lg mx-auto w-48 h-48 object-cover"
                />
              </div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Settle without confusion</h3>
              <p className="text-gray-600 text-base sm:text-lg">See net balances and settle clearly with full visibility for everyone.</p>
              <div className="mt-6">
                <img
                  src="/Abstract_pastel_grad.png"
                  alt="Settle up in SmartSplit"
                  loading="lazy"
                  decoding="async"
                  className="rounded-xl shadow-lg mx-auto w-48 h-48 object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="benefits" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mb-6">
                Built for everyday money collaboration
              </h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Save hours every month</h3>
                    <p className="text-sm sm:text-base text-gray-600">
                      Replace screenshots, notes, and manual calculations with one transparent source of truth.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <Smartphone className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Mobile-first experience</h3>
                    <p className="text-sm sm:text-base text-gray-600">
                      Open it on any device and keep your balances synced in real time.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <Lock className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Security-first design</h3>
                    <p className="text-sm sm:text-base text-gray-600">
                      Access controls and protected APIs keep your financial interactions private.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <Globe className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Global ready collaboration</h3>
                    <p className="text-sm sm:text-base text-gray-600">
                      Multi-language support and flexible group workflows make it friendly for diverse teams.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-3xl blur-3xl opacity-20" />
              <img
                src="/Clean_UI_dashboard.png"
                alt="SmartSplit app interface"
                loading="lazy"
                decoding="async"
                className="relative rounded-2xl shadow-2xl border-4 border-white"
              />
            </div>
          </div>
        </div>
      </section>

      <section id="testimonials" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 mb-3">Loved by real users</h2>
            <p className="text-slate-600 text-lg">Teams choose SmartSplit because it reduces confusion and saves time.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((item) => (
              <article key={item.name} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-1 mb-4 text-amber-500">
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                </div>
                <p className="text-slate-700 mb-5">"{item.quote}"</p>
                <div>
                  <p className="font-bold text-slate-900">{item.name}</p>
                  <p className="text-sm text-slate-500">{item.role}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 mb-3">Frequently asked questions</h2>
            <p className="text-slate-600 text-lg">Quick answers before your team gets started.</p>
          </div>
          <div className="space-y-4">
            {faqs.map((item) => (
              <details key={item.q} className="group rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 open:bg-white open:shadow-sm">
                <summary className="list-none cursor-pointer flex items-center justify-between font-semibold text-slate-900">
                  {item.q}
                  <ChevronRight className="w-5 h-5 text-slate-500 group-open:rotate-90 transition-transform" />
                </summary>
                <p className="mt-3 text-slate-600 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-gradient-to-r from-teal-600 to-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">
            Ready to make expense splitting effortless?
          </h2>
          <p className="text-lg sm:text-xl text-teal-100 mb-6 sm:mb-8">
            Join SmartSplit today and run your shared money life with confidence.
          </p>
          <button
            onClick={onPrimaryAction}
            className="bg-white text-teal-600 px-8 sm:px-10 py-3 sm:py-4 rounded-full text-base sm:text-lg font-bold hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl inline-flex items-center gap-2 group"
          >
            {ctaPrimaryActionLabel}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="text-sm sm:text-base text-teal-100 mt-4">
            No credit card required | Setup in minutes | Secure by design
          </p>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-300 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src="/logo.png" alt="SmartSplit Logo" className="h-8 w-8" />
                <span className="text-xl font-bold text-white">{t('common.appName')}</span>
              </div>
              <p className="text-gray-400">
                Modern expense splitting for groups who value clarity, speed, and trust.
              </p>
            </div>

            <div>
              <h3 className="text-white font-bold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="hover:text-teal-400 transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-teal-400 transition-colors">How it works</a></li>
                <li><a href="#why-smartsplit" className="hover:text-teal-400 transition-colors">Why SmartSplit</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-bold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><a href="#faq" className="hover:text-teal-400 transition-colors">FAQ</a></li>
                <li><a href="#testimonials" className="hover:text-teal-400 transition-colors">User reviews</a></li>
                <li><a href="#benefits" className="hover:text-teal-400 transition-colors">Benefits</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-bold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="mailto:support@smartsplit.app" className="hover:text-teal-400 transition-colors">support@smartsplit.app</a></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2026 SmartSplit. All rights reserved.</p>
            <p>Built by S3 for transparent group money management.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
