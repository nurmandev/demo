import { useNavigate } from "react-router-dom";

function RailLines() {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full text-slate-950 dark:text-white" preserveAspectRatio="none" aria-hidden="true">
      <line x1="0" y1="53.5" x2="100%" y2="53.5" stroke="currentColor" strokeOpacity="0.06" strokeWidth="0.5" />
      <line x1="0" y1="49.5" x2="100%" y2="49.5" stroke="currentColor" strokeOpacity="0.04" strokeWidth="0.5" />
    </svg>
  );
}

export function NotchNavbar({ onNewChat, hasMessages }: { onNewChat?: () => void; hasMessages?: boolean } = {}) {
  const navigate = useNavigate();

  return (
    <header className="relative z-10 flex h-20 w-full bg-transparent" aria-label="Miracle Edem navigation">
      <div className="relative flex h-14 min-w-0 flex-1 items-center px-3 sm:px-8 bg-slate-50 dark:bg-slate-950">
        <RailLines />
        <span className="relative z-10 hidden sm:block text-sm font-bold tracking-wide text-slate-900 dark:text-slate-100">Miracle Edem</span>
      </div>
      <div className="relative z-10 flex h-20 shrink-0 -ml-px">
        <div className="relative h-full w-[28px] sm:w-[56px] shrink-0">
          <div className="absolute inset-0 bg-slate-50 dark:bg-slate-950" style={{ clipPath: 'path("M 0 0 H 56 V 80 C 28 80 28 56 0 56 Z")' }} />
        </div>
        <div className="relative h-full min-w-0 flex-1 -ml-px bg-slate-50 dark:bg-slate-950">
          <svg className="pointer-events-none absolute inset-0 h-full w-full text-slate-950 dark:text-white" preserveAspectRatio="none" aria-hidden="true">
            <line x1="0" y1="79.5" x2="100%" y2="79.5" stroke="currentColor" strokeOpacity="0.06" strokeWidth="0.5" />
            <line x1="0" y1="75.5" x2="100%" y2="75.5" stroke="currentColor" strokeOpacity="0.04" strokeWidth="0.5" />
          </svg>
          <div className="relative flex h-full min-w-[70px] items-end justify-between gap-2 px-2 pb-2 sm:min-w-[420px] sm:gap-6 sm:px-8">
            <div className="absolute bottom-1.5 left-1/2 flex size-10 -translate-x-1/2 items-center justify-center rounded-2xl bg-slate-950 p-2 text-white shadow-xl shadow-slate-950/20 transition-transform hover:scale-105 sm:size-12 sm:p-2.5 dark:bg-white dark:text-slate-950">
              <img src="/favicon.svg" alt="Miracle Edem" className="size-6 sm:size-7" />
            </div>
          </div>
        </div>
        <div className="relative -ml-px h-full w-[28px] sm:w-[56px] shrink-0">
          <div className="absolute inset-0 bg-slate-50 dark:bg-slate-950" style={{ clipPath: 'path("M 0 0 H 56 V 56 C 28 56 28 80 0 80 Z")' }} />
        </div>
      </div>
      <div className="relative -ml-px flex h-14 min-w-0 flex-1 items-center justify-end gap-3 bg-slate-50 px-3 sm:px-8 dark:bg-slate-950">
        <RailLines />
        {hasMessages && onNewChat ? (
          <button
            type="button"
            onClick={onNewChat}
            className="relative z-20 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200/70 hover:text-slate-900 active:scale-95 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white cursor-pointer"
          >
            New chat
          </button>
        ) : (
          <button
            type="button"
            onClick={() => navigate("/login")}
            aria-label="Open login page"
            className="relative z-20 inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-slate-800 shadow-sm transition-all hover:border-slate-400 hover:bg-slate-50 hover:shadow active:scale-95 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-700 cursor-pointer shrink-0"
          >
            Login
          </button>
        )}
      </div>
    </header>
  );
}

