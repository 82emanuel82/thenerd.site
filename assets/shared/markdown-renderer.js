/**
 * Markdown Renderer Factory
 * Shared between builder and website
 * 
 * Usage:
 *   NodeJS (builder):   const renderer = await createMarkdownRenderer(MarkdownIt, hljs);
 *   Browser (website):  const renderer = await createMarkdownRenderer(window.markdownit, window.hljs);
 */

export async function createMarkdownRenderer(markdownitLib, hljsLib) {
  if (!markdownitLib) {
    throw new Error("markdown-it library is required");
  }

  // Factory function to create configured instances
  const createInstance = () => {
    const MarkdownItClass = markdownitLib.default || markdownitLib;
    
    return new MarkdownItClass({
      html: false,
      linkify: true,
      typographer: true,
      highlight(code, lang) {
        if (lang && hljsLib && hljsLib.getLanguage?.(lang)) {
          try {
            return hljsLib.highlight(code, { language: lang }).value;
          } catch (e) {
            console.warn(`[Markdown] Highlight error for lang "${lang}":`, e.message);
          }
        }
        
        // Fallback to auto detection
        if (hljsLib?.highlightAuto) {
          try {
            return hljsLib.highlightAuto(code).value;
          } catch (e) {
            console.warn("[Markdown] Auto-highlight error:", e.message);
          }
        }
        
        return code;
      }
    });
  };

  return {
    /**
     * Create a new markdown-it instance with shared configuration
     */
    createInstance,

    /**
     * Render markdown string to HTML
     */
    render(markdown, instance = null) {
      if (!markdown) return "";
      
      const md = instance || createInstance();
      try {
        // Trim leading whitespace while preserving content
        const trimmed = String(markdown).replace(/^\s+/, "");
        return md.render(trimmed);
      } catch (e) {
        console.error("[Markdown] Render error:", e);
        return `<pre style="color: #ff6b6b; font-family: monospace;">Error: ${escapeHtml(e.message)}</pre>`;
      }
    },

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
      const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      };
      return String(text).replace(/[&<>"']/g, m => map[m]);
    }
  };
}

/**
 * Helper: Escape HTML (standalone function)
 */
export function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}
