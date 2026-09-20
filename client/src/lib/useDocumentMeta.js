import { useEffect } from "react";

function setMetaTag(attr, key, content) {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

// Small, dependency-free per-page metadata hook — sets document.title plus
// description/Open Graph/Twitter meta tags for as long as the page is
// mounted, then restores the site defaults (from index.html) on unmount so
// navigating away doesn't leave a stale hotel's title/description behind.
// Deliberately not react-helmet or similar: this app doesn't need a whole
// metadata library for a handful of dynamic fields on a few pages.
export function useDocumentMeta({ title, description, image, url }) {
  useEffect(() => {
    const prevTitle = document.title;
    if (title) document.title = title;
    if (description) setMetaTag("name", "description", description);
    setMetaTag("property", "og:title", title);
    setMetaTag("property", "og:description", description);
    setMetaTag("property", "og:image", image);
    setMetaTag("property", "og:url", url || window.location.href);
    setMetaTag("name", "twitter:title", title);
    setMetaTag("name", "twitter:description", description);
    setMetaTag("name", "twitter:image", image);

    return () => { document.title = prevTitle; };
  }, [title, description, image, url]);
}

// Injects/replaces a single JSON-LD <script> block, removed on unmount.
export function useJsonLd(data) {
  useEffect(() => {
    if (!data) return;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(data);
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, [JSON.stringify(data)]);
}
