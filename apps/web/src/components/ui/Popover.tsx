"use client";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface PopoverProps {
  /** Content of the trigger button (an icon, usually). */
  button: ReactNode;
  buttonClassName?: string;
  buttonAriaLabel: string;
  /** Panel content; receives a `close` callback. */
  children: ReactNode | ((close: () => void) => ReactNode);
  align?: "left" | "right";
  panelClassName?: string;
  /** Accessible label for the floating panel. */
  panelLabel: string;
  panelRole?: "menu" | "dialog";
}

/**
 * A small, dependency-free anchored popover: toggles on click, closes on
 * outside-click or Escape, moves focus into the panel on open and back to the
 * trigger on close. Used for the document kebab menus and the settings panel.
 */
export function Popover({
  button,
  buttonClassName,
  buttonAriaLabel,
  children,
  align = "right",
  panelClassName,
  panelLabel,
  panelRole = "menu",
}: PopoverProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const id = useId();

  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;

    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);

    // Move focus into the panel for keyboard users.
    const first = panelRef.current?.querySelector<HTMLElement>(
      '[role="menuitem"], button, input, [tabindex="0"]'
    );
    first?.focus();

    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup={panelRole === "menu" ? "menu" : "dialog"}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-label={buttonAriaLabel}
        onClick={() => setOpen((v) => !v)}
        className={buttonClassName}
      >
        {button}
      </button>

      {open && (
        <div
          ref={panelRef}
          id={id}
          role={panelRole}
          aria-label={panelLabel}
          className={`cm-rise absolute z-50 mt-1.5 min-w-[11rem] overflow-hidden rounded-[var(--radius-md)] border border-line bg-surface p-1 shadow-[var(--shadow-pop)] ${
            align === "right" ? "right-0" : "left-0"
          } ${panelClassName ?? ""}`}
        >
          {typeof children === "function" ? children(close) : children}
        </div>
      )}
    </div>
  );
}
