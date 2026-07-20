// ============================================================
// DASHBOARD PAGE — Admin overview: revenue, profit, trends
// ============================================================
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp, TrendingDown, ShoppingBag, DollarSign,
  Package, AlertTriangle, ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts'
import api from '../lib/api'
import { formatKES, formatDateTime } from '../lib/utils'
import { Card, CardContent, CardHeader, CardTitle, Badge } from '../components/ui/index'

// Stat card component
function StatCard({ title, value, sub, change, changeDir, icon: Icon, color = 'primary', onClick }) {
  const colors = {
    primary: 'bg-primary/10 text-primary',
    emerald: 'bg-emerald-100 text-emerald-600',
    amber: 'bg-amber-100 text-amber-600',
    rose: 'bg-rose-100 text-rose-600',
  }
  return (
    <div className={`stat-card cursor-pointer ${onClick ? 'hover:border-primary/30' : ''}`} onClick={onClick}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl font-display font-semibold mt-1">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon size={20} />
        </div>
      </div>
      {change !== undefined && (
        <div className={`flex items-center gap-1 mt-3 text-xs font-medium
          ${changeDir === 'up' ? 'text-emerald-600' : changeDir === 'down' ? 'text-red-500' : 'text-muted-foreground'}`}>
          {changeDir === 'up' ? <ArrowUpRight size={14} /> : changeDir === 'down' ? <ArrowDownRight size={14} /> : <Minus size={14} />}
          {change !== null ? `${Math.abs(change)}% vs yesterday` : 'No data for yesterday'}
        </div>
      )}
    </div>
  )
}

// Custom tooltip for recharts
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-sm">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {formatKES(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState(null)
  const [comparison, setComparison] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    async function load() {
      try {
        const [dashRes, reconRes] = await Promise.all([
          api.get('/reports/dashboard'),
          api.get('/reconciliation/today')
        ])
        setData(dashRes.data)
        setComparison(reconRes.data.comparison)
      } catch (err) {
        console.error('Dashboard load error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  const today = data?.today || {}
  const month = data?.month || {}
  const inventory = data?.inventory || {}
  const weekTrend = data?.weekTrend || []

  // Fill in missing days in trend
  const trendData = weekTrend.map(d => ({
    date: new Date(d.sale_date).toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric' }),
    Revenue: parseFloat(d.revenue),
    Transactions: d.transactions,
  }))

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="font-display text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {new Date().toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Low stock alert banner */}
      {inventory.low_stock_count > 0 && (
        <div
          className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-amber-100 transition-colors"
          onClick={() => navigate('/inventory/low-stock')}
        >
          <AlertTriangle size={18} className="text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800 font-medium">
            {inventory.low_stock_count} product{inventory.low_stock_count > 1 ? 's' : ''} need restocking — click to view shopping list
          </p>
          <ArrowUpRight size={16} className="text-amber-600 ml-auto flex-shrink-0" />
        </div>
      )}

      {/* Today's stats */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Today</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Revenue"
            value={formatKES(today.revenue)}
            sub={`${today.transactions} transactions`}
            change={comparison?.change_percent}
            changeDir={comparison?.change_direction}
            icon={DollarSign}
            color="primary"
          />
          <StatCard
            title="Gross Profit"
            value={formatKES(today.profit)}
            sub={today.revenue > 0 ? `${((today.profit / today.revenue) * 100).toFixed(1)}% margin` : '—'}
            icon={TrendingUp}
            color="emerald"
          />
          <StatCard
            title="Expenses"
            value={formatKES(today.expenses)}
            sub="Operating costs today"
            icon={ShoppingBag}
            color="rose"
            onClick={() => navigate('/expenses')}
          />
          <StatCard
            title="Net Today"
            value={formatKES(today.net)}
            sub="Profit minus expenses"
            icon={today.net >= 0 ? TrendingUp : TrendingDown}
            color={today.net >= 0 ? 'emerald' : 'rose'}
          />
        </div>
      </div>

      {/* This month */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">This Month</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            title="Monthly Revenue"
            value={formatKES(month.revenue)}
            sub={`${month.transactions} transactions`}
            icon={DollarSign}
            color="primary"
          />
          <StatCard
            title="Monthly Profit"
            value={formatKES(month.profit)}
            icon={TrendingUp}
            color="emerald"
          />
          <StatCard
            title="Inventory Value"
            value={formatKES(inventory.stock_value_cost)}
            sub={`${inventory.total_products} products (at cost)`}
            icon={Package}
            color="amber"
            onClick={() => navigate('/inventory')}
          />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-day revenue trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>7-Day Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {trendData.length ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(340,60%,55%)" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="hsl(340,60%,55%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(30,20%,90%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="Revenue"
                    stroke="hsl(340,60%,55%)"
                    strokeWidth={2}
                    fill="url(#revGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">
                No sales data yet for this period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent sales */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {data?.recentSales?.length ? (
              <div className="divide-y divide-border">
                {data.recentSales.map(sale => (
                  <div key={sale.id} className="px-6 py-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{formatKES(sale.total_amount)}</p>
                        <p className="text-xs text-muted-foreground">{sale.attendant}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={
                          sale.payment_method === 'cash' ? 'default' :
                          sale.payment_method === 'mpesa' ? 'success' : 'secondary'
                        } className="text-xs capitalize">
                          {sale.payment_method}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDateTime(sale.sold_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-8 text-center text-muted-foreground text-sm">
                No sales yet today
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
