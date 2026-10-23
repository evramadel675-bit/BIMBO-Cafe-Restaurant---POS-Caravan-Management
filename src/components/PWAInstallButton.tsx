import React, { useState } from 'react';
import { Download, Smartphone, Share, X, Laptop, ExternalLink, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';
import { sound } from '../utils/sound';
import { Language, Translations } from '../utils/i18n';

interface PWAInstallButtonProps {
  language: Language;
  t: Translations;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ language, t }) => {
  const { isInstallable, isInstalled, isIOS, isInIframe, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // If already running in standalone PWA mode, don't show install button
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    sound.playTap();

    // 1. If native prompt is available (Chrome/Edge desktop or Android Chrome)
    if (isInstallable) {
      setIsInstalling(true);
      try {
        const accepted = await install();
        if (accepted) {
          // Successfully accepted & installed - button disappears automatically via isInstalled
          return;
        }
      } finally {
        setIsInstalling(false);
      }
    } else {
      // 2. Prompt not yet dispatched (iOS Safari or inside iframe/preview) -> show guide modal
      setShowGuideModal(true);
    }
  };

  const openDirectWindow = () => {
    sound.playTap();
    window.open(window.location.href, '_blank', 'noopener,noreferrer');
    setShowGuideModal(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        disabled={isInstalling}
        title={language === 'ar' ? 'تثبيت التطبيق على جهازك (PWA)' : 'Install BIMBO POS on your device (PWA)'}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-bold text-xs shadow-md shadow-amber-500/25 transition active:scale-95 cursor-pointer shrink-0 disabled:opacity-60"
      >
        <Download className="w-4 h-4 stroke-[2.5] text-stone-950 shrink-0" />
        <span className="hidden md:inline">
          {isInstalling ? (language === 'ar' ? 'جارِ التثبيت...' : 'Installing...') : t.installApp}
        </span>
        <span className="md:hidden">
          {isInstalling ? (language === 'ar' ? '...' : '...') : (language === 'ar' ? 'تثبيت' : 'Install')}
        </span>
      </button>

      {/* Guided installation modal when native prompt is pending or unsupported (e.g., iOS Safari or IFrame) */}
      {showGuideModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowGuideModal(false)}
        >
          <div 
            className="bg-stone-900 border border-stone-800 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-stone-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <img 
                  src="/pwa-192x192.png" 
                  alt="BIMBO Cafe & Restaurant"
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-amber-500/50"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/logo-square.png';
                  }}
                />
                <div>
                  <h3 className="font-black text-sm text-white">
                    {language === 'ar' ? 'تثبيت تطبيق BIMBO POS' : 'Install BIMBO POS App'}
                  </h3>
                  <span className="text-[11px] text-stone-400">
                    {language === 'ar' ? 'تطبيق سطح مكتب وهاتف مستقل وسريع' : 'Fast standalone desktop & mobile app'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* If in iframe / preview, browser security blocks beforeinstallprompt */}
            {isInIframe && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs space-y-2 text-stone-200">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                  <ExternalLink className="w-4 h-4 shrink-0" />
                  <span>{language === 'ar' ? 'تثبيت بنقرة واحدة مباشرة' : 'Direct 1-Click Install'}</span>
                </div>
                <p className="text-[11px] text-stone-300 leading-relaxed">
                  {language === 'ar'
                    ? 'لحماية الأمان، يتطلب المتصفح فتح التطبيق في تبويب مباشر لتشغيل نافذة التثبيت الرسمية بنقرة واحدة.'
                    : 'Browsers require opening in a direct window to trigger the 1-click native system install dialog.'}
                </p>
                <button
                  type="button"
                  onClick={openDirectWindow}
                  className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 transition shadow"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'فتح في تبويب مباشر للتثبيت الفوري' : 'Open Direct Tab for 1-Click Install'}</span>
                </button>
              </div>
            )}

            {isIOS ? (
              /* iOS Safari instructions */
              <div className="p-3.5 bg-stone-950 rounded-2xl border border-stone-800 space-y-3 text-xs">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <Smartphone className="w-4 h-4" />
                  <span>{language === 'ar' ? 'طريقة التثبيت على آيفون / آيباد (Safari)' : 'Install on iPhone / iPad (Safari)'}</span>
                </div>
                <ol className="space-y-2 text-stone-300 list-decimal list-inside leading-relaxed text-[11px]">
                  <li>
                    {language === 'ar' ? (
                      <>اضغط على زر <strong className="text-white">المشاركة (Share)</strong> أسفل المتصفح <Share className="w-3 h-3 inline mx-1 text-amber-400" /></>
                    ) : (
                      <>Tap the <strong className="text-white">Share</strong> button in Safari toolbar <Share className="w-3 h-3 inline mx-1 text-amber-400" /></>
                    )}
                  </li>
                  <li>
                    {language === 'ar' ? (
                      <>مرر لأسفل واختر <strong className="text-amber-400">إضافة إلى الشاشة الرئيسية (Add to Home Screen)</strong></>
                    ) : (
                      <>Scroll down and tap <strong className="text-amber-400">Add to Home Screen</strong></>
                    )}
                  </li>
                  <li>
                    {language === 'ar' ? (
                      <>اضغط على <strong className="text-white">إضافة (Add)</strong> بالأعلى لتثبيت الأيقونة</>
                    ) : (
                      <>Tap <strong className="text-white">Add</strong> in the top right to complete</>
                    )}
                  </li>
                </ol>
              </div>
            ) : (
              /* Desktop / Android native instructions when prompt hasn't fired yet */
              <div className="p-3.5 bg-stone-950 rounded-2xl border border-stone-800 space-y-3 text-xs">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <Laptop className="w-4 h-4" />
                  <span>{language === 'ar' ? 'التثبيت على الكمبيوتر أو الأندرويد' : 'Install on PC / Android'}</span>
                </div>
                <div className="space-y-2 text-stone-300 leading-relaxed text-[11px]">
                  <p>
                    {language === 'ar' 
                      ? '1. في شريط عنوان المتصفح (أعلى اليمين أو اليسار)، اضغط على أيقونة التثبيت (🖥️ أو 📥).'
                      : '1. In your browser address bar, click the Install App icon (🖥️ or 📥).'}
                  </p>
                  <p>
                    {language === 'ar'
                      ? '2. أو افتح قائمة المتصفح (⋮) واختر "تثبيت تطبيق BIMBO" أو "الإضافة للشاشة الرئيسية".'
                      : '2. Or open browser menu (⋮) and select "Install BIMBO" / "Add to Home Screen".'}
                  </p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="w-full py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs transition"
            >
              {language === 'ar' ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
