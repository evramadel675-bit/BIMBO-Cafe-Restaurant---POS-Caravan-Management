import React, { useState, useEffect } from 'react';
import { ActiveTab, POSSettings } from '../types/pos';
import { 
  Coffee, 
  Store, 
  BarChart3, 
  FileSpreadsheet, 
  Archive, 
  Volume2, 
  VolumeX, 
  Sparkles,
  UtensilsCrossed,
  Sun,
  Moon,
  Globe
} from 'lucide-react';
import { sound } from '../utils/sound';
import { HorizontalScrollContainer } from './HorizontalScrollContainer';
import { PWAInstallButton } from './PWAInstallButton';
import { Theme, Language, Translations } from '../utils/i18n';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  activeTableCount: number;
  todaySales: number;
  todayProfit: number;
  settings: POSSettings;
  setSettings: React.Dispatch<React.SetStateAction<POSSettings>>;
  theme: Theme;
  onToggleTheme: () => void;
  language: Language;
  onToggleLanguage: () => void;
  t: Translations;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  activeTableCount,
  todaySales,
  todayProfit,
  settings,
  setSettings,
  theme,
  onToggleTheme,
  language,
  onToggleLanguage,
  t,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('en-GB', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const toggleSound = () => {
    const nextState = !settings.soundEffects;
    sound.enabled = nextState;
    setSettings(prev => ({ ...prev, soundEffects: nextState }));
    if (nextState) sound.playTap();
  };

  const navItems = [
    {
      id: 'tables' as ActiveTab,
      label: t.tabTables,
      icon: UtensilsCrossed,
      badge: activeTableCount > 0 ? activeTableCount : null,
      badgeColor: 'bg-amber-500 text-stone-950 font-bold'
    },
    {
      id: 'takeaway' as ActiveTab,
      label: t.tabTakeaway,
      icon: Store,
      badge: null
    },
    {
      id: 'dashboard' as ActiveTab,
      label: t.tabDashboard,
      icon: BarChart3,
      badge: null
    },
    {
      id: 'menu' as ActiveTab,
      label: t.tabMenu,
      icon: Coffee,
      badge: null
    },
    {
      id: 'excel' as ActiveTab,
      label: t.tabExcel,
      icon: FileSpreadsheet,
      badge: null
    },
    {
      id: 'archive' as ActiveTab,
      label: t.tabArchive,
      icon: Archive,
      badge: null
    }
  ];

  return (
    <header className="bg-stone-900 border-b border-stone-800 text-stone-100 sticky top-0 z-40 shadow-xl">
      {/* Top Brand Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-20 border-b border-stone-800/80 gap-2 sm:gap-3">
          
          {/* Logo & Caravan Brand */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="relative shrink-0">
              <img 
                src="/logo-square.png" 
                alt="BIMBO Cafe & Restaurant Logo" 
                className="w-9 h-9 sm:w-14 sm:h-14 rounded-full object-cover ring-2 ring-amber-500/50 shadow-md sm:shadow-lg shadow-amber-500/25 bg-stone-900"
              />
              <span className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full bg-emerald-500 border-2 border-stone-900" title="POS Active" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-base sm:text-2xl font-black tracking-tight text-white flex items-center gap-1">
                  <span>BIMBO</span>
                  <span className="hidden sm:inline text-amber-400 font-serif font-normal italic text-sm sm:text-xl">Cafe & Restaurant</span>
                </h1>
                <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Sparkles className="w-3 h-3" /> {t.caravanPOS}
                </span>
              </div>
            </div>
          </div>

          {/* Real-time KPI summary & Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Sales Today widget */}
            <div className="hidden lg:flex items-center gap-3 bg-stone-950/60 border border-stone-800 rounded-xl px-3.5 py-1.5 shadow-inner">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-semibold">{t.todayRevenue}</span>
                <span className="text-sm font-bold text-amber-400 font-mono">
                  {todaySales.toLocaleString()} <span className="text-xs text-stone-400 font-sans">{t.currency}</span>
                </span>
              </div>
              <div className="w-px h-6 bg-stone-800" />
              <div>
                <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-semibold">{t.todayProfit}</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">
                  +{todayProfit.toLocaleString()} <span className="text-xs text-stone-400 font-sans">{t.currency}</span>
                </span>
              </div>
            </div>

            {/* Time */}
            <div className="text-right hidden sm:block">
              <span className="text-xs font-medium text-stone-300 block font-mono">{currentTime}</span>
              <span className="text-[11px] text-amber-500 font-medium">{t.caravanOnline}</span>
            </div>

            {/* In-App PWA Install Button */}
            <PWAInstallButton language={language} t={t} />

            {/* Language Toggle Button (Arabic / English) */}
            <button
              type="button"
              onClick={onToggleLanguage}
              title={language === 'en' ? 'التحويل إلى اللغة العربية (RTL)' : 'Switch to English (LTR)'}
              aria-label="Toggle language"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-200 hover:text-white transition border border-stone-700/60 shadow-sm cursor-pointer active:scale-95 text-xs font-bold"
            >
              <Globe className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{language === 'ar' ? 'English' : 'العربية'}</span>
            </button>

            {/* Dark / Light Theme Toggle Button */}
            <button
              type="button"
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'Switch to Light Theme (Soft Beige/Cream)' : 'Switch to Dark Theme (Charcoal/Amber)'}
              aria-label="Toggle theme"
              className="p-2.5 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-200 hover:text-white transition border border-stone-700/60 shadow-sm cursor-pointer active:scale-95"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-amber-600" />
              )}
            </button>

            {/* Sound toggle */}
            <button
              onClick={toggleSound}
              title={settings.soundEffects ? 'Mute sound effects' : 'Enable sound effects'}
              className="p-2.5 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white transition border border-stone-700/60 cursor-pointer active:scale-95"
            >
              {settings.soundEffects ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-stone-500" />}
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar with Horizontal Scroll Arrows */}
        <div className="py-2">
          <HorizontalScrollContainer scrollAmount={220}>
            <nav className="flex flex-nowrap gap-1.5 sm:gap-2 scrollbar-none w-max">
              {navItems.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      sound.playTap();
                      setActiveTab(tab.id);
                    }}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-150 relative shrink-0 ${
                      isActive
                        ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20 font-bold scale-[1.02]'
                        : 'text-stone-300 hover:text-white hover:bg-stone-800/70'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-stone-950' : 'text-stone-400'}`} />
                    <span>{tab.label}</span>
                    {tab.badge !== null && (
                      <span
                        className={`ml-1 text-[11px] px-1.5 py-0.2 rounded-full min-w-[20px] text-center ${
                          isActive ? 'bg-stone-950 text-amber-400' : tab.badgeColor
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </HorizontalScrollContainer>
        </div>
      </div>
    </header>
  );
};
