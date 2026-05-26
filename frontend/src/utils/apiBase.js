// API base URL — empty string when frontend + backend are on the SAME origin
// (i.e. deployed together on Render as a single service).
// Set VITE_API_URL only if you ever split them to separate services.
const API_BASE = import.meta.env.VITE_API_URL || '';

export default API_BASE;

