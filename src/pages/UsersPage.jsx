// ============================================================
// USERS PAGE — Manage staff/attendant accounts + module access (Admin)
// ============================================================
import { useState, useEffect } from 'react'
import { Users, Plus, ToggleLeft, ToggleRight, Loader2, Check } from 'lucide-react'
import api from '../lib/api'
import { formatDate } from '../lib/utils'
import { Input, Label, Select, Card, Badge } from '../components/ui/index'
import { Button } from '../components/ui/button'
import { useToast, ToastContainer } from '../hooks/useToast'

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [modules, setModules] = useState([]) // all modules in the system, e.g. cosmetics + bookshop
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'attendant', moduleIds: [] })
  const [saving, setSaving] = useState(false)
  const [savingModulesFor, setSavingModulesFor] = useState(null) // user id currently being updated
  const { toasts, toast, dismiss } = useToast()

  async function load() {
    try {
      const [usersRes, modulesRes] = await Promise.all([
        api.get('/auth/users'),
        api.get('/modules/all'),
      ])
      setUsers(usersRes.data.users)
      setModules(modulesRes.data.modules)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  function toggleFormModule(moduleId) {
    setForm(p => ({
      ...p,
      moduleIds: p.moduleIds.includes(moduleId)
        ? p.moduleIds.filter(id => id !== moduleId)
        : [...p.moduleIds, moduleId]
    }))
  }

  async function handleCreate(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/auth/register', form)
      toast({ title: 'User created', description: `${form.name} can now log in.`, variant: 'success' })
      setForm({ name: '', email: '', password: '', role: 'attendant', moduleIds: [] })
      setShowForm(false)
      load()
    } catch (err) {
      toast({ title: 'Error', description: err.response?.data?.message, variant: 'error' })
    } finally { setSaving(false) }
  }

  async function toggleUser(user) {
    try {
      await api.put(`/auth/users/${user.id}/toggle`)
      toast({ title: `${user.name} ${user.is_active ? 'deactivated' : 'activated'}`, variant: 'success' })
      load()
    } catch (err) {
      toast({ title: 'Error', description: err.response?.data?.message, variant: 'error' })
    }
  }

  // Toggle a single module on/off for an existing user (admins always see
  // everything regardless of assignment, so this is mainly for attendants)
  async function toggleUserModule(user, moduleId) {
    const current = (user.modules || []).map(m => m.id)
    const next = current.includes(moduleId)
      ? current.filter(id => id !== moduleId)
      : [...current, moduleId]

    setSavingModulesFor(user.id)
    try {
      await api.put(`/auth/users/${user.id}/modules`, { moduleIds: next })
      load()
    } catch (err) {
      toast({ title: 'Error', description: err.response?.data?.message, variant: 'error' })
    } finally {
      setSavingModulesFor(null)
    }
  }

  return (
    <div className="max-w-4xl space-y-6 animate-fade-in">
      <ToastContainer toasts={toasts} dismiss={dismiss} />
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Staff & Users</h1>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus size={15} /> Add Staff
        </Button>
      </div>

      {/* Add user form */}
      {showForm && (
        <Card>
          <div className="p-6">
            <h2 className="font-semibold mb-4">Create New User Account</h2>
            <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Full Name *</Label>
                <Input value={form.name} required onChange={e => setForm(p => ({...p, name: e.target.value}))}
                  placeholder="e.g. Jane Wanjiku" className="mt-1" />
              </div>
              <div>
                <Label>Email Address *</Label>
                <Input type="email" value={form.email} required
                  onChange={e => setForm(p => ({...p, email: e.target.value}))}
                  placeholder="jane@cosmetix.co.ke" className="mt-1" />
              </div>
              <div>
                <Label>Password *</Label>
                <Input type="password" value={form.password} required minLength={8}
                  onChange={e => setForm(p => ({...p, password: e.target.value}))}
                  placeholder="Min 8 characters" className="mt-1" />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={form.role} onChange={e => setForm(p => ({...p, role: e.target.value}))} className="mt-1">
                  <option value="attendant">Attendant (Sales Only)</option>
                  <option value="admin">Admin (Full Access)</option>
                </Select>
              </div>

              <div className="col-span-2">
                <Label>Module Access</Label>
                {form.role === 'admin' ? (
                  <p className="text-xs text-muted-foreground mt-1">Admins automatically get every module — no need to pick.</p>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground mt-1 mb-2">
                      Choose which module(s) this attendant can see. Pick both to let them view Bookshop and Cosmetics.
                    </p>
                    <div className="flex gap-3 flex-wrap">
                      {modules.map(m => (
                        <label key={m.id} className="flex items-center gap-2 text-sm border border-border rounded-lg px-3 py-2 cursor-pointer hover:bg-muted">
                          <input
                            type="checkbox"
                            checked={form.moduleIds.includes(m.id)}
                            onChange={() => toggleFormModule(m.id)}
                          />
                          {m.name}
                        </label>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-end gap-2 col-span-2">
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? <Loader2 size={14} className="animate-spin mr-2" /> : null} Create User
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      {/* Users table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Modules</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="text-center py-8 text-muted-foreground">Loading...</td></tr>
              ) : users.map(u => (
                <tr key={u.id}>
                  <td className="font-medium">{u.name}</td>
                  <td className="text-sm text-muted-foreground">{u.email}</td>
                  <td>
                    <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                      {u.role}
                    </Badge>
                  </td>
                  <td>
                    {u.role === 'admin' ? (
                      <span className="text-xs text-muted-foreground italic">All (admin)</span>
                    ) : (
                      <div className="flex gap-2 flex-wrap">
                        {modules.map(m => {
                          const has = (u.modules || []).some(um => um.id === m.id)
                          return (
                            <button
                              key={m.id}
                              disabled={savingModulesFor === u.id}
                              onClick={() => toggleUserModule(u, m.id)}
                              title={has ? `Remove ${m.name} access` : `Grant ${m.name} access`}
                              className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition-colors ${
                                has
                                  ? 'border-primary/40 bg-primary/10 text-primary'
                                  : 'border-border text-muted-foreground hover:bg-muted'
                              }`}
                            >
                              {has && <Check size={11} />}
                              {m.name}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </td>
                  <td>
                    <Badge variant={u.is_active ? 'success' : 'destructive'}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="text-sm text-muted-foreground">{formatDate(u.created_at)}</td>
                  <td>
                    <button onClick={() => toggleUser(u)}
                      className={`flex items-center gap-1 text-xs ${u.is_active ? 'text-red-500 hover:text-red-700' : 'text-emerald-600 hover:text-emerald-800'}`}>
                      {u.is_active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="bg-secondary/50 rounded-xl p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">Role & Module Permissions</p>
        <p><strong>Admin:</strong> Full access — dashboard, reports, expenses, reconciliation, user management, and every module (Cosmetics + Bookshop).</p>
        <p className="mt-1"><strong>Attendant:</strong> Point of Sale, their own sales history, and read-only inventory — scoped to whichever module(s) they're assigned above. An attendant assigned only "Bookshop" only ever sees Bookshop data; assign both to let them switch between modules.</p>
      </div>
    </div>
  )
}
