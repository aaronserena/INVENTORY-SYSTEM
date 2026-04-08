import { useState, useMemo } from 'react';
import { Printer, Trash2 } from 'lucide-react';
import { subDays, subMonths, subYears, isAfter, parseISO, format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard({ products, salesLogs, setSalesLogs, settings }) {
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

  // Helper for print data calculation
  const getPeriodData = (period) => {
    const now = new Date();
    let cutoff;
    if (period === 'weekly') cutoff = subDays(now, 7);
    else if (period === 'monthly') cutoff = subMonths(now, 1);
    else cutoff = subYears(now, 1);

    const logs = salesLogs.filter(log => isAfter(parseISO(log.timestamp), cutoff));

    let revenue = 0;
    let cost = 0;
    logs.forEach(log => {
      revenue += log.price * log.quantity;
      const product = products.find(p => p.id === log.productId);
      cost += (product?.costPrice || 0) * log.quantity;
    });

    const productSales = {};
    logs.forEach(log => {
      productSales[log.productId] = (productSales[log.productId] || 0) + log.quantity;
    });

    const top = Object.keys(productSales)
      .map(id => ({ name: products.find(p => p.id === id)?.name || 'Unknown', qty: productSales[id] }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 3);

    return { revenue, profit: revenue - cost, top, count: logs.length };
  };

  const weeklyData = getPeriodData('weekly');
  const monthlyData = getPeriodData('monthly');
  const yearlyData = getPeriodData('yearly');

  const printReport = () => {
    window.print();
  };


  return (
    <div className="space-y-8 w-full pb-20 lg:h-full lg:overflow-y-auto scrollbar-hide h-auto">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between no-print">
        <h2 className="text-2xl font-black">Dashboard Analytics</h2>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-white border border-stone-200 rounded p-1 shadow-sm">
            {[
              { id: 'weekly', label: 'Weekly' },
              { id: 'monthly', label: 'Monthly' },
              { id: 'yearly', label: 'Yearly' },
            ].map((tf) => (
              <button
                key={tf.id}
                onClick={() => setTimeframe(tf.id)}
                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-black rounded transition-all ${timeframe === tf.id ? 'bg-sage text-white shadow-sm' : 'text-stone-400 hover:bg-dirty-white hover:text-deep-charcoal'
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

      <div id="analytics-report" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 no-print">
        <MetricCard
          title="Total General Earnings"
          value={`${settings.currency}${totalGeneralEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          subtitle={`${timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} sales performance`}
        />
        <MetricCard
          title="Net Profit"
          value={`${settings.currency}${netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          subtitle={`Revenue minus item cost (${timeframe})`}
          highlight={netProfit >= 0 ? 'text-sage' : 'text-muted-orange'}
        />
        <MetricCard
          title="Potential Revenue"
          value={`${settings.currency}${totalPotentialRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          subtitle="Estimated total inventory value"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 no-print pb-10">
        <div className="xl:col-span-2 bg-white border border-stone-200 p-4 sm:p-6 lg:p-8 rounded-lg shadow-sm">
          <h3 className="text-xl font-black mb-6 uppercase italic">Sales & Profit Overview</h3>
          {chartData.length > 0 ? (
            <div className="h-[450px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={{ stroke: '#E5E5E5' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={{ stroke: '#E5E5E5' }} tickFormatter={(value) => `${settings.currency}${value}`} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E5E5E5' }} formatter={(value) => [`${settings.currency}${value.toFixed(2)}`]} />
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

        <div className="bg-white border border-stone-200 p-4 sm:p-6 lg:p-8 rounded-lg shadow-sm">
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

      {/* TRIPLE-PERIOD INTELLIGENCE REPORT - ONLY VISIBLE DURING PRINT */}
      <div className="print-only print-area mx-auto bg-white text-deep-charcoal">
        <div className="flex justify-between items-end border-b-8 border-deep-charcoal pb-8 mb-12">
          <div>
            <h1 className="text-6xl font-black uppercase italic tracking-tighter mb-2 leading-none">Fiscal Intelligence</h1>
            <p className="text-xl font-bold uppercase tracking-[0.3em] opacity-40">Unified Period Analysis</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-black uppercase text-stone-accent mb-1 underline">Security Verified</p>
            <p className="text-2xl font-black tracking-tighter">#{Date.now().toString().slice(-6)}</p>
          </div>
        </div>

        {[
          { label: 'WEEKLY SNAPSHOT', data: weeklyData, color: 'bg-sage' },
          { label: 'MONTHLY PERFORMANCE', data: monthlyData, color: 'bg-deep-charcoal' },
          { label: 'ANNUAL PROJECTION', data: yearlyData, color: 'bg-muted-orange' }
        ].map((period, idx) => (
          <div key={idx} className="mb-20 last:mb-0 avoid-break border-l-2 border-stone-100 pl-8">
            <div className="flex items-center gap-4 mb-8">
              <div className={`h-10 w-3 ${period.color}`}></div>
              <h2 className="text-4xl font-black uppercase italic tracking-tight">{period.label}</h2>
            </div>

            <div className="grid grid-cols-3 gap-8 mb-10">
              <div className="bg-dirty-white p-6 rounded-2xl">
                <p className="text-[10px] font-black uppercase text-stone-accent mb-2">Revenue</p>
                <p className="text-3xl font-black">{settings.currency}{period.data.revenue.toLocaleString()}</p>
              </div>
              <div className="bg-dirty-white p-6 rounded-2xl">
                <p className="text-[10px] font-black uppercase text-stone-accent mb-2 text-sage">Net Profit</p>
                <p className="text-3xl font-black text-sage">{settings.currency}{period.data.profit.toLocaleString()}</p>
              </div>
              <div className="bg-dirty-white p-6 rounded-2xl">
                <p className="text-[10px] font-black uppercase text-stone-accent mb-2">Logs</p>
                <p className="text-3xl font-black">{period.data.count}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-12">
              <div>
                <h3 className="text-xs font-black uppercase text-stone-accent mb-4 italic underline underline-offset-4">Top Period Performers</h3>
                <div className="space-y-4">
                  {period.data.top.map((p, i) => (
                    <div key={i} className="flex justify-between items-end border-b border-stone-100 pb-2">
                      <span className="text-sm font-bold flex items-center gap-3">
                        <span className="text-stone-300">0{i + 1}</span> {p.name}
                      </span>
                      <span className="text-sm font-black leading-none">{p.qty} units</span>
                    </div>
                  ))}
                  {period.data.top.length === 0 && <p className="text-sm italic text-stone-accent">No data recorded</p>}
                </div>
              </div>

              <div className="flex flex-col justify-end">
                <h3 className="text-[10px] font-black uppercase text-stone-accent mb-4 tracking-widest text-right">Revenue Scale View</h3>
                <div className="h-24 w-full bg-dirty-white rounded-xl flex items-end p-4 gap-2 border border-stone-100">
                  <div className="flex-1 bg-stone-300 rounded-t-lg transition-all" style={{ height: `${Math.min(100, (period.data.revenue / 10000) * 100)}%` }}></div>
                  <div className="flex-1 bg-deep-charcoal rounded-t-lg transition-all" style={{ height: '80%' }}></div>
                  <div className="flex-1 bg-sage rounded-t-lg transition-all" style={{ height: `${Math.min(100, (period.data.profit / 5000) * 100)}%` }}></div>
                  <div className="flex-1 bg-stone-200 rounded-t-lg transition-all" style={{ height: '45%' }}></div>
                </div>
              </div>
            </div>
          </div>
        ))}

        <div className="mt-20 pt-8 border-t-8 border-deep-charcoal flex justify-between items-center italic">
          <p className="text-[10px] font-black uppercase tracking-widest text-stone-accent">Fiscal Export Protocol v1.0 • Authorized Personnel Only</p>
          <p className="text-xs font-black">{format(new Date(), 'yyyy-MM-dd HH:mm')}</p>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, subtitle, highlight = 'text-deep-charcoal' }) {
  return (
    <div className="bg-white border border-stone-200 p-4 sm:p-6 lg:p-8 rounded-lg shadow-sm">
      <h3 className="text-[10px] sm:text-sm font-bold text-stone-accent uppercase tracking-wider mb-4">{title}</h3>
      <p className={`text-2xl sm:text-3xl lg:text-4xl font-black mb-2 truncate ${highlight}`}>{value}</p>
      {subtitle && <p className="text-[10px] sm:text-xs text-stone-accent font-medium leading-tight">{subtitle}</p>}
    </div>
  );
}
