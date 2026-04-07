import { useState } from 'react';
import { PaintBucket, Shield, Languages, Database, X, Lock, Unlock, Trash2 } from 'lucide-react';

export default function Settings({ securityPin, setSecurityPin, products, setProducts, salesLogs, setSalesLogs }) {
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [dialogStep, setDialogStep] = useState('setup'); // 'verify' | 'setup' | 'remove'
  const [verifyInput, setVerifyInput] = useState('');
  const [tempPin, setTempPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isError, setIsError] = useState(false);
  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [showBackupModal, setShowBackupModal] = useState(false);

  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No O, 0, I, 1 for clarity
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(code);
    setCaptchaInput('');
  };

  const [pendingAction, setPendingAction] = useState('setup');
  
  const handleExport = () => {
    const data = {
      products,
      salesLogs,
      securityPin,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.products && data.salesLogs) {
          if (confirm('Importing this file will overwrite your CURRENT products and sales history. Do you want to proceed?')) {
            setProducts(data.products);
            setSalesLogs(data.salesLogs);
            if (data.securityPin) setSecurityPin(data.securityPin);
            alert('Data imported successfully!');
          }
        } else {
          alert('Invalid backup file format.');
        }
      } catch (err) {
        alert('Error parsing backup file.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const startPinAction = (step) => {
    if (securityPin) {
      setDialogStep('verify');
      setPendingAction(step); // Save what we want to do after verification
    } else {
      setDialogStep('setup');
    }
    setShowPinDialog(true);
    resetForm();
  };


  const resetForm = () => {
    setVerifyInput('');
    setTempPin('');
    setConfirmPin('');
    setIsError(false);
  };

  const handleVerify = (e) => {
    e.preventDefault();
    if (verifyInput === securityPin) {
      if (pendingAction === 'remove') {
        setSecurityPin('');
        setShowPinDialog(false);
      } else if (pendingAction === 'reset') {
        generateCaptcha();
        setDialogStep('captcha');
      } else {
        setDialogStep('setup');
        setIsError(false);
      }
    } else {
      setIsError(true);
      setVerifyInput('');
      setTimeout(() => setIsError(false), 600);
    }
  };

  const handleSavePin = (e) => {
    e.preventDefault();
    if (tempPin.length < 4) return;
    
    if (tempPin !== confirmPin) {
      setIsError(true);
      setConfirmPin('');
      setTimeout(() => setIsError(false), 600);
      return;
    }
    
    setSecurityPin(tempPin);
    setShowPinDialog(false);
    resetForm();
  };

  const handleResetSystem = () => {
    if (confirm('Are you sure you want to RESET THE ENTIRE SYSTEM? This will permanently delete ALL products and sales history. This action cannot be undone.')) {
      setProducts([]);
      setSalesLogs([]);
      alert('System has been completely reset.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto relative">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-stone-500 mt-1">Manage your application preferences and configurations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SettingCard 
          icon={<PaintBucket size={20} className="text-stone-500" />}
          title="Appearance"
          description="Customize the interface color scheme and layout."
          actionText="Visit UI Editor"
          disabled
        />
        
        <div className="bg-white border border-stone-200 rounded-lg p-6 flex flex-col items-start hover:border-sage transition-colors shadow-sm relative overflow-hidden">
          <div className="p-2 bg-dirty-white rounded-lg mb-3">
            <Shield size={20} className="text-stone-500" />
          </div>
          <h3 className="font-bold text-lg mb-1">Account & Security</h3>
          <p className="text-stone-500 text-sm mb-6 flex-1">
            {securityPin 
              ? "Security PIN is currently active. System is protected." 
              : "Set a security PIN to protect your system from unauthorized access."}
          </p>
          <div className="flex gap-4 w-full pt-2">
            <button 
              onClick={() => startPinAction('setup')}
              className="flex-1 px-4 py-2.5 bg-deep-charcoal text-white rounded font-medium text-sm hover:bg-opacity-90 transition-colors shadow-sm"
            >
              {securityPin ? "Change PIN" : "Setup PIN"}
            </button>
            {securityPin && (
              <button 
                onClick={() => startPinAction('remove')}
                className="px-4 py-2.5 border border-muted-orange text-muted-orange rounded font-medium text-sm hover:bg-red-50 transition-colors"
              >
                Remove
              </button>
            )}
          </div>

          {/* PIN Setup Modal Overlay */}
          {showPinDialog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backdrop */}
              <div 
                className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm animate-in fade-in" 
                onClick={() => setShowPinDialog(false)}
              />
              
              {/* Modal Card */}
              <div className={`relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 animate-in zoom-in-95 slide-in-from-bottom-5 duration-300 ${isError ? 'animate-shake' : ''}`}>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg transition-colors ${isError ? 'bg-muted-orange/10' : 'bg-sage/10'}`}>
                      <Lock size={20} className={isError ? 'text-muted-orange' : 'text-sage'} />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-deep-charcoal">
                        {dialogStep === 'verify' ? 'Verify Current PIN' : 
                         dialogStep === 'captcha' ? 'Reset Confirmation' : 
                         'Security PIN Setup'}
                      </h4>
                      <p className={`text-xs transition-colors ${isError ? 'text-muted-orange font-bold animate-pulse' : 'text-stone-500'}`}>
                        {isError 
                          ? (dialogStep === 'verify' ? 'Incorrect PIN!' : dialogStep === 'captcha' ? 'Verification Failed!' : 'PINs do not match!') 
                          : (dialogStep === 'verify' ? 'Authorization required' : dialogStep === 'captcha' ? 'Final identity check' : 'Secure your inventory system')
                        }
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowPinDialog(false)} 
                    className="p-2 text-stone-400 hover:text-muted-orange hover:bg-red-50 rounded-xl transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                {dialogStep === 'verify' ? (
                  <form onSubmit={handleVerify} className="space-y-5">
                    <p className="text-sm text-stone-600 leading-relaxed">
                      Please enter your current security PIN to continue.
                    </p>
                    <div className="py-2">
                       <input 
                        autoFocus
                        type="password" 
                        pattern="[0-9]*" 
                        inputMode="numeric"
                        maxLength="6"
                        placeholder="••••••"
                        value={verifyInput}
                        onChange={e => setVerifyInput(e.target.value.replace(/\D/g,''))}
                        className={`w-full text-center text-2xl tracking-[0.3em] p-4 border-2 rounded-xl transition-all focus:outline-none shadow-sm ${
                          isError 
                          ? 'border-muted-orange bg-red-50' 
                          : 'border-stone-100 bg-stone-50 focus:border-sage focus:bg-white focus:ring-4 focus:ring-sage/10'
                        }`}
                      />
                    </div>
                    <div className="pt-4">
                      <button 
                        type="submit" 
                        className={`w-full py-4 rounded-xl font-bold active:scale-[0.98] transition-all shadow-lg uppercase tracking-widest text-sm ${
                          isError ? 'bg-muted-orange text-white' : 'bg-deep-charcoal text-white hover:bg-opacity-90'
                        }`}
                      >
                        {isError ? 'TRY AGAIN' : 'VERIFY AUTHORIZATION'}
                      </button>
                    </div>
                  </form>
                ) : dialogStep === 'captcha' ? (
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (captchaInput.toUpperCase() === captchaCode) {
                      handleResetSystem();
                      setShowPinDialog(false);
                      setDialogStep('setup');
                    } else {
                      setIsError(true);
                      setCaptchaInput('');
                      generateCaptcha();
                      setTimeout(() => setIsError(false), 600);
                    }
                  }} className="space-y-5">
                    <p className="text-sm text-stone-600 leading-relaxed">
                      To prevent accidental data loss, please type the characters shown below.
                    </p>
                    
                    <div className="space-y-6 py-2">
                      <div className="flex flex-col items-center gap-3">
                        <div className="bg-dirty-white px-8 py-4 rounded-xl border-2 border-dashed border-stone-200 select-none">
                          <span className="text-3xl font-black tracking-[0.4em] text-deep-charcoal italic">{captchaCode}</span>
                        </div>
                        
                        <input 
                          autoFocus
                          type="text" 
                          placeholder="••••••"
                          value={captchaInput}
                          onChange={e => setCaptchaInput(e.target.value)}
                          className={`w-full text-center text-2xl tracking-[0.2em] p-4 border-2 rounded-xl transition-all focus:outline-none shadow-sm uppercase ${
                            isError 
                            ? 'border-muted-orange bg-red-50' 
                            : 'border-stone-100 bg-stone-50 focus:border-sage focus:bg-white focus:ring-4 focus:ring-sage/10'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="pt-4">
                      <button 
                        type="submit" 
                        disabled={captchaInput.length < 6 || isError}
                        className={`w-full py-4 rounded-xl font-bold active:scale-[0.98] transition-all shadow-lg uppercase tracking-widest text-sm ${
                          isError ? 'bg-muted-orange text-white' : 'bg-deep-charcoal text-white hover:bg-opacity-90'
                        }`}
                      >
                        {isError ? 'TRY AGAIN' : 'PROCEED WITH RESET'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleSavePin} className="space-y-5">
                    <p className="text-sm text-stone-600 leading-relaxed">
                      Set a 4-6 digit numeric PIN. This will be required to unlock the system and manage sensitive sections.
                    </p>
                    
                    <div className="space-y-4 py-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">Create New PIN</label>
                        <input 
                          autoFocus
                          type="password" 
                          pattern="[0-9]*" 
                          inputMode="numeric"
                          maxLength="6"
                          placeholder="••••••"
                          value={tempPin}
                          onChange={e => setTempPin(e.target.value.replace(/\D/g,''))}
                          className={`w-full text-center text-2xl tracking-[0.3em] p-4 border-2 rounded-xl transition-all focus:outline-none shadow-sm ${
                            isError 
                            ? 'border-muted-orange bg-red-50 animate-pulse' 
                            : 'border-stone-100 bg-stone-50 focus:border-sage focus:bg-white focus:ring-4 focus:ring-sage/10'
                          }`}
                        />
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">Confirm PIN</label>
                        <input 
                          type="password" 
                          pattern="[0-9]*" 
                          inputMode="numeric"
                          maxLength="6"
                          placeholder="••••••"
                          value={confirmPin}
                          onChange={e => setConfirmPin(e.target.value.replace(/\D/g,''))}
                          className={`w-full text-center text-2xl tracking-[0.3em] p-4 border-2 rounded-xl transition-all focus:outline-none shadow-sm ${
                            isError 
                            ? 'border-muted-orange bg-red-50 animate-pulse' 
                            : 'border-stone-100 bg-stone-50 focus:border-sage focus:bg-white focus:ring-4 focus:ring-sage/10'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="pt-4">
                      <button 
                        type="submit" 
                        disabled={tempPin.length < 4 || confirmPin.length < 4 || isError}
                        className={`w-full py-4 rounded-xl font-bold active:scale-[0.98] transition-all shadow-lg uppercase tracking-widest text-sm ${
                          isError 
                          ? 'bg-muted-orange text-white' 
                          : 'bg-deep-charcoal text-white hover:bg-opacity-90 disabled:opacity-30 disabled:cursor-not-allowed'
                        }`}
                      >
                        {isError ? 'TRY AGAIN' : 'Save Secure PIN'}
                      </button>
                    </div>
                  </form>
                )}
                <button 
                  type="button"
                  onClick={() => setShowPinDialog(false)}
                  className="w-full mt-2 py-3 text-stone-400 font-medium text-sm hover:text-stone-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <SettingCard 
          icon={<Languages size={20} className="text-stone-500" />}
          title="Language & Region"
          description="Set your preferred language and regional formats."
          disabled
        />
        <div className="bg-white border border-stone-200 rounded-lg p-6 flex flex-col items-start hover:border-sage transition-colors shadow-sm relative overflow-hidden group">
          <div className="p-2 bg-dirty-white rounded-lg mb-3">
            <Database size={20} className="text-stone-500" />
          </div>
          <h3 className="font-bold text-lg mb-1">Data Backup</h3>
          <p className="text-stone-500 text-sm mb-6 flex-1">
            Export or import your inventory and sales data.
          </p>
          <button 
            onClick={() => setShowBackupModal(true)}
            className="w-full px-4 py-2.5 border border-stone-200 text-stone-600 rounded font-medium text-sm hover:bg-dirty-white transition-all shadow-sm"
          >
            Manage Data Tools
          </button>
        </div>
        <div className="bg-white border border-stone-200 rounded-lg p-6 flex flex-col items-start hover:border-muted-orange transition-colors shadow-sm relative overflow-hidden group">
          <div className="p-2 bg-dirty-white rounded-lg mb-3 group-hover:bg-red-50 transition-colors">
            <Trash2 size={20} className="text-stone-500 group-hover:text-muted-orange" />
          </div>
          <h3 className="font-bold text-lg mb-1">Reset System</h3>
          <p className="text-stone-500 text-sm mb-6 flex-1">
            Permanently delete all products and clear all transaction history.
          </p>
          <button 
            onClick={() => {
              if (securityPin) startPinAction('reset');
              else {
                generateCaptcha();
                setDialogStep('captcha');
                setShowPinDialog(true);
              }
            }}
            className="w-full px-4 py-2.5 border border-stone-200 text-stone-600 rounded font-medium text-sm hover:bg-muted-orange hover:text-white hover:border-muted-orange transition-all shadow-sm"
          >
            Reset System
          </button>
        </div>

        {/* Backup Modal Overlay */}
        {showBackupModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-stone-900/10 backdrop-blur-md animate-in fade-in" 
              onClick={() => setShowBackupModal(false)}
            />
            <div className="relative bg-white/90 backdrop-blur-xl w-full max-w-sm rounded-[2rem] shadow-[0_32px_64px_rgba(0,0,0,0.1)] border border-white/50 p-10 animate-in zoom-in-95 duration-300 text-center">
              <div className="p-4 bg-dirty-white rounded-2xl w-fit mx-auto mb-6">
                <Database size={28} className="text-stone-500" />
              </div>
              <h3 className="text-xl font-black text-deep-charcoal tracking-tight mb-2">Data Management</h3>
              <p className="text-stone-400 text-xs uppercase tracking-[0.15em] mb-10 leading-relaxed font-bold">
                Export or import your system database
              </p>
              
              <div className="space-y-4">
                <button 
                  onClick={() => {
                    handleExport();
                    setShowBackupModal(false);
                  }}
                  className="w-full py-4 bg-deep-charcoal text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-opacity-90 transition-all shadow-lg"
                >
                  Export Data JSON
                </button>
                
                <div className="relative">
                  <input 
                    type="file" 
                    accept=".json" 
                    onChange={(e) => {
                      handleImport(e);
                      setShowBackupModal(false);
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                  />
                  <button 
                    className="w-full py-4 bg-white border-2 border-stone-100 text-stone-600 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-dirty-white transition-all shadow-sm"
                  >
                    Import From File
                  </button>
                </div>

                <button 
                  onClick={() => setShowBackupModal(false)}
                  className="w-full mt-4 py-2 text-stone-400 text-[10px] font-bold uppercase tracking-[0.2em] hover:text-stone-600 transition-colors"
                >
                  cancel and close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SettingCard({ icon, title, description, actionText = "Coming Soon", disabled = false }) {
  return (
    <div className={`bg-white border border-stone-200 rounded-lg p-5 flex flex-col items-start hover:border-sage transition-colors shadow-sm ${disabled ? 'opacity-70' : ''}`}>
      <div className="p-2 bg-dirty-white rounded-lg mb-3">
        {icon}
      </div>
      <h3 className="font-bold text-lg mb-1">{title}</h3>
      <p className="text-stone-500 text-sm mb-4 flex-1">{description}</p>
      <button className="px-4 py-2 border border-stone-200 rounded font-medium text-sm text-stone-600 hover:bg-dirty-white transition-colors disabled:cursor-not-allowed" disabled={disabled}>
        {actionText}
      </button>
    </div>
  );
}
