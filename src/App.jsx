import { useState, useEffect } from 'react';
import { Maximize, Minimize, LayoutDashboard, Package, Calculator, Menu, ClipboardList, Settings as SettingsIcon } from 'lucide-react';
import Logo from './assets/logo.png';
import Dashboard from './Dashboard';
import Products from './Products';
import POS from './POS';
import Transactions from './Transactions';
import Settings from './Settings';

function App() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Security State
  const [securityPin, setSecurityPin] = useState(() => localStorage.getItem('inv_security_pin') || '');
  const [isSystemLocked, setIsSystemLocked] = useState(!!(localStorage.getItem('inv_security_pin')));
  const [isProductsUnlocked, setIsProductsUnlocked] = useState(false);

  useEffect(() => {
    if (securityPin) localStorage.setItem('inv_security_pin', securityPin);
    else localStorage.removeItem('inv_security_pin');
  }, [securityPin]);

  useEffect(() => {
    // When switching away from Products, re-lock it for security
    if (activeTab !== 'products') {
      setIsProductsUnlocked(false);
    }
  }, [activeTab]);

  // State
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('inv_products');
    return saved ? JSON.parse(saved) : [];
  });

  const [salesLogs, setSalesLogs] = useState(() => {
    const saved = localStorage.getItem('inv_sales_logs');
    return saved ? JSON.parse(saved) : [];
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('inv_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('inv_sales_logs', JSON.stringify(salesLogs));
  }, [salesLogs]);

  // Fullscreen support
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-dirty-white text-deep-charcoal overflow-hidden select-none">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 pr-4 sm:pr-6 py-4 flex items-center justify-between no-print shadow-sm">
        <div className="flex items-center">
          <div className="w-16 flex items-center justify-center shrink-0">
            <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1 text-stone-accent hover:text-deep-charcoal transition-colors">
              <Menu size={24} />
            </button>
          </div>
          <h1 className="text-2xl font-black tracking-tighter hidden sm:block ml-2 italic text-deep-charcoal">Inventory</h1>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={toggleFullscreen}
            className="p-2 border border-stone-200 rounded text-stone-accent hover:bg-dirty-white transition-colors flex items-center gap-2"
          >
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            <span className="hidden sm:inline font-medium text-sm">{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className={`${isCollapsed ? 'w-0 lg:w-16' : 'w-16 lg:w-56'} transition-all duration-300 overflow-hidden bg-white border-r border-stone-200 flex flex-col no-print`}>
          <nav className="p-2 flex-1 space-y-1">
            <NavItem
              active={activeTab === 'dashboard'}
              onClick={() => setActiveTab('dashboard')}
              icon={<LayoutDashboard size={20} />}
              label="Dashboard"
              isCollapsed={isCollapsed}
            />
            <NavItem
              active={activeTab === 'products'}
              onClick={() => setActiveTab('products')}
              icon={<Package size={20} />}
              label="Products"
              isCollapsed={isCollapsed}
            />
            <NavItem
              active={activeTab === 'pos'}
              onClick={() => setActiveTab('pos')}
              icon={<Calculator size={20} />}
              label="Point of Sale"
              isCollapsed={isCollapsed}
            />
            <NavItem
              active={activeTab === 'transactions'}
              onClick={() => setActiveTab('transactions')}
              icon={<ClipboardList size={20} />}
              label="Transaction History"
              isCollapsed={isCollapsed}
            />
          </nav>
          <div className="p-2 border-t border-stone-200">
            <NavItem
              active={activeTab === 'settings'}
              onClick={() => setActiveTab('settings')}
              icon={<SettingsIcon size={20} />}
              label="Settings"
              isCollapsed={isCollapsed}
            />
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-4 sm:p-8 flex flex-col items-center min-h-0 bg-dirty-white">
          <div className="w-full max-w-7xl h-full">
            {activeTab === 'dashboard' && (
              <Dashboard products={products} salesLogs={salesLogs} setSalesLogs={setSalesLogs} />
            )}
            {activeTab === 'products' && (
              <div className="relative h-full">
                <div className={!isProductsUnlocked && securityPin ? 'blur-md pointer-events-none' : ''}>
                  <Products products={products} setProducts={setProducts} salesLogs={salesLogs} />
                </div>
                {!isProductsUnlocked && securityPin && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/20 backdrop-blur-md">
                    <div className="bg-white p-2 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-stone-200">
                      <PinLock
                        title="Authorization Required"
                        subtitle="Please enter the PIN to manage products."
                        correctPin={securityPin}
                        onUnlock={() => setIsProductsUnlocked(true)}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'pos' && (
              <POS products={products} setProducts={setProducts} setSalesLogs={setSalesLogs} />
            )}
            {activeTab === 'transactions' && (
              <Transactions salesLogs={salesLogs} products={products} />
            )}
            {activeTab === 'settings' && (
              <Settings
                securityPin={securityPin}
                setSecurityPin={setSecurityPin}
                products={products}
                setProducts={setProducts}
                salesLogs={salesLogs}
                setSalesLogs={setSalesLogs}
              />
            )}
          </div>
        </main>
      </div>

      {isSystemLocked && (
        <div className="fixed inset-0 z-[100] bg-white flex items-center justify-center">
          <PinLock
            title="System Locked"
            subtitle="Enter your PIN to access your Inventory."
            correctPin={securityPin}
            onUnlock={() => setIsSystemLocked(false)}
          />
        </div>
      )}
    </div>
  );
}

function PinLock({ title, subtitle, correctPin, onUnlock }) {
  const [inputPin, setInputPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputPin === correctPin) {
      onUnlock();
    } else {
      setError(true);
      setInputPin('');
      setTimeout(() => setError(false), 1000);
    }
  };

  return (
    <div className="p-8 max-w-sm w-full text-center space-y-6">
      <div className="flex justify-center mb-2">
        <img src={Logo} alt="Inventory Logo" className="w-full h-auto object-contain px-4" />
      </div>
      <div>
        <h2 className="text-lg font-black tracking-tight text-deep-charcoal opacity-90">{title}</h2>
        <p className="text-stone-400 text-xs mt-0.5 uppercase tracking-widest">{subtitle}</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          autoFocus
          type="password"
          maxLength="6"
          placeholder="••••••"
          value={inputPin}
          onChange={e => setInputPin(e.target.value)}
          className={`w-full text-center text-4xl tracking-[0.5em] p-3 border-2 rounded focus:outline-none transition-all ${error ? 'border-muted-orange animate-shake' : 'border-stone-200 focus:border-sage'}`}
        />
        {error && <p className="text-muted-orange text-xs font-bold uppercase tracking-widest">Invalid PIN</p>}
        <button
          type="submit"
          className="w-full py-3 bg-deep-charcoal text-white rounded font-bold hover:bg-opacity-90 tracking-wide transition-opacity"
        >
          UNLOCK
        </button>
      </form>
    </div>
  );
}

function NavItem({ active, onClick, icon, label, isCollapsed }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center p-3 rounded text-sm font-medium transition-colors ${active
        ? 'bg-sage text-white'
        : 'text-stone-accent hover:bg-dirty-white hover:text-deep-charcoal'
        } ${isCollapsed ? 'justify-center' : 'justify-center lg:justify-start lg:gap-3'}`}
      title={label}
    >
      <div className="flex-shrink-0">{icon}</div>
      <span className={`whitespace-nowrap transition-opacity duration-300 ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100 hidden lg:block'}`}>
        {label}
      </span>
    </button>
  );
}

export default App;
