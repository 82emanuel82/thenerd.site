/**
 * Markdown Renderer Factory
 * Shared between builder and website
 * 
 * Usage:
 *   NodeJS (builder):   const renderer = await createMarkdownRenderer(MarkdownIt, hljs);
 *   Browser (website):  const renderer = await createMarkdownRenderer(window.markdownit, window.hljs);
 */

export async function createMarkdownRenderer(markdownitLib, hljsLib, options = {}) {
  if (!markdownitLib) {
    throw new Error("markdown-it library is required");
  }

  // Helper: Escape HTML to prevent XSS
  const escapeHtmlLocal = (text) => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
  };

  // Factory function to create configured instances
  const createInstance = () => {
    const MarkdownItClass = markdownitLib.default || markdownitLib;
    
    const md = new MarkdownItClass({
      html: true,  // Enable HTML rendering for images
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

    // Custom image renderer to handle relative paths
    const defaultImageRenderer = md.renderer.rules.image;
    md.renderer.rules.image = function(tokens, idx, _options, env, self) {
      const token = tokens[idx];
      const src = token.attrGet('src');
      const alt = token.content;

      // For builder context (base64 or local file system paths)
      if (!src) return defaultImageRenderer(tokens, idx, _options, env, self);

      // Render with custom attributes for styling
      return `<img src="${escapeHtmlLocal(src)}" alt="${escapeHtmlLocal(alt)}" style="max-width: 100%; height: auto; border-radius: 4px; margin: 0.85em 0;" />`;
    };

    return md;
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
        return `<pre style="color: #ff6b6b; font-family: monospace;">Error: ${escapeHtmlLocal(e.message)}</pre>`;
      }
    },

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
      return escapeHtmlLocal(text);
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
