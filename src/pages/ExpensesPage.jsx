// ============================================================
// EXPENSES PAGE — Daily expense tracking (Admin)
// ============================================================
import { useState, useEffect } from 'react'
import { Plus, Trash2, Loader2, Wallet } from 'lucide-react'
import api from '../lib/api'
import { formatKES, formatDate, today } from '../lib/utils'
import { Input, Label, Select, Card, CardContent, CardHeader, CardTitle } from '../components/ui/index'
import { Button } from '../components/ui/button'
import { useToast, ToastContainer } from '../hooks/useToast'

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([])
  const [summary, setSummary] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ date_from: today(), date_to: today() })
  const [form, setForm] = useState({
    category: '', description: '', amount: '', receipt_no: '', expense_date: today()
  })
  const [saving, setSaving] = useState(false)
  const { toasts, toast, dismiss } = useToast()

  async function load() {
    setLoading(true)
    try {
      const [expRes, catRes] = await Promise.all([
        api.get('/expenses', { params: filters }),
        api.get('/expenses/meta/categories')
      ])
      setExpenses(expRes.data.expenses)
      setSummary(expRes.data.summary)
      setCategories(catRes.data.categories)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [filters.date_from, filters.date_to])

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.description || !form.amount) return
    setSaving(true)
    try {
      await api.post('/expenses', form)
      toast({ title: 'Expense recorded', variant: 'success' })
      setForm({ category: '', description: '', amount: '', receipt_no: '', expense_date: today() })
      load()
    } catch (err) {
      toast({ title: 'Error', description: err.response?.data?.message, variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this expense?')) return
    try {
      await api.delete(`/expenses/${id}`)
      toast({ title: 'Expense deleted', variant: 'success' })
      load()
    } catch {
      toast({ title: 'Error deleting', variant: 'error' })
    }
  }

  const totalExpenses = expenses.reduce((s, e) => s + parseFloat(e.amount), 0)

  return (
    <div className="max-w-5xl space-y-6 animate-fade-in">
      <ToastContainer toasts={toasts} dismiss={dismiss} />
      <h1 className="font-display text-2xl font-semibold">Expenses</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add expense form */}
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-base">Record Expense</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <Label className="text-xs">Date</Label>
                <Input type="date" value={form.expense_date}
                  onChange={e => setForm(p => ({ ...p, expense_date: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Category</Label>
                <Select value={form.category}
                  onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="mt-1">
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
              </div>
              <div>
                <Label className="text-xs">Description *</Label>
                <Input value={form.description} required
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="e.g. Electricity bill payment" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Amount (KES) *</Label>
                <Input type="number" step="0.01" min="1" value={form.amount} required
                  onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                  placeholder="0.00" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Receipt No. (optional)</Label>
                <Input value={form.receipt_no}
                  onChange={e => setForm(p => ({ ...p, receipt_no: e.target.value }))}
                  placeholder="Receipt or ref number" className="mt-1" />
              </div>
              <Button type="submit" className="w-full gap-2" disabled={saving}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Add Expense
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Right side: list + summary */}
        <div className="lg:col-span-2 space-y-4">
          {/* Date filter + total */}
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Label className="text-xs">From</Label>
              <Input type="date" value={filters.date_from}
                onChange={e => setFilters(p => ({ ...p, date_from: e.target.value }))} className="mt-1" />
            </div>
            <div className="flex-1">
              <Label className="text-xs">To</Label>
              <Input type="date" value={filters.date_to}
                onChange={e => setFilters(p => ({ ...p, date_to: e.target.value }))} className="mt-1" />
            </div>
          </div>

          {/* Category summary */}
          {summary.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">By Category</CardTitle></CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {summary.map(s => (
                    <div key={s.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="text-sm">{s.category}</span>
                        <span className="text-xs text-muted-foreground">({s.count})</span>
                      </div>
                      <span className="text-sm font-semibold">{formatKES(s.total)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 border-t border-border font-semibold">
                    <span>Total</span>
                    <span className="text-red-500">{formatKES(totalExpenses)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Expenses list */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="5" className="text-center py-6 text-muted-foreground">Loading...</td></tr>
                  ) : expenses.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-8 text-muted-foreground">
                      <Wallet size={28} className="mx-auto mb-2 opacity-30" />
                      No expenses for this period
                    </td></tr>
                  ) : expenses.map(exp => (
                    <tr key={exp.id}>
                      <td className="text-xs text-muted-foreground">{formatDate(exp.expense_date)}</td>
                      <td><span className="badge-warning">{exp.category || 'Other'}</span></td>
                      <td className="text-sm">
                        <p>{exp.description}</p>
                        {exp.receipt_no && <p className="text-xs text-muted-foreground">Ref: {exp.receipt_no}</p>}
                      </td>
                      <td className="font-semibold text-red-500">{formatKES(exp.amount)}</td>
                      <td>
                        <button onClick={() => handleDelete(exp.id)}
                          className="text-muted-foreground hover:text-destructive p-1">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
