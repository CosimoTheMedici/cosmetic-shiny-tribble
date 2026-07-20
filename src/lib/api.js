// ============================================================
// API CLIENT - Axios instance with JWT auth + error handling
// All API calls go through this single configured instance
// ============================================================
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// These resource paths live under a module (e.g. /api/cosmetics/products,
// /api/bookshop/products) rather than being shop-wide. Anything else
// (auth, reports, expenses, reconciliation, modules) stays unprefixed.
const MODULE_SCOPED_PREFIXES = ['/products', '/categories', '/sales']

export function getActiveModule() {
  return localStorage.getItem('cosmetix_active_module') || null
}

export function setActiveModule(moduleKey) {
  if (moduleKey) localStorage.setItem('cosmetix_active_module', moduleKey)
  else localStorage.removeItem('cosmetix_active_module')
}

// Attach JWT token to every request automatically, and prefix
// module-scoped resource paths with the currently active module.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cosmetix_token')
  if (token) config.headers.Authorization = `Bearer ${token}`

  const activeModule = getActiveModule()
  const isModuleScoped = MODULE_SCOPED_PREFIXES.some(
    (p) => config.url === p || config.url.startsWith(`${p}/`) || config.url.startsWith(`${p}?`)
  )
  if (activeModule && isModuleScoped) {
    config.url = `/${activeModule}${config.url}`
  }
  return config
})

// Handle 401 (token expired) — redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('cosmetix_token')
      localStorage.removeItem('cosmetix_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
