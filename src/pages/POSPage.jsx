// // ============================================================
// // POS PAGE — Point of Sale: search products, build cart, checkout
// // Fast keyword search helps attendants find products instantly
// // ============================================================
// import { useState, useEffect, useRef, useCallback } from 'react'
// import { Search, Plus, Minus, Trash2, ShoppingCart, CheckCircle, Loader2, X, Printer } from 'lucide-react'
// import api from '../lib/api'
// import { formatKES, today } from '../lib/utils'
// import { Button } from '../components/ui/button'
// import { Input, Label, Select, Badge, Card, CardContent } from '../components/ui/index'
// import { useToast, ToastContainer } from '../hooks/useToast'

// // Debounce hook for search input
// function useDebounce(value, delay) {
//   const [debounced, setDebounced] = useState(value)
//   useEffect(() => {
//     const timer = setTimeout(() => setDebounced(value), delay)
//     return () => clearTimeout(timer)
//   }, [value, delay])
//   return debounced
// }

// export default function POSPage() {
//   const [searchQuery, setSearchQuery] = useState('')
//   const [products, setProducts] = useState([])
//   const [searching, setSearching] = useState(false)
//   const [cart, setCart] = useState([])
//   const [checkoutOpen, setCheckoutOpen] = useState(false)
//   const [checkoutData, setCheckoutData] = useState({
//     payment_method: 'cash',
//     amount_paid: '',
//     customer_name: '',
//     customer_phone: '',
//     discount_amount: '0',
//     mpesa_ref: '',
//   })
//   const [submitting, setSubmitting] = useState(false)
//   const [completedSale, setCompletedSale] = useState(null)
//   const { toasts, toast, dismiss } = useToast()
//   const searchRef = useRef(null)
//   const debouncedSearch = useDebounce(searchQuery, 300)

//   // Auto-focus search on mount
//   useEffect(() => {
//     searchRef.current?.focus()
//   }, [])

//   // Search products when query changes
//   useEffect(() => {
//     if (!debouncedSearch.trim()) {
//       setProducts([])
//       return
//     }
//     async function doSearch() {
//       setSearching(true)
//       try {
//         const { data } = await api.get('/products', { params: { search: debouncedSearch, limit: 20 } })
//         setProducts(data.products)
//       } catch {
//         setProducts([])
//       } finally {
//         setSearching(false)
//       }
//     }
//     doSearch()
//   }, [debouncedSearch])

//   // Add product to cart
//   function addToCart(product) {
//     if (product.quantity_in_stock <= 0) {
//       toast({ title: 'Out of stock', description: `${product.name} has no stock.`, variant: 'error' })
//       return
//     }
//     setCart(prev => {
//       const existing = prev.find(c => c.product_id === product.id)
//       if (existing) {
//         if (existing.quantity >= product.quantity_in_stock) {
//           toast({ title: 'Stock limit reached', description: `Only ${product.quantity_in_stock} units available.`, variant: 'warning' })
//           return prev
//         }
//         return prev.map(c => c.product_id === product.id
//           ? { ...c, quantity: c.quantity + 1, line_total: (c.quantity + 1) * c.selling_price }
//           : c
//         )
//       }
//       return [...prev, {
//         product_id: product.id,
//         name: product.name,
//         brand: product.brand,
//         selling_price: parseFloat(product.selling_price),
//         quantity: 1,
//         line_total: parseFloat(product.selling_price),
//         max_qty: product.quantity_in_stock,
//       }]
//     })
//     setSearchQuery('')
//     searchRef.current?.focus()
//   }

//   function updateQty(productId, delta) {
//     setCart(prev => prev
//       .map(c => c.product_id === productId
//         ? { ...c, quantity: Math.max(1, Math.min(c.max_qty, c.quantity + delta)), line_total: Math.max(1, Math.min(c.max_qty, c.quantity + delta)) * c.selling_price }
//         : c
//       )
//     )
//   }

//   function removeFromCart(productId) {
//     setCart(prev => prev.filter(c => c.product_id !== productId))
//   }

