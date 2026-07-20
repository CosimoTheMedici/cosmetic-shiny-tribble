// //============================================================
// // APP LAYOUT — Sidebar + topbar shell for all protected pages
// // ============================================================
// import { Outlet, NavLink, useNavigate } from 'react-router-dom'
// import {
//   LayoutDashboard, ShoppingCart, History, Package, TrendingUp,
//   Receipt, AlertTriangle, Users, LogOut, ChevronDown,
//   Wallet, FileBarChart, BookOpen, Sparkles
// } from 'lucide-react'
// import useAuthStore from '../../store/authStore'
// import { useState } from 'react'

// const NAV_ATTENDANT = [
//   { to: '/pos', icon: ShoppingCart, label: 'Point of Sale' },
//   { to: '/sales', icon: History, label: 'Sales History' },
//   { to: '/inventory', icon: Package, label: 'Inventory' },
// ]

// const NAV_ADMIN = [
//   { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
//   { to: '/pos', icon: ShoppingCart, label: 'Point of Sale' },
//   { to: '/sales', icon: History, label: 'Sales History' },
//   { to: '/inventory', icon: Package, label: 'Inventory' },
//   { to: '/inventory/low-stock', icon: AlertTriangle, label: 'Low Stock Alert' },
//   { to: '/reconciliation', icon: Receipt, label: 'Reconciliation' },
//   { to: '/expenses', icon: Wallet, label: 'Expenses' },
//   {
//     label: 'Reports', icon: TrendingUp, children: [
//       { to: '/reports', label: 'Sales Analytics' },
//       { to: '/reports/pnl', label: 'Profit & Loss' },
//       { to: '/reports/balance-sheet', label: 'Balance Sheet' },
//     ]
//   },
//   { to: '/users', icon: Users, label: 'Staff & Users' },
// ]

// function NavItem({ item }) {
//   const [open, setOpen] = useState(false)

//   if (item.children) {
//     return (
//       <div>
//         <button
//           onClick={() => setOpen(!open)}
//           className="nav-link w-full justify-between"
//         >
//           <span className="flex items-center gap-3">
//             <item.icon size={17} />
//             {item.label}
//           </span>
//           <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
//         </button>
//         {open && (
//           <div className="ml-8 mt-1 flex flex-col gap-0.5">
//             {item.children.map(child => (
//               <NavLink
//                 key={child.to}
//                 to={child.to}
//                 className={({ isActive }) =>
//                   `text-sm py-1.5 px-2 rounded-md transition-colors ${isActive
//                     ? 'text-primary font-medium'
//                     : 'text-muted-foreground hover:text-foreground'}`
//                 }
//               >
//                 {child.label}
//               </NavLink>
//             ))}
//           </div>
//         )}
//       </div>
//     )
//   }

//   return (
//     <NavLink
//       to={item.to}
//       className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
//     >
//       <item.icon size={18} className="flex-shrink-0" />
//       {item.label}
//     </NavLink>
//   )
// }

// export default function AppLayout() {
//   const { user, logout } = useAuthStore()
//   const navigate = useNavigate()
//   const isAdmin = user?.role === 'admin'
//   const navItems = isAdmin ? NAV_ADMIN : NAV_ATTENDANT

//   function handleLogout() {
//     logout()
//     navigate('/login')
//   }

//   return (
//     <div className="flex h-screen overflow-hidden bg-background">
//       {/* ====== SIDEBAR ====== */}
//       <aside className="w-60 flex flex-col border-r border-border bg-card flex-shrink-0">
//         {/* Logo */}
//         <div className="px-5 py-5 border-b border-border">
//           <div className="flex items-center gap-2">
//             <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
//               <Sparkles size={16} className="text-white" />
//             </div>
//             <div>
//               <p className="font-display font-semibold text-sm leading-none">Cosmetix</p>
//               <p className="text-xs text-muted-foreground mt-0.5">Shop Manager</p>
//             </div>
//           </div>
//         </div>

//         {/* Navigation */}
//         <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-0.5">
//           {navItems.map((item) => (
//             <NavItem key={item.to || item.label} item={item} />
//           ))}
//         </nav>

//         {/* User info + logout */}
//         <div className="px-3 py-4 border-t border-border">
//           <div className="flex items-center gap-3 px-2 mb-2">
//             <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold">
//               {user?.name?.[0]?.toUpperCase()}
//             </div>
//             <div className="flex-1 min-w-0">
//               <p className="text-sm font-medium truncate">{user?.name}</p>
//               <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
//             </div>
//           </div>
//           <button
//             onClick={handleLogout}
//             className="nav-link w-full text-destructive hover:text-destructive hover:bg-destructive/10"
//           >
//             <LogOut size={16} />
//             Sign Out
//           </button>
//         </div>
//       </aside>

//       {/* ====== MAIN CONTENT ====== */}
//       <main className="flex-1 overflow-y-auto">
//         <div className="min-h-full p-6">
//           <Outlet />
//         </div>
//       </main>
//     </div>
//   )
// }



