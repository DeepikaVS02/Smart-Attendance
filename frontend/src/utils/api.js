/**
 * api.js — Central API base URL resolver.
 *
 * In development: Vite proxy handles /api/* → http://127.0.0.1:8000
 * In production (Render): VITE_API_URL env var points to the deployed backend.
 *
 * Usage:  import { API } from '../utils/api';
 *         fetch(`${API}/api/students`)
 */

// VITE_API_URL is injected at build time via Render environment variables.
// Leave it empty in dev so relative /api/ paths work with the Vite proxy.
export const API = import.meta.env.VITE_API_URL || '';
