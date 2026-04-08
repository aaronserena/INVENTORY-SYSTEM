import { useState, useEffect } from 'react';
import { LayoutDashboard, Package, Calculator, ClipboardList, Settings as SettingsIcon, Menu, Lock, Mail, X, Maximize, Minimize, Power } from 'lucide-react';
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

  // User Registry and Auth state
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('inv_users');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeUser, setActiveUser] = useState(localStorage.getItem('inv_active_user') || null);
  const [isQuickLocked, setIsQuickLocked] = useState(false);
  const [isSystemLocked, setIsSystemLocked] = useState(!localStorage.getItem('inv_active_user'));
  const [isProductsUnlocked, setIsProductsUnlocked] = useState(false);

  const [settings, setSettings] = useState(() => {
    const user = localStorage.getItem('inv_active_user');
    if (!user) return { currency: '₱', dateFormat: 'MM/DD/yyyy', theme: 'light', accent: 'sage' };
    const saved = localStorage.getItem(`inv_settings_${user}`);
    return saved ? JSON.parse(saved) : { currency: '₱', dateFormat: 'MM/DD/yyyy', theme: 'light', accent: 'sage' };
  });

  useEffect(() => {
    if (activeUser) {
      localStorage.setItem(`inv_settings_${activeUser}`, JSON.stringify(settings));
    }
  }, [settings, activeUser]);

  // Sync users to storage
  useEffect(() => {
    localStorage.setItem('inv_users', JSON.stringify(users));
  }, [users]);

  // Initialize data based on active user
  const [products, setProducts] = useState(() => {
    if (!activeUser) return [];
    const saved = localStorage.getItem(`inv_products_${activeUser}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [salesLogs, setSalesLogs] = useState(() => {
    if (!activeUser) return [];
    const saved = localStorage.getItem(`inv_sales_logs_${activeUser}`);
    return saved ? JSON.parse(saved) : [];
  });

  // Sync data to localStorage scoped by user
  useEffect(() => {
    if (activeUser) {
      localStorage.setItem(`inv_products_${activeUser}`, JSON.stringify(products));
    }
  }, [products, activeUser]);

  useEffect(() => {
    if (activeUser) {
      localStorage.setItem(`inv_sales_logs_${activeUser}`, JSON.stringify(salesLogs));
    }
  }, [salesLogs, activeUser]);

  const handleUnlock = (email) => {
    setActiveUser(email);
    localStorage.setItem('inv_active_user', email);

    // Load that specific user's data
    const savedProducts = localStorage.getItem(`inv_products_${email}`);
    const savedLogs = localStorage.getItem(`inv_sales_logs_${email}`);
    const savedSettings = localStorage.getItem(`inv_settings_${email}`);
    setProducts(savedProducts ? JSON.parse(savedProducts) : []);
    setSalesLogs(savedLogs ? JSON.parse(savedLogs) : []);
    setSettings(savedSettings ? JSON.parse(savedSettings) : { currency: '₱', dateFormat: 'MM/DD/yyyy', theme: 'light', accent: 'sage' });

    setActiveTab('dashboard');
    setIsSystemLocked(false);
  };

  const handleLock = () => {
    setIsSystemLocked(true);
    setIsProductsUnlocked(false);
  };

  const handleSignOut = () => {
    setActiveUser(null);
    localStorage.removeItem('inv_active_user');
    setProducts([]);
    setSalesLogs([]);
    setSettings({ currency: '₱', dateFormat: 'MM/DD/yyyy', theme: 'light', accent: 'sage' });
    setIsSystemLocked(true);
    setIsProductsUnlocked(false);
  };

  useEffect(() => {
    // When switching away from Products, re-lock it for security
    if (activeTab !== 'products') {
      setIsProductsUnlocked(false);
    }
  }, [activeTab]);

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
        <aside className={`${isCollapsed ? 'w-0 lg:w-16' : 'w-16 lg:w-48'} transition-all duration-300 overflow-hidden bg-white border-r border-stone-200 flex flex-col no-print`}>
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
              label="POS"
              isCollapsed={isCollapsed}
            />
            <NavItem
              active={activeTab === 'transactions'}
              onClick={() => setActiveTab('transactions')}
              icon={<ClipboardList size={20} />}
              label="Transactions"
              isCollapsed={isCollapsed}
            />
            <NavItem
              active={activeTab === 'settings'}
              onClick={() => setActiveTab('settings')}
              icon={<SettingsIcon size={20} />}
              label="Settings"
              isCollapsed={isCollapsed}
            />
          </nav>

          <div className="p-2 border-t border-stone-100 mt-auto">
            <button
              onClick={() => setIsQuickLocked(true)}
              className={`w-full flex items-center p-3 rounded text-[10px] font-black uppercase tracking-widest transition-all bg-dirty-white text-deep-charcoal hover:bg-deep-charcoal hover:text-white ${isCollapsed ? 'justify-center' : 'justify-center lg:justify-start lg:gap-3'}`}
              title="Lock"
            >
              <Power size={20} />
              <span className={`whitespace-nowrap transition-opacity duration-300 ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100 hidden lg:block'}`}>
                Lock
              </span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className={`flex-1 overflow-x-hidden p-6 lg:p-12 ${['dashboard', 'pos', 'products'].includes(activeTab) ? 'lg:h-screen lg:overflow-hidden overflow-y-auto' : 'overflow-y-auto'}`}>
          <div className={`mx-auto h-full ${['dashboard', 'pos', 'products'].includes(activeTab) ? 'w-full' : 'max-w-7xl'}`}>
            {activeTab === 'dashboard' && (
              <Dashboard products={products} salesLogs={salesLogs} setSalesLogs={setSalesLogs} settings={settings} />
            )}
            {activeTab === 'products' && (
              <div className="relative h-full">
                <div className={!isProductsUnlocked ? 'blur-md pointer-events-none' : ''}>
                  <Products products={products} setProducts={setProducts} salesLogs={salesLogs} settings={settings} />
                </div>
                {!isProductsUnlocked && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/20 backdrop-blur-md">
                    <div className="bg-white p-2 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-stone-200">
                      <PinLock
                        title="Authorization Required"
                        subtitle="Please enter the PIN to manage products."
                        correctPin={users.find(u => u.email === activeUser)?.pin}
                        onUnlock={() => setIsProductsUnlocked(true)}
                        onClose={() => setActiveTab('dashboard')}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'pos' && (
              <POS products={products} setProducts={setProducts} salesLogs={salesLogs} setSalesLogs={setSalesLogs} userEmail={activeUser} settings={settings} />
            )}
            {activeTab === 'transactions' && (
              <Transactions salesLogs={salesLogs} products={products} settings={settings} />
            )}
            {activeTab === 'settings' && (
              <Settings 
                userEmail={activeUser} 
                userPin={users.find(u => u.email === activeUser)?.pin} 
                products={products}
                setProducts={setProducts}
                salesLogs={salesLogs}
                setSalesLogs={setSalesLogs}
                setIsSystemLocked={setIsSystemLocked}
                onSignOut={handleSignOut}
                settings={settings}
                setSettings={setSettings}
              />
            )}
          </div>
        </main>
      </div>

      {isQuickLocked && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-dirty-white/40 backdrop-blur-2xl">
          <div className="w-full max-w-sm">
            <div className="flex flex-col items-center mb-12">
              <div className="bg-white p-2 rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.1)] border border-stone-200">
                <PinLock
                  title="Inventory Locked"
                  subtitle={`Session active for ${activeUser}`}
                  correctPin={users.find(u => u.email === activeUser)?.pin}
                  onUnlock={() => setIsQuickLocked(false)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {isSystemLocked && (
        <div className="fixed inset-0 z-[100] bg-dirty-white flex items-center justify-center p-4">
          <AuthPage
            users={users}
            setUsers={setUsers}
            onUnlock={handleUnlock}
          />
        </div>
      )}
    </div>
  );
}

function AuthPage({ users, setUsers, onUnlock }) {
  const [authMode, setAuthMode] = useState(users.length > 0 ? 'signin' : 'signup');
  const [inputPin, setInputPin] = useState('');
  const [inputEmail, setInputEmail] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoverySent, setRecoverySent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (authMode === 'signup') {
      if (inputPin.length >= 4 && inputPin === confirmPin && inputEmail.includes('@')) {
        // Check if user exists
        if (users.find(u => u.email === inputEmail)) {
          alert("Account already exists with this email.");
          return;
        }
        const newUser = { email: inputEmail, pin: inputPin };
        setUsers([...users, newUser]);
        // Also update localStorage immediately for the handleUnlock jump
        const currentUsers = [...users, newUser];
        localStorage.setItem('inv_users', JSON.stringify(currentUsers));
        onUnlock(inputEmail);
      } else {
        setError(true);
        setTimeout(() => setError(false), 1000);
      }
      return;
    }

    const foundUser = users.find(u => u.email === inputEmail && u.pin === inputPin);
    if (foundUser) {
      onUnlock(inputEmail);
    } else {
      setError(true);
      setInputPin('');
      setTimeout(() => setError(false), 1000);
    }
  };

  const handleForgotPin = () => {
    const userToRecover = users.find(u => u.email === inputEmail);
    if (userToRecover) {
      setRecoverySent(true);
      setTimeout(() => {
        setRecoverySent(false);
        setShowRecovery(false);
      }, 3000);
    } else {
      alert("No account found with this email.");
    }
  };

  return (
    <div className="relative w-full max-w-xl">
      {/* Dynamic Background Elements */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-sage/10 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-muted-orange/10 rounded-full blur-[100px] animate-pulse duration-700" />

      <div className="relative bg-white/70 backdrop-blur-3xl p-10 md:p-14 rounded-[3.5rem] shadow-[0_64px_128px_-24px_rgba(0,0,0,0.1)] border border-white/50 flex flex-col items-center">

        {/* Toggle Controls */}
        <div className="bg-dirty-white p-1.5 rounded-2xl flex gap-1 mb-10 w-fit">
          <button
            onClick={() => setAuthMode('signin')}
            className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${authMode === 'signin' ? 'bg-white text-deep-charcoal shadow-sm' : 'text-stone-400 hover:text-stone-500'}`}
          >
            Sign In
          </button>
          <button
            onClick={() => setAuthMode('signup')}
            className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${authMode === 'signup' ? 'bg-white text-deep-charcoal shadow-sm' : 'text-stone-400 hover:text-stone-500'}`}
          >
            Sign Up
          </button>
        </div>

        <div className="w-64 mb-14 hover:scale-105 transition-transform duration-500">
          <img src={Logo} alt="Inventory Logo" className="w-full h-auto" />
        </div>

        {!showRecovery ? (
          <div className="w-full max-w-sm space-y-8">
            <div className="text-center">
              <h2 className="text-xl font-black tracking-[0.15em] text-deep-charcoal italic uppercase">
                {authMode === 'signup' ? 'Join the Fleet' : 'Welcome Back'}
              </h2>
              <p className="text-stone-400 text-[9px] font-black mt-3 uppercase tracking-[0.3em] leading-relaxed">
                {authMode === 'signup' ? 'Secure your terminal database' : 'Enter your credentials to continue'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {authMode === 'signup' ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 ml-4">Corporate Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300 pointer-events-none" size={14} />
                      <input
                        type="email"
                        placeholder="admin@terminal.io"
                        value={inputEmail}
                        onChange={e => setInputEmail(e.target.value)}
                        className="w-full p-4 pl-10 bg-dirty-white border-2 border-transparent rounded-2xl focus:outline-none focus:border-sage text-xs font-bold transition-all shadow-inner"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-400 ml-4">Security Pin</label>
                      <input
                        type="password"
                        maxLength="6"
                        placeholder="••••"
                        value={inputPin}
                        onChange={e => setInputPin(e.target.value.replace(/\D/g, ''))}
                        className="w-full text-center p-4 bg-dirty-white border-2 border-transparent rounded-2xl focus:outline-none focus:border-sage text-xs font-bold transition-all shadow-inner"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-400 ml-4">Confirm</label>
                      <input
                        type="password"
                        maxLength="6"
                        placeholder="••••"
                        value={confirmPin}
                        onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                        className="w-full text-center p-4 bg-dirty-white border-2 border-transparent rounded-2xl focus:outline-none focus:border-sage text-xs font-bold transition-all shadow-inner"
                        required
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-400 ml-4">Account Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300 pointer-events-none" size={14} />
                      <input
                        type="email"
                        placeholder="admin@terminal.io"
                        value={inputEmail}
                        onChange={e => setInputEmail(e.target.value)}
                        className="w-full p-4 pl-10 bg-dirty-white border-2 border-transparent rounded-2xl focus:outline-none focus:border-sage text-xs font-bold transition-all shadow-inner"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 ml-4">Security Pin</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300 pointer-events-none" size={14} />
                      <input
                        autoFocus
                        type="password"
                        maxLength="6"
                        placeholder="••••••"
                        value={inputPin}
                        onChange={e => setInputPin(e.target.value)}
                        className={`w-full p-4 pl-10 bg-dirty-white border-2 rounded-2xl focus:outline-none transition-all ${error ? 'border-muted-orange animate-shake' : 'border-transparent focus:border-sage focus:bg-white'} shadow-inner text-xs font-bold`}
                      />
                    </div>
                  </div>
                  <div className="flex justify-center flex-col items-center gap-2">
                    {error && <p className="text-muted-orange text-[10px] font-black uppercase tracking-widest animate-bounce text-center">Authorization Failed: Invalid Credentials</p>}
                  </div>
                </div>
              )}

              <div className="pt-2 space-y-6">
                <button
                  type="submit"
                  className="w-full py-5 bg-deep-charcoal text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.25em] hover:bg-opacity-90 transform active:scale-[0.98] transition-all shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)]"
                >
                  {authMode === 'signin' ? "Authorize Entry" : "Create My Account"}
                </button>
              </div>

              {authMode === 'signin' && (
                <div className="text-center pt-4">
                  <button
                    type="button"
                    onClick={() => setShowRecovery(true)}
                    className="text-stone-400 text-[10px] font-black uppercase tracking-widest hover:text-deep-charcoal transition-colors underline-offset-8 hover:underline"
                  >
                    Forgot Security PIN?
                  </button>
                </div>
              )}
            </form>
          </div>
        ) : (
          <div className="w-full max-w-sm space-y-8">
            <div className="p-8 bg-dirty-white rounded-[2rem] w-fit mx-auto shadow-inner">
              <Mail size={48} className="text-stone-400" />
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-black text-deep-charcoal italic uppercase tracking-tighter">Security Recovery</h3>
              <p className="text-stone-400 text-[10px] font-black uppercase tracking-[0.2em] mt-3 leading-relaxed px-4">
                {recoverySent
                  ? "Check your inbox. We've sent a temporary access code."
                  : `PIN will be sent to: ${inputEmail || 'your registered email'}`}
              </p>
            </div>

            {recoverySent ? (
              <div className="py-8 text-center">
                <div className="inline-block px-10 py-5 bg-sage/10 text-sage rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] animate-bounce">
                  Email Dispatched
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  onClick={handleForgotPin}
                  className="w-full py-5 bg-sage text-white rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-opacity-90 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] active:scale-95 transition-all"
                >
                  Request Recovery Email
                </button>
                <button
                  onClick={() => setShowRecovery(false)}
                  className="w-full text-stone-400 text-[10px] font-black uppercase tracking-widest hover:text-deep-charcoal transition-colors text-center"
                >
                  Return to login
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <p className="text-center mt-12 text-stone-300 text-[9px] font-black uppercase tracking-[0.4em] opacity-40">
        Inventory OS &bull; Terminal v1.0.4 &bull; Secure Environment
      </p>
    </div>
  );
}

function PinLock({ title, subtitle, correctPin, onUnlock, onClose }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input === correctPin) {
      onUnlock();
    } else {
      setError(true);
      setInput('');
      setTimeout(() => setError(false), 650);
    }
  };

  return (
    <div className={`relative p-8 bg-white rounded-3xl w-full max-w-xs transition-all ${error ? 'animate-shake' : ''}`}>
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-300 hover:text-muted-orange hover:bg-red-50 rounded-xl transition-all"
        >
          <X size={18} />
        </button>
      )}
      <div className="flex flex-col items-center gap-4 text-center mb-6">
        <div className={`p-3 rounded-2xl ${error ? 'bg-red-50 text-muted-orange' : 'bg-sage/10 text-sage'}`}>
          <Lock size={24} />
        </div>
        <div>
          <h3 className="font-black text-xs uppercase tracking-widest">{title}</h3>
          <p className="text-[10px] text-stone-400 mt-1 uppercase font-bold">{subtitle}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          autoFocus
          type="password"
          maxLength="6"
          placeholder="••••••"
          value={input}
          onChange={(e) => setInput(e.target.value.replace(/\D/g, ''))}
          className={`w-full text-center p-4 bg-dirty-white border-2 rounded-2xl focus:outline-none transition-all text-sm font-black tracking-widest ${error ? 'border-muted-orange' : 'border-transparent focus:border-sage'}`}
        />
        <button
          type="submit"
          className="w-full py-4 bg-deep-charcoal text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-opacity-90 transition-all"
        >
          Unlock Database
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
