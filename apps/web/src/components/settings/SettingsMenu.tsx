"use client";
import { useEffect, useSyncExternalStore } from "react";
import { Popover } from "@/components/ui/Popover";
import {
  applyTheme,
  getThemeChoice,
  setThemeChoice,
  subscribeThemeChoice,
  type ThemeChoice,
} from "@/lib/theme";

const ic = "size-4 shrink-0";

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 2.8v2.2M12 19v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.8 12H5M19 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className={ic} fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className={ic} fill="none" aria-hidden="true">
      <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
function MonitorIcon() {
  return (
    <svg viewBox="0 0 24 24" className={ic} fill="none" aria-hidden="true">
      <rect x="3" y="4.5" width="18" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 20h6M12 16.5V20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

const OPTIONS: { value: ThemeChoice; label: string; icon: React.ReactNode }[] = [
  { value: "system", label: "System", icon: <MonitorIcon /> },
  { value: "light", label: "Light", icon: <SunIcon /> },
  { value: "dark", label: "Dark", icon: <MoonIcon /> },
];

export function SettingsMenu() {
  // The boot script already applied the theme; read the choice from the store
  // (SSR snapshot is "system") without a mount effect.
  const choice = useSyncExternalStore(
    subscribeThemeChoice,
    getThemeChoice,
    () => "system" as ThemeChoice
  );

  // When following the system, react live to OS light/dark switches.
  useEffect(() => {
    if (choice !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [choice]);

  const select = (value: ThemeChoice) => setThemeChoice(value);

  return (
    <Popover
      panelRole="dialog"
      panelLabel="Settings"
      buttonAriaLabel="Settings"
      buttonClassName="grid size-8 place-items-center rounded-full border border-line text-muted transition-colors duration-150 hover:border-line-strong hover:text-ink"
      button={<GearIcon />}
      panelClassName="w-60 p-3"
    >
      <p className="px-1 pb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
        Appearance
      </p>
      <div
        role="radiogroup"
        aria-label="Theme"
        className="grid grid-cols-3 gap-1 rounded-[var(--radius-md)] border border-line bg-paper-2/60 p-1"
      >
        {OPTIONS.map((opt) => {
          const active = choice === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => select(opt.value)}
              className={`flex flex-col items-center gap-1.5 rounded-[var(--radius-sm)] px-2 py-2 text-[11.5px] transition-colors duration-150 ${
                active
                  ? "bg-surface text-ink shadow-[var(--shadow-soft)]"
                  : "text-muted hover:text-ink"
              }`}
            >
              <span className={active ? "text-accent-ink" : ""}>{opt.icon}</span>
              {opt.label}
            </button>
          );
        })}
      </div>
      <p className="px-1 pt-2.5 text-[11px] leading-relaxed text-faint">
        {choice === "system"
          ? "Matching your operating system."
          : `Always ${choice}.`}
      </p>
    </Popover>
  );
}