//   const subtotal = cart.reduce((sum, c) => sum + c.line_total, 0)
//   const discount = parseFloat(checkoutData.discount_amount || 0)
//   const total = Math.max(0, subtotal - discount)
//   const change = parseFloat(checkoutData.amount_paid || 0) - total

//   async function handleCheckout() {
//     if (!cart.length) return
//     if (checkoutData.payment_method === 'cash' && parseFloat(checkoutData.amount_paid) < total) {
//       toast({ title: 'Insufficient payment', description: 'Amount paid is less than total.', variant: 'error' })
//       return
//     }
//     setSubmitting(true)
//     try {
//       const { data } = await api.post('/sales', {
//         items: cart.map(c => ({ product_id: c.product_id, quantity: c.quantity })),
//         ...checkoutData,
//         amount_paid: parseFloat(checkoutData.amount_paid) || total,
//       })
//       setCompletedSale({
//         ...data,
//         items: cart,
//         total,
//         change: Math.max(0, change),
//         payment_method: checkoutData.payment_method,
//       })
//       setCart([])
//       setCheckoutOpen(false)
//       setCheckoutData({ payment_method: 'cash', amount_paid: '', customer_name: '', customer_phone: '', discount_amount: '0', mpesa_ref: '' })
//       toast({ title: '✅ Sale recorded!', description: `Ref: ${data.referenceNo}`, variant: 'success' })
//     } catch (err) {
//       toast({ title: 'Sale failed', description: err.response?.data?.message || 'Please try again.', variant: 'error' })
//     } finally {
//       setSubmitting(false)
//     }
//   }

//   // ---- RECEIPT MODAL ----
//   if (completedSale) {
//     return (
//       <div className="max-w-sm mx-auto">
//         <Card className="border-emerald-200 shadow-lg">
//           <CardContent className="pt-6">
//             <div className="text-center mb-6">
//               <CheckCircle size={40} className="text-emerald-500 mx-auto mb-2" />
//               <h2 className="font-display text-xl font-semibold">Sale Complete!</h2>
//               <p className="text-sm text-muted-foreground">Ref: {completedSale.referenceNo}</p>
//             </div>
//             <div className="space-y-2 mb-4">
//               {completedSale.items.map(item => (
//                 <div key={item.product_id} className="flex justify-between text-sm">
//                   <span>{item.name} × {item.quantity}</span>
//                   <span className="font-medium">{formatKES(item.line_total)}</span>
//                 </div>
//               ))}
//             </div>
//             <div className="border-t border-border pt-3 space-y-1">
//               <div className="flex justify-between font-semibold">
//                 <span>Total</span>
//                 <span>{formatKES(completedSale.total)}</span>
//               </div>
//               {completedSale.change > 0 && (
//                 <div className="flex justify-between text-emerald-600 font-medium">
//                   <span>Change</span>
//                   <span>{formatKES(completedSale.change)}</span>
//                 </div>
//               )}
//               <div className="flex justify-between text-sm text-muted-foreground capitalize">
//                 <span>Payment</span>
//                 <span>{completedSale.payment_method}</span>
//               </div>
//             </div>
//             <div className="flex gap-2 mt-6">
//               <Button variant="outline" className="flex-1 gap-2" onClick={() => window.print()}>
//                 <Printer size={15} /> Print
//               </Button>
//               <Button className="flex-1" onClick={() => { setCompletedSale(null); searchRef.current?.focus() }}>
//                 New Sale
//               </Button>
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     )
//   }

//   return (
//     <div className="flex gap-6 h-[calc(100vh-6rem)] animate-fade-in">
//       <ToastContainer toasts={toasts} dismiss={dismiss} />

//       {/* ===== LEFT: Product Search ===== */}
//       <div className="flex-1 flex flex-col min-w-0">
//         <div className="mb-4">
//           <h1 className="font-display text-2xl font-semibold mb-3">Point of Sale</h1>
//           {/* Search bar — THE main tool for attendants */}
//           <div className="relative">
//             <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
//             <Input
//               ref={searchRef}
//               placeholder="Search by name, brand, keyword, SKU… (e.g. 'lotion', 'nivea', 'relaxer')"
//               className="pl-10 h-12 text-base"
//               value={searchQuery}
//               onChange={e => setSearchQuery(e.target.value)}
//             />
//             {searching && (
//               <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin" />
//             )}
//           </div>
//           <p className="text-xs text-muted-foreground mt-1.5">
//             💡 Tip: Use keywords like "moisturizer", "hair oil", "foundation", or scan barcode
//           </p>
//         </div>

