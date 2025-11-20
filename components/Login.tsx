import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Lock, AlertCircle, Info, Mail, User, Eye, EyeOff } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';
import { useNavigate } from 'react-router-dom';

export const Login = () => {
  const { login, register, resetPassword, isDemoMode, currentUser } = useAuth();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!email) {
      setError('Por favor, insira seu email.');
      return;
    }

    if (isForgotPassword) {
      // Password reset
      setLoading(true);
      try {
        await resetPassword(email);
        setSuccess('Email de recuperação enviado! Verifique sua caixa de entrada.');
        setEmail('');
      } catch (e: any) {
        setError(getErrorMessage(e.code));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password) {
      setError('Por favor, insira sua senha.');
      return;
    }

    if (isRegisterMode) {
      // Registration validation
      if (!displayName) {
        setError('Por favor, insira seu nome.');
        return;
      }
      if (password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setError('As senhas não coincidem.');
        return;
      }

      // Register
      setLoading(true);
      try {
        await register(email, password, displayName);
      } catch (e: any) {
        setError(getErrorMessage(e.code));
        setLoading(false);
      }
    } else {
      // Login
      setLoading(true);
      try {
        await login(email, password);
      } catch (e: any) {
        setError(getErrorMessage(e.code));
        setLoading(false);
      }
    }
  };

  const getErrorMessage = (code: string) => {
    switch (code) {
      case 'auth/invalid-email':
        return 'Email inválido.';
      case 'auth/user-disabled':
        return 'Esta conta foi desativada.';
      case 'auth/user-not-found':
        return 'Usuário não encontrado.';
      case 'auth/wrong-password':
        return 'Senha incorreta.';
      case 'auth/email-already-in-use':
        return 'Este email já está em uso.';
      case 'auth/weak-password':
        return 'A senha é muito fraca.';
      case 'auth/too-many-requests':
        return 'Muitas tentativas. Tente novamente mais tarde.';
      default:
        return 'Erro ao processar sua solicitação. Tente novamente.';
    }
  };

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setIsForgotPassword(false);
    setError('');
    setSuccess('');
    setPassword('');
    setConfirmPassword('');
    setDisplayName('');
  };

  const toggleForgotPassword = () => {
    setIsForgotPassword(!isForgotPassword);
    setIsRegisterMode(false);
    setError('');
    setSuccess('');
    setPassword('');
    setConfirmPassword('');
    setDisplayName('');
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

        {success && (
          <div className="mb-6 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3 text-green-400 text-sm">
            <Info size={16} />
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Display Name - Only for registration */}
          {isRegisterMode && (
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Nome Completo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-brand-accent transition-colors"
                  placeholder="Seu nome"
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-brand-accent transition-colors"
                placeholder="seu@email.com"
                disabled={loading}
              />
            </div>
          </div>

          {/* Password - Not shown in forgot password mode */}
          {!isForgotPassword && (
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-3 pl-10 pr-10 text-white placeholder-slate-500 focus:outline-none focus:border-brand-accent transition-colors"
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          {/* Confirm Password - Only for registration */}
          {isRegisterMode && (
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Confirmar Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-brand-accent transition-colors"
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-brand-purple to-brand-accent hover:opacity-90 text-white font-bold py-3.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95 mt-6"
          >
            {loading ? (
              <LoadingSpinner />
            ) : (
              <>
                {isForgotPassword ? 'Enviar Email de Recuperação' : isRegisterMode ? 'Criar Conta' : 'Entrar'}
              </>
            )}
          </button>

          {/* Toggle between login/register */}
          <div className="pt-4 text-center space-y-2">
            {!isForgotPassword && (
              <button
                type="button"
                onClick={toggleMode}
                className="text-sm text-brand-accent hover:text-brand-accent/80 transition-colors"
              >
                {isRegisterMode ? 'Já tem uma conta? Entrar' : 'Não tem uma conta? Criar conta'}
              </button>
            )}

            {!isRegisterMode && (
              <div>
                <button
                  type="button"
                  onClick={toggleForgotPassword}
                  className="text-sm text-slate-400 hover:text-slate-300 transition-colors"
                >
                  {isForgotPassword ? 'Voltar ao login' : 'Esqueceu a senha?'}
                </button>
              </div>
            )}
          </div>

          <div className="pt-6 text-center">
            <p className="text-[10px] text-slate-600 uppercase tracking-widest">
              {isDemoMode ? 'Ambiente de Teste' : 'Acesso Restrito à Empresa Júnior'}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};