import React, { useState } from 'react';
import {
  Settings,
  Users,
  Shield,
  Server,
  Key,
  CheckCircle,
  AlertTriangle,
  Building2,
  Plus,
  RefreshCw,
  GitBranch,
  FolderOpen,
  ExternalLink,
  FileSpreadsheet,
  CheckCircle2,
  Upload,
  Code2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { isFirebaseConfigured } from '../../config/firebase';
import { ROLES, INITIAL_SEDES } from '../../config/constants';
import { Role } from '../../types';
import { googleDriveService, TARGET_DRIVE_FOLDER } from '../../services/googleDriveService';
import { AppsScriptConnectionModal } from '../epp/AppsScriptConnectionModal';

interface SystemUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  siteId: string;
}

const INITIAL_USERS: SystemUser[] = [
  {
    id: 'usr-1',
    email: 'excelenciaoperativamg@gmail.com',
    name: 'Excelencia Operativa MG',
    role: 'admin',
    siteId: 'TODAS',
  },
  {
    id: 'usr-2',
    email: 'coordinador.sst@mgconsultores.com',
    name: 'Coordinador General SST',
    role: 'sst_lead',
    siteId: 'TODAS',
  },
  {
    id: 'usr-3',
    email: 'lider.hacienda@mgconsultores.com',
    name: 'Líder Operativo Hacienda',
    role: 'site_lead',
    siteId: 'MG-HA',
  },
  {
    id: 'usr-4',
    email: 'consulta.gerencia@mgconsultores.com',
    name: 'Gerencia y Auditoría Externa',
    role: 'viewer',
    siteId: 'TODAS',
  },
];