//         {/* Product results grid */}
//         <div className="flex-1 overflow-y-auto">
//           {searchQuery && !searching && products.length === 0 && (
//             <div className="text-center py-12 text-muted-foreground">
//               <Search size={32} className="mx-auto mb-2 opacity-30" />
//               <p>No products found for "{searchQuery}"</p>
//               <p className="text-xs mt-1">Try different keywords or check spelling</p>
//             </div>
//           )}

//           {!searchQuery && (
//             <div className="text-center py-16 text-muted-foreground">
//               <ShoppingCart size={40} className="mx-auto mb-3 opacity-20" />
//               <p className="font-medium">Start typing to search for products</p>
//               <p className="text-xs mt-1">Search by product name, brand, or keywords</p>
//             </div>
//           )}

//           <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
//             {products.map(product => (
//               <button
//                 key={product.id}
//                 onClick={() => addToCart(product)}
//                 disabled={product.quantity_in_stock <= 0}
//                 className={`text-left p-3 rounded-xl border transition-all
//                   ${product.quantity_in_stock <= 0
//                     ? 'opacity-40 cursor-not-allowed bg-muted border-border'
//                     : 'bg-card border-border hover:border-primary/50 hover:shadow-md hover:shadow-primary/10 active:scale-95'
//                   }`}
//               >
//                 <p className="text-sm font-semibold leading-tight line-clamp-2">{product.name}</p>
//                 {product.brand && <p className="text-xs text-muted-foreground mt-0.5">{product.brand}</p>}
//                 <div className="flex items-center justify-between mt-2">
//                   <p className="text-primary font-bold">{formatKES(product.selling_price)}</p>
//                   <span className={`text-xs px-1.5 py-0.5 rounded-full
//                     ${product.quantity_in_stock <= 0 ? 'bg-red-100 text-red-600'
//                       : product.is_low_stock ? 'bg-amber-100 text-amber-600'
//                       : 'bg-emerald-100 text-emerald-600'}`}>
//                     {product.quantity_in_stock <= 0 ? 'Out' : `${product.quantity_in_stock} ${product.unit}`}
//                   </span>
//                 </div>
//               </button>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* ===== RIGHT: Cart ===== */}
//       <div className="w-80 flex flex-col border border-border rounded-xl bg-card flex-shrink-0">
//         <div className="px-4 py-3 border-b border-border flex items-center gap-2">
//           <ShoppingCart size={18} className="text-primary" />
//           <h2 className="font-semibold">Cart</h2>
//           {cart.length > 0 && (
//             <Badge className="ml-auto">{cart.length} item{cart.length > 1 ? 's' : ''}</Badge>
//           )}
//         </div>

