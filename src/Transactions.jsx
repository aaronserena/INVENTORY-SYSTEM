import { useMemo, useState } from 'react';
import { format, parseISO, isWithinInterval, subDays, subMonths, subYears, startOfToday } from 'date-fns';
import { Search, Receipt, Printer, Calendar, Filter, X, BarChart3 } from 'lucide-react';

export default function Transactions({ salesLogs, products, settings }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [timeframe, setTimeframe] = useState('all'); // 'all' | 'weekly' | 'monthly' | 'yearly'
  const [showPrintConfirm, setShowPrintConfirm] = useState(false);
  const [isPrintingWithAnalytics, setIsPrintingWithAnalytics] = useState(false);



  // Group logs by transaction (timestamp)
  const transactions = useMemo(() => {
    const groups = {};
    salesLogs.forEach(log => {
      const key = log.timestamp;
      
      if (!groups[key]) {
        groups[key] = {
          timestamp: log.timestamp,
          items: [],
          total: 0
        };
      }
      
      const product = products.find(p => p.id === log.productId);
      const name = product ? product.name : 'Unknown Product (Deleted)';
      
      groups[key].items.push({
        ...log,
        name
      });
      groups[key].total += log.price * log.quantity;
    });

    return Object.values(groups).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [salesLogs, products]);

  // Filter transactions by timeframe first
  const timeframeFiltered = useMemo(() => {
    const today = startOfToday();
    let startDate;

    if (timeframe === 'weekly') startDate = subDays(today, 7);
    else if (timeframe === 'monthly') startDate = subMonths(today, 1);
    else if (timeframe === 'yearly') startDate = subYears(today, 1);
    else return transactions;

    return transactions.filter(t => {
      const date = parseISO(t.timestamp);
      return isWithinInterval(date, { start: startDate, end: new Date() });
    });
  }, [transactions, timeframe]);

  // Analytics helper for print
  const analyticsSummary = useMemo(() => {
    const revenue = timeframeFiltered.reduce((acc, t) => acc + t.total, 0);
    const transactionsCount = timeframeFiltered.length;
    const itemsCount = timeframeFiltered.reduce((acc, t) => acc + t.items.reduce((sum, i) => sum + i.quantity, 0), 0);
    
    let totalCost = 0;
    timeframeFiltered.forEach(t => {
      t.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        totalCost += (prod ? Number(prod.costPrice || 0) : 0) * item.quantity;
      });
    });

    const netProfit = revenue - totalCost;
    
    // Potential Revenue (stock value)
    const potentialRevenue = products.reduce((acc, p) => acc + (Number(p.sellingPrice || 0) * Number(p.currentQty || 0)), 0);

    return { revenue, transactionsCount, itemsCount, potentialRevenue, netProfit };
  }, [timeframeFiltered, products]);

  // Then filter by search term
  const filteredTransactions = timeframeFiltered.filter(t => {
    const searchLow = searchTerm.toLowerCase();
    const dateStr = format(parseISO(t.timestamp), 'MMM dd, yyyy hh:mm a').toLowerCase();
    
    if (dateStr.includes(searchLow)) return true;
    
    return t.items.some(item => item.name.toLowerCase().includes(searchLow));
  });

  const handlePrint = () => {
    setShowPrintConfirm(true);
  };

  const executePrint = (includeAnalytics) => {
    if (includeAnalytics) {
      setIsPrintingWithAnalytics(true);
      // Give DOM time to update before printing
      setTimeout(() => {
        window.print();
        setIsPrintingWithAnalytics(false);
        setShowPrintConfirm(false);
      }, 100);
    } else {
      window.print();
      setShowPrintConfirm(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center flex-wrap gap-4 no-print relative">
        <h2 className="text-2xl font-bold">Transaction History</h2>
        
        {/* Print Confirmation Modal */}
        {showPrintConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-stone-900/10 backdrop-blur-md" onClick={() => setShowPrintConfirm(false)} />
            <div className="relative bg-white/95 backdrop-blur-xl w-full max-w-sm rounded-[2rem] shadow-[0_32px_64px_rgba(0,0,0,0.15)] border border-white/50 p-10 text-center animate-in zoom-in-95 duration-300">
              <div className="p-4 bg-dirty-white rounded-2xl w-fit mx-auto mb-6">
                <Printer size={28} className="text-stone-500" />
              </div>
              <h3 className="text-xl font-black text-deep-charcoal tracking-tight mb-2">Print Options</h3>
              <p className="text-stone-400 text-xs uppercase font-bold tracking-[0.15em] mb-10">
                Choose report density
              </p>
              
              <div className="space-y-4">
                <button 
                  onClick={() => executePrint(true)}
                  className="w-full flex flex-col items-center gap-1 py-5 bg-deep-charcoal text-white rounded-2xl font-bold hover:bg-opacity-90 transition-all shadow-lg group"
                >
                  <span className="text-xs uppercase tracking-widest flex items-center gap-2">
                    <BarChart3 size={14} /> Print All
                  </span>
                  <span className="text-[10px] opacity-60 font-normal">History + Analytics Data</span>
                </button>
                
                <button 
                  onClick={() => executePrint(false)}
                  className="w-full py-4 bg-white border-2 border-stone-100 text-stone-600 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-dirty-white transition-all"
                >
                  History Only
                </button>

                <button 
                  onClick={() => setShowPrintConfirm(false)}
                  className="w-full mt-4 py-2 text-stone-400 text-[10px] font-bold uppercase tracking-[0.2em] hover:text-stone-600 transition-colors"
                >
                  cancel
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex items-center gap-3">
          {/* Timeframe Selector */}
          <div className="flex bg-white border border-stone-200 rounded p-0.5">
            {[
              { id: 'all', label: 'All Time' },
              { id: 'weekly', label: 'Weekly' },
              { id: 'monthly', label: 'Monthly' },
              { id: 'yearly', label: 'Yearly' },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setTimeframe(opt.id)}
                className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                  timeframe === opt.id ? 'bg-sage text-white' : 'text-stone-400 hover:bg-dirty-white hover:text-deep-charcoal'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-deep-charcoal text-white rounded font-bold text-sm hover:bg-opacity-90 transition-opacity"
          >
            <Printer size={16} /> Print Report
          </button>
        </div>
      </div>

      {/* Print-Only Analytics Section */}
      {isPrintingWithAnalytics && (
        <div className="hidden print:block mb-8 space-y-6">
          <div className="border-b-2 border-deep-charcoal pb-4 mb-6">
            <h1 className="text-2xl font-black uppercase tracking-tighter">Inventory Performance Report</h1>
            <p className="text-xs text-stone-500 italic mt-1 uppercase tracking-widest">
              Generated on {format(new Date(), 'MMMM dd, yyyy - HH:mm')}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-dirty-white p-4 rounded-xl border border-stone-200">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Total Revenue ({timeframe})</span>
              <span className="text-xl font-black text-deep-charcoal">{settings.currency}{analyticsSummary.revenue.toLocaleString()}</span>
            </div>
            <div className="bg-dirty-white p-4 rounded-xl border border-stone-200">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Net Profit</span>
              <span className="text-xl font-black text-sage">{settings.currency}{analyticsSummary.netProfit.toLocaleString()}</span>
            </div>
            <div className="bg-dirty-white p-4 rounded-xl border border-stone-200">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Transaction Count</span>
              <span className="text-xl font-black text-deep-charcoal">{analyticsSummary.transactionsCount}</span>
            </div>
            <div className="bg-dirty-white p-4 rounded-xl border border-stone-200">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Total Items Sold</span>
              <span className="text-xl font-black text-deep-charcoal">{analyticsSummary.itemsCount}</span>
            </div>
            <div className="bg-dirty-white p-4 rounded-xl border border-stone-200 col-span-2">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Total Value of Items on Hand</span>
              <span className="text-xl font-black text-deep-charcoal">{settings.currency}{analyticsSummary.potentialRevenue.toLocaleString()}</span>
            </div>
          </div>
          <div className="border-t-2 border-dashed border-stone-200 my-8" />
        </div>
      )}

      <div className="bg-white border border-stone-200 rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 border-b border-stone-200 bg-dirty-white flex flex-wrap gap-4 items-center justify-between no-print">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 text-stone-accent" size={18} />
            <input 
              type="text" 
              placeholder="Search by product name or date..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded focus:outline-none focus:border-sage bg-white text-sm"
            />
          </div>
          <div className="text-sm text-stone-accent italic">
             Showing {filteredTransactions.length} transaction groups
          </div>
        </div>

        <div className="p-4 space-y-4 max-h-[calc(100vh-16rem)] overflow-auto print:max-h-none print:overflow-visible">
          {filteredTransactions.map((transaction, index) => (
            <div key={transaction.timestamp + index} className="border border-stone-200 rounded overflow-hidden print:border-0 print:border-b print:rounded-none">
              <div className="bg-dirty-white px-4 py-3 border-b border-stone-200 flex justify-between items-center print:bg-white print:px-0">
                <div className="flex items-center gap-2">
                  <Receipt size={18} className="text-stone-accent" />
                  <span className="font-bold text-sm">
                    {format(parseISO(transaction.timestamp), 'MMMM dd, yyyy - hh:mm a')}
                  </span>
                </div>
                <div className="font-bold text-sage">
                  {settings.currency}{transaction.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="p-4 print:px-0">
                <table className="w-full text-sm">
                  <thead className="text-stone-accent text-left border-b border-stone-100">
                    <tr>
                      <th className="pb-2 font-bold uppercase text-xs">Product</th>
                      <th className="pb-2 font-bold uppercase text-xs text-right hidden sm:table-cell">Price</th>
                      <th className="pb-2 font-bold uppercase text-xs text-center">Qty</th>
                      <th className="pb-2 font-bold uppercase text-xs text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transaction.items.map((item, i) => (
                      <tr key={i} className="border-b border-stone-100 last:border-0">
                        <td className="py-2.5">{item.name}</td>
                        <td className="py-2.5 text-right hidden sm:table-cell text-stone-accent font-mono">{settings.currency}{item.price.toFixed(2)}</td>
                        <td className="py-2.5 text-center font-medium">x{item.quantity}</td>
                        <td className="py-2.5 text-right font-bold text-deep-charcoal font-mono">{settings.currency}{(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          
          {filteredTransactions.length === 0 && (
            <div className="text-center py-12 text-stone-accent">No transaction records found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
