import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SSTProvider } from './context/SSTContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { LoginView } from './components/auth/LoginView';
import { EPPDeliveryModuleView } from './components/epp/EPPDeliveryModuleView';
import { PersonnelMasterView } from './components/personnel/PersonnelMasterView';
import { CatalogsView } from './components/catalogs/CatalogsView';
import { AuditView } from './components/audit/AuditView';
import { SettingsView } from './components/settings/SettingsView';
import { Lock, Shield, ArrowRight } from 'lucide-react';
import { googleDriveService, TARGET_DRIVE_FOLDER } from './services/googleDriveService';

function InactiveModuleNotice({ onGoToEPP }: { onGoToEPP: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-xs my-8 animate-in fade-in zoom-in-95">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4 text-amber-600">
        <Lock className="w-8 h-8" />
      </div>
      <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
        Módulo Inactivo - Fase de Implementación
      </span>
      <h2 className="text-xl font-black text-[#0A2958] mt-4">
        Este módulo y formulario se encuentran inactivos
      </h2>
      <p className="text-xs text-slate-500 mt-2 max-w-lg mx-auto leading-relaxed">
        Siguiendo las directrices operativas del proyecto SST de MG Consultores, actualmente estamos operando en la <strong>Fase 1 con el Módulo de Personal y el formulario oficial de Entrega de EPP's</strong>. Los demás módulos se habilitarán progresivamente.
      </p>
      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          onClick={onGoToEPP}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#0A2958] hover:bg-[#123e80] text-white rounded-xl text-xs font-bold shadow-md transition-all"
        >
          <Shield className="w-4 h-4 text-[#E60000]" />
          <span>Ir a Entrega de EPP's</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function MainApp() {
  const { isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState('epp_delivery');

  // Automatic background sync with Google Drive when app is active
  React.useEffect(() => {
    if (!isAuthenticated) return;
    if (googleDriveService.isAppsScriptConfigured()) {
      googleDriveService.syncFromAppsScript().catch(() => {});
    } else if (googleDriveService.isAuthenticated()) {
      googleDriveService.syncUsersFromDrive(TARGET_DRIVE_FOLDER.id).catch(() => {});
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const handleNavigate = (view: string) => {
    setActiveView(view);
    setSidebarOpen(false);
  };

  return (
    <div className="app-container flex h-screen w-full overflow-hidden bg-slate-50 font-sans text-slate-800 antialiased">
      {/* Skip to Main Content Link for Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-[#0A2958] focus:px-4 focus:py-2 focus:text-xs focus:font-bold focus:text-white focus:shadow-xl focus:ring-2 focus:ring-[#E60000]"
      >
        Saltar al contenido principal
      </a>

      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeView={activeView}
        onNavigate={handleNavigate}
      />

      {/* Main Content Column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        {/* Semantic Main Content Viewport */}
        <main id="main-content" role="main" tabIndex={-1} className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            {activeView === 'epp_delivery' && <EPPDeliveryModuleView />}

            {activeView === 'personnel' && <PersonnelMasterView />}

            {activeView.startsWith('inactive_') && (
              <InactiveModuleNotice onGoToEPP={() => setActiveView('epp_delivery')} />
            )}

            {activeView === 'catalogs' && <CatalogsView />}

            {activeView === 'audit' && <AuditView />}

            {activeView === 'settings' && <SettingsView />}

            {/* Semantic Footer */}
            <footer role="contentinfo" className="border-t border-slate-200/80 pt-4 text-center text-xs text-slate-500 no-print">
              <p className="font-semibold text-slate-700">
                MG CONSULTORES S.A.S. &copy; {new Date().getFullYear()} – Plataforma Web Interna de Gestión SST
              </p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Cumplimiento normativo Decreto 1072 de 2015 y Resolución 2400 de 1979 de Colombia.
              </p>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SSTProvider>
        <MainApp />
      </SSTProvider>
    </AuthProvider>
  );
}
