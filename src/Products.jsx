import { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Tag, Sparkles, Utensils, Box, Coffee, Cookie, Home, Check } from 'lucide-react';

export const getCategoryIcon = () => {
  return <Tag size={18} />;
};

export default function Products({ products, setProducts, salesLogs, settings }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [form, setForm] = useState({ name: '', category: '', sellingPrice: '', costPrice: '', currentQty: '' });
  
  const existingCategories = useMemo(() => {
    const usedCategories = products.map(p => p.category);
    return [...new Set(usedCategories)].filter(Boolean).sort();
  }, [products]);

  const productAnalytics = useMemo(() => {
    return products.map(product => {
      const totalSoldRevenue = salesLogs
        .filter(log => log.productId === product.id)
        .reduce((sum, log) => sum + (log.price * log.quantity), 0);
      
      const expectedRemainingRevenue = product.currentQty * product.sellingPrice;

      return {
        ...product,
        totalEarnings: totalSoldRevenue,
        potentialSoldOutEarnings: expectedRemainingRevenue
      };
    });
  }, [products, salesLogs]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      setProducts(products.map(p => p.id === editingId ? { ...p, ...form, sellingPrice: Number(form.sellingPrice), costPrice: Number(form.costPrice), currentQty: Number(form.currentQty) } : p));
      setEditingId(null);
    } else {
      setProducts([...products, { id: crypto.randomUUID(), ...form, sellingPrice: Number(form.sellingPrice), costPrice: Number(form.costPrice), currentQty: Number(form.currentQty) }]);
      setIsAdding(false);
    }
    setForm({ name: '', category: '', sellingPrice: '', costPrice: '', currentQty: '' });
  };

  const startEdit = (product) => {
    setForm(product);
    setEditingId(product.id);
    setIsAdding(true);
  };

  const deleteProduct = (id) => {
    if(confirm('Are you sure you want to delete this product?')) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  return (
    <div className="flex flex-col lg:max-h-[calc(100vh-10rem)] relative pb-10">
      <div className="flex justify-between items-center shrink-0 mb-6">
        <h2 className="text-2xl font-bold">Product Management</h2>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-deep-charcoal text-white rounded font-medium hover:bg-opacity-90"
          >
            <Plus size={18} />
            Add Product
          </button>
        )}
      </div>

      {showCategoryPicker && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-stone-900/10 backdrop-blur-md animate-in fade-in duration-300" 
            onClick={() => setShowCategoryPicker(false)} 
          />
          <div className="relative bg-white/95 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/50 shadow-[0_32px_128px_rgba(0,0,0,0.15)] w-full max-w-sm animate-in zoom-in-95 duration-300 ease-out flex flex-col items-center">
            
            <div className="p-4 bg-dirty-white rounded-2xl w-fit mb-6">
              <Tag size={28} className="text-stone-500" />
            </div>

            <h3 className="text-xl font-black text-deep-charcoal uppercase tracking-tighter mb-2 italic">Categorize</h3>
            <p className="text-stone-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-8">Type or select existing</p>

            <div className="w-full space-y-4">
              <div className="relative group">
                <input 
                  autoFocus
                  type="text" 
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="Custom category name..."
                  className="w-full px-5 py-4 bg-dirty-white border-2 border-transparent focus:border-sage rounded-2xl text-sm font-bold placeholder:text-stone-300 focus:outline-none transition-all shadow-inner"
                />
              </div>

              <div className="max-h-60 overflow-y-auto px-1 -mx-1 space-y-1.5 scrollbar-hide">
                {existingCategories.map((cat, i) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setForm({ ...form, category: cat });
                      setShowCategoryPicker(false);
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 ${
                      form.category === cat 
                        ? 'bg-sage text-white shadow-lg scale-[1.02]' 
                        : 'hover:bg-dirty-white text-stone-500 hover:text-deep-charcoal'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg shrink-0 ${
                      form.category === cat ? 'bg-white/20' : 'bg-stone-100'
                    }`}>
                      {getCategoryIcon(cat)}
                    </div>
                    <span className="font-bold text-xs truncate">{cat}</span>
                    {form.category === cat && <Check size={14} className="ml-auto" />}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setShowCategoryPicker(false)}
                className="w-full py-4 mt-4 bg-deep-charcoal text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-opacity-90 transition-all shadow-lg"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white p-6 border border-stone-200 rounded-lg shadow-sm animate-in fade-in slide-in-from-top-4 duration-300 space-y-3">
          {/* Row 1: Name + Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-stone-500 mb-1">Name</label>
              <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-sage text-sm" placeholder="Product name" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-500 mb-1">Category</label>
              <button 
                type="button"
                onClick={() => setShowCategoryPicker(true)}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-left flex items-center gap-2 hover:border-sage transition-colors bg-white group"
              >
                <span className="text-stone-400 shrink-0">{getCategoryIcon(form.category)}</span>
                <span className={`text-sm font-medium flex-1 min-w-0 truncate ${form.category ? 'text-deep-charcoal' : 'text-stone-300'}`}>
                  {form.category || 'Select or type category'}
                </span>
                <Plus size={14} className="text-stone-200 group-hover:text-stone-400 transition-colors shrink-0" />
              </button>
            </div>
          </div>

          {/* Row 2: Prices + Qty + Buttons */}
          <div className="flex items-end gap-3">
            <div className="flex-1 min-w-0">
              <label className="block text-sm font-semibold text-stone-500 mb-1">Cost Price ({settings.currency})</label>
              <input required type="number" min="0" step="0.01" value={form.costPrice} onChange={e => setForm({...form, costPrice: e.target.value})} className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-sage text-sm" placeholder="0.00" />
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-sm font-semibold text-stone-500 mb-1">Selling Price ({settings.currency})</label>
              <input required type="number" min="0" step="0.01" value={form.sellingPrice} onChange={e => setForm({...form, sellingPrice: e.target.value})} className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-sage text-sm" placeholder="0.00" />
            </div>
            <div className="w-28 shrink-0">
              <label className="block text-sm font-semibold text-stone-500 mb-1">Qty</label>
              <input required type="number" min="0" value={form.currentQty} onChange={e => setForm({...form, currentQty: e.target.value})} className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-sage text-sm" placeholder="0" />
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => { setIsAdding(false); setEditingId(null); setForm({ name: '', category: '', sellingPrice: '', costPrice: '', currentQty: '' }); }}
                className="px-4 py-2 text-sm text-stone-accent font-bold border border-stone-200 rounded-lg hover:bg-dirty-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-sage text-white font-bold rounded-lg hover:bg-opacity-90 transition-colors whitespace-nowrap"
              >
                {editingId ? 'Update' : 'Save'} Product
              </button>
            </div>
          </div>
        </form>
      )}



      <div className="flex-1 bg-white border border-stone-200 rounded-lg overflow-auto shadow-sm min-h-0">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-dirty-white border-b border-stone-200 text-xs uppercase tracking-widest text-stone-accent sticky top-0 z-10">
              <th className="p-4 font-black">Product Info</th>
              <th className="p-4 font-black text-right">Stock</th>
              <th className="p-4 font-black text-right">Selling Price</th>
              <th className="p-4 font-black text-right">Total Earned</th>
              <th className="p-4 font-black text-right">Expected</th>
              <th className="p-4 font-black text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {productAnalytics.map(product => (
              <tr key={product.id} className="border-b border-stone-100 hover:bg-dirty-white transition-colors text-sm group">
                <td className="p-4">
                  <div className="font-bold text-deep-charcoal">{product.name}</div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-stone-400 mt-0.5 flex items-center gap-1">
                    <span className="text-stone-300">{getCategoryIcon(product.category)}</span> {product.category || 'Uncategorized'}
                  </div>
                </td>
                <td className="p-4 text-right">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${product.currentQty === 0 ? 'bg-muted-orange text-white' : 'bg-stone-100 text-stone-600'}`}>
                    {product.currentQty}
                  </span>
                </td>
                <td className="p-4 text-right font-medium">{settings.currency}{product.sellingPrice.toFixed(2)}</td>
                <td className="p-4 text-right text-sage font-bold">{settings.currency}{product.totalEarnings.toFixed(2)}</td>
                <td className="p-4 text-right text-stone-accent text-xs">{settings.currency}{product.potentialSoldOutEarnings.toFixed(2)}</td>
                <td className="p-4 flex justify-center gap-2">
                  <button onClick={() => startEdit(product)} className="p-1.5 text-stone-300 hover:text-deep-charcoal hover:bg-white rounded transition-all" title="Edit">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => deleteProduct(product.id)} className="p-1.5 text-stone-300 hover:text-muted-orange hover:bg-white rounded transition-all" title="Delete">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan="6" className="p-12 text-center text-stone-accent font-medium italic">No products found. Add some to get started.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
