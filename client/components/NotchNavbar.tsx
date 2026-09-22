import { BrainCircuit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { GenerateButton } from "@/components/GenerateButton";

function RailLines() {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full text-slate-950 dark:text-white" preserveAspectRatio="none" aria-hidden="true">
      <line x1="0" y1="39.5" x2="100%" y2="39.5" stroke="currentColor" strokeOpacity="0.06" strokeWidth="0.5" />
      <line x1="0" y1="36.5" x2="100%" y2="36.5" stroke="currentColor" strokeOpacity="0.04" strokeWidth="0.5" />
    </svg>
  );
}

export function NotchNavbar({ onNewChat, hasMessages }: { onNewChat?: () => void; hasMessages?: boolean } = {}) {
  const navigate = useNavigate();

  return (
    <header className="relative z-10 flex h-16 w-full overflow-hidden bg-transparent" aria-label="AI Assistant navigation">
      <div className="relative h-10 min-w-0 flex-1 bg-slate-50 dark:bg-slate-950">
        <RailLines />
      </div>
      <div className="relative z-10 flex h-16 shrink-0 -ml-px">
        <div className="relative h-full w-[50px] shrink-0">
          <div className="absolute inset-0 bg-slate-50 dark:bg-slate-950" style={{ clipPath: 'path("M 0 0 H 50 V 64 C 25 64 25 40 0 40 Z")' }} />
        </div>
        <div className="relative h-full min-w-0 flex-1 -ml-px bg-slate-50 dark:bg-slate-950">
          <svg className="pointer-events-none absolute inset-0 h-full w-full text-slate-950 dark:text-white" preserveAspectRatio="none" aria-hidden="true">
            <line x1="0" y1="63.5" x2="100%" y2="63.5" stroke="currentColor" strokeOpacity="0.06" strokeWidth="0.5" />
            <line x1="0" y1="60.5" x2="100%" y2="60.5" stroke="currentColor" strokeOpacity="0.04" strokeWidth="0.5" />
          </svg>
          <div className="relative flex h-full min-w-[150px] items-end justify-between gap-2 px-2 pb-2 sm:min-w-[420px] sm:gap-6 sm:px-8">
            <div className="absolute bottom-1 left-1/2 flex size-9 -translate-x-1/2 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-950/15 transition-transform hover:scale-105 sm:size-10 dark:bg-white dark:text-slate-950">
              <BrainCircuit className="size-4 sm:size-5" />
            </div>
          </div>
        </div>
        <div className="relative -ml-px h-full w-[50px] shrink-0">
          <div className="absolute inset-0 bg-slate-50 dark:bg-slate-950" style={{ clipPath: 'path("M 0 0 H 50 V 40 C 25 40 25 64 0 64 Z")' }} />
        </div>
      </div>
      <div className="relative -ml-px flex h-10 min-w-0 flex-1 items-center justify-end gap-2 bg-slate-50 px-2 dark:bg-slate-950 sm:px-6">
        <RailLines />
        {hasMessages && onNewChat && (
          <button
            type="button"
            onClick={onNewChat}
            className="relative z-10 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-200/60 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            New chat
          </button>
        )}
        <GenerateButton label="Login" activeLabel="Login" onClick={() => navigate("/login")} className="relative z-10 h-8 w-[88px] border border-slate-400/60 text-xs shadow-none sm:h-9 sm:w-[94px] sm:text-sm" aria-label="Open login page" />
      </div>
    </header>
  );
}
