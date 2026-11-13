import React, { useState, useEffect } from 'react';
import {
  X,
  Code2,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Link2,
  Trash2,
} from 'lucide-react';
import { APPS_SCRIPT_CODE } from '../../config/appsScriptTemplate';
import {
  googleDriveService,
  TARGET_DRIVE_FOLDER,
  TARGET_ENTREGA_EPP_SPREADSHEET,
} from '../../services/googleDriveService';

interface AppsScriptConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected?: (message: string) => void;
}

export const AppsScriptConnectionModal: React.FC<AppsScriptConnectionModalProps> = ({
  isOpen,
  onClose,
  onConnected,
}) => {
  const [webAppUrl, setWebAppUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showCode, setShowCode] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setWebAppUrl(googleDriveService.getAppsScriptUrl());
      setStatus(null);
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(APPS_SCRIPT_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = APPS_SCRIPT_CODE;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleSaveAndTest = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = webAppUrl.trim();
    if (!cleanUrl) {
      setStatus({
        type: 'error',
        message: 'Pega la URL de la Aplicación Web generada por Google Apps Script.',
      });
      return;
    }

    setIsTesting(true);
    setStatus(null);
    try {
      const testRes = await googleDriveService.testAppsScriptConnection(cleanUrl);
      if (!testRes.success) {
        setStatus({ type: 'error', message: testRes.message });
        return;
      }

      googleDriveService.setAppsScriptUrl(cleanUrl);
      const syncRes = await googleDriveService.syncFromAppsScript(cleanUrl);
      const finalMsg = syncRes.success ? syncRes.message : testRes.message;
      setStatus({ type: 'success', message: finalMsg });
      if (onConnected) {
        onConnected(finalMsg);
      }
    } catch (err: any) {
      setStatus({
        type: 'error',
        message: err?.message || 'Error al probar conexión con Apps Script.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleDisconnect = () => {
    googleDriveService.setAppsScriptUrl('');
    setWebAppUrl('');
    setStatus({
      type: 'success',
      message: 'URL de Apps Script eliminada de este navegador.',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0A2958] via-[#0d346e] to-[#0A2958] text-white p-5 flex items-start justify-between border-b-2 border-[#E60000]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Code2 className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#0A2958] bg-emerald-300 px-2.5 py-0.5 rounded-full">
                Conexión Automática sin Pop-ups
              </span>
              <h2 className="text-lg font-bold text-white mt-1">
                Script de Conexión Automática — Entrega Epp´s MG
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[82vh] overflow-y-auto text-xs">
          {/* Target Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-500 block">
                Archivo Destino (Google Sheets):
              </span>
              <a
                href={TARGET_ENTREGA_EPP_SPREADSHEET.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-[#0A2958] hover:underline inline-flex items-center gap-1 mt-0.5"
              >
                <span>{TARGET_ENTREGA_EPP_SPREADSHEET.name}</span>
                <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
              </a>
              <span className="block font-mono text-[10px] text-slate-500 mt-0.5">
                ID: {TARGET_ENTREGA_EPP_SPREADSHEET.id}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-500 block">
                Carpeta Drive y Evidencias:
              </span>
              <a
                href={TARGET_DRIVE_FOLDER.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-[#0A2958] hover:underline inline-flex items-center gap-1 mt-0.5"
              >
                <span>{TARGET_DRIVE_FOLDER.name}</span>
                <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
              </a>
              <span className="block font-mono text-[10px] text-slate-500 mt-0.5">
                ID: {TARGET_DRIVE_FOLDER.id}
              </span>
            </div>
          </div>

          {/* Step by step instructions */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 space-y-2">
            <h3 className="font-bold text-[#0A2958] text-xs uppercase tracking-wide">
              Pasos para activar la conexión automática (funciona en móvil e incógnito):
            </h3>
            <ol className="list-decimal pl-5 space-y-1.5 text-slate-700 leading-relaxed">
              <li>
                Abre el archivo{' '}
                <a
                  href={TARGET_ENTREGA_EPP_SPREADSHEET.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-[#0A2958] underline"
                >
                  Entrega Epp´s MG
                </a>{' '}
                en Google Sheets y entra al menú <strong>Extensiones ➔ Apps Script</strong>.
              </li>
              <li>
                Borra el código actual del editor, haz clic en <strong>Copiar Script</strong> abajo y pégalo en el archivo <code>Código.gs</code>. Luego presiona Guardar (💾).
              </li>
              <li>
                Haz clic en <strong>Implementar ➔ Nueva implementación</strong> (o si ya habías implementado una, entra a <strong>Implementar ➔ Administrar implementaciones ➔ Editar (✏️) ➔ Nueva versión</strong>), elige tipo <strong>Aplicación web</strong>, en <em>Ejecutar como</em> selecciona <strong>Yo</strong> y en <em>Quién tiene acceso</em> selecciona <strong>Cualquier usuario</strong>.
              </li>
              <li>
                Copia la <strong>URL de la aplicación web</strong> (<code>https://script.google.com/macros/s/.../exec</code>), pégala abajo y haz clic en <strong>Conectar y Sincronizar</strong>.
              </li>
            </ol>
          </div>

          {/* URL Input Form */}
          <form onSubmit={handleSaveAndTest} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <label className="block font-bold text-[#0A2958]">
              URL de la Aplicación Web (Google Apps Script):
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="url"
                  value={webAppUrl}
                  onChange={(e) => setWebAppUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0A2958]"
                />
              </div>
              <button
                type="submit"
                disabled={isTesting}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#0A2958] hover:bg-[#123e80] text-white rounded-xl font-bold transition-colors disabled:opacity-60 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
                <span>{isTesting ? 'Conectando...' : 'Conectar y Sincronizar'}</span>
              </button>
              {googleDriveService.isAppsScriptConfigured() && (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-xl font-semibold transition-colors cursor-pointer"
                  title="Desvincular URL"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {status && (
              <div
                className={`p-3 rounded-xl border flex items-center gap-2 font-semibold ${
                  status.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                {status.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{status.message}</span>
              </div>
            )}

            {webAppUrl.trim().startsWith('https://script.google.com/') && (
              <div className="p-3 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <p className="font-bold text-[#0A2958]">
                  Para conexión automática global en Vercel (todos los dispositivos / incógnito):
                </p>
                <p>
                  En Vercel → <strong>Settings → Environment Variables</strong>, agrega la variable{' '}
                  <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-[#0A2958]">VITE_APPS_SCRIPT_URL</code>{' '}
                  con esta misma URL y vuelve a desplegar.
                </p>
              </div>
            )}
          </form>

          {/* Code block */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowCode(!showCode)}
                className="font-bold text-[#0A2958] hover:underline flex items-center gap-1.5 cursor-pointer"
              >
                <Code2 className="w-4 h-4 text-[#E60000]" />
                <span>
                  {showCode ? 'Ocultar código Google Apps Script (Código.gs)' : 'Mostrar código Google Apps Script (Código.gs)'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleCopyScript}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#E60000] hover:bg-red-700 text-white shadow-xs'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '¡Script Copiado!' : 'Copiar Script'}</span>
              </button>
            </div>

            {showCode && (
              <pre className="rounded-xl bg-slate-900 text-slate-100 p-4 font-mono text-[11px] overflow-x-auto max-h-72 overflow-y-auto border border-slate-700 leading-relaxed">
                {APPS_SCRIPT_CODE}
              </pre>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
