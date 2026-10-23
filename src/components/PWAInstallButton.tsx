import React, { useState } from 'react';
import { Download, Smartphone, Share, CheckCircle2, X, Laptop } from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';
import { sound } from '../utils/sound';
import { Language, Translations } from '../utils/i18n';

interface PWAInstallButtonProps {
  language: Language;
  t: Translations;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ language, t }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  // If already running in standalone PWA mode, don't show install prompt
  if (isInstalled && !justInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    sound.playTap();
    if (isInstallable) {
      const accepted = await install();
      if (accepted) {
        setJustInstalled(true);
      }
    } else {
      // Show guided instructions for iOS Safari or desktop browser address bar
      setShowGuideModal(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        title={language === 'ar' ? 'تثبيت التطبيق على جهازك' : 'Install BIMBO POS App on your device'}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-bold text-xs shadow-md shadow-amber-500/20 transition active:scale-95 cursor-pointer shrink-0"
      >
        <Download className="w-4 h-4 stroke-[2.5] text-stone-950 shrink-0" />
        <span className="hidden md:inline">{t.installApp}</span>
        <span className="md:hidden">{language === 'ar' ? 'تثبيت' : 'Install'}</span>
      </button>

      {/* Guided installation modal for iOS or browsers without direct prompt */}
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
                  src="/assets/aistudio/Gemini_Generated_Image_cbgr2zcbgr2zcbgr_cddd89ba.jpg" 
                  alt="BIMBO Cafe & Restaurant"
                  className="w-10 h-10 rounded-xl object-cover ring-2 ring-amber-500/50"
                />
                <div>
                  <h3 className="font-black text-sm text-white">
                    {language === 'ar' ? 'تثبيت تطبيق بيمبو POS' : 'Install BIMBO POS App'}
                  </h3>
                  <span className="text-[11px] text-stone-400">
                    {language === 'ar' ? 'يعمل كتطبيق سطح مكتب أو هاتف مستقل' : 'Run as standalone desktop or mobile app'}
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

            {isIOS ? (
              /* iOS Safari instructions */
              <div className="p-3.5 bg-stone-950 rounded-2xl border border-stone-800 space-y-3 text-xs">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <Smartphone className="w-4 h-4" />
                  <span>{language === 'ar' ? 'طريقة التثبيت على آيفون / آيباد' : 'Install on iPhone / iPad (Safari)'}</span>
                </div>
                <ol className="space-y-2 text-stone-300 list-decimal list-inside leading-relaxed text-[11px]">
                  <li>
                    {language === 'ar' ? (
                      <>اضغط على زر <strong className="text-white">المشاركة (Share)</strong> أسفل المتصفح <Share className="w-3 h-3 inline mx-1" /></>
                    ) : (
                      <>Tap the <strong className="text-white">Share</strong> button in Safari toolbar <Share className="w-3 h-3 inline mx-1" /></>
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
              /* Desktop / Android instructions */
              <div className="p-3.5 bg-stone-950 rounded-2xl border border-stone-800 space-y-3 text-xs">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <Laptop className="w-4 h-4" />
                  <span>{language === 'ar' ? 'التثبيت على الكمبيوتر أو الأندرويد' : 'Install on PC / Android'}</span>
                </div>
                <div className="space-y-2 text-stone-300 leading-relaxed text-[11px]">
                  <p>
                    {language === 'ar' 
                      ? '1. في شريط عنوان المتصفح (في الأعلى)، اضغط على أيقونة التثبيت (🖥️ أو 📥).'
                      : '1. In your browser address bar (top right), click the Install App icon (🖥️ or 📥).'}
                  </p>
                  <p>
                    {language === 'ar'
                      ? '2. أو افتح قائمة المتصفح (⋮) واختر "تثبيت تطبيق BIMBO POS" أو "الإضافة للشاشة الرئيسية".'
                      : '2. Or open browser menu (⋮) and select "Install BIMBO POS" / "Add to Home Screen".'}
                  </p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="w-full py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs transition"
            >
              {language === 'ar' ? 'فهمت' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
