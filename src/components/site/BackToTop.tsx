import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 800);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  function toTop() {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    document.querySelector("header")?.querySelector<HTMLElement>("a,button")?.focus();
  }

  return (
    <button
      type="button"
      onClick={toTop}
      aria-label="Înapoi sus"
      className="fixed bottom-6 right-4 z-30 grid size-11 place-items-center border border-foreground bg-background text-foreground shadow-none transition-colors hover:bg-foreground hover:text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground md:bottom-8 md:right-8"
    >
      <ArrowUp className="size-4" aria-hidden="true" />
    </button>
  );
}
