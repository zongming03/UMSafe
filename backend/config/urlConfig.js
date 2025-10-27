// URL config for dynamic hostname and admin prefix
// Usage: import { HOSTNAME, ADMIN_PREFIX } from '../config/urlConfig.js';
// HOSTNAME will default to 'http://localhost:3000' if not set in env
const HOSTNAME = process.env.HOSTNAME || 'http://localhost:3000';
const ADMIN_PREFIX = '/admin';
export { HOSTNAME, ADMIN_PREFIX };