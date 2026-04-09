import { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, Search, CheckCircle, Printer, LayoutGrid, List, Zap, ChevronDown, ChevronUp, MonitorOff, Tag } from 'lucide-react';
import { getCategoryIcon } from './Products';

export default function POS({ products, setProducts, salesLogs, setSalesLogs, userEmail, settings }) {
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [clientMoney, setClientMoney] = useState('');
  const [shouldPrint, setShouldPrint] = useState(false);
  const [isSilentPrint, setIsSilentPrint] = useState(false);
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [sortMode, setSortMode] = useState('date');
  const [isTooSmall, setIsTooSmall] = useState(window.innerWidth < 768);

  const activeCategories = useMemo(() => {
    return [...new Set(products.map(p => p.category))].filter(Boolean).sort();
  }, [products]);

  useEffect(() => {
    const handleResize = () => setIsTooSmall(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filteredProducts = [...products]
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      return matchesSearch && matchesCategory && p.currentQty > 0;
    })
    .sort((a, b) => {
      if (sortMode === 'alpha') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const change = Number(clientMoney) - cartTotal;

  const addToCart = (product) => {
    const existing = cart.find(item => item.productId === product.id);
    if (existing) {
      if (existing.quantity >= product.currentQty) return;
      setCart(cart.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { productId: product.id, name: product.name, price: product.sellingPrice, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId, qty) => {
    const product = products.find(p => p.id === productId);
    if (qty > product.currentQty) return;
    if (qty <= 0) {
      removeFromCart(productId);
    } else {
      setCart(cart.map(item => item.productId === productId ? { ...item, quantity: qty } : item));
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    if (clientMoney === '' || Number(clientMoney) < cartTotal) {
      alert("Insufficient client money.");
      return;
    }

    const timestamp = new Date().toISOString();
    
    const updatedProducts = products.map(p => {
      const cartItem = cart.find(item => item.productId === p.id);
      if (cartItem) {
        return { ...p, currentQty: p.currentQty - cartItem.quantity };
      }
      return p;
    });

    const newLogs = cart.map(item => ({
      id: crypto.randomUUID(),
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
      timestamp
    }));

    setProducts(updatedProducts);
    setSalesLogs(prev => [...prev, ...newLogs]);

    if (shouldPrint) {
      printReceipt(newLogs, timestamp);
    }

    setCart([]);
    setClientMoney('');
    alert("Transaction Successful!");
  };

  const printReceipt = (logs, timestamp) => {
    const itemsHtml = logs.map(log => {
      const product = products.find(p => p.id === log.productId);
      return `
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px;">
          <span>${product?.name || 'Unknown'} x${log.quantity}</span>
          <span>${settings.currency}${(log.price * log.quantity).toFixed(2)}</span>
        </div>
      `;
    }).join('');

    const htmlContent = `
      <html>
        <head>
          <title>Receipt</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; width: 80mm; padding: 10px; color: #333; }
            .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .footer { text-align: center; border-top: 1px dashed #000; padding-top: 10px; margin-top: 10px; font-size: 10px; }
            .flex-row { display: flex; justify-content: space-between; }
            .bold { font-weight: bold; }
          </style>
        </head>
        <body onload="${isSilentPrint ? 'window.print(); window.close();' : ''}">
          <div class="header">
            <h2 style="margin: 0; font-size: 16px;">INVENTORY SYSTEM</h2>
            <p style="margin: 5px 0; font-size: 10px;">${new Date(timestamp).toLocaleString()}</p>
          </div>
          <div style="margin-bottom: 10px;">
            ${itemsHtml}
          </div>
          <div class="flex-row bold" style="font-size: 14px; margin-top: 5px;">
            <span>TOTAL</span>
            <span>${settings.currency}${cartTotal.toFixed(2)}</span>
          </div>
          <div class="flex-row" style="font-size: 12px;">
            <span>CASH</span>
            <span>${settings.currency}${Number(clientMoney).toFixed(2)}</span>
          </div>
          <div class="flex-row bold" style="font-size: 14px; border-top: 1px solid #000; margin-top: 5px; padding-top: 5px;">
            <span>CHANGE</span>
            <span>${settings.currency}${change.toFixed(2)}</span>
          </div>
          <div class="footer">
            <p>Thank you for your purchase!</p>
            <p>Support: support@example.com</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    if (isSilentPrint) {
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };
    } else {
        // Just let it open
    }
  };

  if (isTooSmall) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center h-full animate-in fade-in duration-500">
        <div className="max-w-xs bg-white/90 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white/50 shadow-[0_32px_128px_rgba(0,0,0,0.1)]">
          <div className="p-4 bg-dirty-white rounded-2xl w-fit mx-auto mb-6">
            <MonitorOff size={32} className="text-stone-400" />
          </div>
          <h3 className="text-xl font-black text-deep-charcoal tracking-tight mb-3 italic">Hardware Needed</h3>
          <p className="text-stone-400 text-sm leading-relaxed mb-8 font-medium">
            For a premium and safe checkout experience, please use a tablet or desktop device (7 inches and above).
          </p>
          <div className="py-2 px-4 border border-stone-100 rounded-full w-fit mx-auto">
            <p className="text-[10px] text-stone-300 uppercase tracking-[0.25em] font-black">
              System Protected
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-8rem)]">
      {/* Product Selection Area */}
      <div className="flex-1 flex flex-col bg-white border border-stone-200 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-stone-200 bg-dirty-white space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-stone-accent" size={18} />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded focus:outline-none focus:border-sage bg-white shadow-sm"
            />
          </div>
          
          <div className="flex items-center gap-2 pb-1 overflow-x-auto scrollbar-hide no-print">
            {/* All Items */}
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-6 py-3 rounded-xl border flex items-center justify-center gap-2 whitespace-nowrap transition-all ${
                selectedCategory === 'All'
                  ? 'bg-deep-charcoal text-white border-transparent shadow-lg scale-105'
                  : 'bg-white text-stone-accent border-stone-200 hover:bg-dirty-white'
              }`}
            >
              <LayoutGrid size={18} className="shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-widest">All Items</span>
            </button>

            {activeCategories.map(catName => (
              <button
                key={catName}
                onClick={() => setSelectedCategory(catName)}
                className={`px-6 py-3 rounded-xl border flex items-center justify-center gap-2 whitespace-nowrap transition-all ${
                  selectedCategory === catName
                    ? 'bg-sage text-white border-transparent shadow-lg scale-105'
                    : 'bg-white text-stone-accent border-stone-200 hover:bg-dirty-white'
                }`}
              >
                <span className="text-[10px] font-black uppercase tracking-widest">{catName}</span>
              </button>
            ))}
          </div>

          <div className="flex justify-between items-center text-stone-accent pt-3 border-t border-stone-200/50">
            <div className="flex bg-white border border-stone-200 rounded overflow-hidden">
              <button 
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 flex items-center gap-1 text-sm font-medium transition-colors ${viewMode === 'grid' ? 'bg-sage text-white' : 'hover:bg-dirty-white hover:text-deep-charcoal'}`}
              >
                <LayoutGrid size={16} /> Grid
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 flex items-center gap-1 text-sm font-medium transition-colors border-l border-stone-200 ${viewMode === 'list' ? 'bg-sage text-white' : 'hover:bg-dirty-white hover:text-deep-charcoal'}`}
              >
                <List size={16} /> List
              </button>
            </div>
            
            <select 
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value)}
              className="px-3 py-1.5 border border-stone-200 rounded bg-white text-sm font-medium focus:outline-none focus:border-sage text-stone-700 cursor-pointer"
            >
              <option value="date">Date Added</option>
              <option value="alpha">Alphabetical</option>
            </select>
          </div>
        </div>
        <div className={`flex-1 overflow-auto p-4 gap-4 content-start ${viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 3xl:grid-cols-8' : 'flex flex-col'}`}>
          {filteredProducts.map(product => (
            <button 
              key={product.id}
              onClick={() => addToCart(product)}
              className={`border border-stone-200 rounded-lg text-left hover:border-sage hover:bg-dirty-white transition-all group bg-white focus:outline-none focus:ring-2 focus:ring-sage focus:ring-opacity-50 ${
                viewMode === 'grid' 
                  ? 'p-4 flex flex-col items-center justify-center' 
                  : 'p-3 flex items-center justify-between'
              }`}
            >
              {viewMode === 'grid' ? (
                <>
                  <span className="font-bold text-center block mb-2">{product.name}</span>
                  <span className="text-sage font-bold block">{settings.currency}{product.sellingPrice.toFixed(2)}</span>
                  <span className="text-xs text-stone-accent block mt-1">Stock: {product.currentQty}</span>
                </>
              ) : (
                <>
                  <span className="font-bold">{product.name}</span>
                  <div className="text-right flex items-center gap-4">
                    <span className="text-xs text-stone-accent">Stock: {product.currentQty}</span>
                    <span className="text-sage font-bold min-w-[5rem] text-right">{settings.currency}{product.sellingPrice.toFixed(2)}</span>
                  </div>
                </>
              )}
            </button>
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-span-full py-8 text-center text-stone-accent">No available products found.</div>
          )}
        </div>
      </div>

      {/* POS Cart / Calculator Area */}
      <div className="w-full md:w-64 lg:w-80 xl:w-96 bg-white border border-stone-200 rounded-lg flex flex-col shadow-sm shrink-0">
        <div className="p-4 border-b border-stone-200 flex items-center gap-2 bg-dirty-white font-bold">
          <ShoppingCart size={18} /> Current Order
        </div>
        
        <div className="flex-1 overflow-auto p-4 space-y-3">
          {cart.map(item => (
            <div key={item.productId} className="flex justify-between items-center bg-dirty-white p-3 rounded">
              <div className="flex-1">
                <div className="font-medium text-sm">{item.name}</div>
                <div className="text-sage font-bold text-sm">{settings.currency}{item.price.toFixed(2)}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="w-6 h-6 flex items-center justify-center bg-white border border-stone-200 rounded text-stone-accent hover:text-deep-charcoal">-</button>
                <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center bg-white border border-stone-200 rounded text-stone-accent hover:text-deep-charcoal">+</button>
              </div>
            </div>
          ))}
          {cart.length === 0 && (
             <div className="text-center text-stone-accent text-sm mt-10">Cart is empty.<br/>Click products to add.</div>
          )}
        </div>

        <div className="p-4 border-t border-stone-200 bg-dirty-white space-y-4">
          <div className="flex justify-between items-center text-lg">
            <span className="font-bold">Total</span>
            <span className="font-bold text-deep-charcoal">{settings.currency}{cartTotal.toFixed(2)}</span>
          </div>
          
          <div>
            <label className="block text-sm font-bold mb-1">Client Money ({settings.currency})</label>
            <input 
              type="number" 
              value={clientMoney}
              onChange={(e) => setClientMoney(e.target.value)}
              className="w-full p-2 border border-stone-200 rounded focus:outline-none focus:border-sage text-lg font-mono placeholder-stone-300"
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>

          <div className="flex justify-between items-center text-lg">
            <span className="font-bold text-stone-accent">Change</span>
            <span className={`font-bold ${change >= 0 ? 'text-sage' : 'text-muted-orange'}`}>
              {settings.currency}{(change || 0).toFixed(2)}
            </span>
          </div>

          <div className="flex flex-col py-1 mb-2">
             <button 
               onClick={() => setShowPrintOptions(!showPrintOptions)}
               className="flex items-center justify-between w-full text-sm font-bold text-stone-accent hover:text-deep-charcoal transition-colors group"
             >
               <div className="flex items-center gap-2">
                 <Printer size={16} /> Print Settings {shouldPrint ? '(On)' : '(Off)'}
               </div>
               {showPrintOptions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
             </button>
             
             {showPrintOptions && (
               <div className="flex flex-col gap-3 p-3 bg-white border border-stone-200 rounded mt-3 shadow-sm">
                 <div className="flex items-center gap-2">
                   <input 
                     type="checkbox" 
                     id="printReceipt" 
                     checked={shouldPrint} 
                     onChange={(e) => setShouldPrint(e.target.checked)} 
                     className="w-4 h-4 accent-sage cursor-pointer"
                   />
                   <label htmlFor="printReceipt" className="text-sm font-bold text-deep-charcoal cursor-pointer flex items-center gap-1">
                     Auto-print Receipt
                   </label>
                 </div>
                 
                 {shouldPrint && (
                   <div className="flex items-center gap-2 border-t border-stone-100 pt-2" title="Hide popup window. Pair with Chrome Kiosk Mode for true silent printing">
                     <input 
                       type="checkbox" 
                       id="silentPrint" 
                       checked={isSilentPrint} 
                       onChange={(e) => setIsSilentPrint(e.target.checked)} 
                       className="w-4 h-4 accent-sage cursor-pointer"
                     />
                     <label htmlFor="silentPrint" className="text-xs font-semibold text-stone-500 cursor-pointer flex items-center gap-1">
                       <Zap size={14} /> Silent Printing (Hidden iframe)
                     </label>
                   </div>
                 )}
               </div>
             )}
          </div>

          <button 
            disabled={cart.length === 0 || Number(clientMoney) < cartTotal}
            onClick={handleCheckout}
            className="w-full flex items-center justify-center gap-2 py-3 bg-deep-charcoal text-white rounded font-bold hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity text-lg"
          >
            <CheckCircle size={20} />
            Check Out {shouldPrint && '& Print'}
          </button>
        </div>
      </div>
    </div>
  );
}
