import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { SSTProvider } from './context/SSTContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { PersonnelMasterView } from './components/personnel/PersonnelMasterView';
import { SSTModuleView } from './components/forms/SSTModuleView';
import { CatalogsView } from './components/catalogs/CatalogsView';
import { ReportsView } from './components/reports/ReportsView';
import { BackupsView } from './components/backups/BackupsView';
import { AuditView } from './components/audit/AuditView';
import { SettingsView } from './components/settings/SettingsView';
import { DynamicSSTFormModal } from './components/forms/DynamicSSTFormModal';
import { SST_MODULES } from './config/constants';

function MainApp() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [activeModuleId, setActiveModuleId] = useState<string>('d19d30b0'); // Default emergency inspections
  const [activeSubMenuId, setActiveSubMenuId] = useState<string>('sub-em-1');
  const [isGlobalNewRecordOpen, setIsGlobalNewRecordOpen] = useState(false);

  const handleNavigate = (view: string, moduleId?: string, subMenuId?: string) => {
    setActiveView(view);
    if (moduleId) {
      setActiveModuleId(moduleId);
      const mod = SST_MODULES.find((m) => m.id === moduleId);
      setActiveSubMenuId(subMenuId || mod?.submenus[0]?.id || '');
    }
    setSidebarOpen(false); // Close on mobile navigation
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
        activeModuleId={activeModuleId}
        activeSubMenuId={activeSubMenuId}
        onNavigate={handleNavigate}
      />

      {/* Main Content Column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        {/* Semantic Main Content Viewport */}
        <main id="main-content" role="main" tabIndex={-1} className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            {activeView === 'dashboard' && (
              <DashboardView
                onNavigateToModule={(modId, subId) => handleNavigate('sst_module', modId, subId)}
                onNavigateToPersonnel={() => handleNavigate('personnel')}
                onNavigateToReports={() => handleNavigate('reports')}
                onOpenNewRecordModal={() => setIsGlobalNewRecordOpen(true)}
              />
            )}

            {activeView === 'personnel' && <PersonnelMasterView />}

            {activeView === 'sst_module' && (
              <SSTModuleView
                moduleId={activeModuleId}
                activeSubMenuId={activeSubMenuId}
                onSelectSubMenu={(subId) => setActiveSubMenuId(subId)}
              />
            )}

            {activeView === 'catalogs' && <CatalogsView />}

            {activeView === 'reports' && <ReportsView />}

            {activeView === 'backups' && <BackupsView />}

            {activeView === 'audit' && <AuditView />}

            {activeView === 'settings' && <SettingsView />}

            {/* Semantic Footer */}
            <footer role="contentinfo" className="border-t border-slate-200/80 pt-4 text-center text-xs text-slate-500 no-print">
              <p className="font-semibold text-slate-700">
                MG CONSULTORES S.A.S. &copy; {new Date().getFullYear()} – Plataforma Web Interna de Gestión SST
              </p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Cumplimiento normativo Decreto 1072 de 2015 y Resolución 0312 de 2019 de Colombia.
              </p>
            </footer>
          </div>
        </main>
      </div>

      {/* Global Quick Action New SST Record Modal */}
      <DynamicSSTFormModal
        isOpen={isGlobalNewRecordOpen}
        onClose={() => setIsGlobalNewRecordOpen(false)}
        initialMenuId={activeModuleId}
        initialSubMenuId={activeSubMenuId}
        onSaved={() => {
          // Data refreshed automatically via storage event
        }}
      />
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
