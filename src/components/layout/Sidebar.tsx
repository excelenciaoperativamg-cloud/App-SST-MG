import React from 'react';
import {
  Users2,
  Shield,
  Lock,
  LogOut,
  X,
  Building2,
  User,
  Settings,
  History,
  Database,
  Sparkles,
} from 'lucide-react';
import { MGLogo } from '../common/MGLogo';
import { useAuth } from '../../context/AuthContext';
import { useSST } from '../../context/SSTContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeView: string;
  onNavigate: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeView,
  onNavigate,
}) => {
  const { user, logout } = useAuth();
  const { stats } = useSST();

  const INACTIVE_MODULES = [
    { id: 'salud', nombre: 'Salud', submenus: ['Agenda Médica', 'Atenciones en Campo', 'Pausas Saludables', 'Reporte Salud'] },
    { id: 'pesv', nombre: 'PESV', submenus: ['Chequeo Vehículos'] },
    { id: 'personal_otros', nombre: 'Personal (Otros)', submenus: ['Condiciones Inseguras', 'PAT_SST'] },
    { id: '5s', nombre: '5S', submenus: ['Orden y Aseo'] },
    { id: 'contratistas', nombre: 'Contratistas', submenus: ['Seguimiento Contratistas', 'Selección Contratistas'] },
    { id: 'emergencias', nombre: 'Inspección Emergencias', submenus: ['Cilindros', 'Extintores', 'Kit Derrames', 'Sensores de humo'] },
    { id: 'integrales', nombre: 'Inspecciones Integrales', submenus: ['Inspecciones Integrales'] },
    { id: 'rondas', nombre: 'Rondas de Cuidado', submenus: ['Rondas de Cuidado'] },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col bg-[#0A2958] text-white shadow-2xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Branding Section */}
        <div className="flex min-h-[4.75rem] items-center justify-between border-b border-white/10 px-3.5 py-2.5 bg-[#071d3f]">
          <MGLogo size="md" variant="dark" showSubtitle={true} />
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Navigation Landmark */}
        <nav
          aria-label="Menú principal de módulos SST"
          className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-white/20"
        >
          {/* Active Module Section: Personal ➔ Entrega EPP's */}
          <div>
            <div className="flex items-center justify-between px-3 mb-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                MÓDULO ACTIVO (FASE 1)
              </p>
              <span className="text-[9px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-800 px-1.5 py-0.2 rounded">
                OPERATIVO
              </span>
            </div>

            <div className="space-y-1.5">
              {/* Entrega EPP's - Primary Target */}
              <button
                onClick={() => onNavigate('epp_delivery')}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition-all ${
                  activeView === 'epp_delivery'
                    ? 'bg-[#E60000] text-white shadow-lg ring-2 ring-red-400/50'
                    : 'text-white bg-white/10 hover:bg-white/20'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Shield className="h-4 w-4 text-emerald-300 flex-shrink-0" />
                  <div className="text-left">
                    <div className="leading-tight">Personal</div>
                    <div className="text-[11px] opacity-90 font-normal">Entrega Epp´s MG</div>
                  </div>
                </div>
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">
                  Activo
                </span>
              </button>

              {/* Maestro de Personal */}
              <button
                onClick={() => onNavigate('personnel')}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                  activeView === 'personnel'
                    ? 'bg-[#E60000] text-white shadow-md'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users2 className="h-4 w-4 flex-shrink-0 text-slate-300" />
                  <span>Maestro de Personal</span>
                </div>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                  {stats.activeWorkers}
                </span>
              </button>
            </div>
          </div>

          {/* Inactive Modules Section: Módulos Inactivos */}
          <div>
            <div className="flex items-center justify-between px-3 mb-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Módulos Inactivos (Fase 2)
              </p>
              <span className="text-[9px] font-bold text-slate-400 bg-white/5 border border-white/10 px-1.5 py-0.2 rounded">
                INACTIVOS
              </span>
            </div>

            <div className="space-y-1">
              {INACTIVE_MODULES.map((mod) => (
                <div
                  key={mod.id}
                  onClick={() => onNavigate(`inactive_${mod.id}`)}
                  className={`flex w-full items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                    activeView === `inactive_${mod.id}`
                      ? 'bg-white/15 text-white'
                      : 'text-slate-400 hover:text-slate-300 hover:bg-white/5'
                  }`}
                  title={`${mod.nombre} se encuentra inactivo por directriz de implementación`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Lock className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{mod.nombre}</span>
                  </div>
                  <span className="text-[9px] text-slate-400 bg-white/5 px-1.5 py-0.2 rounded shrink-0">
                    Inactivo
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* System & Operations (Admin Only) */}
          {user?.role === 'admin' && (
            <div>
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Administración
              </p>
              <div className="space-y-1">
                <button
                  onClick={() => onNavigate('catalogs')}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                    activeView === 'catalogs'
                      ? 'bg-[#E60000] text-white'
                      : 'text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <Database className="h-4 w-4" />
                  <span>Catálogos (Sedes, EPS, ARL)</span>
                </button>

                <button
                  onClick={() => onNavigate('audit')}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                    activeView === 'audit'
                      ? 'bg-[#E60000] text-white'
                      : 'text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <History className="h-4 w-4" />
                  <span>Auditoría de Cambios</span>
                </button>

                <button
                  onClick={() => onNavigate('settings')}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                    activeView === 'settings'
                      ? 'bg-[#E60000] text-white'
                      : 'text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <Settings className="h-4 w-4" />
                  <span>Gestión de Usuarios</span>
                </button>
              </div>
            </div>
          )}
        </nav>

        {/* Footer User Info & Logout */}
        <div className="border-t border-white/10 p-3 bg-[#071d3f]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#E60000] text-white font-black text-xs flex items-center justify-center shrink-0">
                {user?.displayName ? user.displayName.substring(0, 2).toUpperCase() : 'MG'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate leading-tight">
                  {user?.displayName}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <Building2 className="w-3 h-3 text-[#E60000]" />
                  <span className="truncate font-semibold text-slate-300">
                    {user?.role === 'admin' ? 'Todas las Sedes (Admin)' : `Sede ${user?.siteId}`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg bg-white/10 hover:bg-red-950/50 hover:text-red-300 text-xs text-slate-300 font-medium transition-colors border border-white/10"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
};
