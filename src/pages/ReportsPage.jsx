// ============================================================
// REPORTS PAGE — Sales analytics, top/least sold products
// ============================================================
import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, BarChart2 } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import api from '../lib/api'
import { formatKES } from '../lib/utils'
import { Select, Card, CardContent, CardHeader, CardTitle, Badge } from '../components/ui/index'

const COLORS = ['#e05c8a', '#f0a0b8', '#d4446c', '#fbc4d5', '#a8325c', '#fde8ef']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-sm">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {p.name.includes('Revenue') || p.name.includes('Profit') ? formatKES(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

export default function ReportsPage() {
  const [period, setPeriod] = useState('month')
  const [data, setData] = useState(null)
  const [profitData, setProfitData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [topRes, profitRes] = await Promise.all([
          api.get('/reports/top-products', { params: { period } }),
          api.get('/reports/profit-by-product')
        ])
        setData(topRes.data)
        setProfitData(profitRes.data.products.slice(0, 10))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [period])

  const top5 = data?.topSelling?.slice(0, 5) || []
  const least5 = data?.leastSelling?.slice(0, 5) || []

  // Prepare bar chart data
  const barData = top5.map(p => ({
    name: p.name.length > 18 ? p.name.slice(0, 18) + '…' : p.name,
    Revenue: parseFloat(p.total_revenue),
    Profit: parseFloat(p.total_profit),
    Qty: p.total_qty_sold,
  }))

  // Pie chart: revenue share
  const pieData = top5.map(p => ({
    name: p.brand ? `${p.brand} ${p.name.slice(0, 12)}…` : p.name.slice(0, 18),
    value: parseFloat(p.total_revenue)
  }))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Sales Analytics</h1>
        <Select value={period} onChange={e => setPeriod(e.target.value)} className="w-40">
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <>
          {/* Top 5 products bar chart */}
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Products by Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              {barData.length ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={barData} margin={{ top: 5, right: 20, left: 10, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(30,20%,92%)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="Revenue" fill="hsl(340,60%,55%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Profit" fill="hsl(160,50%,50%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">
                  No sales data for this period
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Most sold table */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp size={18} className="text-emerald-500" />
                  <CardTitle>Most Sold Products</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {top5.length === 0 ? (
                  <p className="px-6 py-4 text-sm text-muted-foreground">No data</p>
                ) : (
                  <table className="w-full data-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Product</th>
                        <th>Qty Sold</th>
                        <th>Revenue</th>
                        <th>Profit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {top5.map((p, i) => (
                        <tr key={p.id}>
                          <td>
                            <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-bold
                              ${i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-100 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-muted text-muted-foreground'}`}>
                              {i + 1}
                            </span>
                          </td>
                          <td>
                            <p className="text-sm font-medium leading-tight">{p.name}</p>
                            {p.brand && <p className="text-xs text-muted-foreground">{p.brand}</p>}
                          </td>
                          <td className="font-semibold">{p.total_qty_sold}</td>
                          <td className="text-sm">{formatKES(p.total_revenue)}</td>
                          <td className="text-emerald-600 font-medium">{formatKES(p.total_profit)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>

            {/* Least sold table */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingDown size={18} className="text-amber-500" />
                  <CardTitle>Least Sold Products</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {least5.length === 0 ? (
                  <p className="px-6 py-4 text-sm text-muted-foreground">No data</p>
                ) : (
                  <table className="w-full data-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Qty Sold</th>
                        <th>In Stock</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {least5.map(p => (
                        <tr key={p.id}>
                          <td>
                            <p className="text-sm font-medium leading-tight">{p.name}</p>
                            {p.brand && <p className="text-xs text-muted-foreground">{p.brand}</p>}
                          </td>
                          <td>{p.total_qty_sold}</td>
                          <td>{p.quantity_in_stock}</td>
                          <td>
                            {p.total_qty_sold === 0
                              ? <Badge variant="destructive">No Sales</Badge>
                              : <Badge variant="warning">Slow Mover</Badge>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Profit by product table */}
          <Card>
            <CardHeader><CardTitle>Profit per Product — This Month</CardTitle></CardHeader>
            <CardContent className="p-0">
              {profitData.length === 0 ? (
                <p className="px-6 py-4 text-sm text-muted-foreground">No sales this month yet</p>
              ) : (
                <table className="w-full data-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Qty Sold</th>
                      <th>Revenue</th>
                      <th>Cost (COGS)</th>
                      <th>Profit</th>
                      <th>Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profitData.map(p => (
                      <tr key={p.id}>
                        <td>
                          <p className="text-sm font-medium">{p.name}</p>
                          {p.brand && <p className="text-xs text-muted-foreground">{p.brand}</p>}
                        </td>
                        <td className="text-xs text-muted-foreground">{p.category || '—'}</td>
                        <td>{p.qty_sold}</td>
                        <td className="text-sm">{formatKES(p.revenue)}</td>
                        <td className="text-sm text-muted-foreground">{formatKES(p.cost)}</td>
                        <td className="font-semibold text-emerald-600">{formatKES(p.profit)}</td>
                        <td>
                          <span className={`text-xs font-medium ${parseFloat(p.margin_percent) > 20 ? 'text-emerald-600' : parseFloat(p.margin_percent) > 10 ? 'text-amber-600' : 'text-red-500'}`}>
                            {p.margin_percent}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
