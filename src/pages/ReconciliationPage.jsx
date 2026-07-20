// ============================================================
// RECONCILIATION PAGE — End-of-day cash reconciliation (Admin)
// ============================================================
import { useState, useEffect } from 'react'
import { CheckCircle, Loader2, TrendingUp, TrendingDown } from 'lucide-react'
import api from '../lib/api'
import { formatKES, formatPercent, today } from '../lib/utils'
import { Input, Label, Card, CardContent, CardHeader, CardTitle } from '../components/ui/index'
import { Button } from '../components/ui/button'
import { useToast, ToastContainer } from '../hooks/useToast'

export default function ReconciliationPage() {
  const [recon, setRecon] = useState(null)
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(today())
  const [actualCash, setActualCash] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { toasts, toast, dismiss } = useToast()

  async function loadRecon() {
    setLoading(true)
    try {
      const { data } = await api.get('/reconciliation/today', { params: { date } })
      setRecon(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadRecon() }, [date])

  async function handleSubmit() {
    if (!actualCash) return
    setSubmitting(true)
    try {
      const { data } = await api.post('/reconciliation', {
        reconciliation_date: date, actual_cash: actualCash, notes
      })
      toast({ title: 'Reconciliation saved', description: data.status, variant: 'success' })
    } catch (err) {
      toast({ title: 'Error', description: err.response?.data?.message, variant: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const s = recon?.summary || {}
  const comp = recon?.comparison || {}
  const expectedCash = parseFloat(s.cash_total || 0)
  const variance = parseFloat(actualCash || 0) - expectedCash

  return (
    <div className="max-w-4xl space-y-6 animate-fade-in">
      <ToastContainer toasts={toasts} dismiss={dismiss} />
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Daily Reconciliation</h1>
        <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-44" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={28} /></div>
      ) : (
        <>
          {/* Sales comparison */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Sales', value: formatKES(s.total_sales) },
              { label: 'Cash Sales', value: formatKES(s.cash_total) },
              { label: 'M-Pesa', value: formatKES(s.mpesa_total) },
              { label: 'Transactions', value: s.total_transactions },
            ].map(item => (
              <div key={item.label} className="stat-card text-center">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-xl font-display font-semibold mt-1">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Day comparison */}
          {comp.change_percent !== null && (
            <Card className={`border-2 ${comp.change_direction === 'up' ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
              <CardContent className="pt-4 flex items-center gap-4">
                {comp.change_direction === 'up' ? (
                  <TrendingUp className="text-emerald-600" size={28} />
                ) : (
                  <TrendingDown className="text-red-500" size={28} />
                )}
                <div>
                  <p className="font-semibold">
                    {comp.change_direction === 'up' ? '📈 Sales up' : '📉 Sales down'} {Math.abs(comp.change_percent)}% vs yesterday
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Yesterday: {formatKES(comp.yesterday_sales)} → Today: {formatKES(comp.today_sales)}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* P&L for the day */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Gross Profit', value: formatKES(s.total_profit), color: 'text-emerald-600' },
              { label: 'Total Expenses', value: formatKES(s.total_expenses), color: 'text-red-500' },
              { label: 'Net Revenue', value: formatKES(s.net_revenue), color: parseFloat(s.net_revenue) >= 0 ? 'text-emerald-600' : 'text-red-500' },
            ].map(item => (
              <div key={item.label} className="stat-card text-center">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className={`text-xl font-display font-semibold mt-1 ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>

          {/* By attendant */}
          {recon?.by_attendant?.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Sales by Attendant</CardTitle></CardHeader>
              <CardContent>
                <table className="w-full data-table">
                  <thead><tr><th>Attendant</th><th>Transactions</th><th>Total Sales</th></tr></thead>
                  <tbody>
                    {recon.by_attendant.map(a => (
                      <tr key={a.attendant}>
                        <td>{a.attendant}</td>
                        <td>{a.transactions}</td>
                        <td className="font-semibold">{formatKES(a.sales_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {/* Cash reconciliation form */}
          <Card>
            <CardHeader><CardTitle>Cash Count Reconciliation</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <span className="text-sm text-muted-foreground">Expected Cash (system)</span>
                <span className="font-semibold">{formatKES(expectedCash)}</span>
              </div>
              <div>
                <Label>Actual Cash in Till (KES)</Label>
                <Input type="number" step="0.01" value={actualCash}
                  onChange={e => setActualCash(e.target.value)} placeholder="Count and enter actual cash"
                  className="mt-1 text-lg" />
              </div>
              {actualCash && (
                <div className={`p-3 rounded-lg font-semibold flex justify-between
                  ${Math.abs(variance) < 1 ? 'bg-emerald-50 text-emerald-700' : variance > 0 ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'}`}>
                  <span>Variance</span>
                  <span>{variance > 0 ? '+' : ''}{formatKES(variance)}
                    {Math.abs(variance) < 1 ? ' ✅ Balanced' : variance > 0 ? ' ⚠️ Surplus' : ' ⚠️ Shortage'}
                  </span>
                </div>
              )}
              <div>
                <Label>Notes</Label>
                <Input value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Any notes about variance or cash handling" className="mt-1" />
              </div>
              <Button onClick={handleSubmit} disabled={submitting || !actualCash} className="w-full gap-2">
                {submitting ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                Submit Reconciliation for {date}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
