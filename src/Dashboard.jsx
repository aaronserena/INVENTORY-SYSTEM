import { useState, useMemo } from 'react';
import { Printer, Trash2 } from 'lucide-react';
import { subDays, subMonths, subYears, isAfter, parseISO, format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard({ products, salesLogs, setSalesLogs }) {
  const [timeframe, setTimeframe] = useState('weekly');

  const filteredLogs = useMemo(() => {
    const now = new Date();
    let cutoffDate;
    if (timeframe === 'weekly') cutoffDate = subDays(now, 7);
    else if (timeframe === 'monthly') cutoffDate = subMonths(now, 1);
    else if (timeframe === 'yearly') cutoffDate = subYears(now, 1);

    return salesLogs.filter(log => isAfter(parseISO(log.timestamp), cutoffDate));
  }, [salesLogs, timeframe]);

  const { totalGeneralEarnings, netProfit } = useMemo(() => {
    let revenue = 0;
    let cost = 0;
    filteredLogs.forEach(log => {
      revenue += log.price * log.quantity;
      const product = products.find(p => p.id === log.productId);
      const costPrice = product ? product.costPrice : 0;
      cost += costPrice * log.quantity;
    });
    return {
      totalGeneralEarnings: revenue,
      netProfit: revenue - cost
    };
  }, [filteredLogs, products]);

  const totalPotentialRevenue = useMemo(() => {
    return products.reduce((sum, p) => sum + (p.currentQty * p.sellingPrice), 0);
  }, [products]);

  const chartData = useMemo(() => {
    const grouped = {};
    const sortedLogs = [...filteredLogs].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    sortedLogs.forEach(log => {
      const dateStr = format(parseISO(log.timestamp), timeframe === 'yearly' ? 'MMM yyyy' : 'MMM dd');
      if (!grouped[dateStr]) grouped[dateStr] = { date: dateStr, sales: 0, profit: 0 };
      
      const revenue = log.price * log.quantity;
      const product = products.find(p => p.id === log.productId);
      const cost = (product ? product.costPrice : 0) * log.quantity;
      
      grouped[dateStr].sales += revenue;
      grouped[dateStr].profit += (revenue - cost);
    });
    return Object.values(grouped);
  }, [filteredLogs, products, timeframe]);

  const topSellingProducts = useMemo(() => {
    const productSales = {};
    filteredLogs.forEach(log => {
      if (!productSales[log.productId]) {
        productSales[log.productId] = 0;
      }
      productSales[log.productId] += log.quantity;
    });

    return Object.keys(productSales)
      .map(productId => {
        const product = products.find(p => p.id === productId);
        return {
          id: productId,
          name: product ? product.name : 'Unknown Product',
          quantitySold: productSales[productId]
        };
      })
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 5); // top 5
  }, [filteredLogs, products]);

  const printReport = () => {
    const content = document.getElementById('analytics-report').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Analytics Report</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #555555; }
            h1 { font-size: 24px; border-bottom: 2px solid #555555; padding-bottom: 10px; }
            .metric { margin-bottom: 15px; }
            .label { font-weight: bold; }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };


  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center no-print">
        <h2 className="text-2xl font-black">Dashboard Analytics</h2>
        
        <div className="hidden md:block"></div>

        <div className="flex items-center justify-end gap-3">
          {/* Timeframe Selector */}
          <div className="flex bg-white border border-stone-200 rounded p-1 shadow-sm">
            {[
              { id: 'weekly', label: 'Weekly' },
              { id: 'monthly', label: 'Monthly' },
              { id: 'yearly', label: 'Yearly' },
            ].map((tf) => (
              <button
                key={tf.id}
                onClick={() => setTimeframe(tf.id)}
                className={`px-4 py-2 text-sm font-black rounded transition-all ${
                  timeframe === tf.id ? 'bg-sage text-white shadow-sm' : 'text-stone-400 hover:bg-dirty-white hover:text-deep-charcoal'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          <button 
            onClick={printReport}
            className="flex items-center gap-2 px-4 py-2 bg-deep-charcoal text-white rounded font-black text-sm hover:bg-opacity-90 transition-opacity shadow-sm"
          >
            <Printer size={16} /> Print
          </button>
        </div>
      </div>

      <div id="analytics-report" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard 
          title="Total General Earnings" 
          value={`₱${totalGeneralEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
          subtitle={`${timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} sales performance`}
        />
        <MetricCard 
          title="Net Profit" 
          value={`₱${netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
          subtitle={`Revenue minus item cost (${timeframe})`}
          highlight={netProfit >= 0 ? 'text-sage' : 'text-muted-orange'}
        />
        <MetricCard 
          title="Potential Revenue" 
          value={`₱${totalPotentialRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
          subtitle="Estimated total inventory value"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 no-print">
        <div className="bg-white border border-stone-200 p-8 rounded-lg shadow-sm">
          <h3 className="text-xl font-black mb-6">Sales & Profit Overview</h3>
          {chartData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                  <XAxis 
                    dataKey="date" 
                    tick={{fontSize: 12, fill: '#6B7280'}} 
                    axisLine={{stroke: '#E5E5E5'}} 
                  />
                  <YAxis 
                    tick={{fontSize: 12, fill: '#6B7280'}} 
                    axisLine={{stroke: '#E5E5E5'}} 
                    tickFormatter={(value) => `₱${value}`} 
                  />
                  <Tooltip 
                    contentStyle={{borderRadius: '8px', border: '1px solid #E5E5E5'}}
                    formatter={(value) => [`₱${value.toFixed(2)}`]}
                  />
                  <Bar dataKey="sales" name="Sales" fill="#555555" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="profit" name="Profit" fill="#87A96B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-stone-accent italic border-2 border-dashed border-stone-100 rounded">
              Insufficient data for chart
            </div>
          )}
        </div>
  
        <div className="bg-white border border-stone-200 p-8 rounded-lg shadow-sm">
          <h3 className="text-xl font-black mb-6">Top 5 Selling Products</h3>
          {topSellingProducts.length > 0 ? (
            <div className="space-y-6">
              {topSellingProducts.map((item, index) => (
                <div key={item.id} className="flex justify-between items-center border-b border-stone-100 pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-stone-accent">#{index + 1}</span>
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold text-sage">{item.quantitySold} units sold</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-stone-accent">No sales records found.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, subtitle, highlight = 'text-deep-charcoal' }) {
  return (
    <div className="bg-white border border-stone-200 p-8 rounded-lg shadow-sm">
      <h3 className="text-sm font-bold text-stone-accent uppercase tracking-wider mb-4">{title}</h3>
      <p className={`text-4xl font-black mb-2 ${highlight}`}>{value}</p>
      {subtitle && <p className="text-xs text-stone-accent font-medium">{subtitle}</p>}
    </div>
  );
}
