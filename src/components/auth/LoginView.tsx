import React, { useState, useRef, useEffect } from 'react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Upload,
  RefreshCw,
  Info,
  FolderSync,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { MGLogo } from '../common/MGLogo';
import { googleDriveService, TARGET_DRIVE_FOLDER } from '../../services/googleDriveService';

export const LoginView: React.FC = () => {
  const { login, loginWithGoogle } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Google Drive & Excel Sync State
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
    details?: string;
  } | null>(null);

  // Background check on mount: If Google token is already cached, sync automatically
  useEffect(() => {
    if (googleDriveService.isAuthenticated()) {
      googleDriveService
        .syncUsersFromDrive(TARGET_DRIVE_FOLDER.id)
        .then((res) => {
          if (res.success) {
            setSyncFeedback({
              type: 'success',
              message: `Conexión automática activa con Google Drive: ${res.usersFound} usuarios sincronizados.`,
            });
          }
        })
        .catch(() => {});
    }
  }, []);

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

  /**
   * One-click automatic connection:
   * 1. Connects to Google
   * 2. Automatically syncs file App_SST MG from folder App_SST MG.V2
   * 3. Automatically logs the user into the platform
   */
  const handleAutoConnectGoogle = async () => {
    setIsSyncingDrive(true);
    setError(null);
    setSyncFeedback(null);

    try {
      const res = await loginWithGoogle();
      if (!res.success) {
        const isPopupClosed =
          String(res.error).includes('popup-closed') ||
          String(res.error).includes('cerrada');

        setSyncFeedback({
          type: isPopupClosed ? 'warning' : 'error',
          message: isPopupClosed
            ? 'La ventana de Google se cerró antes de completar la autorización.'
            : res.error || 'Error al conectar automáticamente con Google Drive.',
          details: isPopupClosed
            ? 'Haz clic nuevamente asegurándote de completar la autorización, o carga el archivo Excel directamente.'
            : undefined,
        });
      }
    } catch (err: any) {
      setSyncFeedback({
        type: 'error',
        message: 'No fue posible completar la conexión con Google Drive.',
        details: err.message,
      });
    } finally {
      setIsSyncingDrive(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSyncingDrive(true);
    setSyncFeedback(null);

    try {
      const result = await googleDriveService.syncUsersFromExcelFile(file);
      if (result.success) {
        setSyncFeedback({
          type: 'success',
          message: result.message,
          details: `Archivo: ${file.name} | Hoja: ${result.sheetName} (${result.usersFound} usuarios actualizados)`,
        });
      } else {
        setSyncFeedback({
          type: 'error',
          message: result.message,
        });
      }
    } catch (err: any) {
      setSyncFeedback({
        type: 'error',
        message: 'Error al procesar el archivo Excel: ' + err.message,
      });
    } finally {
      setIsSyncingDrive(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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

          {/* Segurito MG Image - Preserved exactly as uploaded */}
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
            <div className="mt-6 mb-4">
              <h1 className="text-xl sm:text-2xl font-black text-[#0A2958]">
                Iniciar Sesión en la Plataforma
              </h1>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* ONE-CLICK AUTOMATIC GOOGLE DRIVE CONNECTION BUTTON */}
            <div className="mb-5 space-y-2">
              <button
                type="button"
                onClick={handleAutoConnectGoogle}
                disabled={isSyncingDrive}
                className="w-full flex items-center justify-center gap-3 rounded-2xl border-2 border-[#0A2958]/20 bg-gradient-to-r from-blue-50/70 via-white to-blue-50/50 hover:border-[#0A2958] hover:shadow-md py-3 px-4 text-xs font-bold text-[#0A2958] transition-all disabled:opacity-60 cursor-pointer group"
                title="Conectarse automáticamente con Google Drive y sincronizar la hoja Usuario del archivo App_SST MG"
              >
                {/* Official Google G Icon */}
                <svg className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <div className="text-left">
                  <div className="flex items-center gap-1.5 font-black text-xs text-[#0A2958]">
                    <span>{isSyncingDrive ? 'Conectando con Google Drive...' : 'Conectar Automáticamente con Google Drive'}</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  </div>
                  <div className="text-[10px] text-slate-500 font-normal">
                    Sincroniza y accede con la carpeta <span className="font-semibold text-slate-700">{TARGET_DRIVE_FOLDER.name}</span>
                  </div>
                </div>
              </button>

              {/* Sync Feedback Message */}
              {syncFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-start gap-2.5 border animate-in fade-in ${
                    syncFeedback.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : syncFeedback.type === 'warning'
                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}
                >
                  {syncFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                  ) : syncFeedback.type === 'warning' ? (
                    <Info className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                  )}
                  <div className="space-y-1 flex-1">
                    <p className="font-semibold leading-tight">{syncFeedback.message}</p>
                    {syncFeedback.details && (
                      <p className="text-[11px] opacity-85 leading-relaxed">{syncFeedback.details}</p>
                    )}
                    {syncFeedback.type === 'warning' && (
                      <div className="pt-1 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleAutoConnectGoogle}
                          className="text-[11px] font-bold text-amber-900 underline hover:text-amber-950"
                        >
                          Reintentar conexión
                        </button>
                        <span className="text-amber-400">•</span>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-[11px] font-bold text-blue-700 underline hover:text-blue-900"
                        >
                          Cargar Excel (.xlsx)
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-wider font-bold">
                <span className="bg-white px-3 text-slate-400">O ingresa con usuario y contraseña</span>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Username / Email */}
              <div>
                <label className="block text-xs font-bold text-[#0A2958] mb-1">
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
                    placeholder="Ingresa tu usuario o correo"
                    className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0A2958] font-medium"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-[#0A2958] mb-1">
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
                    className="w-full rounded-xl border border-slate-300 pl-10 pr-10 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0A2958] font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#E60000] py-2.5 px-4 text-xs font-bold text-white shadow-md hover:bg-red-700 hover:shadow-lg transition-all active:scale-[0.98] disabled:bg-slate-300 cursor-pointer"
                >
                  <span>{isLoading ? 'Verificando...' : 'Ingresar'}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>

            {/* Hidden File Input for Direct Excel Upload */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Clean Corporate Footer */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>MG Consultores S.A.S. &copy; {new Date().getFullYear()}</span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-slate-500 hover:text-[#0A2958] font-medium flex items-center gap-1 hover:underline"
              title="Cargar archivo Excel directamente si estás desconectado"
            >
              <Upload className="w-3 h-3" />
              <span>Cargar Excel</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
