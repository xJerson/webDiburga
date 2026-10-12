// Entry point: wires interactions always, and scroll motion only when reduced motion is not requested.
import { initContactForm, initCoverage, initFab, initFinder, initMenu, initPractices, type ScrollToTarget } from "./interactions";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const headerOffset = () => document.querySelector<HTMLElement>(".top")?.offsetHeight ?? 80;

async function start() {
  // These do not depend on the motion layer, so wire them before it loads
  initCoverage();
  initContactForm();
  initFab();

  let scrollTo: ScrollToTarget = (target) => {
    window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - headerOffset(), behavior: "auto" });
  };
  let refresh = () => {};
  let menuHooks = {};

  if (reducedMotion) {
    // Without scroll motion the watermark is simply visible
    document.documentElement.style.setProperty("--wm", "1");
  } else {
    const motion = await import("./motion");
    const lenis = motion.createSmoothScroll();
    scrollTo = (target) => lenis.scrollTo(target, { offset: -headerOffset() });
    refresh = motion.refreshMotion;
    menuHooks = {
      onOpen: motion.animateMenuLinks,
      lockScroll: (locked: boolean) => (locked ? lenis.stop() : lenis.start()),
    };
    motion.initMotion();
    // The pinned intro adds scroll length after the browser has already jumped to a #hash
    const hashTarget = location.hash ? document.querySelector<HTMLElement>(location.hash) : null;
    if (hashTarget) {
      const jump = () => requestAnimationFrame(() => scrollTo(hashTarget));
      if (document.readyState === "complete") jump();
      else window.addEventListener("load", jump, { once: true });
    }
  }

  initMenu(scrollTo, menuHooks);
  const practices = initPractices(refresh);
  initFinder(practices.open, scrollTo);
}

start();