//         {/* Cart items */}
//         <div className="flex-1 overflow-y-auto px-4 py-2">
//           {cart.length === 0 ? (
//             <div className="text-center py-12 text-muted-foreground text-sm">
//               Cart is empty. Search and tap a product to add it.
//             </div>
//           ) : (
//             <div className="space-y-3">
//               {cart.map(item => (
//                 <div key={item.product_id} className="cart-item py-3">
//                   <div className="flex-1 min-w-0 pr-2">
//                     <p className="text-sm font-medium leading-tight">{item.name}</p>
//                     <p className="text-xs text-muted-foreground">{formatKES(item.selling_price)} each</p>
//                   </div>
//                   <div className="flex items-center gap-1.5">
//                     <button
//                       onClick={() => updateQty(item.product_id, -1)}
//                       className="w-6 h-6 rounded-full border border-border flex items-center justify-center hover:bg-muted"
//                     >
//                       <Minus size={12} />
//                     </button>
//                     <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
//                     <button
//                       onClick={() => updateQty(item.product_id, 1)}
//                       className="w-6 h-6 rounded-full border border-border flex items-center justify-center hover:bg-muted"
//                     >
//                       <Plus size={12} />
//                     </button>
//                     <button
//                       onClick={() => removeFromCart(item.product_id)}
//                       className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-destructive ml-1"
//                     >
//                       <Trash2 size={13} />
//                     </button>
//                   </div>
//                   <div className="w-full mt-1.5 flex justify-end">
//                     <span className="text-sm font-semibold text-primary">{formatKES(item.line_total)}</span>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         {/* Cart totals */}
//         {cart.length > 0 && (
//           <div className="px-4 pb-4 border-t border-border pt-3 space-y-1.5">
//             <div className="flex justify-between text-sm">
//               <span className="text-muted-foreground">Subtotal</span>
//               <span>{formatKES(subtotal)}</span>
//             </div>
//             {discount > 0 && (
//               <div className="flex justify-between text-sm text-emerald-600">
//                 <span>Discount</span>
//                 <span>- {formatKES(discount)}</span>
//               </div>
//             )}
//             <div className="flex justify-between font-semibold text-lg pt-1 border-t border-border">
//               <span>Total</span>
//               <span className="text-primary">{formatKES(total)}</span>
//             </div>

//             {/* Quick discount input */}
//             <div className="flex gap-2 pt-1">
//               <Input
//                 placeholder="Discount (KES)"
//                 type="number"
//                 min="0"
//                 value={checkoutData.discount_amount}
//                 onChange={e => setCheckoutData(p => ({ ...p, discount_amount: e.target.value }))}
//                 className="h-8 text-sm"
//               />
//             </div>

//             <Button className="w-full mt-2" onClick={() => setCheckoutOpen(true)}>
//               Checkout →
//             </Button>
//           </div>
//         )}
//       </div>

//       {/* ===== CHECKOUT MODAL ===== */}
//       {checkoutOpen && (
//         <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4" onClick={() => setCheckoutOpen(false)}>
//           <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
//             <div className="flex items-center justify-between mb-5">
//               <h2 className="font-display text-xl font-semibold">Complete Sale</h2>
//               <button onClick={() => setCheckoutOpen(false)} className="text-muted-foreground hover:text-foreground">
//                 <X size={20} />
//               </button>
//             </div>

//             <div className="space-y-4">
//               <div className="bg-primary/5 rounded-xl p-4 text-center">
//                 <p className="text-sm text-muted-foreground">Total Due</p>
//                 <p className="text-3xl font-display font-bold text-primary">{formatKES(total)}</p>
//               </div>

//               <div className="grid grid-cols-2 gap-3">
//                 <div>
//                   <Label className="text-xs mb-1">Payment Method</Label>
//                   <Select
//                     value={checkoutData.payment_method}
//                     onChange={e => setCheckoutData(p => ({ ...p, payment_method: e.target.value }))}
//                   >
//                     <option value="cash">Cash</option>
//                     <option value="mpesa">M-Pesa</option>
//                     <option value="card">Card</option>
//                     <option value="credit">Credit</option>
//                   </Select>
//                 </div>
//                 <div>
//                   <Label className="text-xs mb-1">Amount Paid (KES)</Label>
//                   <Input
//                     type="number"
//                     placeholder={total.toFixed(2)}
//                     value={checkoutData.amount_paid}
//                     onChange={e => setCheckoutData(p => ({ ...p, amount_paid: e.target.value }))}
//                   />
//                 </div>
//               </div>

//               {checkoutData.payment_method === 'mpesa' && (
//                 <div>
//                   <Label className="text-xs mb-1">M-Pesa Reference (optional)</Label>
//                   <Input
//                     placeholder="e.g. QKA8J23LMX"
//                     value={checkoutData.mpesa_ref}
//                     onChange={e => setCheckoutData(p => ({ ...p, mpesa_ref: e.target.value }))}
//                   />
//                 </div>
//               )}

//               {/* Change due */}
//               {checkoutData.payment_method === 'cash' && parseFloat(checkoutData.amount_paid) > total && (
//                 <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-center">
//                   <p className="text-sm text-emerald-700 font-medium">Change Due</p>
//                   <p className="text-2xl font-display font-bold text-emerald-600">{formatKES(change)}</p>
//                 </div>
//               )}