export const SettingsView: React.FC = () => {
  const { user, login } = useAuth();
  const [usersList, setUsersList] = useState<SystemUser[]>(INITIAL_USERS);
  const [activeTab, setActiveTab] = useState<'users' | 'firebase' | 'deployment' | 'google_drive'>('users');
  const [isDriveSyncing, setIsDriveSyncing] = useState(false);
  const [driveSyncResult, setDriveSyncResult] = useState<any>(null);
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);

  // Add User State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<Role>('sst_lead');
  const [newUserSite, setNewUserSite] = useState('TODAS');

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail || !newUserName) return;
    const newUser: SystemUser = {
      id: 'usr-' + Date.now(),
      email: newUserEmail.trim(),
      name: newUserName.trim(),
      role: newUserRole,
      siteId: newUserSite,
    };
    setUsersList((prev) => [...prev, newUser]);
    setIsAddUserOpen(false);
    setNewUserEmail('');
    setNewUserName('');
  };

  const handleSwitchToUser = (u: SystemUser) => {
    login(u.email);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-[#0A2958] p-1 text-white">
              <Settings className="h-4 w-4" />
            </span>
            <h1 className="text-xl font-black text-[#0A2958] sm:text-2xl">
              Configuración y Control de Usuarios
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Administración de cuentas con acceso por roles, vinculación de Firebase Firestore y parámetros de despliegue en Vercel.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
            activeTab === 'users'
              ? 'bg-[#0A2958] text-white shadow-sm'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Users className="h-4 w-4 text-[#E60000]" />
          <span>Usuarios y Roles ({usersList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('firebase')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
            activeTab === 'firebase'
              ? 'bg-[#0A2958] text-white shadow-sm'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Server className="h-4 w-4 text-blue-600" />
          <span>Conexión Firebase & Variables</span>
        </button>

        <button
          onClick={() => setActiveTab('google_drive')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
            activeTab === 'google_drive'
              ? 'bg-[#0A2958] text-white shadow-sm'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <FolderOpen className="h-4 w-4 text-amber-600" />
          <span>Google Drive (App_SST MG.V2)</span>
        </button>

        <button
          onClick={() => setActiveTab('deployment')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
            activeTab === 'deployment'
              ? 'bg-[#0A2958] text-white shadow-sm'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <GitBranch className="h-4 w-4 text-emerald-600" />
          <span>Guía Despliegue Vercel & GitHub</span>
        </button>
      </div>

      {/* TAB 1: USERS & ROLES */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-700">
              Cuentas configuradas en la plataforma de MG Consultores:
            </p>
            <button
              onClick={() => setIsAddUserOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#E60000] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-red-700 shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Nuevo Usuario</span>
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Nombre / Funcionario</th>
                  <th className="px-4 py-3">Correo Electrónico</th>
                  <th className="px-4 py-3">Rol Asignado</th>
                  <th className="px-4 py-3">Sede Asignada</th>
                  <th className="px-4 py-3 text-right">Sesión Activa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.map((u) => {
                  const role = ROLES[u.role];
                  const isCurrent = user?.email === u.email;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-800">{u.name}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">{u.email}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${role.badgeColor}`}
                        >
                          {role.name}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-[#0A2958] bg-slate-100 px-2 py-0.5 rounded">
                          {u.siteId}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {isCurrent ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                            <CheckCircle className="h-3.5 w-3.5" />
                            Sesión Actual
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSwitchToUser(u)}
                            className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-[#0A2958] hover:bg-slate-100 transition-colors"
                          >
                            Iniciar como {u.name.split(' ')[0]}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: FIREBASE CONNECTION */}
      {activeTab === 'firebase' && (
        <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div>
            <h3 className="text-base font-bold text-[#0A2958] flex items-center gap-2">
              <Server className="h-5 w-5 text-blue-600" />
              Estado de los Servicios Firebase
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Cloud Firestore, Firebase Authentication y Firebase Storage para MG Consultores.
            </p>
          </div>

          <div
            className={`rounded-xl border p-4 text-xs ${
              isFirebaseConfigured
                ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                : 'border-blue-200 bg-blue-50/50 text-blue-950'
            }`}
          >
            <div className="flex items-center gap-2 font-bold mb-1">
              <CheckCircle className="h-4 w-4 text-blue-700" />
              <span>
                {isFirebaseConfigured
                  ? 'Firebase conectado en producción con Cloud Firestore activo.'
                  : 'Modo Almacenamiento Local Seguro Activo (Listo para conectar con Firebase en Vercel)'}
              </span>
            </div>
            <p className="text-slate-600">
              La plataforma cuenta con un motor de almacenamiento reactivo y persistente que garantiza operatividad inmediata. Para conectar tu propio proyecto de Firebase en Vercel o en local, configura las variables en tus ajustes de entorno.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-[#0A2958] flex items-center gap-1.5">
              <Key className="h-4 w-4 text-[#E60000]" />
              <span>Variables de Entorno Requeridas (.env.local o Vercel Environment Variables):</span>
            </h4>
            <div className="rounded-xl bg-slate-900 p-4 text-slate-200 font-mono text-[11px] overflow-x-auto space-y-1">
              <p>VITE_FIREBASE_API_KEY="AIzaSy..."</p>
              <p>VITE_FIREBASE_AUTH_DOMAIN="mg-consultores-sst.firebaseapp.com"</p>
              <p>VITE_FIREBASE_PROJECT_ID="mg-consultores-sst"</p>
              <p>VITE_FIREBASE_STORAGE_BUCKET="mg-consultores-sst.appspot.com"</p>
              <p>VITE_FIREBASE_MESSAGING_SENDER_ID="1234567890"</p>
              <p>VITE_FIREBASE_APP_ID="1:1234567890:web:abcdef..."</p>
            </div>
            <p className="text-[11px] text-slate-500">
              Las reglas de seguridad optimizadas y probadas se encuentran en el archivo <code>firestore.rules</code> y la arquitectura intermedia en <code>firebase-blueprint.json</code>.
            </p>
          </div>
        </div>
      )}

      {/* TAB 3: DEPLOYMENT VERCEL & GITHUB */}
      {activeTab === 'deployment' && (
        <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div>
            <h3 className="text-base font-bold text-[#0A2958] flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-emerald-600" />
              Instrucciones de Despliegue en Vercel e Integración con GitHub
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Pasos para conectar el repositorio de GitHub y realizar despliegue continuo (CI/CD) en Vercel.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h4 className="font-bold text-[#0A2958] mb-1">Paso 1: Repositorio en GitHub</h4>
              <p className="text-slate-700">
                Sube el código fuente a tu organización o cuenta de GitHub:
              </p>
              <pre className="mt-2 rounded-lg bg-slate-900 p-3 text-slate-100 font-mono text-[11px]">
{`git init
git add .
git commit -m "feat: Plataforma Web Interna SST MG Consultores Fase 1"
git branch -M main
git remote add origin https://github.com/tu-organizacion/mg-sst-platform.git
git push -u origin main`}
              </pre>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h4 className="font-bold text-[#0A2958] mb-1">Paso 2: Conexión con Vercel</h4>
              <ol className="list-decimal pl-5 space-y-1 text-slate-700">
                <li>Ingresa a vercel.com e inicia sesión.</li>
                <li>Haz clic en "Add New..." ➔ "Project".</li>
                <li>Selecciona el repositorio <code>mg-sst-platform</code>.</li>
                <li>En "Framework Preset", Vercel detectará automáticamente <strong>Vite</strong>.</li>
                <li>En "Environment Variables", agrega las variables de Firebase listadas en la pestaña anterior.</li>
                <li>Haz clic en <strong>Deploy</strong>.</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: GOOGLE DRIVE CONNECTION */}
      {activeTab === 'google_drive' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  Google Drive & Sheets API
                </span>
                <h3 className="text-lg font-black text-[#0A2958] mt-1.5 flex items-center gap-2">
                  <FolderOpen className="h-5 w-5 text-amber-600" />
                  Conexión con Carpeta: {TARGET_DRIVE_FOLDER.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Sincronización automatizada de usuarios desde el archivo <strong>{TARGET_DRIVE_FOLDER.targetFileName}</strong> (hoja <em>Usuario</em>).
                </p>
              </div>

              <a
                href={TARGET_DRIVE_FOLDER.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors border border-slate-200"
              >
                <span>Abrir en Google Drive</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">ID de la Carpeta:</span>
                <span className="font-mono font-bold text-slate-800">{TARGET_DRIVE_FOLDER.id}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Archivo Objetivo:</span>
                <span className="font-bold text-[#0A2958] flex items-center gap-1">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  {TARGET_DRIVE_FOLDER.targetFileName}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Hoja Específica:</span>
                <span className="font-mono font-bold text-slate-800">Usuario / Usuarios</span>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setIsScriptModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                <Code2 className="w-4 h-4" />
                <span>Script Conexión Automática (Entrega Epp´s MG)</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  setIsDriveSyncing(true);
                  setDriveSyncResult(null);
                  try {
                    const res = googleDriveService.isAppsScriptConfigured()
                      ? await googleDriveService.syncFromAppsScript()
                      : await googleDriveService.syncUsersFromDrive(TARGET_DRIVE_FOLDER.id);
                    setDriveSyncResult(res);
                  } catch (e: any) {
                    setDriveSyncResult({ success: false, message: e.message });
                  } finally {
                    setIsDriveSyncing(false);
                  }
                }}
                disabled={isDriveSyncing}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0A2958] hover:bg-[#123e80] text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isDriveSyncing ? 'animate-spin' : ''}`} />
                <span>{isDriveSyncing ? 'Sincronizando con Google Drive...' : 'Sincronizar Datos Ahora'}</span>
              </button>

              <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-300 cursor-pointer">
                <Upload className="w-4 h-4 text-slate-600" />
                <span>Cargar Archivo Excel (.xlsx)</span>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setIsDriveSyncing(true);
                    setDriveSyncResult(null);
                    try {
                      const res = await googleDriveService.syncUsersFromExcelFile(file);
                      setDriveSyncResult(res);
                    } catch (err: any) {
                      setDriveSyncResult({ success: false, message: err.message });
                    } finally {
                      setIsDriveSyncing(false);
                      e.target.value = '';
                    }
                  }}
                />
              </label>
            </div>

            {driveSyncResult && (
              <div
                className={`p-4 rounded-xl border text-xs space-y-1 animate-in fade-in ${
                  driveSyncResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-red-50 border-red-200 text-red-900'
                }`}
              >
                <div className="flex items-center gap-2 font-bold">
                  {driveSyncResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span>{driveSyncResult.message}</span>
                </div>
                {driveSyncResult.users && driveSyncResult.users.length > 0 && (
                  <p className="text-[11px] opacity-80 pt-1">
                    Se han actualizado {driveSyncResult.users.length} usuarios en la plataforma.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-[#0A2958] mb-3">Nuevo Usuario del Sistema</h3>
            <form onSubmit={handleAddUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre Completo:</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Ej. Inspector SST"
                  className="w-full rounded-lg border p-2 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Correo Electrónico:</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="usuario@mgconsultores.com"
                  className="w-full rounded-lg border p-2"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Rol Operativo:</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as Role)}
                  className="w-full rounded-lg border p-2 font-bold"
                >
                  {(Object.keys(ROLES) as Role[]).map((r) => (
                    <option key={r} value={r}>
                      {ROLES[r].name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Sede Asignada:</label>
                <select
                  value={newUserSite}
                  onChange={(e) => setNewUserSite(e.target.value)}
                  className="w-full rounded-lg border p-2 font-bold"
                >
                  <option value="TODAS">TODAS LAS SEDES</option>
                  {INITIAL_SEDES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.codigo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-4 py-2 border rounded-lg font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#E60000] text-white rounded-lg font-bold hover:bg-red-700"
                >
                  Guardar Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AppsScriptConnectionModal
        isOpen={isScriptModalOpen}
        onClose={() => setIsScriptModalOpen(false)}
        onConnected={(msg) => setDriveSyncResult({ success: true, message: msg })}
      />
    </div>
  );
};
