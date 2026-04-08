// v1.0.5 - Enhanced Data Security
import { useState } from 'react';
import { PaintBucket, Shield, Languages, Database, X, Lock, Trash2, Download, Upload, AlertTriangle } from 'lucide-react';

export default function Settings({ userEmail, userPin, products, setProducts, salesLogs, setSalesLogs, setIsSystemLocked, onSignOut, settings, setSettings }) {
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const [showRegionalModal, setShowRegionalModal] = useState(false);
  const [showPersonalizationModal, setShowPersonalizationModal] = useState(false);

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };
  
  const handleExport = () => {
    const data = {
      userEmail,
      products,
      salesLogs,
      settings,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventory_backup_${userEmail}_${new Date().toLocaleDateString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        
        // Validation: Must have at least one of the core data arrays
        const hasProducts = Array.isArray(data.products);
        const hasLogs = Array.isArray(data.salesLogs);

        if (!hasProducts && !hasLogs) {
          alert('Invalid backup file: Could not find any valid product or sales data.');
          return;
        }

        const confirmMsg = `Are you sure you want to import this data? ${
          hasProducts ? `\n- ${data.products.length} Products` : ''
        }${
          hasLogs ? `\n- ${data.salesLogs.length} Sales Records` : ''
        }\n\nWARNING: This will overwrite your current local data for ${userEmail}.`;

        if (confirm(confirmMsg)) {
          if (hasProducts) setProducts(data.products);
          if (hasLogs) setSalesLogs(data.salesLogs);
          if (data.settings) setSettings(data.settings);
          
          alert('Data successfully synchronized with your current account!');
        }
      } catch (err) {
        console.error('Import Error:', err);
        alert('Failed to parse backup file. Please ensure it is a valid .json backup exported from this system.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input to allow re-importing same file if needed
  };

  const handleDeleteData = (e) => {
    e.preventDefault();
    setError('');

    if (confirmEmail !== userEmail) {
      setError('Verification Email does not match.');
      return;
    }

    if (confirmPin !== userPin) {
      setError('Security PIN is incorrect.');
      return;
    }

    setIsDeleting(true);
    
    // Simulate deletion delay for gravity
    setTimeout(() => {
      setProducts([]);
      setSalesLogs([]);
      setIsDeleting(false);
      setShowDeleteModal(false);
      setConfirmEmail('');
      setConfirmPin('');
      alert('Account data has been wiped successfully.');
    }, 1500);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-10">
        <h1 className="text-4xl font-black tracking-tight text-deep-charcoal italic uppercase">Settings</h1>
        <p className="text-stone-500 mt-2 font-medium">Manage your account, data security, and system preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account Card */}
        <div className="bg-white border border-stone-200 rounded-3xl p-8 flex flex-col items-start hover:border-sage transition-all shadow-sm group">
          <div className="p-3 bg-dirty-white rounded-2xl mb-4 group-hover:bg-sage/10 transition-colors">
            <Shield size={24} className="text-stone-500 group-hover:text-sage" />
          </div>
          <h3 className="font-black text-xl mb-2 italic uppercase">Account & Security</h3>
          <p className="text-stone-500 text-sm mb-8 flex-1 leading-relaxed">
            {`Logged in as ${userEmail || 'Administrator'}. This account's inventory data is isolated and encrypted locally.`}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button 
              onClick={onSignOut}
              className="flex-1 px-6 py-4 bg-deep-charcoal text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-opacity-90 transition-all shadow-lg active:scale-95"
            >
              Sign Out / Switch Account
            </button>
          </div>
        </div>

        {/* Data Management Card */}
        <div className="bg-white border border-stone-200 rounded-3xl p-8 flex flex-col items-start hover:border-sage transition-all shadow-sm group">
          <div className="p-3 bg-dirty-white rounded-2xl mb-4 group-hover:bg-sage/10 transition-colors">
            <Database size={24} className="text-stone-500 group-hover:text-sage" />
          </div>
          <h3 className="font-black text-xl mb-2 italic uppercase">Data Management</h3>
          <p className="text-stone-500 text-sm mb-8 flex-1 leading-relaxed">
            Backup your local inventory or clear all records. Recommended before major stock updates.
          </p>
          <div className="flex gap-3 w-full">
            <button 
              onClick={handleExport}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-dirty-white text-deep-charcoal rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-stone-200 transition-all"
            >
              <Download size={16} /> Export
            </button>
            <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-dirty-white text-deep-charcoal rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-stone-200 transition-all cursor-pointer">
              <Upload size={16} /> Import
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
            <button 
              onClick={() => setShowDeleteModal(true)}
              className="p-3 bg-red-50 text-muted-orange rounded-xl hover:bg-red-100 transition-all"
              title="Reset Account Data"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>

        <SettingCard 
          icon={<Languages size={20} className="text-stone-500" />}
          title="Regional Settings"
          description={`Currency: ${settings.currency} • Format: ${settings.dateFormat}`}
          actionText="Manage Settings"
          onClick={() => setShowRegionalModal(true)}
        />
        
        <SettingCard 
          icon={<PaintBucket size={20} className="text-stone-500" />}
          title="Personalization"
          description={`Theme: ${settings.theme === 'light' ? 'Daylight' : 'Night'} • Accent: ${settings.accent} (Coming Soon)`}
          actionText="Coming Soon"
          disabled={true}
          onClick={() => setShowPersonalizationModal(true)}
        />
      </div>

      {/* Regional Settings Modal */}
      {showRegionalModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={() => setShowRegionalModal(false)} />
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10">
            <div className="flex justify-between items-center mb-8">
                <h4 className="text-xl font-black uppercase italic">Regional Settings</h4>
                <button onClick={() => setShowRegionalModal(false)} className="p-2 hover:bg-dirty-white rounded-full transition-colors"><X size={20}/></button>
            </div>
            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">System Currency</label>
                    <div className="grid grid-cols-4 gap-2">
                        {['₱', '$', '€', '¥'].map(c => (
                            <button key={c} onClick={() => updateSetting('currency', c)} className={`py-4 rounded-xl font-black transition-all ${settings.currency === c ? 'bg-sage text-white shadow-md' : 'bg-dirty-white text-stone-500 hover:bg-stone-100'}`}>
                                {c}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Date Format</label>
                    <div className="flex flex-col gap-2">
                        {[
                            { label: 'MM/DD/YYYY (US)', val: 'MM/DD/yyyy' },
                            { label: 'DD/MM/YYYY (EU)', val: 'dd/MM/yyyy' },
                            { label: 'YYYY-MM-DD (ISO)', val: 'yyyy-MM-dd' }
                        ].map(f => (
                            <button key={f.val} onClick={() => updateSetting('dateFormat', f.val)} className={`px-4 py-3 rounded-xl font-bold text-sm text-left transition-all ${settings.dateFormat === f.val ? 'bg-deep-charcoal text-white' : 'bg-dirty-white text-stone-500 hover:bg-stone-100'}`}>
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>
                <button onClick={() => setShowRegionalModal(false)} className="w-full py-4 mt-4 bg-sage text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-opacity-90 transition-all">
                    Save Preferences
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Personalization Modal */}
      {showPersonalizationModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={() => setShowPersonalizationModal(false)} />
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10">
            <div className="flex justify-between items-center mb-8">
                <h4 className="text-xl font-black uppercase italic">Appearance</h4>
                <button onClick={() => setShowPersonalizationModal(false)} className="p-2 hover:bg-dirty-white rounded-full transition-colors"><X size={20}/></button>
            </div>
            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Interface Theme</label>
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => updateSetting('theme', 'light')} className={`py-6 rounded-2xl flex flex-col items-center gap-2 transition-all ${settings.theme === 'light' ? 'ring-4 ring-sage/20 bg-dirty-white border-2 border-sage' : 'bg-dirty-white border-2 border-transparent opacity-60'}`}>
                            <div className="w-10 h-10 bg-white rounded-lg border border-stone-200"></div>
                            <span className="text-[10px] font-black uppercase">Standard</span>
                        </button>
                        <button onClick={() => updateSetting('theme', 'dark')} className={`py-6 rounded-2xl flex flex-col items-center gap-2 transition-all opacity-40 cursor-not-allowed`}>
                            <div className="w-10 h-10 bg-deep-charcoal rounded-lg border border-stone-700"></div>
                            <span className="text-[10px] font-black uppercase">Night (Coming Soon)</span>
                        </button>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Accent Color</label>
                    <div className="grid grid-cols-5 gap-3">
                        {[
                            { name: 'sage', color: 'bg-sage' },
                            { name: 'rose', color: 'bg-rose-400' },
                            { name: 'amber', color: 'bg-amber-400' },
                            { name: 'blue', color: 'bg-blue-400' },
                            { name: 'slate', color: 'bg-stone-500' }
                        ].map(c => (
                            <button 
                                key={c.name} 
                                onClick={() => updateSetting('accent', c.name)}
                                className={`h-10 rounded-full ${c.color} transition-all transform hover:scale-110 flex items-center justify-center ${settings.accent === c.name ? 'ring-4 ring-offset-2 ring-stone-900 shadow-xl' : 'opacity-80'}`}
                            >
                                {settings.accent === c.name && <div className="w-2 h-2 bg-white rounded-full"></div>}
                            </button>
                        ))}
                    </div>
                </div>
                <button onClick={() => setShowPersonalizationModal(false)} className="w-full py-4 mt-4 bg-deep-charcoal text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-opacity-90 transition-all">
                    Apply Layout
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Extreme Verification Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-md" onClick={() => !isDeleting && setShowDeleteModal(false)} />
          
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 transform scale-100 transition-transform">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="p-4 bg-red-50 text-muted-orange rounded-3xl mb-4 animate-pulse">
                <AlertTriangle size={32} />
              </div>
              <h4 className="text-2xl font-black text-deep-charcoal italic uppercase tracking-tight">Extreme Verification</h4>
              <p className="text-stone-500 text-xs font-bold uppercase tracking-widest mt-2 leading-relaxed">
                You are about to wipe all data for:<br/>
                <span className="text-muted-orange">{userEmail}</span>
              </p>
            </div>

            <form onSubmit={handleDeleteData} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 ml-4">Type Email to Verify</label>
                  <input
                    type="email"
                    placeholder={userEmail}
                    value={confirmEmail}
                    onChange={e => setConfirmEmail(e.target.value)}
                    className="w-full p-4 bg-dirty-white border-2 border-transparent rounded-2xl focus:outline-none focus:border-muted-orange text-xs font-bold transition-all shadow-inner"
                    required
                    disabled={isDeleting}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 ml-4">Enter Security PIN</label>
                  <input
                    type="password"
                    placeholder="••••••"
                    value={confirmPin}
                    onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full p-4 bg-dirty-white border-2 border-transparent rounded-2xl focus:outline-none focus:border-muted-orange text-xs font-bold transition-all shadow-inner text-center tracking-[0.5em]"
                    maxLength="6"
                    required
                    disabled={isDeleting}
                  />
                </div>
              </div>

              {error && (
                <p className="text-muted-orange text-[9px] font-black uppercase tracking-widest text-center animate-shake">
                  {error}
                </p>
              )}

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="flex-1 py-4 bg-stone-100 text-stone-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-stone-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDeleting || !confirmEmail || !confirmPin}
                  className={`flex-[2] py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 ${
                    isDeleting ? 'bg-stone-400 text-white' : 'bg-muted-orange text-white hover:bg-opacity-90'
                  }`}
                >
                  {isDeleting ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Wiping Database...
                    </>
                  ) : (
                    "WIPE DATA"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingCard({ icon, title, description, actionText, onClick, disabled }) {
  return (
    <div className={`relative bg-white border border-stone-200 rounded-3xl p-8 flex flex-col items-start transition-all shadow-sm ${disabled ? 'opacity-70' : 'hover:border-sage hover:shadow-xl'}`}>
      {disabled && (
        <div className="absolute top-6 right-6 px-3 py-1 bg-dirty-white border border-stone-200 rounded-full">
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-stone-400">Coming Soon</span>
        </div>
      )}
      <div className={`p-3 rounded-2xl mb-4 transition-colors ${disabled ? 'bg-dirty-white grayscale' : 'bg-dirty-white group-hover:bg-sage/10'}`}>
        {icon}
      </div>
      <h3 className={`font-black text-xl mb-2 italic uppercase ${disabled ? 'text-stone-400' : 'text-deep-charcoal'}`}>{title}</h3>
      <p className="text-stone-500 text-sm mb-8 flex-1 leading-relaxed">{description}</p>
      <button 
        onClick={onClick}
        disabled={disabled}
        className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
          disabled 
          ? 'bg-stone-50 text-stone-300 cursor-not-allowed' 
          : 'bg-dirty-white text-deep-charcoal hover:bg-stone-200 active:scale-95'
        }`}
      >
        {actionText}
      </button>
    </div>
  );
}

