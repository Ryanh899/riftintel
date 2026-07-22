/**
 * Scroll helpers that account for sticky header / filter bars.
 * Mark sticky chrome with data-scroll-sticky so offsets stay correct.
 */

export function stickyStackHeight(): number {
  let total = 12; // breathing room under the stack
  if (typeof document === "undefined") return total;
  document.querySelectorAll<HTMLElement>("[data-scroll-sticky]").forEach((el) => {
    total += el.getBoundingClientRect().height;
  });
  return total;
}

/** Smooth-scroll an element into view below sticky chrome. */
export function scrollToId(
  id: string,
  opts?: { highlight?: boolean; behavior?: ScrollBehavior },
): boolean {
  if (typeof document === "undefined") return false;
  const el = document.getElementById(id);
  if (!el) return false;

  const offset = stickyStackHeight();
  const top = window.scrollY + el.getBoundingClientRect().top - offset;
  window.scrollTo({
    top: Math.max(0, top),
    behavior: opts?.behavior ?? "smooth",
  });

  if (opts?.highlight !== false) {
    el.classList.add("ring-1", "ring-accent");
    window.setTimeout(
      () => el.classList.remove("ring-1", "ring-accent"),
      1400,
    );
  }

  // Keep URL hash in sync without native jump fighting us
  if (typeof history !== "undefined") {
    history.replaceState(null, "", `#${id}`);
  }

  return true;
}
