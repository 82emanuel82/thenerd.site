import { qs, qsa, esc, fetchJSON, fetchText } from './utils.js';

export function sortByUpdatedDesc(a, b) {
  return String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""));
}

export function projectCardHTML(p) {
  const tags = Array.isArray(p.tags) ? p.tags : [];
  const status = (p.status || "").toUpperCase();
  const updated = p.updatedAt || "";
  const title = p.title || p.slug;
  const path = p.pathIndex || "";
  const kicker = `${(p.section || "").toUpperCase()} / ${p.slug}`;

  return `
    <div class="project-card ... cursor-pointer"
      data-project="${esc(String(p.section || "").toUpperCase() + "/" + String(p.slug || ""))}"
      data-title="${esc(title)}">

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

export function renderProjects(containerId, projects) {
  const host = qs(`#${containerId}`);
  if (!host) return;
  host.innerHTML = projects.length ? projects.map(projectCardHTML).join("") : "";
}

export function parseLatestEntryMeta(mdText) {
  const m = mdText.match(/^##\s+(\d{2}:\d{2})\s+[—-]\s+([a-zA-Z0-9_-]+)\s*:\s*(.+)$/m);
  if (!m) return null;
  return { time: m[1], type: m[2], title: m[3].trim() };
}

export function renderRecentActivity(recentItems) {
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
    const path = it.entryPath;
    const currentTab = location.hash.split("?")[0].split("&")[0].replace(/^#/, "") || "home";

    return `
      <a href="#${currentTab}&read=${encodeURIComponent(path)}&title=${encodeURIComponent(title)}"
         class="block bg-[#141416] border border-[#2a2a2e] rounded-lg p-5 hover:border-[#4ade80] transition-colors">
        <div class="font-mono-tech text-xs text-[#606060]">${esc((it.section || "").toUpperCase())} • ${esc(date)} ${it.time ? "• " + esc(it.time) : ""}</div>
        <div class="font-mono-tech text-lg font-semibold mt-1">${esc(title)}</div>
        <div class="text-sm text-[#a0a0a0] mt-2">${esc(sub)}</div>
      </a>
    `;
  }).join("");
}

export async function loadAndRenderContent() {
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

  // Recent activity from newest entry per project
  const recent = [];
  const tasks = projects.map(async (p) => {
    const entries = Array.isArray(p.entries) ? p.entries : [];
    const lastDate = entries.length ? entries[0] : null; // newest-first in index.json
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

export function removeAdminUI() {
  qsa(".admin-only").forEach(el => { el.style.display = "none"; });
}