//               <div className="grid grid-cols-2 gap-3">
//                 <div>
//                   <Label className="text-xs mb-1">Customer Name (opt)</Label>
//                   <Input
//                     placeholder="Customer name"
//                     value={checkoutData.customer_name}
//                     onChange={e => setCheckoutData(p => ({ ...p, customer_name: e.target.value }))}
//                   />
//                 </div>
//                 <div>
//                   <Label className="text-xs mb-1">Customer Phone (opt)</Label>
//                   <Input
//                     placeholder="07XX XXX XXX"
//                     value={checkoutData.customer_phone}
//                     onChange={e => setCheckoutData(p => ({ ...p, customer_phone: e.target.value }))}
//                   />
//                 </div>
//               </div>

//               <Button className="w-full h-12 text-base" onClick={handleCheckout} disabled={submitting}>
//                 {submitting
//                   ? <><Loader2 size={16} className="animate-spin mr-2" /> Processing...</>
//                   : `Confirm Sale — ${formatKES(total)}`
//                 }
//               </Button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }



// ============================================================
// POS PAGE — Point of Sale: search products, build cart, checkout
// Fast keyword search helps attendants find products instantly
// FULLY RESPONSIVE: Mobile, Tablet, Desktop
// ============================================================
import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Plus, Minus, Trash2, ShoppingCart, CheckCircle, Loader2, X, Printer, ArrowLeft, CreditCard, Smartphone, Wallet as WalletIcon } from 'lucide-react'
import api from '../lib/api'
import { formatKES, today } from '../lib/utils'
import { Button } from '../components/ui/button'
import { Input, Label, Select, Badge, Card, CardContent } from '../components/ui/index'
import { useToast, ToastContainer } from '../hooks/useToast'

