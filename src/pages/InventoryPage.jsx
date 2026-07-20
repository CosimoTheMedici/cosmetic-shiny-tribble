// ============================================================
// INVENTORY PAGE — View & manage all products
// ============================================================
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Filter, Package, Edit, RefreshCw, AlertTriangle } from 'lucide-react'
import api from '../lib/api'
import { formatKES } from '../lib/utils'
import { Input, Select, Badge, Card } from '../components/ui/index'
import { Button } from '../components/ui/button'
import useAuthStore from '../store/authStore'
import ProductFormModal from '../components/inventory/ProductFormModal'

export default function InventoryPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'admin'

  async function load() {
    setLoading(true)
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/products', { params: { search, category: categoryFilter, limit: 100 } }),
        api.get('/categories')
      ])
      setProducts(prodRes.data.products)
      setCategories(catRes.data.categories)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [search, categoryFilter])

  function openEdit(product) {
    setEditProduct(product)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditProduct(null)
    load()
  }

  const totalValue = products.reduce((s, p) => s + p.quantity_in_stock * parseFloat(p.selling_price), 0)
  const lowStockCount = products.filter(p => p.is_low_stock).length

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Inventory</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {products.length} products · Retail value: {formatKES(totalValue)}
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/inventory/low-stock')} className="gap-2">
              <AlertTriangle size={15} /> Low Stock ({lowStockCount})
            </Button>
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus size={15} /> Add Product
            </Button>
          </div>
        )}
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products…"
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="w-44">
          <option value="">All categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </div>

      {/* Product table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Stock</th>
                {isAdmin && <th>Buy Price</th>}
                <th>Sell Price</th>
                {isAdmin && <th>Margin</th>}
                <th>Status</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" className="text-center py-8 text-muted-foreground">Loading...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan="8" className="text-center py-8 text-muted-foreground">
                  <Package size={32} className="mx-auto mb-2 opacity-30" />
                  No products found
                </td></tr>
              ) : products.map(p => (
                <tr key={p.id} className="cursor-pointer" onClick={() => navigate(`/products/${p.id}`)}>
                  <td>
                    <div>
                      <p className="font-medium text-sm">{p.name}</p>
                      {p.brand && <p className="text-xs text-muted-foreground">{p.brand}</p>}
                      {p.sku && <p className="text-xs font-mono text-muted-foreground">{p.sku}</p>}
                    </div>
                  </td>
                  <td className="text-sm text-muted-foreground">{p.category_name || '—'}</td>
                  <td>
                    <span className={`font-semibold text-sm ${p.quantity_in_stock === 0 ? 'text-red-500' : p.is_low_stock ? 'text-amber-600' : 'text-foreground'}`}>
                      {p.quantity_in_stock} {p.unit}
                    </span>
                  </td>
                  {isAdmin && <td className="text-sm">{formatKES(p.buying_price)}</td>}
                  <td className="font-semibold text-primary">{formatKES(p.selling_price)}</td>
                  {isAdmin && <td className="text-sm text-emerald-600">{p.margin_percent}%</td>}
                  <td>
                    {p.quantity_in_stock === 0
                      ? <Badge variant="destructive">Out of Stock</Badge>
                      : p.is_low_stock
                      ? <Badge variant="warning">Low Stock</Badge>
                      : <Badge variant="success">In Stock</Badge>
                    }
                  </td>
                  {isAdmin && (
                    <td onClick={e => e.stopPropagation()}>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(p)}
                          className="p-1.5 text-muted-foreground hover:text-primary rounded-md hover:bg-primary/10">
                          <Edit size={14} />
                        </button>
                        <button onClick={() => navigate(`/products/${p.id}/replenish`)}
                          className="p-1.5 text-muted-foreground hover:text-primary rounded-md hover:bg-primary/10">
                          <RefreshCw size={14} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showForm && (
        <ProductFormModal
          product={editProduct}
          categories={categories}
          onClose={closeForm}
        />
      )}
    </div>
  )
}
