import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  PersonnelWorker,
  SSTRecord,
  Sede,
  Supervisor,
  EPS,
  ARL,
  MasterImportHistory,
} from '../types';
import { storageService } from '../services/storageService';
import { useAuth } from './AuthContext';

interface SSTContextType {
  workers: PersonnelWorker[];
  records: SSTRecord[];
  sedes: Sede[];
  supervisores: Supervisor[];
  epsList: EPS[];
  arlList: ARL[];
  importHistory: MasterImportHistory[];
  isLoading: boolean;
  refreshData: () => void;
  // Actions
  saveRecord: (record: SSTRecord) => SSTRecord;
  deleteRecord: (id: string) => boolean;
  saveWorker: (worker: PersonnelWorker) => PersonnelWorker;
  // Computed stats
  stats: {
    totalWorkers: number;
    activeWorkers: number;
    inactiveWorkers: number;
    totalRecords: number;
    pendingRecords: number;
    inProcessRecords: number;
    closedRecords: number;
    recordsBySite: Record<string, number>;
    recordsByModule: Record<string, number>;
  };
}

const SSTContext = createContext<SSTContextType | undefined>(undefined);

export const SSTProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [workers, setWorkers] = useState<PersonnelWorker[]>([]);
  const [records, setRecords] = useState<SSTRecord[]>([]);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [supervisores, setSupervisores] = useState<Supervisor[]>([]);
  const [epsList, setEpsList] = useState<EPS[]>([]);
  const [arlList, setArlList] = useState<ARL[]>([]);
  const [importHistory, setImportHistory] = useState<MasterImportHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = () => {
    setIsLoading(true);
    setWorkers(storageService.getWorkers());
    setRecords(storageService.getRecords());
    setSedes(storageService.getSedes());
    setSupervisores(storageService.getSupervisores());
    setEpsList(storageService.getEPS());
    setArlList(storageService.getARL());
    setImportHistory(storageService.getImportHistory());
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();

    const handleDataChange = () => {
      loadData();
    };

    window.addEventListener('mg-sst-data-change', handleDataChange);
    return () => {
      window.removeEventListener('mg-sst-data-change', handleDataChange);
    };
  }, []);

  const saveRecord = (record: SSTRecord) => {
    const saved = storageService.saveRecord(record, {
      email: user?.email || 'sistema@mgconsultores.com',
      name: user?.displayName || 'Usuario',
    });
    return saved;
  };

  const deleteRecord = (id: string) => {
    return storageService.deleteRecord(id, {
      email: user?.email || 'sistema@mgconsultores.com',
      name: user?.displayName || 'Usuario',
    });
  };

  const saveWorker = (worker: PersonnelWorker) => {
    return storageService.saveWorker(worker, {
      email: user?.email || 'sistema@mgconsultores.com',
      name: user?.displayName || 'Usuario',
    });
  };

  // Compute stats according to user role and site permissions
  const stats = useMemo(() => {
    const activeWorkers = workers.filter((w) => w.estado === 'ACTIVO').length;
    const inactiveWorkers = workers.filter((w) => w.estado === 'INACTIVO').length;

    // Filter records if site lead has specific site
    const relevantRecords = records.filter((r) => {
      if (user?.role === 'site_lead' && user.siteId !== 'TODAS') {
        return r.sedeId === user.siteId;
      }
      return true;
    });

    const pendingRecords = relevantRecords.filter((r) => r.estado === 'PENDIENTE').length;
    const inProcessRecords = relevantRecords.filter((r) => r.estado === 'EN_PROCESO').length;
    const closedRecords = relevantRecords.filter((r) => r.estado === 'CERRADO').length;

    const recordsBySite: Record<string, number> = {};
    relevantRecords.forEach((r) => {
      recordsBySite[r.sedeId] = (recordsBySite[r.sedeId] || 0) + 1;
    });

    const recordsByModule: Record<string, number> = {};
    relevantRecords.forEach((r) => {
      recordsByModule[r.moduloNombre] = (recordsByModule[r.moduloNombre] || 0) + 1;
    });

    return {
      totalWorkers: workers.length,
      activeWorkers,
      inactiveWorkers,
      totalRecords: relevantRecords.length,
      pendingRecords,
      inProcessRecords,
      closedRecords,
      recordsBySite,
      recordsByModule,
    };
  }, [workers, records, user]);

  return (
    <SSTContext.Provider
      value={{
        workers,
        records,
        sedes,
        supervisores,
        epsList,
        arlList,
        importHistory,
        isLoading,
        refreshData: loadData,
        saveRecord,
        deleteRecord,
        saveWorker,
        stats,
      }}
    >
      {children}
    </SSTContext.Provider>
  );
};

export const useSST = () => {
  const context = useContext(SSTContext);
  if (!context) {
    throw new Error('useSST must be used within an SSTProvider');
  }
  return context;
};
