import React from 'react';
import { Clock, Compass, Calendar, Volume2, MoreHorizontal } from 'lucide-react';

interface MobileTabBarProps {
  onOpenSounds: () => void;
  onOpenQibla: () => void;
  onOpenCalendar: () => void;
  onOpenMore: () => void;
  onScrollToTop: () => void;
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({
  onOpenSounds,
  onOpenQibla,
  onOpenCalendar,
  onOpenMore,
  onScrollToTop,
}) => {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/80 px-2 py-2 flex items-center justify-around shadow-2xl safe-area-bottom">
      <button
        onClick={onScrollToTop}
        className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-emerald-400 hover:text-emerald-300 transition-colors"
      >
        <Clock className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] font-semibold tracking-tight">Today</span>
      </button>

      <button
        onClick={onOpenQibla}
        className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-400 hover:text-emerald-300 transition-colors"
      >
        <Compass className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] font-semibold tracking-tight">Qibla</span>
      </button>

      <button
        onClick={onOpenCalendar}
        className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-400 hover:text-emerald-300 transition-colors"
      >
        <Calendar className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] font-semibold tracking-tight">Timetable</span>
      </button>

      <button
        onClick={onOpenSounds}
        className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-400 hover:text-emerald-300 transition-colors"
      >
        <Volume2 className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] font-semibold tracking-tight">Adhan</span>
      </button>

      <button
        onClick={onOpenMore}
        className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-400 hover:text-emerald-300 transition-colors"
      >
        <MoreHorizontal className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] font-semibold tracking-tight">More</span>
      </button>
    </nav>
  );
};
