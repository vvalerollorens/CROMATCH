"use client";
import { useEffect, useRef, type ReactNode, type CSSProperties } from "react";
export function Dialog({
  children,
  titleId,
  close,
  className = "",
  style,
}: {
  children: ReactNode;
  titleId: string;
  close: () => void;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLElement>(null);
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const panel = ref.current;
    const selectors =
      'button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]';
    const first = panel?.querySelector<HTMLElement>(selectors);
    first?.focus({ preventScroll: true });
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeRef.current();
        return;
      }
      if (e.key === "Tab") {
        const controls = Array.from(
          panel?.querySelectorAll<HTMLElement>(selectors) ?? [],
        );
        const first = controls[0],
          last = controls.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = before;
      document.removeEventListener("keydown", key);
      previous?.focus({ preventScroll: true });
    };
  }, []);
  return (
    <div className="overlay">
      <article
        ref={ref}
        style={style}
        className={`modal ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        {children}
      </article>
    </div>
  );
}