// ============================================================
// APP LAYOUT — Responsive Sidebar + Topbar shell for all protected pages
// ============================================================
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, ShoppingCart, History, Package, TrendingUp,
  Receipt, AlertTriangle, Users, LogOut, ChevronDown,
  Wallet, FileBarChart, BookOpen, Sparkles, Menu, X, Layers
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import { Button } from '../ui/button'
import { useState, useEffect } from 'react'

// Simple label/icon lookup for known modules — falls back gracefully
// if an admin adds a new module key we don't recognize yet.
const MODULE_META = {
  cosmetics: { label: 'Cosmetics', icon: Sparkles },
  bookshop: { label: 'Bookshop', icon: BookOpen },
}
function moduleMeta(keyName) {
  return MODULE_META[keyName] || { label: keyName, icon: Layers }
}

// Module switcher — only rendered when the user has access to more than one module
function ModuleSwitcher({ modules, activeModule, onSwitch, isCollapsed }) {
  const [open, setOpen] = useState(false)
  if (!modules || modules.length < 2) return null

  const current = modules.find(m => m.key_name === activeModule) || modules[0]
  const CurrentIcon = moduleMeta(current.key_name).icon

  return (
    <div className="relative px-2 pb-2">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg border border-border bg-muted/40 hover:bg-muted transition-colors ${isCollapsed ? 'justify-center' : 'justify-between'}`}
      >
        <span className="flex items-center gap-2 text-sm font-medium">
          <CurrentIcon size={16} />
          {!isCollapsed && moduleMeta(current.key_name).label}
        </span>
        {!isCollapsed && <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />}
      </button>
      {open && (
        <div className="absolute left-2 right-2 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          {modules.map(m => {
            const Icon = moduleMeta(m.key_name).icon
            return (
              <button
                key={m.key_name}
                onClick={() => { onSwitch(m.key_name); setOpen(false) }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-muted transition-colors ${m.key_name === current.key_name ? 'text-primary font-medium' : ''}`}
              >
                <Icon size={15} /> {moduleMeta(m.key_name).label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

const NAV_ATTENDANT = [
  { to: '/pos', icon: ShoppingCart, label: 'Point of Sale' },
  { to: '/sales', icon: History, label: 'Sales History' },
  { to: '/inventory', icon: Package, label: 'Inventory' },
]

const NAV_ADMIN = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/pos', icon: ShoppingCart, label: 'Point of Sale' },
  { to: '/sales', icon: History, label: 'Sales History' },
  { to: '/inventory', icon: Package, label: 'Inventory' },
  { to: '/inventory/low-stock', icon: AlertTriangle, label: 'Low Stock Alert' },
  { to: '/reconciliation', icon: Receipt, label: 'Reconciliation' },
  { to: '/expenses', icon: Wallet, label: 'Expenses' },
  {
    label: 'Reports', icon: TrendingUp, children: [
      { to: '/reports', label: 'Sales Analytics' },
      { to: '/reports/pnl', label: 'Profit & Loss' },
      { to: '/reports/balance-sheet', label: 'Balance Sheet' },
    ]
  },
  { to: '/users', icon: Users, label: 'Staff & Users' },
]

function NavItem({ item, isCollapsed, onNavigate }) {
  const [open, setOpen] = useState(false)

  // Auto-close dropdown when sidebar is collapsed
  useEffect(() => {
    if (isCollapsed) setOpen(false)
  }, [isCollapsed])

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => !isCollapsed && setOpen(!open)}
          className={`nav-link w-full ${isCollapsed ? 'justify-center' : 'justify-between'} relative group`}
          title={isCollapsed ? item.label : ''}
        >
          <span className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
            <item.icon size={18} className="flex-shrink-0" />
            {!isCollapsed && item.label}
          </span>
          {!isCollapsed && <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />}
          
          {/* Tooltip for collapsed mode */}
          {isCollapsed && (
            <span className="absolute left-full ml-2 px-2 py-1 bg-foreground text-background text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
              {item.label}
            </span>
          )}
        </button>
        
        {!isCollapsed && open && (
          <div className="ml-6 mt-1 flex flex-col gap-0.5">
            {item.children.map(child => (
              <NavLink
                key={child.to}
                to={child.to}
                onClick={() => onNavigate?.()}
                className={({ isActive }) =>
                  `text-sm py-1.5 px-2 rounded-md transition-colors ${isActive
                    ? 'text-primary font-medium bg-primary/5'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`
                }
              >
                {child.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <NavLink
      to={item.to}
      onClick={() => onNavigate?.()}
      className={({ isActive }) => 
        `nav-link ${isActive ? 'active' : ''} ${isCollapsed ? 'justify-center' : ''} group relative`
      }
      title={isCollapsed ? item.label : ''}
    >
      <item.icon size={18} className="flex-shrink-0" />
      {!isCollapsed && item.label}
      
      {/* Tooltip for collapsed mode */}
      {isCollapsed && (
        <span className="absolute left-full ml-2 px-2 py-1 bg-foreground text-background text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
          {item.label}
        </span>
      )}
    </NavLink>
  )
}

export default function AppLayout() {
  const { user, logout, activeModule, setActiveModule } = useAuthStore()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'admin'
  const navItems = isAdmin ? NAV_ADMIN : NAV_ATTENDANT

  // Switching modules changes what /products, /categories and /sales
  // resolve to server-side, so we do a full reload to keep every page
  // (inventory, POS, sales history, etc.) in sync with the new scope.
  function handleSwitchModule(moduleKey) {
    setActiveModule(moduleKey)
    window.location.reload()
  }
  
  // State for responsive behavior
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Check screen size on mount and resize
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024)
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false) // Close mobile sidebar on desktop
      }
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  function closeMobileSidebar() {
    setIsMobileOpen(false)
  }

  // Edge case: an attendant was created without any module assigned yet.
  // Rather than silently showing empty pages, tell them clearly.
  if (!isAdmin && (!user?.modules || user.modules.length === 0)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-6 text-center">
        <div className="max-w-sm space-y-3">
          <p className="font-display text-lg font-semibold">No module access yet</p>
          <p className="text-sm text-muted-foreground">
            Your account hasn't been assigned to a module (Cosmetics or Bookshop) yet.
            Ask an admin to grant you access from Staff & Users.
          </p>
          <Button variant="outline" onClick={handleLogout}>Sign Out</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background relative">
      
      {/* Mobile Menu Button - Only visible on mobile/tablet */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-card rounded-xl shadow-lg border border-border hover:bg-muted transition-colors"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* ====== SIDEBAR ====== */}
      <aside className={`
        flex flex-col border-r border-border bg-card
        transition-all duration-300 ease-in-out
        ${isSidebarCollapsed && !isMobile ? 'w-20' : 'w-64'}
        ${isMobileOpen ? 'fixed left-0 z-40' : 'hidden lg:flex'}
        h-full flex-shrink-0 shadow-xl lg:shadow-none
      `}>
        
        {/* Sidebar Header with controls */}
        <div className="px-4 py-5 border-b border-border flex items-center justify-between">
          {(!isSidebarCollapsed || isMobile) && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                <Sparkles size={16} className="text-white" />
              </div>
              <div>
                <p className="font-display font-semibold text-sm leading-none">Cosmetix</p>
                {(!isSidebarCollapsed || isMobile) && (
                  <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">Shop Manager</p>
                )}
              </div>
            </div>
          )}
          
          <div className="flex gap-2">
            {/* Desktop collapse button - Hidden on mobile */}
            {!isMobile && (
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <ChevronDown size={16} className={`transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-90' : '-rotate-90'}`} />
              </button>
            )}
            
            {/* Mobile close button */}
            {isMobile && (
              <button
                onClick={closeMobileSidebar}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors lg:hidden"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Module switcher — only shows up if the user has access to 2+ modules */}
        <ModuleSwitcher
          modules={user?.modules}
          activeModule={activeModule}
          onSwitch={handleSwitchModule}
          isCollapsed={isSidebarCollapsed && !isMobile}
        />

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-4 flex flex-col gap-1 custom-scrollbar">
          {navItems.map((item) => (
            <NavItem 
              key={item.to || item.label} 
              item={item} 
              isCollapsed={isSidebarCollapsed && !isMobile}
              onNavigate={closeMobileSidebar}
            />
          ))}
        </nav>

        {/* User info + logout */}
        <div className="px-2 py-4 border-t border-border">
          <div className={`
            flex items-center gap-3 px-2 mb-3
            ${isSidebarCollapsed && !isMobile ? 'justify-center' : ''}
          `}>
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold flex-shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            {(!isSidebarCollapsed || isMobile) && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
              </div>
            )}
          </div>
          
          <button
            onClick={handleLogout}
            className={`
              nav-link text-destructive hover:text-destructive hover:bg-destructive/10
              ${isSidebarCollapsed && !isMobile ? 'justify-center px-2' : 'w-full justify-start'}
              group relative
            `}
            title={isSidebarCollapsed && !isMobile ? 'Sign Out' : ''}
          >
            <LogOut size={16} className="flex-shrink-0" />
            {(!isSidebarCollapsed || isMobile) && <span className="ml-3">Sign Out</span>}
            
            {/* Tooltip for collapsed mode */}
            {isSidebarCollapsed && !isMobile && (
              <span className="absolute left-full ml-2 px-2 py-1 bg-destructive text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                Sign Out
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Backdrop overlay - Mobile only when sidebar is open */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden animate-fade-in"
          onClick={closeMobileSidebar}
          aria-label="Close menu"
        />
      )}

      {/* ====== MAIN CONTENT ====== */}
      <main className={`
        flex-1 overflow-y-auto w-full transition-all duration-300
        ${isSidebarCollapsed && !isMobile ? 'lg:ml-0' : 'lg:ml-0'}
      `}>
        <div className={`
          min-h-full 
          p-3 sm:p-4 md:p-6 
          pt-16 lg:pt-6
          ${isMobileOpen ? 'overflow-hidden' : ''}
        `}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
