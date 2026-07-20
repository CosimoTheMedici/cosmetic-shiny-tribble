// ============================================================
// REPLENISH PAGE — Add stock when owner buys inventory (Admin)
// ============================================================
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Package, Loader2, CheckCircle } from 'lucide-react'
import api from '../lib/api'
import { formatKES } from '../lib/utils'
import { Input, Label, Card, CardContent, CardHeader, CardTitle } from '../components/ui/index'
import { Button } from '../components/ui/button'
import { useToast, ToastContainer } from '../hooks/useToast'

export default function ReplenishPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    quantity_added: '',
    buying_price: '',
    supplier: '',
    notes: '',
    update_price: true,
  })
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const { toasts, toast, dismiss } = useToast()

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get(`/products/${id}`)
        setProduct(data.product)
        setForm(p => ({ ...p, buying_price: data.product.buying_price }))
      } finally { setLoading(false) }
    }
    load()
  }, [id])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.quantity_added || form.quantity_added < 1) {
      toast({ title: 'Enter quantity', variant: 'error' })
      return
    }
    setSaving(true)
    try {
      await api.post(`/products/${id}/replenish`, form)
      setDone(true)
      toast({ title: '✅ Stock updated!', variant: 'success' })
    } catch (err) {
      toast({ title: 'Error', description: err.response?.data?.message, variant: 'error' })
    } finally { setSaving(false) }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>

  if (done) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <CheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
        <h2 className="font-display text-2xl font-semibold">Stock Updated!</h2>
        <p className="text-muted-foreground mt-2">{form.quantity_added} units added to {product?.name}</p>
        <div className="flex gap-3 justify-center mt-6">
          <Button variant="outline" onClick={() => navigate('/inventory')}>Back to Inventory</Button>
          <Button onClick={() => navigate('/inventory/low-stock')}>View Low Stock</Button>
        </div>
      </div>
    )
  }

  const newTotal = (product?.quantity_in_stock || 0) + parseInt(form.quantity_added || 0)
  const totalCost = parseFloat(form.buying_price || 0) * parseInt(form.quantity_added || 0)

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <ToastContainer toasts={toasts} dismiss={dismiss} />
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={16} /> Back
      </button>

      <h1 className="font-display text-2xl font-semibold">Replenish Stock</h1>

      {/* Product info */}
      <Card className="bg-secondary/30">
        <CardContent className="pt-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Package size={22} className="text-primary" />
          </div>
          <div>
            <p className="font-semibold">{product?.name}</p>
            {product?.brand && <p className="text-sm text-muted-foreground">{product.brand}</p>}
            <p className="text-sm mt-1">
              Current stock: <strong className={product?.quantity_in_stock <= product?.low_stock_threshold ? 'text-amber-600' : 'text-emerald-600'}>
                {product?.quantity_in_stock} {product?.unit}
              </strong>
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Replenishment Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Quantity to Add ({product?.unit}) *</Label>
                <Input type="number" min="1" value={form.quantity_added}
                  onChange={e => setForm(p => ({ ...p, quantity_added: e.target.value }))}
                  placeholder="e.g. 50" required className="mt-1 text-lg" />
              </div>
              <div>
                <Label>Buying Price per {product?.unit} (KES) *</Label>
                <Input type="number" step="0.01" min="0" value={form.buying_price}
                  onChange={e => setForm(p => ({ ...p, buying_price: e.target.value }))}
                  required className="mt-1" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="updatePrice" checked={form.update_price}
                onChange={e => setForm(p => ({ ...p, update_price: e.target.checked }))}
                className="w-4 h-4 accent-primary" />
              <label htmlFor="updatePrice" className="text-sm">
                Update product buying price to this new price (recommended if price changed)
              </label>
            </div>

            {form.quantity_added && form.buying_price && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Units after restock:</span>
                  <span className="font-semibold text-emerald-700">{newTotal} {product?.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total purchase cost:</span>
                  <span className="font-semibold">{formatKES(totalCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expected selling value:</span>
                  <span className="font-semibold text-primary">
                    {formatKES(parseInt(form.quantity_added) * parseFloat(product?.selling_price || 0))}
                  </span>
                </div>
              </div>
            )}

            <div>
              <Label>Supplier / Vendor Name</Label>
              <Input value={form.supplier} onChange={e => setForm(p => ({ ...p, supplier: e.target.value }))}
                placeholder="e.g. Nairobi Beauty Wholesale" className="mt-1" />
            </div>

            <div>
              <Label>Notes</Label>
              <Input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Any notes about this purchase" className="mt-1" />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => navigate(-1)}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving ? <Loader2 size={15} className="animate-spin mr-2" /> : null}
                Confirm Restock
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
