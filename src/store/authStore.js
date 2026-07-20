// ============================================================
// AUTH STORE - Zustand global state for authentication
// Persists token + user to localStorage for page refreshes
// ============================================================
import { create } from 'zustand'
import api, { setActiveModule as persistActiveModule } from '../lib/api'

// Pick a sensible default active module: whatever was last used if the
// user still has access to it, otherwise the user's first assigned module.
function resolveActiveModule(user) {
  const stored = localStorage.getItem('cosmetix_active_module')
  const modules = user?.modules || []
  if (stored && modules.some(m => m.key_name === stored)) return stored
  return modules[0]?.key_name || null
}

const initialUser = JSON.parse(localStorage.getItem('cosmetix_user') || 'null')

const useAuthStore = create((set, get) => ({
  user: initialUser,
  token: localStorage.getItem('cosmetix_token') || null,
  activeModule: resolveActiveModule(initialUser),
  isLoading: false,
  error: null,

  // Login action — fetches token and stores in localStorage
  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await api.post('/auth/login', { email, password })
      localStorage.setItem('cosmetix_token', data.token)
      localStorage.setItem('cosmetix_user', JSON.stringify(data.user))
      const activeModule = resolveActiveModule(data.user)
      persistActiveModule(activeModule)
      set({ user: data.user, token: data.token, activeModule, isLoading: false })
      return { success: true }
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed'
      set({ error: message, isLoading: false })
      return { success: false, message }
    }
  },

  // Logout — clear everything
  logout: () => {
    localStorage.removeItem('cosmetix_token')
    localStorage.removeItem('cosmetix_user')
    persistActiveModule(null)
    set({ user: null, token: null, activeModule: null })
  },

  // Switch which module (cosmetics/bookshop/...) the app is currently scoped to
  setActiveModule: (moduleKey) => {
    persistActiveModule(moduleKey)
    set({ activeModule: moduleKey })
  },

  // Check if current user is admin
  isAdmin: () => {
    const user = JSON.parse(localStorage.getItem('cosmetix_user') || 'null')
    return user?.role === 'admin'
  },
}))

export default useAuthStore
