// ============================================================
// PRODUCT FORM MODAL — Create or edit a product
// Admins can set buying price, selling price, keywords
// ============================================================
import { useState } from "react";
import { X, Loader2, Info } from "lucide-react";
import api from "../../lib/api";
import { Input, Label, Select, Textarea, Card, CardContent } from "../ui/index";
import { Button } from "../ui/button";
import { useToast, ToastContainer } from "../../hooks/useToast";

export default function ProductFormModal({ product, categories, onClose }) {
  const isEdit = !!product;
  const [form, setForm] = useState({
    name: product?.name || "",
    brand: product?.brand || "",
    category_id: product?.category_id || "",
    sku: product?.sku || "",
    barcode: product?.barcode || "",
    description: product?.description || "",
    search_keywords: product?.search_keywords || "",
    buying_price: product?.buying_price || "",
    selling_price: product?.selling_price || "",
    quantity_in_stock: product?.quantity_in_stock || 0,
    low_stock_threshold: product?.low_stock_threshold || 10,
    unit: product?.unit || "pcs",
    price_change_reason: "",
  });
  const [saving, setSaving] = useState(false);
  const { toasts, toast, dismiss } = useToast();

  function update(field, value) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  const margin =
    form.buying_price && form.selling_price
      ? (
          ((form.selling_price - form.buying_price) / form.buying_price) *
          100
        ).toFixed(1)
      : null;

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/products/${product.id}`, form);
        toast({ title: "Product updated", variant: "success" });
      } else {
        await api.post("/products", form);
        toast({ title: "Product created", variant: "success" });
      }
      setTimeout(onClose, 800);
    } catch (err) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Save failed",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    // <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
    <div className="fixed inset-0 bg-black/40 z-40 flex items-start justify-center p-2 sm:p-4 overflow-y-auto">
      <ToastContainer toasts={toasts} dismiss={dismiss} />

      <div
        className="bg-card rounded-2xl border shadow-2xl w-full max-w-2xl my-2 sm:my-4 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Responsive padding */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
          <h2 className="font-display text-base sm:text-lg font-semibold">
            {isEdit ? "Edit Product" : "Add New Product"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-full transition"
          >
            <X size={18} className="sm:w-5 sm:h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Form - Responsive spacing */}
        <form
          onSubmit={handleSave}
          className="p-4 sm:p-6 space-y-4 sm:space-y-5"
        >
          {/* Basic info grid - responsive columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>Product Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="e.g. Nivea Body Lotion 400ml"
                required
                className="mt-1 text-sm sm:text-base"
              />
            </div>

            <div>
              <Label>Brand</Label>
              <Input
                value={form.brand}
                onChange={(e) => update("brand", e.target.value)}
                placeholder="e.g. Nivea"
                className="mt-1 text-sm sm:text-base"
              />
            </div>

            <div>
              <Label>Category</Label>
              <Select
                value={form.category_id}
                onChange={(e) => update("category_id", e.target.value)}
                className="mt-1 w-full"
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label>SKU / Item Code</Label>
              <Input
                value={form.sku}
                onChange={(e) => update("sku", e.target.value)}
                placeholder="e.g. NIV-BL-400"
                className="mt-1 text-sm sm:text-base"
              />
            </div>

            <div>
              <Label>Barcode</Label>
              <Input
                value={form.barcode}
                onChange={(e) => update("barcode", e.target.value)}
                placeholder="Barcode number"
                className="mt-1 text-sm sm:text-base"
              />
            </div>

            <div>
              <Label>Unit of Measure</Label>
              <Select
                value={form.unit}
                onChange={(e) => update("unit", e.target.value)}
                className="mt-1 w-full"
              >
                {[
                  "pcs",
                  "bottle",
                  "tube",
                  "sachet",
                  "kit",
                  "box",
                  "roll",
                  "ml",
                  "g",
                  "kg",
                  "l",
                ].map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label>Low Stock Alert (units)</Label>
              <Input
                type="number"
                min="1"
                value={form.low_stock_threshold}
                onChange={(e) => update("low_stock_threshold", e.target.value)}
                className="mt-1 text-sm sm:text-base"
              />
            </div>
          </div>

          {/* Search keywords - Full width on all screens */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Label>Search Keywords</Label>
              <Info size={13} className="text-muted-foreground" />
            </div>
            <Input
              value={form.search_keywords}
              onChange={(e) => update("search_keywords", e.target.value)}
              placeholder="e.g. lotion,skin,moisturizer,body,soft — comma separated"
              className="text-sm sm:text-base"
            />
            <p className="text-xs text-muted-foreground mt-1">
              These help attendants find this product fast at the POS. Add
              synonyms, uses, ingredients.
            </p>
          </div>

          {/* Pricing section - responsive padding */}
          <div className="bg-secondary/50 rounded-xl p-3 sm:p-4 space-y-3">
            <h3 className="font-semibold text-sm sm:text-base">Pricing</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Buying Price (KES) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.buying_price}
                  onChange={(e) => update("buying_price", e.target.value)}
                  placeholder="0.00"
                  required
                  className="mt-1 text-sm sm:text-base"
                />
              </div>

              <div>
                <Label>Selling Price (KES) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.selling_price}
                  onChange={(e) => update("selling_price", e.target.value)}
                  placeholder="0.00"
                  required
                  className="mt-1 text-sm sm:text-base"
                />
              </div>
            </div>

            {margin && (
              <div
                className={`text-sm font-medium ${parseFloat(margin) > 0 ? "text-emerald-600" : "text-red-500"}`}
              >
                Profit margin: {margin}%
                {parseFloat(margin) < 10 && (
                  <span className="text-amber-600 ml-2">⚠️ Low margin</span>
                )}
              </div>
            )}

            {isEdit && (
              <div>
                <Label>Reason for Price Change (if changed)</Label>
                <Input
                  value={form.price_change_reason}
                  onChange={(e) =>
                    update("price_change_reason", e.target.value)
                  }
                  placeholder="e.g. Supplier price increase"
                  className="mt-1 text-sm sm:text-base"
                />
              </div>
            )}
          </div>

          {/* Stock section - only on new product */}
          {!isEdit && (
            <div>
              <Label>Opening Stock Quantity</Label>
              <Input
                type="number"
                min="0"
                value={form.quantity_in_stock}
                onChange={(e) => update("quantity_in_stock", e.target.value)}
                className="mt-1 text-sm sm:text-base"
              />
            </div>
          )}

          {/* Description */}
          <div>
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Optional product description"
              rows={2}
              className="mt-1 text-sm sm:text-base"
            />
          </div>

          {/* Buttons - responsive layout */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="w-full sm:flex-1"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 size={15} className="animate-spin mr-2" /> Saving...
                </>
              ) : isEdit ? (
                "Update Product"
              ) : (
                "Create Product"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>

    // <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4 overflow-y-auto">
    //   <ToastContainer toasts={toasts} dismiss={dismiss} />
    //   <div className="bg-card rounded-2xl border shadow-2xl w-full max-w-2xl my-4 animate-fade-in" onClick={e => e.stopPropagation()}>
    //     <div className="flex items-center justify-between px-6 py-4 border-b border-border">
    //       <h2 className="font-display text-lg font-semibold">
    //         {isEdit ? 'Edit Product' : 'Add New Product'}
    //       </h2>
    //       <button onClick={onClose}><X size={20} className="text-muted-foreground" /></button>
    //     </div>

    //     <form onSubmit={handleSave} className="p-6 space-y-5">
    //       {/* Basic info */}
    //       <div className="grid grid-cols-2 gap-4">
    //         <div className="col-span-2">
    //           <Label>Product Name *</Label>
    //           <Input value={form.name} onChange={e => update('name', e.target.value)}
    //             placeholder="e.g. Nivea Body Lotion 400ml" required className="mt-1" />
    //         </div>
    //         <div>
    //           <Label>Brand</Label>
    //           <Input value={form.brand} onChange={e => update('brand', e.target.value)}
    //             placeholder="e.g. Nivea" className="mt-1" />
    //         </div>
    //         <div>
    //           <Label>Category</Label>
    //           <Select value={form.category_id} onChange={e => update('category_id', e.target.value)} className="mt-1">
    //             <option value="">Select category</option>
    //             {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
    //           </Select>
    //         </div>
    //         <div>
    //           <Label>SKU / Item Code</Label>
    //           <Input value={form.sku} onChange={e => update('sku', e.target.value)}
    //             placeholder="e.g. NIV-BL-400" className="mt-1" />
    //         </div>
    //         <div>
    //           <Label>Barcode</Label>
    //           <Input value={form.barcode} onChange={e => update('barcode', e.target.value)}
    //             placeholder="Barcode number" className="mt-1" />
    //         </div>
    //         <div>
    //           <Label>Unit of Measure</Label>
    //           <Select value={form.unit} onChange={e => update('unit', e.target.value)} className="mt-1">
    //             {['pcs','bottle','tube','sachet','kit','box','roll','ml','g','kg','l'].map(u =>
    //               <option key={u} value={u}>{u}</option>
    //             )}
    //           </Select>
    //         </div>
    //         <div>
    //           <Label>Low Stock Alert (units)</Label>
    //           <Input type="number" min="1" value={form.low_stock_threshold}
    //             onChange={e => update('low_stock_threshold', e.target.value)} className="mt-1" />
    //         </div>
    //       </div>

    //       {/* Search keywords — KEY for POS attendant search */}
    //       <div>
    //         <div className="flex items-center gap-2 mb-1">
    //           <Label>Search Keywords</Label>
    //           <Info size={13} className="text-muted-foreground" />
    //         </div>
    //         <Input
    //           value={form.search_keywords}
    //           onChange={e => update('search_keywords', e.target.value)}
    //           placeholder="e.g. lotion,skin,moisturizer,body,soft — comma separated"
    //         />
    //         <p className="text-xs text-muted-foreground mt-1">
    //           These help attendants find this product fast at the POS. Add synonyms, uses, ingredients.
    //         </p>
    //       </div>

    //       {/* Pricing */}
    //       <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
    //         <h3 className="font-semibold text-sm">Pricing</h3>
    //         <div className="grid grid-cols-2 gap-4">
    //           <div>
    //             <Label>Buying Price (KES) *</Label>
    //             <Input type="number" step="0.01" min="0" value={form.buying_price}
    //               onChange={e => update('buying_price', e.target.value)}
    //               placeholder="0.00" required className="mt-1" />
    //           </div>
    //           <div>
    //             <Label>Selling Price (KES) *</Label>
    //             <Input type="number" step="0.01" min="0" value={form.selling_price}
    //               onChange={e => update('selling_price', e.target.value)}
    //               placeholder="0.00" required className="mt-1" />
    //           </div>
    //         </div>
    //         {margin && (
    //           <div className={`text-sm font-medium ${parseFloat(margin) > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
    //             Profit margin: {margin}%
    //             {parseFloat(margin) < 10 && <span className="text-amber-600 ml-2">⚠️ Low margin</span>}
    //           </div>
    //         )}
    //         {isEdit && (
    //           <div>
    //             <Label>Reason for Price Change (if changed)</Label>
    //             <Input value={form.price_change_reason}
    //               onChange={e => update('price_change_reason', e.target.value)}
    //               placeholder="e.g. Supplier price increase" className="mt-1" />
    //           </div>
    //         )}
    //       </div>

    //       {/* Stock (only on new product) */}
    //       {!isEdit && (
    //         <div>
    //           <Label>Opening Stock Quantity</Label>
    //           <Input type="number" min="0" value={form.quantity_in_stock}
    //             onChange={e => update('quantity_in_stock', e.target.value)} className="mt-1" />
    //         </div>
    //       )}

    //       <div>
    //         <Label>Description</Label>
    //         <Textarea value={form.description} onChange={e => update('description', e.target.value)}
    //           placeholder="Optional product description" rows={2} className="mt-1" />
    //       </div>

    //       <div className="flex gap-3 pt-2">
    //         <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
    //         <Button type="submit" className="flex-1" disabled={saving}>
    //           {saving ? <><Loader2 size={15} className="animate-spin mr-2" /> Saving...</> : (isEdit ? 'Update Product' : 'Create Product')}
    //         </Button>
    //       </div>
    //     </form>
    //   </div>
    // </div>
  );
}
