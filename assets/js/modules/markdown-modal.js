import { qs, qsa, esc, fetchText } from './utils.js';
import { setHashParam } from './routing.js';
import { createMarkdownRenderer } from '../../shared/markdown-renderer.js';

// --- Modal helper getters ---
const modal = () => qs("#md-modal");
const modalTitle = () => qs("#md-title");
const modalKicker = () => qs("#md-kicker");
const modalBody = () => qs("#md-body");

// --- Content index cache ---
let _contentIndexCache = null;
let _markdownRenderer = null;

// Initialize markdown renderer (uses CDN libraries)
async function getMarkdownRenderer() {
  if (_markdownRenderer) return _markdownRenderer;
  
  if (!window.markdownit) {
    throw new Error("markdown-it non disponibile (CDN non caricato)");
  }
  
  _markdownRenderer = await createMarkdownRenderer(window.markdownit, window.hljs);
  return _markdownRenderer;
}

export async function getContentIndex() {
  if (_contentIndexCache) return _contentIndexCache;
  const { fetchJSON } = await import('./utils.js');
  _contentIndexCache = await fetchJSON("./content/index.json");
  return _contentIndexCache;
}

export function findProject(data, section, slug) {
  const items = Array.isArray(data?.items) ? data.items : [];
  const S = String(section || "").toUpperCase();
  const s = String(slug || "");
  return items.find(p => String(p.section || "").toUpperCase() === S && String(p.slug || "") === s) || null;
}

export function buildProjectIndexPath(section, slug) {
  return `./content/${String(section).toUpperCase()}/${slug}/index.md`;
}

export function buildProjectEntryPath(section, slug, dateStr) {
  return `./content/${String(section).toUpperCase()}/${slug}/entries/${dateStr}.md`;
}

// --- Modal setup ---
function ensureModalWired() {
  const closeBtn = qs("#md-close");
  const backdrop = qs("#md-backdrop");

  if (closeBtn && !closeBtn.__wired) {
    closeBtn.__wired = true;
    closeBtn.addEventListener("click", () => {
      setHashParam("read", null);
      setHashParam("project", null);
    });
  }
  if (backdrop && !backdrop.__wired) {
    backdrop.__wired = true;
    backdrop.addEventListener("click", () => {
      setHashParam("read", null);
      setHashParam("project", null);
    });
  }

  if (!window.__md_esc_wired) {
    window.__md_esc_wired = true;
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !modal()?.classList.contains("hidden")) {
        setHashParam("read", null);
        setHashParam("project", null);
      }
    });
  }
}

// --- Open markdown ---
export async function openMarkdown(path, title = "") {
  ensureModalWired();
  const m = modal();
  if (!m) return;

  m.classList.remove("hidden");
  modalKicker().textContent = path;
  modalTitle().textContent = title || "Loading…";
  modalBody().innerHTML = `<div class="font-mono-tech text-sm text-[#606060]">Loading…</div>`;

  try {
    const text = await fetchText(path);
    const renderer = await getMarkdownRenderer();
    const html = renderer.render(text);
    
    modalBody().innerHTML = html;

    if (window.hljs) qsa("#md-body pre code").forEach(block => hljs.highlightElement(block));

    if (!title) {
      const h1 = qs("#md-body h1");
      modalTitle().textContent = h1 ? h1.textContent.trim() : path.split("/").pop();
    }
  } catch (err) {
    console.error(err);
    modalBody().innerHTML = `
      <div class="font-mono-tech text-sm text-red-300">
        Errore nel caricamento: ${esc(String(err.message || err))}
      </div>`;
    modalTitle().textContent = "Error";
  }
}

// --- Open project ---
export async function openProject(section, slug) {
  ensureModalWired();
  const m = modal();
  if (!m) return;

  m.classList.remove("hidden");

  const data = await getContentIndex();
  const project = findProject(data, section, slug);

  if (!project) {
    modalKicker().textContent = `./content/${section}/${slug}/`;
    modalTitle().textContent = "Project not found";
    modalBody().innerHTML = `<div class="font-mono-tech text-sm text-red-300">Progetto non trovato in content/index.json</div>`;
    return;
  }

  const title = project.title || project.slug;
  modalKicker().textContent = `./content/${project.section}/${project.slug}/`;
  modalTitle().textContent = title;
  modalBody().innerHTML = `<div class="font-mono-tech text-sm text-[#606060]">Loading project…</div>`;

  try {
    const indexPath = project.pathIndex || buildProjectIndexPath(project.section, project.slug);
    const indexMd = await fetchText(indexPath);

    const entries = Array.isArray(project.entries) ? project.entries.slice() : [];
    entries.reverse(); // ordine crescente: vecchio → nuovo

    const entryTexts = [];
    for (const d of entries) {
      const p = buildProjectEntryPath(project.section, project.slug, d);
      const t = await fetchText(p);
      entryTexts.push({ date: d, text: t });
    }

    let merged = "";
    merged += indexMd.trim();
    merged += `\n\n---\n\n`;
    for (const e of entryTexts) {
      // Entry files already contain date heading, so just add separator before each entry
      merged += e.text.trim();
      merged += `\n\n---\n\n`;
    }

    const renderer = await getMarkdownRenderer();
    const html = renderer.render(merged);
    modalBody().innerHTML = html;

    if (window.hljs) {
      qsa("#md-body pre code").forEach(block => hljs.highlightElement(block));
    }

  } catch (err) {
    console.error(err);
    modalBody().innerHTML = `<div class="font-mono-tech text-sm text-red-300">Errore nel caricamento: ${esc(err.message || err)}</div>`;
    modalTitle().textContent = "Error";
  }
}

// --- Close markdown ---
export function closeMarkdown(silent = false) {
  const m = modal();
  if (!m) return;
  m.classList.add("hidden");
  if (!silent) setHashParam("read", null);
}
