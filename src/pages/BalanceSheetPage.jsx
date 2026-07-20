// ============================================================
// BALANCE SHEET PAGE — Monthly simplified balance sheet (Admin)
// ============================================================
import { useState, useEffect } from 'react'
import { Loader2, Printer } from 'lucide-react'
import api from '../lib/api'
import { formatKES } from '../lib/utils'
import { Select, Card, CardContent, CardHeader, CardTitle } from '../components/ui/index'
import { Button } from '../components/ui/button'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function BalanceSheetPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const { data } = await api.get('/reports/balance-sheet', { params: { year, month } })
        setData(data)
      } finally { setLoading(false) }
    }
    load()
  }, [year, month])

  function Row({ label, value, bold, color, sub }) {
    return (
      <div className={`flex justify-between py-2.5 ${bold ? 'font-semibold border-t border-border mt-1 pt-3' : ''}`}>
        <div>
          <span className={color || (bold ? '' : 'text-muted-foreground')}>{label}</span>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
        <span className={color || ''}>{value}</span>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Balance Sheet</h1>
        <div className="flex gap-2">
          <Select value={month} onChange={e => setMonth(parseInt(e.target.value))} className="w-36">
            {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
          </Select>
          <Select value={year} onChange={e => setYear(parseInt(e.target.value))} className="w-24">
            {[now.getFullYear()-1, now.getFullYear()].map(y => <option key={y} value={y}>{y}</option>)}
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
          <p className="text-muted-foreground text-sm">
            {MONTHS[month-1]} {year} — Simplified balance sheet for Cosmetix Beauty Shop
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ASSETS */}
            <Card>
              <CardHeader><CardTitle>Assets</CardTitle></CardHeader>
              <CardContent>
                <Row label="Inventory (at cost)" value={formatKES(data.assets.inventory_at_cost)}
                  sub="Value of stock on hand" />
                <Row label="Cash / Revenue Received" value={formatKES(data.assets.cash_received)}
                  sub="Sales collected this month" />
                <Row label="Total Assets"
                  value={formatKES(data.assets.inventory_at_cost + data.assets.cash_received)} bold />
              </CardContent>
            </Card>

            {/* LIABILITIES */}
            <Card>
              <CardHeader><CardTitle>Liabilities & Costs</CardTitle></CardHeader>
              <CardContent>
                <Row label="Stock Purchased" value={formatKES(data.liabilities.stock_purchased)}
                  sub="Cash spent on inventory" />
                <Row label="Operating Expenses" value={formatKES(data.liabilities.operating_expenses)}
                  sub="Rent, utilities, salaries, etc." />
                <Row label="Total Costs"
                  value={formatKES(data.liabilities.stock_purchased + data.liabilities.operating_expenses)} bold />
              </CardContent>
            </Card>
          </div>

          {/* EQUITY */}
          <Card className={`border-2 ${data.status === 'profit' ? 'border-emerald-200' : 'border-red-200'}`}>
            <CardHeader><CardTitle>Equity / Owner's Position</CardTitle></CardHeader>
            <CardContent>
              <Row label="Gross Profit (Revenue - COGS)" value={formatKES(data.equity.gross_profit)}
                color={data.equity.gross_profit >= 0 ? 'text-emerald-600' : 'text-red-500'} />
              <Row
                label={`Net ${data.status === 'profit' ? 'Profit' : 'Loss'} (Gross - Expenses)`}
                value={formatKES(Math.abs(data.equity.net_profit))}
                bold
                color={data.status === 'profit' ? 'text-emerald-600' : 'text-red-500'}
              />
              <p className="text-sm text-muted-foreground mt-3">
                {data.status === 'profit'
                  ? '✅ The business made a profit this month.'
                  : '⚠️ The business ran at a loss this month. Review expenses and pricing.'}
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
