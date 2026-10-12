// Scroll-driven motion: Lenis smooth scroll wired to GSAP ScrollTrigger, SplitText line reveals,
// the pinned kinetic intro, counters, image reveals and the map draw-in.
// Only runs when the visitor has not asked for reduced motion; content is fully visible otherwise.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger, SplitText);

const headerHeight = () => document.querySelector<HTMLElement>(".top")?.offsetHeight ?? 80;

// Deterministic scattered start for each intro letter: [x vw, y vh, rotation deg]
const SCATTER: [number, number, number][] = [
  [-16, -22, -18],
  [-9, 24, 26],
  [-4, -26, -12],
  [2, 20, 38],
  [5, -18, -30],
  [7, 26, 16],
  [9, -24, 28],
];

export function createSmoothScroll() {
  const lenis = new Lenis({ anchors: { offset: -headerHeight() }, autoRaf: false });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

function initIntro() {
  const intro = document.querySelector<HTMLElement>("[data-intro]");
  if (!intro) return;
  const stage = intro.querySelector<HTMLElement>(".intro-stage");
  const letters = gsap.utils.toArray<HTMLElement>("[data-intro-letter]", intro);
  const mark = intro.querySelector<HTMLElement>("[data-intro-d]");
  const copy = intro.querySelector<HTMLElement>("[data-intro-copy]");
  if (!stage || !mark || !copy) return;

  // The gold D is the first letter of the word and assembles together with the rest
  const pieces = [mark, ...letters];

  const timeline = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: intro,
      start: () => `top ${headerHeight()}px`,
      end: "+=120%",
      pin: stage,
      scrub: 0.8,
      invalidateOnRefresh: true,
    },
  });

  timeline
    .fromTo(
      pieces,
      {
        x: (index) => `${SCATTER[index % SCATTER.length][0]}vw`,
        y: (index) => `${SCATTER[index % SCATTER.length][1]}vh`,
        rotation: (index) => SCATTER[index % SCATTER.length][2],
        opacity: 0.35,
      },
      { x: 0, y: 0, rotation: 0, opacity: 1, duration: 1, stagger: 0.04 },
    )
    .fromTo(copy.children, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, stagger: 0.1 }, 0.85);

  // The watermark appears once the intro has finished
  gsap.to(document.documentElement, {
    "--wm": 1,
    ease: "none",
    scrollTrigger: { trigger: "#encuentra", start: "top 60%", end: "top 20%", scrub: true },
  });
}

function initSplitHeadings() {
  gsap.utils.toArray<HTMLElement>("[data-split]").forEach((element) => {
    SplitText.create(element, {
      type: "lines",
      mask: "lines",
      linesClass: "split-line",
      autoSplit: true,
      onSplit: (self) =>
        gsap.from(self.lines, {
          yPercent: 105,
          duration: 0.9,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: { trigger: element, start: "top 85%", once: true },
        }),
    });
  });
}

function initCounters() {
  gsap.utils.toArray<HTMLElement>("[data-count]").forEach((element) => {
    const target = Number(element.dataset.count);
    const counter = { value: 0 };
    gsap.to(counter, {
      value: target,
      duration: 1.6,
      ease: "power2.out",
      scrollTrigger: { trigger: element, start: "top 85%", once: true },
      onStart: () => {
        element.textContent = "0";
      },
      onUpdate: () => {
        element.textContent = String(Math.round(counter.value));
      },
    });
  });
}

function initReveals() {
  ScrollTrigger.batch("[data-reveal]", {
    start: "top 88%",
    once: true,
    onEnter: (batch) => gsap.from(batch, { y: 36, opacity: 0, duration: 0.8, stagger: 0.12, ease: "power3.out" }),
  });

  const steps = gsap.utils.toArray<HTMLElement>("[data-steps] > li");
  if (steps.length) {
    gsap.from(steps, {
      y: 48,
      opacity: 0,
      duration: 0.9,
      stagger: 0.18,
      ease: "power3.out",
      scrollTrigger: { trigger: "[data-steps]", start: "top 80%", once: true },
    });
  }

  const arch = document.querySelector<HTMLElement>("[data-reveal-arch]");
  if (arch) {
    const timeline = gsap.timeline({ scrollTrigger: { trigger: arch, start: "top 80%", once: true } });
    timeline
      .from(arch.querySelector(".arch-photo"), { clipPath: "inset(100% 0% 0% 0%)", duration: 1.2, ease: "power3.inOut" })
      .from(arch.querySelector(".arch-outline"), { x: 0, y: 0, opacity: 0, duration: 0.9, ease: "power2.out" }, "-=0.5");
  }

  const curtain = document.querySelector<HTMLElement>("[data-curtain]");
  if (curtain) {
    const timeline = gsap.timeline({ scrollTrigger: { trigger: curtain, start: "top 80%", once: true } });
    timeline
      .from(curtain, { clipPath: "inset(0% 100% 0% 0%)", duration: 1.3, ease: "power3.inOut" })
      .from(curtain.querySelector("img"), { scale: 1.2, duration: 1.6, ease: "power2.out" }, 0);
  }
}

function initMap() {
  const outline = document.querySelector<SVGPolygonElement>("[data-map-outline]");
  const points = gsap.utils.toArray<SVGGElement>("[data-point]");
  if (!outline) return;
  const timeline = gsap.timeline({ scrollTrigger: { trigger: "[data-map]", start: "top 75%", once: true } });
  timeline
    .fromTo(outline, { strokeDashoffset: 1, fillOpacity: 0 }, { strokeDashoffset: 0, duration: 1.8, ease: "power2.inOut" })
    .to(outline, { fillOpacity: 1, duration: 0.6 }, "-=0.4")
    .from(points, { scale: 0, transformOrigin: "50% 50%", duration: 0.5, stagger: 0.15, ease: "back.out(2)" }, "-=0.3");
}

export function animateMenuLinks(links: HTMLElement[]) {
  gsap.fromTo(links, { yPercent: 110 }, { yPercent: 0, duration: 0.7, stagger: 0.06, ease: "power3.out" });
}

export function initMotion() {
  initIntro();
  initSplitHeadings();
  initCounters();
  initReveals();
  initMap();
  // Recalculate positions once fonts and images have settled
  window.addEventListener("load", () => ScrollTrigger.refresh());
}

export function refreshMotion() {
  ScrollTrigger.refresh();
}
