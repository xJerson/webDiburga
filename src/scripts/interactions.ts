// Interactive behaviour that must work with or without animation:
// menu overlay, practice accordion, finder, coverage chips, contact form and floating button.

export type ScrollToTarget = (target: HTMLElement) => void;

type MenuHooks = {
  onOpen?: (links: HTMLElement[]) => void;
  lockScroll?: (locked: boolean) => void;
};

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])';

export function initMenu(scrollTo: ScrollToTarget, hooks: MenuHooks = {}) {
  const menu = document.querySelector<HTMLElement>("[data-menu]");
  const toggle = document.querySelector<HTMLButtonElement>("[data-menu-toggle]");
  const close = document.querySelector<HTMLButtonElement>("[data-menu-close]");
  const fab = document.querySelector<HTMLElement>("[data-fab]");
  if (!menu || !toggle || !close) return;

  const links = Array.from(menu.querySelectorAll<HTMLAnchorElement>("[data-menu-link]"));

  const setOpen = (open: boolean, returnFocus = true) => {
    menu.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    document.documentElement.classList.toggle("menu-open", open);
    fab?.classList.toggle("is-hidden", open);
    hooks.lockScroll?.(open);
    if (open) {
      close.focus();
      hooks.onOpen?.(Array.from(menu.querySelectorAll<HTMLElement>(".menu-links a")));
    } else if (returnFocus) {
      toggle.focus();
    }
  };

  toggle.addEventListener("click", () => setOpen(true));
  close.addEventListener("click", () => setOpen(false));

  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      const target = document.querySelector<HTMLElement>(link.getAttribute("href") ?? "");
      if (!target) return;
      event.preventDefault();
      setOpen(false, false);
      scrollTo(target);
    });
  });

  menu.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key !== "Tab") return;
    // Keep focus inside the overlay while it is open
    const focusable = Array.from(menu.querySelectorAll<HTMLElement>(FOCUSABLE));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}

export function initPractices(onLayoutChange: () => void) {
  const items = Array.from(document.querySelectorAll<HTMLElement>("[data-practice]"));

  const setOpen = (item: HTMLElement, open: boolean) => {
    const toggle = item.querySelector<HTMLButtonElement>("[data-practice-toggle]");
    const panel = item.querySelector<HTMLElement>(".practice-panel");
    item.classList.toggle("is-open", open);
    toggle?.setAttribute("aria-expanded", String(open));
    // Collapsed panels stay out of the tab order
    panel?.toggleAttribute("inert", !open);
  };

  items.forEach((item) => {
    setOpen(item, false);
    item.querySelector("[data-practice-toggle]")?.addEventListener("click", () => {
      setOpen(item, !item.classList.contains("is-open"));
      window.setTimeout(onLayoutChange, 500);
    });
  });

  // Choosing an area link pre-selects it in the contact form
  document.querySelectorAll<HTMLAnchorElement>("[data-area-link]").forEach((link) => {
    link.addEventListener("click", () => {
      const select = document.querySelector<HTMLSelectElement>("#cf-area");
      if (select) select.value = link.dataset.areaLink ?? "";
    });
  });

  return {
    open(id: string) {
      const item = document.getElementById(`area-${id}`);
      if (!item) return null;
      items.forEach((other) => setOpen(other, other === item));
      window.setTimeout(onLayoutChange, 500);
      return item;
    },
  };
}

export function initFinder(openArea: (id: string) => HTMLElement | null, scrollTo: ScrollToTarget) {
  const form = document.querySelector<HTMLFormElement>("[data-finder]");
  if (!form) return;
  const select = form.querySelector<HTMLSelectElement>("select");
  const error = form.querySelector<HTMLElement>("#finder-error");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!select?.value) {
      if (error) error.hidden = false;
      select?.setAttribute("aria-invalid", "true");
      select?.focus();
      return;
    }
    if (error) error.hidden = true;
    select.removeAttribute("aria-invalid");
    const item = openArea(select.value);
    if (!item) return;
    scrollTo(item);
    item.querySelector<HTMLButtonElement>("[data-practice-toggle]")?.focus({ preventScroll: true });
  });
}

type CoverageMode = { id: string; label: string; mode: string; includes: string[] };

export function initCoverage() {
  const map = document.querySelector<HTMLElement>("[data-map]");
  const dataNode = document.querySelector<HTMLScriptElement>("[data-coverage-data]");
  const modeText = document.querySelector<HTMLElement>("[data-coverage-mode]");
  const includes = document.querySelector<HTMLElement>("[data-coverage-includes]");
  const chips = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-chip]"));
  if (!map || !dataNode || !modeText || !includes) return;

  const modes: CoverageMode[] = JSON.parse(dataNode.textContent ?? "[]");

  const select = (id: string) => {
    const mode = modes.find((item) => item.id === id);
    if (!mode) return;
    chips.forEach((chip) => chip.setAttribute("aria-pressed", String(chip.dataset.chip === id)));
    map.dataset.active = id;
    map.querySelectorAll<SVGGElement>("[data-point]").forEach((point) => {
      point.classList.toggle("is-active", point.dataset.point === id);
    });
    modeText.textContent = mode.mode;
    includes.replaceChildren(
      ...mode.includes.map((text) => {
        const li = document.createElement("li");
        li.textContent = text;
        return li;
      }),
    );
  };

  chips.forEach((chip) => chip.addEventListener("click", () => select(chip.dataset.chip ?? "")));
}

export function initContactForm() {
  const form = document.querySelector<HTMLFormElement>("[data-contact-form]");
  const fields = document.querySelector<HTMLFieldSetElement>("[data-contact-fields]");
  const status = document.querySelector<HTMLElement>("[data-form-status]");
  if (!form || !fields || !status) return;

  fields.disabled = false;
  const controls = Array.from(form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input, select, textarea"));

  const check = (control: (typeof controls)[number]) => {
    const valid = control.value.trim() !== "" && control.checkValidity();
    const error = document.getElementById(`${control.id}-error`);
    if (valid) control.removeAttribute("aria-invalid");
    else control.setAttribute("aria-invalid", "true");
    if (error) error.hidden = valid;
    return valid;
  };

  controls.forEach((control) => {
    control.addEventListener("blur", () => {
      if (control.hasAttribute("aria-invalid")) check(control);
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const invalid = controls.filter((control) => !check(control));
    if (invalid.length > 0) {
      status.hidden = true;
      invalid[0].focus();
      return;
    }
    // Keep demo behavior explicit: no data is sent or persisted.
    status.textContent = "Esta es una demostración: la consulta no se envió ni se guardó.";
    status.hidden = false;
  });
}

export function initFab() {
  const fab = document.querySelector<HTMLElement>("[data-fab]");
  const watched = ["[data-intro]", "[data-contact]"]
    .map((selector) => document.querySelector<HTMLElement>(selector))
    .filter((node): node is HTMLElement => node !== null);
  if (!fab || watched.length === 0) return;

  const visible = new Set<Element>();
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) visible.add(entry.target);
      else visible.delete(entry.target);
    });
    const menuOpen = document.documentElement.classList.contains("menu-open");
    fab.classList.toggle("is-hidden", visible.size > 0 || menuOpen);
  }, { threshold: 0.15 });

  watched.forEach((node) => observer.observe(node));
}
