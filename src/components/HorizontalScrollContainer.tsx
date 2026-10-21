import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { sound } from '../utils/sound';

interface HorizontalScrollContainerProps {
  children: React.ReactNode;
  className?: string;
  scrollAmount?: number;
  showArrowsAlways?: boolean;
}

export const HorizontalScrollContainer: React.FC<HorizontalScrollContainerProps> = ({
  children,
  className = '',
  scrollAmount = 240,
  showArrowsAlways = true,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2);
  }, []);

  useEffect(() => {
    checkScroll();
    const timer = setTimeout(checkScroll, 100);
    const el = scrollRef.current;
    if (!el) return () => clearTimeout(timer);

    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);

    const resizeObserver = new ResizeObserver(() => checkScroll());
    resizeObserver.observe(el);

    return () => {
      clearTimeout(timer);
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
      resizeObserver.disconnect();
    };
  }, [checkScroll]);

  const handleScroll = (direction: 'left' | 'right') => {
    sound.playTap();
    const el = scrollRef.current;
    if (!el) return;
    const offset = direction === 'left' ? -scrollAmount : scrollAmount;
    el.scrollBy({ left: offset, behavior: 'smooth' });
    setTimeout(checkScroll, 350);
  };

  return (
    <div className="relative flex items-center w-full min-w-0 group/hscroll">
      {/* Left Arrow Button */}
      {(canScrollLeft || showArrowsAlways) && (
        <button
          type="button"
          onClick={() => handleScroll('left')}
          disabled={!canScrollLeft && !showArrowsAlways}
          aria-label="Scroll left"
          className={`shrink-0 z-10 mr-1.5 p-1.5 sm:p-2 rounded-xl transition duration-150 flex items-center justify-center border shadow-md active:scale-95 ${
            canScrollLeft || showArrowsAlways
              ? 'bg-stone-800 hover:bg-amber-500 text-stone-200 hover:text-stone-950 border-stone-700 hover:border-amber-400 cursor-pointer'
              : 'bg-stone-900/60 text-stone-600 border-stone-800/60 cursor-not-allowed opacity-40'
          }`}
          title="Scroll Left"
        >
          <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
        </button>
      )}

      {/* Horizontally Scrollable Element */}
      <div
        ref={scrollRef}
        className={`flex-1 min-w-0 w-full overflow-x-auto flex-nowrap horizontal-scroll-smooth py-1 scrollbar-none ${className}`}
      >
        {children}
      </div>

      {/* Right Arrow Button */}
      {(canScrollRight || showArrowsAlways) && (
        <button
          type="button"
          onClick={() => handleScroll('right')}
          disabled={!canScrollRight && !showArrowsAlways}
          aria-label="Scroll right"
          className={`shrink-0 z-10 ml-1.5 p-1.5 sm:p-2 rounded-xl transition duration-150 flex items-center justify-center border shadow-md active:scale-95 ${
            canScrollRight || showArrowsAlways
              ? 'bg-stone-800 hover:bg-amber-500 text-stone-200 hover:text-stone-950 border-stone-700 hover:border-amber-400 cursor-pointer'
              : 'bg-stone-900/60 text-stone-600 border-stone-800/60 cursor-not-allowed opacity-40'
          }`}
          title="Scroll Right"
        >
          <ChevronRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      )}
    </div>
  );
};
