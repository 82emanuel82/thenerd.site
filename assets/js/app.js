import { qs, qsa } from './modules/utils.js';
import { wireNav, onRouteChange, setHashParam, initMobileMenu } from './modules/routing.js';
import { updateLanguage, initLanguageToggle } from './modules/language.js';
import { openMarkdown, openProject, closeMarkdown } from './modules/markdown-modal.js';
import { loadAndRenderContent, removeAdminUI } from './modules/content-loader.js';

// Initialize app
async function init() {
  // UI setup
  removeAdminUI();
  wireNav();
  initMobileMenu();
  initLanguageToggle();

  // Load content
  try {
    await loadAndRenderContent();
  } catch (err) {
    console.error(err);
    const host = qs("#recent-activity-list");
    if (host) host.innerHTML = `<div class="font-mono-tech text-sm text-red-300">Errore caricamento contenuti. Controlla console.</div>`;
  }

  // Set default language
  updateLanguage();

  // Handle route changes
  onRouteChange((params) => {
    if (params.project) {
      const [section, slug] = params.project.split("/");
      openProject(section, slug);
    } else if (params.read) {
      openMarkdown(params.read, params.title || "");
    } else {
      closeMarkdown(true);
    }
  });

  // Click event delegation for cards
  document.addEventListener("click", (e) => {
    // Project cards -> open aggregated project
    const projCard = e.target.closest("[data-project]");
    if (projCard) {
      const key = projCard.getAttribute("data-project");
      const title = projCard.getAttribute("data-title") || "";
      if (!key) return;

      setHashParam("title", title);
      setHashParam("read", null);
      setHashParam("project", key);
      return;
    }

    // Recent activity cards (if applicable)
    const card = e.target.closest("[data-md]");
    if (!card) return;
    const path = card.getAttribute("data-md");
    const title = card.getAttribute("data-title") || "";
    if (!path) return;

    setHashParam("title", title);
    setHashParam("project", null);
    setHashParam("read", path);
  });
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
