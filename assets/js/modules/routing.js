import { qs, qsa } from './utils.js';

const TABS = ["home", "lab", "incubator", "toolbox", "who", "admin"];
let routeCallbacks = [];

export function onRouteChange(callback) {
  routeCallbacks.push(callback);
}

export function getHashTab() {
  const raw = (location.hash || "#home").replace(/^#/, "");
  return raw.split("?")[0].split("&")[0];
}

export function parseHashParams() {
  const raw = (location.hash || "").replace(/^#/, "");
  const parts = raw.split("&").slice(1);
  const params = {};
  for (const p of parts) {
    const [k, v] = p.split("=");
    if (!k) continue;
    params[decodeURIComponent(k)] = decodeURIComponent(v || "");
  }
  return params;
}

export function setHashParam(key, value) {
  const tab = getHashTab() || "home";
  const params = parseHashParams();
  if (value == null || value === "") delete params[key];
  else params[key] = value;

  const tail = Object.entries(params)
    .map(([k, v]) => `&${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("");

  const next = `#${tab}${tail}`;
  if (location.hash !== next) location.hash = next;
}

function setActiveNav(tab) {
  qsa(".nav-link").forEach(a => a.classList.toggle("active", a.dataset.page === tab));
}

export function showTab(tab) {
  const safe = TABS.includes(tab) ? tab : "home";
  TABS.forEach(t => qs(`#${t}`)?.classList.toggle("active", t === safe));
  setActiveNav(safe);
}

function toggleMobileMenu() {
  const menu = qs("#mobile-menu");
  if (!menu) return;
  menu.classList.toggle("hidden");
}

function closeMobileMenu() {
  const menu = qs("#mobile-menu");
  if (!menu) return;
  menu.classList.add("hidden");
}

export function wireNav() {
  qsa('a.nav-link[href^="#"]').forEach(a => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href") || "#home";
      const tab = href.replace(/^#/, "");
      if (!TABS.includes(tab)) return;
      e.preventDefault();
      location.hash = `#${tab}`;
      closeMobileMenu();
    });
  });

  window.addEventListener("hashchange", onRoute);
  onRoute();
}

function onRoute() {
  const tab = getHashTab();
  showTab(tab);

  const params = parseHashParams();

  routeCallbacks.forEach(cb => cb(params));
}

export function initMobileMenu() {
  qs("#mobile-menu-btn")?.addEventListener("click", toggleMobileMenu);
}
