// ============================================================
// PRODUCT DETAIL PAGE — Full product view with history
// ============================================================
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, RefreshCw, Package, TrendingUp, Clock, DollarSign } from 'lucide-react'
import api from '../lib/api'
import { formatKES, formatDateTime } from '../lib/utils'
import { Card, CardContent, CardHeader, CardTitle, Badge } from '../components/ui/index'
import { Button } from '../components/ui/button'
import useAuthStore from '../store/authStore'
import ProductFormModal from '../components/inventory/ProductFormModal'

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'

  async function load() {
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get(`/products/${id}`),
        api.get('/categories')
      ])
      setData(prodRes.data)
      setCategories(catRes.data.categories)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [id])

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>

  const product = data?.product
  if (!product) return <div className="text-center py-20 text-muted-foreground">Product not found</div>

  const margin = (((product.selling_price - product.buying_price) / product.buying_price) * 100).toFixed(1)

  return (
    <div className="max-w-4xl space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={16} /> Back to Inventory
        </button>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setShowEdit(true)}>
              <Edit size={14} /> Edit
            </Button>
            <Button className="gap-2" onClick={() => navigate(`/products/${id}/replenish`)}>
              <RefreshCw size={14} /> Restock
            </Button>
          </div>
        )}
      </div>

      {/* Product header */}
      <div className="flex items-start gap-5">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Package size={28} className="text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-semibold">{product.name}</h1>
          {product.brand && <p className="text-muted-foreground">{product.brand}</p>}
          <div className="flex flex-wrap gap-2 mt-2">
            {product.category_name && <Badge variant="secondary">{product.category_name}</Badge>}
            {product.sku && <Badge variant="outline" className="font-mono text-xs">{product.sku}</Badge>}
            {product.quantity_in_stock === 0
              ? <Badge variant="destructive">Out of Stock</Badge>
              : product.quantity_in_stock <= product.low_stock_threshold
              ? <Badge variant="warning">Low Stock</Badge>
              : <Badge variant="success">In Stock</Badge>
            }
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'In Stock', value: `${product.quantity_in_stock} ${product.unit}`, icon: Package, color: 'text-foreground' },
          ...(isAdmin ? [
            { label: 'Buying Price', value: formatKES(product.buying_price), icon: DollarSign, color: 'text-foreground' },
          ] : []),
          { label: 'Selling Price', value: formatKES(product.selling_price), icon: TrendingUp, color: 'text-primary' },
          ...(isAdmin ? [
            { label: 'Profit Margin', value: `${margin}%`, icon: TrendingUp, color: parseFloat(margin) > 20 ? 'text-emerald-600' : 'text-amber-600' },
          ] : []),
        ].map(item => (
          <div key={item.label} className="stat-card">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className={`text-xl font-display font-semibold mt-1 ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Keywords / description */}
      {(product.search_keywords || product.description) && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            {product.search_keywords && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Search Keywords</p>
                <div className="flex flex-wrap gap-1.5">
                  {product.search_keywords.split(',').map(kw => kw.trim()).filter(Boolean).map(kw => (
                    <span key={kw} className="px-2 py-0.5 bg-secondary rounded-full text-xs">{kw}</span>
                  ))}
                </div>
              </div>
            )}
            {product.description && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Description</p>
                <p className="text-sm text-muted-foreground">{product.description}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Price history */}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock size={16} />Price History</CardTitle></CardHeader>
            <CardContent className="p-0">
              {data?.priceHistory?.length === 0 ? (
                <p className="px-6 py-4 text-sm text-muted-foreground">No price changes recorded</p>
              ) : (
                <div className="divide-y divide-border">
                  {data?.priceHistory?.map(ph => (
                    <div key={ph.id} className="px-6 py-3 text-sm">
                      <div className="flex justify-between mb-0.5">
                        <span className="font-medium">{ph.changed_by}</span>
                        <span className="text-xs text-muted-foreground">{formatDateTime(ph.changed_at)}</span>
                      </div>
                      {ph.new_selling_price && (
                        <p className="text-muted-foreground text-xs">
                          Sell: {formatKES(ph.old_selling_price)} → <span className="text-foreground font-medium">{formatKES(ph.new_selling_price)}</span>
                        </p>
                      )}
                      {ph.new_buying_price && (
                        <p className="text-muted-foreground text-xs">
                          Buy: {formatKES(ph.old_buying_price)} → <span className="text-foreground font-medium">{formatKES(ph.new_buying_price)}</span>
                        </p>
                      )}
                      {ph.reason && <p className="text-xs text-muted-foreground italic mt-0.5">{ph.reason}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Replenishment history */}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><RefreshCw size={16} />Restock History</CardTitle></CardHeader>
            <CardContent className="p-0">
              {data?.replenishments?.length === 0 ? (
                <p className="px-6 py-4 text-sm text-muted-foreground">No replenishments recorded</p>
              ) : (
                <div className="divide-y divide-border">
                  {data?.replenishments?.map(r => (
                    <div key={r.id} className="px-6 py-3 text-sm">
                      <div className="flex justify-between mb-0.5">
                        <span className="font-semibold text-emerald-600">+{r.quantity_added} {product.unit}</span>
                        <span className="text-xs text-muted-foreground">{formatDateTime(r.replenished_at)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        @ {formatKES(r.buying_price)}/{product.unit} · by {r.recorded_by}
                      </p>
                      {r.supplier && <p className="text-xs text-muted-foreground">Supplier: {r.supplier}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {showEdit && (
        <ProductFormModal
          product={product}
          categories={categories}
          onClose={() => { setShowEdit(false); load() }}
        />
      )}
    </div>
  )
}
