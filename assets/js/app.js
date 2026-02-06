(() => {
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const TABS = ["home", "lab", "incubator", "toolbox", "who", "admin"];

  // --- utils ---
  function esc(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  async function fetchJSON(path) {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status} on ${path}`);
    return res.json();
  }

  async function fetchText(path) {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status} on ${path}`);
    return res.text();
  }

  // --- helpers for project aggregation ---
  function buildProjectIndexPath(section, slug) {
    return `./content/${section}/${slug}/index.md`;
  }

  function buildProjectEntryPath(section, slug, date) {
    return `./content/${section}/${slug}/entries/${date}.md`;
  }

  async function getContentIndex() {
    if (window.__CONTENT_INDEX_CACHE__) return window.__CONTENT_INDEX_CACHE__;
    const data = await fetchJSON("./content/index.json");
    window.__CONTENT_INDEX_CACHE__ = data;
    return data;
  }

  function findProject(data, section, slug) {
    const items = Array.isArray(data.items) ? data.items : [];
    return items.find(p =>
      String(p.section || "").toUpperCase() === String(section || "").toUpperCase() &&
      String(p.slug || "") === String(slug || "")
    );
  }

  function sortByUpdatedDesc(a, b) {
    return String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""));
  }

  // --- nav / tabs ---
  function setActiveNav(tab) {
    qsa(".nav-link").forEach(a => a.classList.toggle("active", a.dataset.page === tab));
  }

  function showTab(tab) {
    const safe = TABS.includes(tab) ? tab : "home";
    TABS.forEach(t => {
      const el = qs(`#${t}`);
      if (!el) return;
      el.classList.toggle("active", t === safe);
    });
    setActiveNav(safe);
  }

  function getHashTab() {
    const raw = (location.hash || "#home").replace(/^#/, "");
    return raw.split("?")[0].split("&")[0];
  }

  function parseHashParams() {
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

  function setHashParam(key, value) {
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

  function wireNav() {
    qsa('a.nav-link[href^="#"]').forEach(a => {
      a.addEventListener("click", (e) => {
        const href = a.getAttribute("href") || "#home";
        const tab = href.replace(/^#/, "");
        if (!TABS.includes(tab)) return;
        e.preventDefault();
        location.hash = `#${tab}`;
      });
    });

    window.addEventListener("hashchange", onRoute);
    onRoute();
  }

  function onRoute() {
    const tab = getHashTab();
    showTab(tab);

    const params = parseHashParams();

    if (params.project) {
      const [section, slug] = params.project.split("/");
      openProject(section, slug);
    } else if (params.read) {
      openMarkdown(params.read, params.title || "");
    } else {
      closeMarkdown(true);
    }
  }

  // --- modal viewer ---
  const modal = () => qs("#md-modal");
  const modalTitle = () => qs("#md-title");
  const modalKicker = () => qs("#md-kicker");
  const modalBody = () => qs("#md-body");

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

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !modal()?.classList.contains("hidden")) {
        setHashParam("read", null);
        setHashParam("project", null);
      }
    });
  }

  async function openMarkdown(path, title = "") {
    ensureModalWired();
    const m = modal();
    if (!m) return;

    m.classList.remove("hidden");
    modalKicker().textContent = path;
    modalTitle().textContent = title || "Loading…";
    modalBody().innerHTML = `<div class="font-mono-tech text-sm text-[#606060]">Loading…</div>`;

    try {
      const text = await fetchText(path);

      if (!window.markdownit) {
        throw new Error("markdown-it non disponibile (CDN non caricato)");
      }

      const mdFactory = window.markdownit?.default || window.markdownit;
      const md = mdFactory({
        html: false,
        linkify: true,
        typographer: true,
        highlight: (str, lang) => {
          try {
            if (lang && window.hljs && hljs.getLanguage(lang)) {
              return `<pre><code class="hljs language-${esc(lang)}">${hljs.highlight(str, { language: lang }).value}</code></pre>`;
            }
          } catch {}
          return `<pre><code class="hljs">${esc(str)}</code></pre>`;
        }
      });

      modalBody().innerHTML = md.render(text);

      if (window.hljs) {
        qsa("#md-body pre code").forEach(block => hljs.highlightElement(block));
      }

      if (!title) {
        const h1 = qs("#md-body h1");
        if (h1) modalTitle().textContent = h1.textContent.trim();
        else modalTitle().textContent = path.split("/").pop();
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

  async function openProject(section, slug) {
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
        merged += `# ${e.date}\n\n`;
        merged += e.text.trim();
        merged += `\n\n---\n\n`;
      }

      if (!window.markdownit) throw new Error("markdown-it non disponibile");

      const mdFactory = window.markdownit?.default || window.markdownit;
      const md = mdFactory({
        html: false,
        linkify: true,
        typographer: true,
        highlight: (str, lang) => {
          try {
            if (lang && window.hljs && hljs.getLanguage(lang)) {
              return `<pre><code class="hljs language-${esc(lang)}">${hljs.highlight(str, { language: lang }).value}</code></pre>`;
            }
          } catch {}
          return `<pre><code class="hljs">${esc(str)}</code></pre>`;
        }
      });

      modalBody().innerHTML = md.render(merged);

      if (window.hljs) {
        qsa("#md-body pre code").forEach(block => hljs.highlightElement(block));
      }

    } catch (err) {
      console.error(err);
      modalBody().innerHTML = `<div class="font-mono-tech text-sm text-red-300">Errore nel caricamento: ${esc(err.message || err)}</div>`;
      modalTitle().textContent = "Error";
    }
  }

  function closeMarkdown(silent = false) {
    const m = modal();
    if (!m) return;
    m.classList.add("hidden");
    if (!silent) {
      setHashParam("read", null);
      setHashParam("project", null);
    }
  }

  // --- UI renderers (cards) ---
  function projectCardHTML(p) {
    const tags = Array.isArray(p.tags) ? p.tags : [];
    const status = (p.status || "").toUpperCase();
    const updated = p.updatedAt || "";
    const title = p.title || p.slug;

    const kicker = `${(p.section || "").toUpperCase()} / ${p.slug}`;
    const projectKey = `${String(p.section || "").toUpperCase()}/${p.slug}`;

    return `
      <div
        class="project-card block bg-[#141416] rounded-lg p-5 hover:border-[#4ade80] transition-colors border border-[#2a2a2e] cursor-pointer"
        data-project="${esc(projectKey)}"
        data-title="${esc(title)}"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <div class="font-mono-tech text-xs text-[#606060]">${esc(kicker)}</div>
            <div class="font-mono-tech text-lg font-semibold mt-1 truncate">${esc(title)}</div>
            <div class="text-sm text-[#a0a0a0] mt-2">${esc(p.summary || "")}</div>
          </div>
          ${status ? `<span class="status-badge border border-[#2a2a2e] text-[#a0a0a0]">${esc(status)}</span>` : ""}
        </div>

        <div class="mt-4 flex flex-wrap gap-2 items-center">
          ${updated ? `<span class="font-mono-tech text-xs text-[#606060]">updated: ${esc(updated)}</span>` : ""}
          ${tags.slice(0, 6).map(t => `<span class="tool-badge font-mono-tech text-xs px-2 py-1 rounded">${esc(t)}</span>`).join("")}
        </div>
      </div>
    `;
  }

  function renderProjects(containerId, projects) {
  const host = qs(`#${containerId}`);
  if (!host) return;

  // prova a trovare un "empty state" vicino al container (stessa section)
  // pattern: un elemento con id "<containerId>-empty" oppure un blocco con data-empty-for="<containerId>"
  const emptyById = qs(`#${containerId}-empty`);
  const emptyByData = qs(`[data-empty-for="${containerId}"]`);
  const emptyEl = emptyById || emptyByData;

  if (!projects.length) {
    host.innerHTML = "";
    if (emptyEl) emptyEl.style.display = "";
    return;
  }

  if (emptyEl) emptyEl.style.display = "none";
  host.innerHTML = projects.map(projectCardHTML).join("");
}

  function renderRecentActivity(recentItems) {
    const list = qs("#recent-activity-list");
    const empty = qs("#recent-activity-empty");
    if (!list) return;

    if (!recentItems.length) {
      list.innerHTML = "";
      list.style.display = "none";
      if (empty) empty.style.display = "";
      return;
    }

    if (empty) empty.style.display = "none";
    list.style.display = "";

    list.innerHTML = recentItems.map(it => {
      const title = it.projectTitle || it.slug || "Untitled";
      const sub = `${it.type ? it.type : "entry"}${it.entryTitle ? " : " + it.entryTitle : ""}`;
      const date = it.date || "";
      const projectKey = `${String(it.section || "").toUpperCase()}/${it.slug}`;

      return `
        <div
          class="block bg-[#141416] border border-[#2a2a2e] rounded-lg p-5 hover:border-[#4ade80] transition-colors cursor-pointer"
          data-recent-project="${esc(projectKey)}"
          data-title="${esc(title)}"
        >
          <div class="font-mono-tech text-xs text-[#606060]">${esc((it.section || "").toUpperCase())} • ${esc(date)} ${it.time ? "• " + esc(it.time) : ""}</div>
          <div class="font-mono-tech text-lg font-semibold mt-1">${esc(title)}</div>
          <div class="text-sm text-[#a0a0a0] mt-2">${esc(sub)}</div>
        </div>
      `;
    }).join("");
  }

  function parseLatestEntryMeta(mdText) {
    const m = mdText.match(/^##\s+(\d{2}:\d{2})\s+[—-]\s+([a-zA-Z0-9_-]+)\s*:\s*(.+)$/m);
    if (!m) return null;
    return { time: m[1], type: m[2], title: m[3].trim() };
  }

  // --- main load ---
  async function loadAndRenderContent() {
    const data = await fetchJSON("./content/index.json");
    const projects = Array.isArray(data.items) ? data.items.slice() : [];

    const bySection = { LAB: [], INCUBATOR: [], TOOLBOX: [] };
    projects.forEach(p => {
      const s = String(p.section || "").toUpperCase();
      if (bySection[s]) bySection[s].push(p);
    });

    Object.values(bySection).forEach(arr => arr.sort(sortByUpdatedDesc));

    renderProjects("lab-projects-list", bySection.LAB);
    renderProjects("incubator-ideas-list", bySection.INCUBATOR);
    renderProjects("toolbox-categories", bySection.TOOLBOX);

    // Recent activity: last entry per project (newest)
    const recent = [];
    const tasks = projects.map(async (p) => {
      const entries = Array.isArray(p.entries) ? p.entries : [];
      const lastDate = entries.length ? entries[0] : null; // newest-first
      if (!lastDate) return;

      const entryPath = `./content/${p.section}/${p.slug}/entries/${lastDate}.md`;
      try {
        const mdText = await fetchText(entryPath);
        const meta = parseLatestEntryMeta(mdText);
        recent.push({
          section: p.section,
          slug: p.slug,
          projectTitle: p.title,
          date: lastDate,
          time: meta?.time || "",
          type: meta?.type || "",
          entryTitle: meta?.title || "",
          entryPath
        });
      } catch {
        recent.push({
          section: p.section,
          slug: p.slug,
          projectTitle: p.title,
          date: lastDate,
          entryPath
        });
      }
    });

    await Promise.all(tasks);
    recent.sort((a, b) => String(b.date).localeCompare(String(a.date)));
    renderRecentActivity(recent.slice(0, 6));
  }

  function removeAdminUI() {
    qsa(".admin-only").forEach(el => { el.style.display = "none"; });
  }

  function showError(err) {
    console.error(err);
    const host = qs("#recent-activity-list");
    if (host) host.innerHTML = `<div class="font-mono-tech text-sm text-red-300">Errore caricamento contenuti. Controlla console.</div>`;
  }

  // init
  removeAdminUI();
  wireNav();
  loadAndRenderContent().catch(showError);

  // Click handler: open aggregated project view
  document.addEventListener("click", (e) => {
    const proj = e.target.closest("[data-project]");
    if (proj) {
      const projectKey = proj.getAttribute("data-project");
      const title = proj.getAttribute("data-title") || "";
      setHashParam("title", title);
      setHashParam("read", null);
      setHashParam("project", projectKey);
      return;
    }

    const recent = e.target.closest("[data-recent-project]");
    if (recent) {
      const projectKey = recent.getAttribute("data-recent-project");
      const title = recent.getAttribute("data-title") || "";
      setHashParam("title", title);
      setHashParam("read", null);
      setHashParam("project", projectKey);
    }
  });
})();
