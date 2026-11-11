import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  User as FirebaseUser,
  onAuthStateChanged,
} from 'firebase/auth';
import * as XLSX from 'xlsx';
import firebaseConfig from '../../firebase-applet-config.json';
import { AppUser, INITIAL_APP_USERS } from '../config/users';
import { Role } from '../types';
import { auditService } from './auditService';

// Initialize Firebase App safely (singleton)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

// Provider with Drive and Sheets scopes
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.readonly');
provider.addScope('https://www.googleapis.com/auth/spreadsheets.readonly');
provider.setCustomParameters({
  prompt: 'select_account',
});

// Target folder configuration requested by user
export const TARGET_DRIVE_FOLDER = {
  id: '1LrtkMgzlxsTz9j_jX-bIATPK5CmF0DV7',
  name: 'App_SST MG.V2',
  url: 'https://drive.google.com/drive/folders/1LrtkMgzlxsTz9j_jX-bIATPK5CmF0DV7',
  targetFileName: 'App_SST MG',
};

// In-memory token cache (do NOT store in localStorage)
let cachedAccessToken: string | null = null;
let cachedGoogleUser: FirebaseUser | null = null;
let isSigningIn = false;

export interface DriveFileInfo {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export interface SyncUsersResult {
  success: boolean;
  message: string;
  folderName?: string;
  fileName?: string;
  sheetName?: string;
  usersFound: number;
  users: AppUser[];
  error?: string;
}

export const googleDriveService = {
  /**
   * Check if user is currently signed in with Google and token is cached
   */
  isAuthenticated(): boolean {
    return !!cachedAccessToken;
  },

  getGoogleUser(): FirebaseUser | null {
    return cachedGoogleUser;
  },

  getAccessToken(): string | null {
    return cachedAccessToken;
  },

  /**
   * Listen to Firebase auth state
   */
  initAuthListener(
    onSuccess?: (user: FirebaseUser, token: string) => void,
    onFailure?: () => void
  ) {
    return onAuthStateChanged(auth, async (user) => {
      if (user && cachedAccessToken) {
        cachedGoogleUser = user;
        if (onSuccess) onSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        cachedGoogleUser = null;
        if (onFailure) onFailure();
      }
    });
  },

  /**
   * Interactive Sign In with Google popup to obtain OAuth token
   */
  async signInWithGoogle(): Promise<{ user: FirebaseUser; accessToken: string }> {
    try {
      isSigningIn = true;
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);

      if (!credential?.accessToken) {
        throw new Error('No se pudo obtener el token de acceso de Google.');
      }

      cachedAccessToken = credential.accessToken;
      cachedGoogleUser = result.user;
      return { user: result.user, accessToken: cachedAccessToken };
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        const error = new Error('La ventana de Google fue cerrada antes de completar la autorización.');
        (error as any).code = 'auth/popup-closed-by-user';
        throw error;
      }
      if (err.code === 'auth/popup-blocked') {
        const error = new Error('El navegador bloqueó la ventana emergente de Google. Por favor permite los pop-ups para esta página.');
        (error as any).code = 'auth/popup-blocked';
        throw error;
      }
      if (err.code === 'auth/cancelled-popup-request') {
        const error = new Error('Operación cancelada.');
        (error as any).code = 'auth/cancelled-popup-request';
        throw error;
      }
      console.warn('Google Auth notice:', err?.message || err);
      throw err;
    } finally {
      isSigningIn = false;
    }
  },

  /**
   * One-click automatic connection:
   * Authenticates with Google and immediately synchronizes
   * users from folder App_SST MG.V2 (file App_SST MG -> hoja Usuario)
   */
  async autoConnectAndSync(): Promise<{
    user: FirebaseUser;
    accessToken: string;
    syncResult: SyncUsersResult;
  }> {
    const authData = await this.signInWithGoogle();
    const syncResult = await this.syncUsersFromDrive(TARGET_DRIVE_FOLDER.id);
    return {
      user: authData.user,
      accessToken: authData.accessToken,
      syncResult,
    };
  },

  /**
   * Sign out from Google Auth
   */
  async signOut(): Promise<void> {
    await auth.signOut();
    cachedAccessToken = null;
    cachedGoogleUser = null;
  },

  /**
   * List files in a Google Drive folder
   */
  async listFilesInFolder(folderId: string = TARGET_DRIVE_FOLDER.id): Promise<DriveFileInfo[]> {
    if (!cachedAccessToken) {
      await this.signInWithGoogle();
    }

    const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
    const fields = encodeURIComponent('files(id, name, mimeType, size, modifiedTime, webViewLink)');
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&pageSize=50`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${cachedAccessToken}`,
      },
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Error al consultar Google Drive (${response.status})`);
    }

    const data = await response.json();
    return data.files || [];
  },

  /**
   * Search for App_SST MG file across Drive if not found directly in folder
   */
  async findAppSSTFile(folderId: string = TARGET_DRIVE_FOLDER.id): Promise<DriveFileInfo | null> {
    // 1. First check directly inside the target folder
    const folderFiles = await this.listFilesInFolder(folderId);
    const inFolder = folderFiles.find(
      (f) =>
        f.name.toLowerCase().includes('app_sst mg') ||
        f.name.toLowerCase().includes('app_sst') ||
        f.name.toLowerCase().includes('sst mg')
    );
    if (inFolder) return inFolder;

    // 2. If not found in folder or folder is restricted, search general Drive for the file
    const query = encodeURIComponent(`name contains 'App_SST MG' and trashed = false`);
    const fields = encodeURIComponent('files(id, name, mimeType, size, modifiedTime, webViewLink)');
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&pageSize=10`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${cachedAccessToken}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.files && data.files.length > 0) {
        return data.files[0];
      }
    }

    return null;
  },

  /**
   * Read users from the "Usuario" or "Usuarios" sheet of the App_SST MG file
   */
  async syncUsersFromDrive(folderId: string = TARGET_DRIVE_FOLDER.id): Promise<SyncUsersResult> {
    try {
      // 1. Ensure authenticated
      if (!cachedAccessToken) {
        await this.signInWithGoogle();
      }

      // 2. Find the file
      let targetFile = await this.findAppSSTFile(folderId);

      // If still not found, check any spreadsheet file in the folder
      if (!targetFile) {
        const folderFiles = await this.listFilesInFolder(folderId).catch(() => []);
        targetFile =
          folderFiles.find(
            (f) =>
              f.mimeType === 'application/vnd.google-apps.spreadsheet' ||
              f.name.endsWith('.xlsx') ||
              f.name.endsWith('.xls')
          ) || null;
      }

      if (!targetFile) {
        return {
          success: false,
          message: `No se encontró el archivo "App_SST MG" en la carpeta "${TARGET_DRIVE_FOLDER.name}". Verifique los permisos de acceso a la carpeta.`,
          usersFound: 0,
          users: [],
        };
      }

      let parsedUsers: AppUser[] = [];
      let detectedSheetName = 'Usuario';

      // 3. Handle Google Sheets vs Excel File
      if (targetFile.mimeType === 'application/vnd.google-apps.spreadsheet') {
        // Read via Google Sheets API v4
        const metaRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${targetFile.id}?fields=sheets.properties`,
          {
            headers: { Authorization: `Bearer ${cachedAccessToken}` },
          }
        );

        if (!metaRes.ok) {
          throw new Error('No se pudo leer la estructura del archivo de Google Sheets.');
        }

        const metaData = await metaRes.json();
        const sheetsList: string[] = (metaData.sheets || []).map((s: any) => s.properties.title);

        // Find "Usuario" or "Usuarios"
        const matchedSheet =
          sheetsList.find((s) => s.toLowerCase().trim() === 'usuario') ||
          sheetsList.find((s) => s.toLowerCase().trim() === 'usuarios') ||
          sheetsList.find((s) => s.toLowerCase().includes('usuario')) ||
          sheetsList[0];

        detectedSheetName = matchedSheet || 'Usuario';

        // Read sheet data
        const valuesRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${targetFile.id}/values/${encodeURIComponent(detectedSheetName)}`,
          {
            headers: { Authorization: `Bearer ${cachedAccessToken}` },
          }
        );

        if (!valuesRes.ok) {
          throw new Error(`Error al leer los valores de la hoja "${detectedSheetName}".`);
        }

        const valuesData = await valuesRes.json();
        parsedUsers = this.parseUsersRows(valuesData.values || []);
      } else {
        // Download Excel binary and parse with XLSX
        const downloadRes = await fetch(
          `https://www.googleapis.com/drive/v3/files/${targetFile.id}?alt=media`,
          {
            headers: { Authorization: `Bearer ${cachedAccessToken}` },
          }
        );

        if (!downloadRes.ok) {
          throw new Error('Error al descargar el archivo Excel de Google Drive.');
        }

        const arrayBuffer = await downloadRes.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });

        const matchedSheet =
          workbook.SheetNames.find((s) => s.toLowerCase().trim() === 'usuario') ||
          workbook.SheetNames.find((s) => s.toLowerCase().trim() === 'usuarios') ||
          workbook.SheetNames.find((s) => s.toLowerCase().includes('usuario')) ||
          workbook.SheetNames[0];

        detectedSheetName = matchedSheet || 'Usuario';
        const worksheet = workbook.Sheets[detectedSheetName];
        const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        parsedUsers = this.parseUsersRows(rows);
      }

      if (parsedUsers.length === 0) {
        return {
          success: false,
          message: `El archivo "${targetFile.name}" en la hoja "${detectedSheetName}" no contiene registros válidos de usuarios.`,
          folderName: TARGET_DRIVE_FOLDER.name,
          fileName: targetFile.name,
          sheetName: detectedSheetName,
          usersFound: 0,
          users: [],
        };
      }

      // 4. Save and persist users to application state
      this.persistUsers(parsedUsers);

      // Audit log
      auditService.log(
        cachedGoogleUser?.email || 'admin@mgconsultores.com',
        cachedGoogleUser?.displayName || 'Google Drive Sync',
        'ACTUALIZAR_MAESTRO',
        'Usuarios Google Drive',
        targetFile.id,
        `Sincronización exitosa de ${parsedUsers.length} usuarios desde la hoja "${detectedSheetName}" del archivo "${targetFile.name}" en Google Drive`
      );

      return {
        success: true,
        message: `Sincronización exitosa: ${parsedUsers.length} usuarios importados desde la hoja "${detectedSheetName}" del archivo "${targetFile.name}".`,
        folderName: TARGET_DRIVE_FOLDER.name,
        fileName: targetFile.name,
        sheetName: detectedSheetName,
        usersFound: parsedUsers.length,
        users: parsedUsers,
      };
    } catch (err: any) {
      const isPopupClosed = err.code === 'auth/popup-closed-by-user' || String(err?.message || '').includes('auth/popup-closed-by-user');
      const isPopupBlocked = err.code === 'auth/popup-blocked' || String(err?.message || '').includes('popup-blocked');

      let userMsg = `Error al conectar con Google Drive: ${err.message || 'Error desconocido'}`;
      if (isPopupClosed) {
        userMsg = 'La ventana de autorización de Google fue cerrada. Puedes intentar de nuevo asegurándote de no cerrar la ventana emergente, o cargar el archivo Excel directamente.';
      } else if (isPopupBlocked) {
        userMsg = 'El navegador bloqueó la ventana emergente de Google. Por favor permite los pop-ups en la barra de direcciones o carga el archivo Excel directamente.';
      }

      return {
        success: false,
        message: userMsg,
        usersFound: 0,
        users: [],
        error: err.code || err.message,
      };
    }
  },

  /**
   * Parse users directly from an uploaded App_SST MG Excel file (.xlsx / .xls)
   */
  async syncUsersFromExcelFile(file: File): Promise<SyncUsersResult> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });

      const matchedSheet =
        workbook.SheetNames.find((s) => s.toLowerCase().trim() === 'usuario') ||
        workbook.SheetNames.find((s) => s.toLowerCase().trim() === 'usuarios') ||
        workbook.SheetNames.find((s) => s.toLowerCase().includes('usuario')) ||
        workbook.SheetNames[0];

      const detectedSheetName = matchedSheet || 'Usuario';
      const worksheet = workbook.Sheets[detectedSheetName];
      const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      const parsedUsers = this.parseUsersRows(rows);

      if (parsedUsers.length === 0) {
        return {
          success: false,
          message: `El archivo "${file.name}" en la hoja "${detectedSheetName}" no contiene registros válidos de usuarios.`,
          fileName: file.name,
          sheetName: detectedSheetName,
          usersFound: 0,
          users: [],
        };
      }

      this.persistUsers(parsedUsers);

      auditService.log(
        'admin@mgconsultores.com',
        'Carga Local Excel',
        'ACTUALIZAR_MAESTRO',
        'Usuarios Excel',
        file.name,
        `Carga exitosa de ${parsedUsers.length} usuarios desde la hoja "${detectedSheetName}" del archivo "${file.name}"`
      );

      return {
        success: true,
        message: `Sincronización exitosa: ${parsedUsers.length} usuarios importados de la hoja "${detectedSheetName}" del archivo "${file.name}".`,
        fileName: file.name,
        sheetName: detectedSheetName,
        usersFound: parsedUsers.length,
        users: parsedUsers,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Error al leer el archivo Excel: ${err.message}`,
        usersFound: 0,
        users: [],
        error: err.message,
      };
    }
  },

  /**
   * Helper to parse rows of spreadsheet into AppUser objects
   */
  parseUsersRows(rows: any[][]): AppUser[] {
    if (!rows || rows.length < 2) return [];

    const headers = rows[0].map((h) => String(h || '').trim().toLowerCase());

    // Locate column indices
    const emailIdx = headers.findIndex((h) => h.includes('email') || h.includes('correo') || h.includes('usuario'));
    const passIdx = headers.findIndex((h) => h.includes('contraseña') || h.includes('clave') || h.includes('password') || h.includes('pass'));
    const nameIdx = headers.findIndex((h) => h.includes('nombre') || h.includes('name') || h.includes('responsable'));
    const roleIdx = headers.findIndex((h) => h.includes('rol') || h.includes('role') || h.includes('perfil') || h.includes('tipo'));
    const siteIdx = headers.findIndex((h) => h.includes('sede') || h.includes('site') || h.includes('sucursal'));
    const cargoIdx = headers.findIndex((h) => h.includes('cargo') || h.includes('puesto') || h.includes('ocupacion'));

    const result: AppUser[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const rawEmail = String(row[emailIdx !== -1 ? emailIdx : 0] || '').trim();
      if (!rawEmail) continue;

      const rawPass = passIdx !== -1 ? String(row[passIdx] || '').trim() : '';
      const rawName = nameIdx !== -1 ? String(row[nameIdx] || '').trim() : '';
      const rawRole = roleIdx !== -1 ? String(row[roleIdx] || '').trim().toLowerCase() : '';
      const rawSite = siteIdx !== -1 ? String(row[siteIdx] || '').trim().toUpperCase() : '';
      const rawCargo = cargoIdx !== -1 ? String(row[cargoIdx] || '').trim() : '';

      // Normalize email (if only username provided like 'ha' or 'admin', append domain or keep as is)
      const email = rawEmail.includes('@') ? rawEmail : `${rawEmail}@mgconsultores.com`;
      const id = `usr-drive-${i}-${rawEmail.replace(/[^a-zA-Z0-9]/g, '')}`;

      // Detect role and site
      let role: Role = 'site_lead';
      let siteId = rawSite || 'MG-MG';

      if (
        rawRole.includes('admin') ||
        rawEmail.toLowerCase().includes('admin') ||
        rawEmail.toLowerCase().includes('excelencia') ||
        rawSite === 'TODAS' ||
        rawSite === 'ALL'
      ) {
        role = 'admin';
        siteId = 'TODAS';
      } else if (rawRole.includes('sst') || rawRole.includes('coordinador')) {
        role = 'sst_lead';
      } else if (rawRole.includes('consulta') || rawRole.includes('viewer') || rawRole.includes('lector')) {
        role = 'viewer';
      }

      // Clean site ID format (e.g. MG-MG, MG-HA, MG-SC, MG-JA, MG-ER)
      if (role !== 'admin') {
        if (siteId.includes('MG') && !siteId.startsWith('MG-')) {
          siteId = siteId.replace('MG', 'MG-');
        }
        if (!siteId.startsWith('MG-')) {
          siteId = `MG-${siteId}`;
        }
      }

      result.push({
        id,
        email,
        password: rawPass || rawEmail.split('@')[0], // Default password matches username
        name: rawName || `Usuario ${rawEmail.split('@')[0].toUpperCase()}`,
        role,
        siteId,
        cargo: rawCargo || (role === 'admin' ? 'Administrador SST' : `Supervisor SST ${siteId}`),
        activo: true,
      });
    }

    return result;
  },

  /**
   * Persist users list into local storage and trigger system update
   */
  persistUsers(users: AppUser[]) {
    if (!users || users.length === 0) return;

    // Merge with default admin to guarantee emergency login
    const adminExists = users.some((u) => u.role === 'admin');
    const finalUsers = adminExists ? users : [INITIAL_APP_USERS[0], ...users];

    localStorage.setItem('mg_sst_system_users', JSON.stringify(finalUsers));
    localStorage.setItem('mg_sst_drive_last_sync', new Date().toISOString());

    // Dispatch global event so AuthContext and other components refresh instantly
    window.dispatchEvent(new CustomEvent('mg-sst-users-updated', { detail: finalUsers }));
  },

  /**
   * Get last sync timestamp
   */
  getLastSyncTime(): string | null {
    return localStorage.getItem('mg_sst_drive_last_sync');
  },
};