// Debounce hook for search input
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export default function POSPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [products, setProducts] = useState([])
  const [searching, setSearching] = useState(false)
  const [cart, setCart] = useState([])
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [showCartMobile, setShowCartMobile] = useState(false) // For mobile cart view
  const [checkoutData, setCheckoutData] = useState({
    payment_method: 'cash',
    amount_paid: '',
    customer_name: '',
    customer_phone: '',
    discount_amount: '0',
    mpesa_ref: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [completedSale, setCompletedSale] = useState(null)
  const { toasts, toast, dismiss } = useToast()
  const searchRef = useRef(null)
  const debouncedSearch = useDebounce(searchQuery, 300)

  // Auto-focus search on mount
  useEffect(() => {
    searchRef.current?.focus()
  }, [])

  // Search products when query changes
  useEffect(() => {
    if (!debouncedSearch.trim()) {
      setProducts([])
      return
    }
    async function doSearch() {
      setSearching(true)
      try {
        const { data } = await api.get('/products', { params: { search: debouncedSearch, limit: 20 } })
        setProducts(data.products)
      } catch {
        setProducts([])
      } finally {
        setSearching(false)
      }
    }
    doSearch()
  }, [debouncedSearch])

  // Add product to cart
  function addToCart(product) {
    if (product.quantity_in_stock <= 0) {
      toast({ title: 'Out of stock', description: `${product.name} has no stock.`, variant: 'error' })
      return
    }
    setCart(prev => {
      const existing = prev.find(c => c.product_id === product.id)
      if (existing) {
        if (existing.quantity >= product.quantity_in_stock) {
          toast({ title: 'Stock limit reached', description: `Only ${product.quantity_in_stock} units available.`, variant: 'warning' })
          return prev
        }
        return prev.map(c => c.product_id === product.id
          ? { ...c, quantity: c.quantity + 1, line_total: (c.quantity + 1) * c.selling_price }
          : c
        )
      }
      return [...prev, {
        product_id: product.id,
        name: product.name,
        brand: product.brand,
        selling_price: parseFloat(product.selling_price),
        quantity: 1,
        line_total: parseFloat(product.selling_price),
        max_qty: product.quantity_in_stock,
      }]
    })
    setSearchQuery('')
    searchRef.current?.focus()
    
    // On mobile, stay on products view but show cart badge
    if (window.innerWidth < 768) {
      // Optional: Add animation or feedback
    }
  }

  function updateQty(productId, delta) {
    setCart(prev => prev.map(c => {
      if (c.product_id === productId) {
        const newQty = Math.max(1, Math.min(c.max_qty, c.quantity + delta))
        return { 
          ...c, 
          quantity: newQty, 
          line_total: newQty * c.selling_price 
        }
      }
      return c
    }))
  }

  function removeFromCart(productId) {
    setCart(prev => prev.filter(c => c.product_id !== productId))
  }

  const subtotal = cart.reduce((sum, c) => sum + c.line_total, 0)
  const discount = parseFloat(checkoutData.discount_amount || 0)
  const total = Math.max(0, subtotal - discount)
  const change = parseFloat(checkoutData.amount_paid || 0) - total

  async function handleCheckout() {
    if (!cart.length) return
    if (checkoutData.payment_method === 'cash' && parseFloat(checkoutData.amount_paid) < total) {
      toast({ title: 'Insufficient payment', description: 'Amount paid is less than total.', variant: 'error' })
      return
    }
    setSubmitting(true)
    try {
      const { data } = await api.post('/sales', {
        items: cart.map(c => ({ product_id: c.product_id, quantity: c.quantity })),
        ...checkoutData,
        amount_paid: parseFloat(checkoutData.amount_paid) || total,
      })
      setCompletedSale({
        ...data,
        items: cart,
        total,
        change: Math.max(0, change),
        payment_method: checkoutData.payment_method,
      })
      setCart([])
      setCheckoutOpen(false)
      setShowCartMobile(false)
      setCheckoutData({ payment_method: 'cash', amount_paid: '', customer_name: '', customer_phone: '', discount_amount: '0', mpesa_ref: '' })
      toast({ title: '✅ Sale recorded!', description: `Ref: ${data.referenceNo}`, variant: 'success' })
    } catch (err) {
      toast({ title: 'Sale failed', description: err.response?.data?.message || 'Please try again.', variant: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  // ---- RECEIPT MODAL (Responsive) ----
  if (completedSale) {
    return (
      <div className="max-w-sm mx-auto px-4 animate-fade-in">
        <Card className="border-emerald-200 shadow-lg">
          <CardContent className="pt-6 p-4 sm:p-6">
            <div className="text-center mb-6">
              <CheckCircle size={40} className="text-emerald-500 mx-auto mb-2" />
              <h2 className="font-display text-xl font-semibold">Sale Complete!</h2>
              <p className="text-sm text-muted-foreground">Ref: {completedSale.referenceNo}</p>
            </div>
            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
              {completedSale.items.map(item => (
                <div key={item.product_id} className="flex justify-between text-sm">
                  <span className="flex-1">{item.name} × {item.quantity}</span>
                  <span className="font-medium ml-4">{formatKES(item.line_total)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-3 space-y-1">
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatKES(completedSale.total)}</span>
              </div>
              {completedSale.change > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Change</span>
                  <span>{formatKES(completedSale.change)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-muted-foreground capitalize">
                <span>Payment</span>
                <span>{completedSale.payment_method}</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-6">
              <Button variant="outline" className="flex-1 gap-2" onClick={() => window.print()}>
                <Printer size={15} /> Print
              </Button>
              <Button className="flex-1" onClick={() => { setCompletedSale(null); searchRef.current?.focus() }}>
                New Sale
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-6rem)] animate-fade-in">
      <ToastContainer toasts={toasts} dismiss={dismiss} />

      {/* Mobile Header with Cart Toggle */}
      <div className="md:hidden mb-4">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-xl font-semibold">Point of Sale</h1>
          <button
            onClick={() => setShowCartMobile(!showCartMobile)}
            className="relative p-2 rounded-lg bg-card border border-border"
          >
            <ShoppingCart size={20} />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Desktop: Side-by-side | Mobile: Toggle between Products and Cart */}
      <div className={`
        flex flex-col md:flex-row gap-4 md:gap-6 h-full
        ${showCartMobile ? 'block' : 'block'}
      `}>
        
        {/* ===== LEFT: Product Search (Hidden on mobile when cart is shown) ===== */}
        <div className={`
          ${showCartMobile ? 'hidden md:flex' : 'flex'} 
          flex-1 flex-col min-w-0
        `}>
          {/* Desktop Title */}
          <div className="hidden md:block mb-4">
            <h1 className="font-display text-2xl font-semibold mb-3">Point of Sale</h1>
          </div>
          
          {/* Search bar */}
          <div className="mb-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchRef}
                placeholder="Search by name, brand, keyword, SKU… (e.g. 'lotion', 'nivea')"
                className="pl-10 h-10 md:h-12 text-sm md:text-base"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searching && (
                <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 hidden md:block">
              💡 Tip: Use keywords like "moisturizer", "hair oil", or scan barcode
            </p>
          </div>

          {/* Product results */}
          <div className="flex-1 overflow-y-auto pb-4">
            {searchQuery && !searching && products.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Search size={32} className="mx-auto mb-2 opacity-30" />
                <p>No products found for "{searchQuery}"</p>
                <p className="text-xs mt-1">Try different keywords or check spelling</p>
              </div>
            )}

            {!searchQuery && (
              <div className="text-center py-12 md:py-16 text-muted-foreground">
                <ShoppingCart size={40} className="mx-auto mb-3 opacity-20" />
                <p className="font-medium">Start typing to search for products</p>
                <p className="text-xs mt-1 hidden md:block">Search by product name, brand, or keywords</p>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-3">
              {products.map(product => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.quantity_in_stock <= 0}
                  className={`
                    text-left p-2 sm:p-3 rounded-xl border transition-all
                    ${product.quantity_in_stock <= 0
                      ? 'opacity-40 cursor-not-allowed bg-muted border-border'
                      : 'bg-card border-border hover:border-primary/50 hover:shadow-md active:scale-95'
                    }
                  `}
                >
                  <p className="text-xs sm:text-sm font-semibold leading-tight line-clamp-2">{product.name}</p>
                  {product.brand && <p className="text-xs text-muted-foreground mt-0.5 truncate">{product.brand}</p>}
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-primary font-bold text-sm sm:text-base">{formatKES(product.selling_price)}</p>
                    <span className={`
                      text-xs px-1.5 py-0.5 rounded-full whitespace-nowrap
                      ${product.quantity_in_stock <= 0 ? 'bg-red-100 text-red-600'
                        : product.is_low_stock ? 'bg-amber-100 text-amber-600'
                        : 'bg-emerald-100 text-emerald-600'}
                    `}>
                      {product.quantity_in_stock <= 0 ? 'Out' : `${product.quantity_in_stock}`}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ===== RIGHT: Cart (Full width on mobile when toggled) ===== */}
        <div className={`
          ${showCartMobile ? 'flex' : 'hidden md:flex'}
          w-full md:w-80 lg:w-96
          flex-col border border-border rounded-xl bg-card
          ${showCartMobile ? 'h-full' : ''}
        `}>
          
          {/* Mobile Back Button */}
          {showCartMobile && (
            <div className="md:hidden px-4 py-3 border-b border-border flex items-center gap-2">
              <button onClick={() => setShowCartMobile(false)} className="p-1">
                <ArrowLeft size={20} />
              </button>
              <h2 className="font-semibold flex-1">Shopping Cart</h2>
              {cart.length > 0 && (
                <Badge>{cart.length} item{cart.length > 1 ? 's' : ''}</Badge>
              )}
            </div>
          )}

          {/* Desktop Header */}
          <div className="hidden md:flex px-4 py-3 border-b border-border items-center gap-2">
            <ShoppingCart size={18} className="text-primary" />
            <h2 className="font-semibold">Cart</h2>
            {cart.length > 0 && (
              <Badge className="ml-auto">{cart.length} item{cart.length > 1 ? 's' : ''}</Badge>
            )}
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-2">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                <ShoppingCart size={32} className="mx-auto mb-3 opacity-20" />
                Cart is empty
                <p className="text-xs mt-1 hidden md:block">Search and tap a product to add it.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.product_id} className="border-b border-border pb-3 last:border-0">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="text-sm font-medium leading-tight">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{formatKES(item.selling_price)} each</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQty(item.product_id, -1)}
                          className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-muted"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQty(item.product_id, 1)}
                          className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-muted"
                        >
                          <Plus size={12} />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.product_id)}
                          className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-destructive ml-1"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-end mt-1">
                      <span className="text-sm font-semibold text-primary">{formatKES(item.line_total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart totals */}
          {cart.length > 0 && (
            <div className="px-3 sm:px-4 pb-4 border-t border-border pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatKES(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Discount</span>
                  <span>- {formatKES(discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-base md:text-lg pt-1 border-t border-border">
                <span>Total</span>
                <span className="text-primary">{formatKES(total)}</span>
              </div>

              {/* Discount input */}
              <div>
                <Input
                  placeholder="Discount (KES)"
                  type="number"
                  min="0"
                  value={checkoutData.discount_amount}
                  onChange={e => setCheckoutData(p => ({ ...p, discount_amount: e.target.value }))}
                  className="h-9 text-sm"
                />
              </div>

              <Button 
                className="w-full" 
                size="lg"
                onClick={() => setCheckoutOpen(true)}
              >
                Checkout →
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ===== CHECKOUT MODAL (Responsive) ===== */}
      {checkoutOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto" onClick={() => setCheckoutOpen(false)}>
          <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md my-4 animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border">
              <h2 className="font-display text-lg sm:text-xl font-semibold">Complete Sale</h2>
              <button onClick={() => setCheckoutOpen(false)} className="p-1 hover:bg-muted rounded-full transition">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <div className="bg-primary/5 rounded-xl p-4 text-center">
                <p className="text-sm text-muted-foreground">Total Due</p>
                <p className="text-2xl sm:text-3xl font-display font-bold text-primary">{formatKES(total)}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1 block">Payment Method</Label>
                  <Select
                    value={checkoutData.payment_method}
                    onChange={e => setCheckoutData(p => ({ ...p, payment_method: e.target.value }))}
                    className="w-full"
                  >
                    <option value="cash">💰 Cash</option>
                    <option value="mpesa">📱 M-Pesa</option>
                    <option value="card">💳 Card</option>
                    <option value="credit">📝 Credit</option>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Amount Paid (KES)</Label>
                  <Input
                    type="number"
                    placeholder={total.toFixed(2)}
                    value={checkoutData.amount_paid}
                    onChange={e => setCheckoutData(p => ({ ...p, amount_paid: e.target.value }))}
                    className="w-full"
                  />
                </div>
              </div>

              {checkoutData.payment_method === 'mpesa' && (
                <div>
                  <Label className="text-xs mb-1 block">M-Pesa Reference (optional)</Label>
                  <Input
                    placeholder="e.g. QKA8J23LMX"
                    value={checkoutData.mpesa_ref}
                    onChange={e => setCheckoutData(p => ({ ...p, mpesa_ref: e.target.value }))}
                  />
                </div>
              )}

              {/* Change due */}
              {checkoutData.payment_method === 'cash' && parseFloat(checkoutData.amount_paid) > total && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-center">
                  <p className="text-sm text-emerald-700 font-medium">Change Due</p>
                  <p className="text-xl sm:text-2xl font-display font-bold text-emerald-600">{formatKES(change)}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1 block">Customer Name (opt)</Label>
                  <Input
                    placeholder="Customer name"
                    value={checkoutData.customer_name}
                    onChange={e => setCheckoutData(p => ({ ...p, customer_name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Customer Phone (opt)</Label>
                  <Input
                    placeholder="07XX XXX XXX"
                    value={checkoutData.customer_phone}
                    onChange={e => setCheckoutData(p => ({ ...p, customer_phone: e.target.value }))}
                  />
                </div>
              </div>

              <Button className="w-full h-11 sm:h-12 text-sm sm:text-base" onClick={handleCheckout} disabled={submitting}>
                {submitting
                  ? <><Loader2 size={16} className="animate-spin mr-2" /> Processing...</>
                  : `Confirm Sale — ${formatKES(total)}`
                }
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}