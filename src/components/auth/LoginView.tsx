import React, { useState } from 'react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { MGLogo } from '../common/MGLogo';

export const LoginView: React.FC = () => {
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Por favor ingresa tu usuario o correo electrónico.');
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const res = await login(identifier, password);
      if (!res.success) {
        setError(res.error || 'Credenciales inválidas.');
      }
    } catch (err: any) {
      setError('Error al iniciar sesión: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#071d3f] via-[#0A2958] to-[#041026] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Login Card Container */}
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-slate-200">
        
        {/* Left Column: Segurito MG Character Hero Banner */}
        <div className="lg:col-span-5 bg-gradient-to-b from-blue-50/60 via-white to-red-50/40 p-6 flex flex-col items-center justify-between border-b lg:border-b-0 lg:border-r border-slate-200 relative overflow-hidden">
          
          {/* Top text badge */}
          <div className="w-full text-center z-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E60000] px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-sm">
              Seguridad y Salud en el Trabajo
            </span>
            <h2 className="text-xl font-black text-[#0A2958] mt-2">
              Segurito MG
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Cultura de Cuidado & Prevención
            </p>
          </div>

          {/* Segurito MG Image - Preserved exactly as uploaded without any deformation */}
          <div className="my-4 relative flex items-center justify-center max-w-[280px] sm:max-w-[320px]">
            <img
              src="/assets/aistudio/Logo_Segurito_MG__1__5e59dc5b.png"
              alt="Segurito MG"
              className="w-full h-auto object-contain max-h-[380px] drop-shadow-xl"
            />
          </div>

          {/* Bottom Compliance Badge */}
          <div className="w-full rounded-2xl bg-white/95 backdrop-blur-xs border border-slate-200 p-3 text-center shadow-xs z-10">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#0A2958]">
              <ShieldCheck className="h-4 w-4 text-[#E60000]" />
              <span>Plataforma Oficial SG-SST</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              MG Consultores S.A.S.
            </p>
          </div>
        </div>

        {/* Right Column: Corporate Login Form */}
        <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between bg-white">
          
          <div>
            {/* Header with official MG logo */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <MGLogo size="lg" variant="light" showSubtitle={true} />
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                SG-SST
              </span>
            </div>

            {/* Form Title */}
            <div className="mt-8 mb-6">
              <h1 className="text-xl sm:text-2xl font-black text-[#0A2958]">
                Iniciar Sesión en la Plataforma
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Ingresa tus credenciales autorizadas del Sistema SG-SST
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username / Email */}
              <div>
                <label className="block text-xs font-bold text-[#0A2958] mb-1.5">
                  Usuario o Correo Electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Ingresa tu usuario o correo (ej. ha, mg, admin)"
                    className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0A2958] font-medium transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-[#0A2958] mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingresa tu contraseña"
                    className="w-full rounded-xl border border-slate-300 pl-10 pr-10 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0A2958] font-medium transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#E60000] py-3 px-4 text-xs font-bold text-white shadow-md hover:bg-red-700 hover:shadow-lg transition-all active:scale-[0.98] disabled:bg-slate-300 cursor-pointer"
                >
                  <span>{isLoading ? 'Verificando...' : 'Ingresar'}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>

          {/* Clean Corporate Footer */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>MG Consultores S.A.S. &copy; {new Date().getFullYear()}</span>
            <span className="font-medium text-slate-500">Plataforma Oficial SG-SST</span>
          </div>
        </div>
      </div>
    </div>
  );
};
