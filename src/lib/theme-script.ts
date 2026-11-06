export const THEME_STORAGE_KEY = "cvision-theme";

/**
 * Inline script for <head>: applies the saved (or system) theme before first paint,
 * so there is no flash of the wrong theme.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.classList.toggle("dark",t==="dark")}catch(e){}})();`;
