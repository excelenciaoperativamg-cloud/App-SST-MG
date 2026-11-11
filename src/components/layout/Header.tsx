import React, { useState } from 'react';
import {
  Menu,
  Building2,
  Shield,
  Bell,
  User,
  ChevronDown,
  LogOut,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSST } from '../../context/SSTContext';
import { ROLES, INITIAL_SEDES } from '../../config/constants';
import { MGLogo } from '../common/MGLogo';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, activeSiteId, switchSite, logout } = useAuth();
  const { stats, refreshData } = useSST();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const roleInfo = user ? ROLES[user.role] : ROLES.viewer;
  const isAdmin = user?.role === 'admin';

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 shadow-xs sm:px-6">
      {/* Left: Mobile hamburger & Sede Status */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          title="Alternar Menú"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="lg:hidden">
          <MGLogo size="sm" variant="light" showSubtitle={false} />
        </div>

        {/* Sede Selector / Display */}
        {isAdmin ? (
          <div className="flex items-center gap-2 rounded-xl bg-blue-50/70 border border-blue-200 px-3 py-1.5 text-xs sm:text-sm">
            <Building2 className="h-4 w-4 text-[#0A2958]" />
            <span className="font-bold text-slate-700 hidden sm:inline">Sede Operativa:</span>
            <select
              value={activeSiteId}
              onChange={(e) => switchSite(e.target.value)}
              className="bg-transparent font-bold text-[#0A2958] focus:outline-none cursor-pointer"
            >
              <option value="TODAS">🏢 TODAS LAS SEDES (Acceso Total Admin)</option>
              {INITIAL_SEDES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.codigo} - {s.nombre}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl bg-slate-100 border border-slate-200 px-3 py-1.5 text-xs sm:text-sm">
            <Building2 className="h-4 w-4 text-[#0A2958]" />
            <span className="font-semibold text-slate-600">Sede Asignada:</span>
            <span className="font-bold text-[#0A2958]">
              {INITIAL_SEDES.find((s) => s.id === user?.siteId)?.nombre || user?.siteId}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
              <Lock className="w-2.5 h-2.5" />
              Sede Fija
            </span>
          </div>
        )}
      </div>

      {/* Right: Refresh, User Profile, Role Badge */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Refresh button */}
        <button
          onClick={refreshData}
          title="Actualizar datos del sistema"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-[#0A2958] transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
        </button>

        {/* Role Badge */}
        <div
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold shadow-xs ${
            isAdmin
              ? 'bg-red-50 text-[#E60000] border-red-200'
              : 'bg-blue-50 text-[#0A2958] border-blue-200'
          }`}
        >
          <Shield className="h-3.5 w-3.5" />
          <span>{isAdmin ? 'ADMINISTRADOR GENERAL' : `RESPONSABLE ${user?.siteId}`}</span>
        </div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0A2958] text-xs font-bold text-white shadow-xs">
              {user?.displayName ? user.displayName.substring(0, 2).toUpperCase() : 'MG'}
            </div>
            <div className="hidden text-left xl:block">
              <p className="text-xs font-bold text-slate-800 leading-tight">
                {user?.displayName || 'Usuario SST'}
              </p>
              <p className="text-[10px] text-slate-500 leading-tight truncate max-w-[160px]">
                {user?.email}
              </p>
            </div>
            <ChevronDown className="h-3 w-3 text-slate-500" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
                <p className="text-xs font-bold text-slate-800">{user?.displayName}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#0A2958] bg-blue-50 px-2 py-0.5 rounded-full">
                    {roleInfo.name}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Sede: {user?.siteId || 'TODAS'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  logout();
                  setShowUserMenu(false);
                }}
                className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
