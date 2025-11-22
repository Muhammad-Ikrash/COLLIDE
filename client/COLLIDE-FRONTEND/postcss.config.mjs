// Local PostCSS configuration for the frontend dev server.
// This prevents Vite from walking up to a parent postcss.config.mjs that may require
// plugins (e.g. Tailwind) which are not installed in this project.
export default {
  plugins: {
    // keep empty or add project-scoped PostCSS plugins here
  }
};
