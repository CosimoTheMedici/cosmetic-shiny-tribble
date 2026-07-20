// ============================================================
// PROFIT & LOSS PAGE — Quarterly P&L statement (Admin)
// ============================================================
import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Loader2, Printer } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../lib/api'
import { formatKES } from '../lib/utils'
import { Select, Card, CardContent, CardHeader, CardTitle } from '../components/ui/index'
import { Button } from '../components/ui/button'

function PnLRow({ label, value, bold, color, indent }) {
  return (
    <div className={`flex justify-between py-2 ${bold ? 'font-semibold border-t border-border mt-1' : ''} ${indent ? 'pl-4 text-sm' : ''}`}>
      <span className={color || (bold ? 'text-foreground' : 'text-muted-foreground')}>{label}</span>
      <span className={color || (bold ? 'text-foreground' : 'text-muted-foreground')}>{value}</span>
    </div>
  )
}

export default function ProfitLossPage() {
  const currentYear = new Date().getFullYear()
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3)
  const [year, setYear] = useState(currentYear)
  const [quarter, setQuarter] = useState(currentQuarter)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const { data } = await api.get('/reports/pnl', { params: { year, quarter } })
        setData(data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [year, quarter])

  const quarterNames = { 1: 'Q1 (Jan–Mar)', 2: 'Q2 (Apr–Jun)', 3: 'Q3 (Jul–Sep)', 4: 'Q4 (Oct–Dec)' }

  const chartData = data?.monthly_breakdown?.map(m => ({
    month: m.month_name?.slice(0, 3),
    Revenue: parseFloat(m.revenue || 0),
    'Gross Profit': parseFloat(m.revenue || 0) - parseFloat(m.cogs || 0),
  })) || []

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      <div className="flex items-center justify-between no-print">
        <h1 className="font-display text-2xl font-semibold">Profit & Loss Statement</h1>
        <div className="flex gap-2">
          <Select value={year} onChange={e => setYear(parseInt(e.target.value))} className="w-28">
            {[currentYear - 1, currentYear, currentYear + 1].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </Select>
          <Select value={quarter} onChange={e => setQuarter(parseInt(e.target.value))} className="w-44">
            {[1, 2, 3, 4].map(q => <option key={q} value={q}>{quarterNames[q]}</option>)}
          </Select>
          <Button variant="outline" onClick={() => window.print()} className="gap-2">
            <Printer size={15} /> Print
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={28} /></div>
      ) : data && (
        <>
          {/* P&L Status Banner */}
          <div className={`rounded-xl p-5 flex items-center gap-4
            ${data.status === 'profit' ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
            {data.status === 'profit'
              ? <TrendingUp size={36} className="text-emerald-500 flex-shrink-0" />
              : <TrendingDown size={36} className="text-red-400 flex-shrink-0" />
            }
            <div>
              <p className={`font-display text-2xl font-bold ${data.status === 'profit' ? 'text-emerald-700' : 'text-red-600'}`}>
                {data.status === 'profit' ? '✅ Profitable' : '❌ Loss'} — {quarterNames[quarter]} {year}
              </p>
              <p className={`text-sm ${data.status === 'profit' ? 'text-emerald-600' : 'text-red-500'}`}>
                Net {data.status === 'profit' ? 'Profit' : 'Loss'}: {formatKES(Math.abs(data.net_profit))} ({data.net_margin}% margin)
              </p>
            </div>
          </div>

          {/* Monthly trend chart */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Monthly Breakdown</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(30,20%,92%)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => formatKES(v)} />
                    <Bar dataKey="Revenue" fill="hsl(340,60%,65%)" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Gross Profit" fill="hsl(160,50%,50%)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* P&L Statement */}
          <Card>
            <CardHeader>
              <CardTitle>Profit & Loss — {quarterNames[quarter]} {year}</CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border">
              {/* Income */}
              <div className="pb-3">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Income</p>
                <PnLRow label="Total Revenue (Sales)" value={formatKES(data.income.total_revenue)} />
                <PnLRow label="Cost of Goods Sold (COGS)" value={`(${formatKES(data.income.cost_of_goods_sold)})`} indent />
                <PnLRow label="Gross Profit" value={formatKES(data.income.gross_profit)} bold
                  color={data.income.gross_profit >= 0 ? 'text-emerald-600' : 'text-red-500'} />
                <PnLRow label="Gross Margin" value={`${data.income.gross_margin}%`} indent />
              </div>

              {/* Operating Expenses */}
              <div className="py-3">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Operating Expenses</p>
                {data.expenses.breakdown.map(exp => (
                  <PnLRow key={exp.category} label={exp.category} value={`(${formatKES(exp.total)})`} indent />
                ))}
                {data.expenses.breakdown.length === 0 && (
                  <p className="text-sm text-muted-foreground pl-4 py-1">No expenses recorded this period</p>
                )}
                <PnLRow label="Total Operating Expenses" value={`(${formatKES(data.expenses.total)})`} bold
                  color="text-red-500" />
              </div>

              {/* Net */}
              <div className="pt-3">
                <PnLRow
                  label={`Net ${data.status === 'profit' ? 'Profit' : 'Loss'}`}
                  value={formatKES(Math.abs(data.net_profit))}
                  bold
                  color={data.status === 'profit' ? 'text-emerald-600' : 'text-red-500'}
                />
                <PnLRow label="Net Margin" value={`${data.net_margin}%`} indent
                  color={data.status === 'profit' ? 'text-emerald-600' : 'text-red-500'} />
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
