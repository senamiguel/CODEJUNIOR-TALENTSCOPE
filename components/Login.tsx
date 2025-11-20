import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Disc, Lock, AlertCircle, Info } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';
import { useNavigate } from 'react-router-dom';

export const Login = () => {
  const { loginWithGoogle, isDemoMode, currentUser } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (e) {
      setError('Falha ao fazer login. Verifique o console para mais detalhes.');
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-accent/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-purple/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md glass-panel p-8 rounded-2xl border border-brand-border shadow-2xl z-10">
        <div className="flex flex-col items-center mb-8">
          {/* Code Logo CSS Recreation */}
          <div className="mb-6 font-black tracking-tighter text-5xl flex items-center gap-2 select-none transform hover:scale-105 transition-transform duration-300">
            <span className="text-brand-purple" style={{ textShadow: '0 0 20px rgba(139, 92, 246, 0.5)' }}>CODE</span>
            <span className="text-brand-accent" style={{ textShadow: '0 0 20px rgba(0, 220, 130, 0.5)' }}>[ ]</span>
          </div>
          
          <h1 className="text-xl font-bold text-white tracking-tight text-center">TalentScout</h1>
          <p className="text-slate-400 text-sm mt-1 text-center">Gestão Inteligente de Talentos</p>
        </div>

        {isDemoMode && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="text-yellow-500 shrink-0 mt-0.5" size={18} />
              <div>
                <h3 className="text-yellow-400 font-bold text-sm">Modo Demonstração</h3>
                <p className="text-yellow-200/70 text-xs mt-1 leading-relaxed">
                  As chaves do Firebase não foram configuradas. O app funcionará em modo local (os dados não serão sincronizados entre dispositivos).
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400 text-sm">
             <AlertCircle size={16} />
             {error}
          </div>
        )}

        <div className="space-y-4">
          <button 
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-white hover:bg-slate-200 text-black font-bold py-3.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
          >
            {loading ? (
              <LoadingSpinner />
            ) : (
              <>
                {isDemoMode ? (
                  <Lock size={18} className="text-slate-600" />
                ) : (
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                )}
                {isDemoMode ? 'Entrar (Modo Local)' : 'Entrar com Google'}
              </>
            )}
          </button>
          
          <div className="pt-6 text-center">
             <p className="text-[10px] text-slate-600 uppercase tracking-widest">
               {isDemoMode ? 'Ambiente de Teste' : 'Acesso Restrito à Empresa Júnior'}
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};