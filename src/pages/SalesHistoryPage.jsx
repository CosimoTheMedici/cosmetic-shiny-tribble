// ============================================================
// SALES HISTORY PAGE — View all sales with filters
// ============================================================
import { useState, useEffect } from 'react'
import { Search, Filter, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import api from '../lib/api'
import { formatKES, formatDateTime, today } from '../lib/utils'
import { Input, Select, Badge, Card, CardContent, CardHeader, CardTitle } from '../components/ui/index'
import { Button } from '../components/ui/button'
import useAuthStore from '../store/authStore'

const PAYMENT_COLORS = { cash: 'default', mpesa: 'success', card: 'secondary', credit: 'warning' }

export default function SalesHistoryPage() {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [selectedSale, setSelectedSale] = useState(null)
  const [saleItems, setSaleItems] = useState([])
  const [filters, setFilters] = useState({ date_from: today(), date_to: today(), payment_method: '' })
  const { user } = useAuthStore()

  async function loadSales(page = 1) {
    setLoading(true)
    try {
      const { data } = await api.get('/sales', {
        params: { ...filters, page, limit: 20 }
      })
      setSales(data.sales)
      setPagination(data.pagination)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadSales() }, [])

  async function viewSale(sale) {
    const { data } = await api.get(`/sales/${sale.id}`)
    setSelectedSale(data.sale)
    setSaleItems(data.items)
  }

  const totalRevenue = sales.reduce((sum, s) => sum + parseFloat(s.total_amount), 0)
  const totalProfit = sales.reduce((sum, s) => sum + parseFloat(s.total_profit || 0), 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Sales History</h1>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-36">
              <label className="text-xs text-muted-foreground mb-1 block">From</label>
              <Input type="date" value={filters.date_from}
                onChange={e => setFilters(p => ({ ...p, date_from: e.target.value }))} />
            </div>
            <div className="flex-1 min-w-36">
              <label className="text-xs text-muted-foreground mb-1 block">To</label>
              <Input type="date" value={filters.date_to}
                onChange={e => setFilters(p => ({ ...p, date_to: e.target.value }))} />
            </div>
            <div className="flex-1 min-w-36">
              <label className="text-xs text-muted-foreground mb-1 block">Payment</label>
              <Select value={filters.payment_method}
                onChange={e => setFilters(p => ({ ...p, payment_method: e.target.value }))}>
                <option value="">All methods</option>
                <option value="cash">Cash</option>
                <option value="mpesa">M-Pesa</option>
                <option value="card">Card</option>
                <option value="credit">Credit</option>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={() => loadSales(1)} className="gap-2">
                <Filter size={15} /> Apply
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary bar */}
      {sales.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Revenue', value: formatKES(totalRevenue) },
            { label: 'Total Profit', value: formatKES(totalProfit) },
            { label: 'Transactions', value: pagination.total },
          ].map(s => (
            <div key={s.label} className="stat-card text-center">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-xl font-display font-semibold mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Date & Time</th>
                {user?.role === 'admin' && <th>Attendant</th>}
                <th>Total</th>
                <th>Profit</th>
                <th>Payment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="text-center py-8 text-muted-foreground">Loading...</td></tr>
              ) : sales.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-8 text-muted-foreground">No sales found for this period</td></tr>
              ) : sales.map(sale => (
                <tr key={sale.id}>
                  <td><span className="font-mono text-xs">{sale.reference_no}</span></td>
                  <td className="text-xs text-muted-foreground">{formatDateTime(sale.sold_at)}</td>
                  {user?.role === 'admin' && <td className="text-sm">{sale.attendant_name}</td>}
                  <td className="font-semibold">{formatKES(sale.total_amount)}</td>
                  <td className="text-emerald-600 font-medium">{formatKES(sale.total_profit)}</td>
                  <td>
                    <Badge variant={PAYMENT_COLORS[sale.payment_method] || 'default'} className="capitalize text-xs">
                      {sale.payment_method}
                    </Badge>
                  </td>
                  <td>
                    <button onClick={() => viewSale(sale)}
                      className="text-primary hover:text-primary/80 text-xs flex items-center gap-1">
                      <Eye size={13} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.pages} ({pagination.total} sales)
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => loadSales(pagination.page - 1)}
                disabled={pagination.page === 1}>
                <ChevronLeft size={15} />
              </Button>
              <Button variant="outline" size="sm" onClick={() => loadSales(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}>
                <ChevronRight size={15} />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Sale detail modal */}
      {selectedSale && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4"
          onClick={() => setSelectedSale(null)}>
          <div className="bg-card rounded-2xl border shadow-2xl w-full max-w-md p-6 animate-fade-in"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold">Sale Receipt</h2>
              <button onClick={() => setSelectedSale(null)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="space-y-1 text-sm text-muted-foreground mb-4">
              <p>Ref: <span className="font-mono text-foreground">{selectedSale.reference_no}</span></p>
              <p>Date: {formatDateTime(selectedSale.sold_at)}</p>
              {selectedSale.customer_name && <p>Customer: {selectedSale.customer_name}</p>}
              {selectedSale.customer_phone && <p>Phone: {selectedSale.customer_phone}</p>}
            </div>
            <div className="space-y-2 border-t border-border pt-3">
              {saleItems.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.product_name} × {item.quantity}</span>
                  <span className="font-medium">{formatKES(item.line_total)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border mt-3 pt-3 space-y-1 text-sm">
              {parseFloat(selectedSale.discount_amount) > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span><span>- {formatKES(selectedSale.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-base">
                <span>Total</span><span>{formatKES(selectedSale.total_amount)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground capitalize">
                <span>Payment</span><span>{selectedSale.payment_method}</span>
              </div>
              {parseFloat(selectedSale.change_given) > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Change Given</span><span>{formatKES(selectedSale.change_given)}</span>
                </div>
              )}
            </div>
            <Button variant="outline" className="w-full mt-4" onClick={() => window.print()}>
              Print Receipt
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
