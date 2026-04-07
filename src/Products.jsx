import { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Tag, Sparkles, Utensils, Box, Coffee, Cookie, Home, Check } from 'lucide-react';

export const CATEGORIES = [
  { name: "Personal Care & Laundry", icon: <Sparkles size={18} /> },
  { name: "Canned Goods & Instant Meals", icon: <Utensils size={18} /> },
  { name: "Grains & Essentials", icon: <Box size={18} /> },
  { name: "Beverages & Snacks", icon: <Coffee size={18} /> },
  { name: "Sweets & Bread", icon: <Cookie size={18} /> },
  { name: "Other Household Items", icon: <Home size={18} /> }
];

export default function Products({ products, setProducts, salesLogs }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  
  const [form, setForm] = useState({ name: '', category: CATEGORIES[0].name, sellingPrice: '', costPrice: '', currentQty: '' });

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
      setProducts([...products, { id: Date.now().toString(), ...form, sellingPrice: Number(form.sellingPrice), costPrice: Number(form.costPrice), currentQty: Number(form.currentQty) }]);
      setIsAdding(false);
    }
    setForm({ name: '', category: CATEGORIES[0].name, sellingPrice: '', costPrice: '', currentQty: '' });
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

  const getCategoryIcon = (catName) => {
    return CATEGORIES.find(c => c.name === catName)?.icon || <Tag size={10} />;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
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
                <span className="text-sm font-medium flex-1 min-w-0 truncate">{form.category}</span>
                <Edit2 size={12} className="text-stone-200 group-hover:text-stone-400 transition-colors shrink-0" />
              </button>
            </div>
          </div>

          {/* Row 2: Prices + Qty + Buttons */}
          <div className="flex items-end gap-3">
            <div className="flex-1 min-w-0">
              <label className="block text-sm font-semibold text-stone-500 mb-1">Cost Price (₱)</label>
              <input required type="number" min="0" step="0.01" value={form.costPrice} onChange={e => setForm({...form, costPrice: e.target.value})} className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-sage text-sm" placeholder="0.00" />
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-sm font-semibold text-stone-500 mb-1">Selling Price (₱)</label>
              <input required type="number" min="0" step="0.01" value={form.sellingPrice} onChange={e => setForm({...form, sellingPrice: e.target.value})} className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-sage text-sm" placeholder="0.00" />
            </div>
            <div className="w-28 shrink-0">
              <label className="block text-sm font-semibold text-stone-500 mb-1">Qty</label>
              <input required type="number" min="0" value={form.currentQty} onChange={e => setForm({...form, currentQty: e.target.value})} className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-sage text-sm" placeholder="0" />
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => { setIsAdding(false); setEditingId(null); setForm({ name: '', category: CATEGORIES[0].name, sellingPrice: '', costPrice: '', currentQty: '' }); }}
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

      {/* Category Picker Modal */}
      {showCategoryPicker && (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div 
            className="absolute inset-0 bg-stone-900/20 backdrop-blur-[2px] animate-in fade-in duration-200" 
            onClick={() => setShowCategoryPicker(false)} 
          />
          <div className="relative bg-white p-6 rounded-t-[2rem] sm:rounded-[2rem] border border-stone-100 shadow-[0_-16px_64px_rgba(0,0,0,0.12)] sm:shadow-[0_32px_128px_rgba(0,0,0,0.15)] w-full sm:max-w-sm animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300 ease-out">
            {/* Handle for mobile bottom sheet */}
            <div className="w-10 h-1 bg-stone-200 rounded-full mx-auto mb-6 sm:hidden" />
            <h3 className="text-base font-black text-deep-charcoal uppercase tracking-widest mb-4 text-center">Select Category</h3>
            <div className="grid grid-cols-1 gap-1.5">
              {CATEGORIES.map((cat, i) => (
                <button
                  key={cat.name}
                  onClick={() => {
                    setForm({ ...form, category: cat.name });
                    setShowCategoryPicker(false);
                  }}
                  style={{ animationDelay: `${i * 40}ms` }}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 ${
                    form.category === cat.name 
                      ? 'bg-sage text-white shadow-md' 
                      : 'hover:bg-dirty-white text-stone-600 hover:text-deep-charcoal'
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 ${
                    form.category === cat.name ? 'bg-white/20' : 'bg-stone-100'
                  }`}>
                    {cat.icon}
                  </div>
                  <span className="font-bold text-sm text-left flex-1">{cat.name}</span>
                  {form.category === cat.name && (
                    <div className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center shrink-0">
                      <Check size={12} />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setShowCategoryPicker(false)}
              className="mt-5 w-full py-3 text-xs font-black uppercase tracking-widest text-stone-400 hover:text-deep-charcoal transition-colors rounded-xl hover:bg-dirty-white"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-stone-200 rounded-lg overflow-x-auto shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-dirty-white border-b border-stone-200 text-xs uppercase tracking-widest text-stone-accent">
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
                <td className="p-4 text-right font-medium">₱{product.sellingPrice.toFixed(2)}</td>
                <td className="p-4 text-right text-sage font-bold">₱{product.totalEarnings.toFixed(2)}</td>
                <td className="p-4 text-right text-stone-accent text-xs">₱{product.potentialSoldOutEarnings.toFixed(2)}</td>
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
