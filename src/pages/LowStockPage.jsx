// ============================================================
// LOW STOCK PAGE — Shopping list for owner (Admin + Attendant)
// ============================================================
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingCart, AlertTriangle, RefreshCw, Printer } from 'lucide-react'
import api from '../lib/api'
import { formatKES } from '../lib/utils'
import { Card, Badge } from '../components/ui/index'
import { Button } from '../components/ui/button'
import useAuthStore from '../store/authStore'

export default function LowStockPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const { data } = await api.get('/products/low-stock')
        setProducts(data.products)
        setMessage(data.message)
      } finally { setLoading(false) }
    }
    load()
  }, [])

  const estimatedCost = products.reduce(
    (sum, p) => sum + (p.units_needed * parseFloat(p.buying_price)), 0
  )

  return (
    <div className="max-w-4xl space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Low Stock Alert</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Products that need restocking</p>
        </div>
        <Button variant="outline" onClick={() => window.print()} className="gap-2 no-print">
          <Printer size={15} /> Print Shopping List
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingCart size={40} className="mx-auto mb-3 text-emerald-400" />
          <p className="font-semibold text-lg text-emerald-600">All products are well stocked! 🎉</p>
          <p className="text-sm text-muted-foreground mt-1">Check back after more sales</p>
        </div>
      ) : (
        <>
          {/* Alert banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800">
                {products.length} product{products.length > 1 ? 's' : ''} need restocking
              </p>
              <p className="text-sm text-amber-700 mt-0.5">
                Estimated restock cost: <strong>{formatKES(estimatedCost)}</strong> (based on last buying prices)
              </p>
            </div>
          </div>

          {/* Shopping list table */}
          <Card>
            <div className="px-6 py-3 border-b border-border flex items-center gap-2">
              <ShoppingCart size={16} className="text-primary" />
              <h2 className="font-semibold text-sm">Shopping List</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Current Stock</th>
                    <th>Min Required</th>
                    <th>Units to Buy</th>
                    <th>Last Buy Price</th>
                    <th>Est. Cost</th>
                    {isAdmin && <th>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div>
                          <p className="font-medium text-sm">{p.name}</p>
                          {p.brand && <p className="text-xs text-muted-foreground">{p.brand}</p>}
                          {p.sku && <p className="text-xs font-mono text-muted-foreground">{p.sku}</p>}
                        </div>
                      </td>
                      <td className="text-sm text-muted-foreground">{p.category_name || '—'}</td>
                      <td>
                        <span className={`font-bold text-sm ${p.quantity_in_stock === 0 ? 'text-red-500' : 'text-amber-600'}`}>
                          {p.quantity_in_stock} {p.unit}
                        </span>
                      </td>
                      <td className="text-sm">{p.low_stock_threshold} {p.unit}</td>
                      <td>
                        <Badge variant="warning" className="font-bold">
                          {Math.max(p.units_needed, p.low_stock_threshold * 2)} {p.unit}
                        </Badge>
                      </td>
                      <td className="text-sm">{formatKES(p.buying_price)}/{p.unit}</td>
                      <td className="font-semibold text-sm">
                        {formatKES(Math.max(p.units_needed, p.low_stock_threshold * 2) * parseFloat(p.buying_price))}
                      </td>
                      {isAdmin && (
                        <td>
                          <button
                            onClick={() => navigate(`/products/${p.id}/replenish`)}
                            className="text-primary hover:text-primary/80 text-xs flex items-center gap-1"
                          >
                            <RefreshCw size={12} /> Restock
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5} className="px-4 py-3 text-right font-semibold text-sm border-t border-border">
                      Total Estimated Cost:
                    </td>
                    <td className="px-4 py-3 font-bold text-primary border-t border-border">
                      {formatKES(estimatedCost)}
                    </td>
                    {isAdmin && <td className="border-t border-border" />}
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
