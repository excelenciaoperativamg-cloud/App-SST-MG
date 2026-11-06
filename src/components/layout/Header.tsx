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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSST } from '../../context/SSTContext';
import { ROLES, INITIAL_SEDES } from '../../config/constants';
import { Role } from '../../types';
import { MGLogo } from '../common/MGLogo';

interface HeaderProps {
  onToggleSidebar: () => void;
  onNavigateToNotifications?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, activeSiteId, switchSite, switchRole, logout } = useAuth();
  const { stats, refreshData } = useSST();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const roleInfo = user ? ROLES[user.role] : ROLES.viewer;

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 shadow-xs sm:px-6">
      {/* Left: Mobile hamburger & Active Sede badge */}
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

        {/* Sede Selector */}
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs sm:text-sm">
          <Building2 className="h-4 w-4 text-[#0A2958]" />
          <span className="font-semibold text-slate-700 hidden sm:inline">Sede Operativa:</span>
          <select
            value={activeSiteId}
            onChange={(e) => switchSite(e.target.value)}
            className="bg-transparent font-bold text-[#0A2958] focus:outline-none cursor-pointer"
            disabled={user?.role === 'site_lead'}
          >
            <option value="TODAS">TODAS LAS SEDES</option>
            {INITIAL_SEDES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.codigo} - {s.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right: Actions, Alerts, Role Selector, User Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Refresh button */}
        <button
          onClick={refreshData}
          title="Actualizar datos del sistema"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-[#0A2958] transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
        </button>

        {/* Pending Alerts Counter */}
        <div
          title={`${stats.pendingRecords} registros SST pendientes de cierre`}
          className="relative flex items-center rounded-lg p-2 text-slate-600 hover:bg-slate-100 cursor-pointer"
        >
          <Bell className="h-4 w-4" />
          {stats.pendingRecords > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[#E60000] px-1 text-[10px] font-bold text-white shadow-xs">
              {stats.pendingRecords}
            </span>
          )}
        </div>

        {/* Role Selector Badge (Allows switching role for validation) */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold shadow-xs transition-colors ${roleInfo.badgeColor}`}
            title="Cambiar rol activo para pruebas de permisos"
          >
            <Shield className="h-3 w-3" />
            <span className="hidden md:inline">{roleInfo.name}</span>
            <span className="md:hidden">{user?.role.toUpperCase()}</span>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Simular Rol de Usuario
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Prueba la vista y permisos según los perfiles definidos en el sistema.
                </p>
              </div>

              {(Object.keys(ROLES) as Role[]).map((r) => {
                const info = ROLES[r];
                const isActive = user?.role === r;
                return (
                  <button
                    key={r}
                    onClick={() => {
                      switchRole(r);
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left rounded-lg p-2 text-xs transition-colors flex flex-col gap-0.5 ${
                      isActive
                        ? 'bg-red-50 text-[#0A2958] font-bold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{info.name}</span>
                      {isActive && (
                        <span className="h-2 w-2 rounded-full bg-[#E60000]" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-600 font-normal">
                      {info.description}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-100 transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0A2958] text-xs font-bold text-white shadow-xs">
              {user?.displayName ? user.displayName.substring(0, 2).toUpperCase() : 'MG'}
            </div>
            <div className="hidden text-left xl:block">
              <p className="text-xs font-bold text-slate-800 leading-tight">
                {user?.displayName || 'Usuario SST'}
              </p>
              <p className="text-[10px] text-slate-600 leading-tight truncate max-w-[160px]">
                {user?.email}
              </p>
            </div>
            <ChevronDown className="h-3 w-3 text-slate-600" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl z-50">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <p className="text-xs font-bold text-slate-800">{user?.displayName}</p>
                <p className="text-[11px] text-slate-600 truncate">{user?.email}</p>
                <span className="inline-block mt-1 text-[10px] font-semibold bg-blue-50 text-[#0A2958] px-2 py-0.5 rounded">
                  {roleInfo.name}
                </span>
              </div>

              <button
                onClick={() => {
                  logout();
                  setShowUserMenu(false);
                }}
                className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
