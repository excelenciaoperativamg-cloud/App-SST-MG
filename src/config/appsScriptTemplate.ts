/**
 * Plantilla oficial de Google Apps Script (.gs) para conectar automáticamente
 * la plataforma SG-SST MG Consultores con:
 * - Libro "Entrega Epp´s MG" (ID: 1LWD6Bg6wHavMIPBa_AlwOfxDPS2FZMs2J4Dbcbbx9k)
 * - Carpeta "App_SST MG.V2" (ID: 1LrtkMgzlxsTz9j_jX-bIATPK5CmF0DV7) y archivo "App_SST MG"
 */

export const APPS_SCRIPT_CODE = `// ============================================================================
// GOOGLE APPS SCRIPT - CONEXIÓN AUTOMÁTICA ENTREGA EPP'S MG & APP_SST MG.V2
// MG Consultores S.A.S. - Sistema SG-SST
// ============================================================================

const ENTREGA_EPP_SPREADSHEET_ID = '1LWD6Bg6wHavMIPBa_AlwOfxDPS2FZMs2J4Dbcbbx9k';
const DRIVE_FOLDER_ID = '1LrtkMgzlxsTz9j_jX-bIATPK5CmF0DV7';
const IMAGES_SUBFOLDER_NAME = 'Entrega Epps_Images';

/**
 * Obtiene el libro activo si el script está vinculado a Entrega Epp´s MG,
 * o lo abre por ID como respaldo.
 */
function getTargetSpreadsheet_() {
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;
  return SpreadsheetApp.openById(ENTREGA_EPP_SPREADSHEET_ID);
}

/**
 * Normaliza nombres de hojas ignorando tildes, apóstrofes distintos (' vs ´) y espacios
 */
function normalizeSheetName_(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[´'’\`]/g, '')
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '')
    .replace(/\\s+/g, ' ')
    .trim();
}

/**
 * Busca una hoja por lista de candidatos tolerando diferencias de apóstrofe o mayúsculas
 */
function findSheet_(ss, candidates) {
  const sheets = ss.getSheets();
  for (let c = 0; c < candidates.length; c++) {
    const exact = ss.getSheetByName(candidates[c]);
    if (exact) return exact;
  }
  const normalizedCandidates = candidates.map(normalizeSheetName_);
  for (let i = 0; i < sheets.length; i++) {
    const norm = normalizeSheetName_(sheets[i].getName());
    if (normalizedCandidates.indexOf(norm) !== -1) {
      return sheets[i];
    }
  }
  return null;
}

/**
 * Convierte un valor de fecha de Sheets a YYYY-MM-DD
 */
function formatDateISO_(val, tz) {
  if (!val) return '';
  if (val instanceof Date) {
    return Utilities.formatDate(val, tz || Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  const str = String(val).trim();
  // Si viene DD/MM/YYYY convertir a YYYY-MM-DD
  const dmy = str.match(/^(\\d{1,2})\\/(\\d{1,2})\\/(\\d{4})$/);
  if (dmy) {
    const dd = dmy[1].padStart(2, '0');
    const mm = dmy[2].padStart(2, '0');
    return dmy[3] + '-' + mm + '-' + dd;
  }
  return str;
}

/**
 * Convierte YYYY-MM-DD a DD/MM/YYYY para guardar en Google Sheets
 */
function formatDateSheets_(fechaStr) {
  if (!fechaStr) return '';
  const str = String(fechaStr).trim();
  const ymd = str.match(/^(\\d{4})-(\\d{2})-(\\d{2})$/);
  if (ymd) {
    return ymd[3] + '/' + ymd[2] + '/' + ymd[1];
  }
  return str;
}

/**
 * Busca la carpeta de imágenes o la crea dentro de App_SST MG.V2
 */
function getOrCreateImagesFolder_() {
  const parent = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  const folders = parent.getFoldersByName(IMAGES_SUBFOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }
  return parent.createFolder(IMAGES_SUBFOLDER_NAME);
}

/**
 * Guarda imagen Base64 en Google Drive y retorna ruta relativa compatible con AppSheet/Sheets
 */
function saveBase64ImageToDrive_(dataUrl, fileName) {
  if (!dataUrl || typeof dataUrl !== 'string') return '';
  if (!dataUrl.startsWith('data:image')) return dataUrl; // Ya es ruta o URL

  try {
    const parts = dataUrl.split(',');
    const meta = parts[0] || '';
    const base64Data = parts[1];
    if (!base64Data) return '';

    const mimeMatch = meta.match(/data:(image\\/[a-zA-Z0-9.+-]+);base64/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bytes = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(bytes, mimeType, fileName);

    const folder = getOrCreateImagesFolder_();
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return IMAGES_SUBFOLDER_NAME + '/' + file.getName();
  } catch (err) {
    return 'Imagen adjunta (Drive)';
  }
}

/**
 * Lee columna simple de catálogos (Labores, Area, Tipo_Entrega)
 */
function readSingleColumnCatalog_(ss, sheetCandidates) {
  const sheet = findSheet_(ss, sheetCandidates);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
  const list = [];
  for (let i = 0; i < values.length; i++) {
    const v = String(values[i][0] || '').trim();
    if (v && list.indexOf(v) === -1) {
      list.push(v);
    }
  }
  return list;
}

/**
 * Lee el catálogo de la hoja Epp´s (Código Epp, Epp, Costo)
 */
function readEppsCatalog_(ss) {
  const sheet = findSheet_(ss, ["Epp´s", "Epp's", "Epps", "EPP"]);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(function (h) { return normalizeSheetName_(h); });

  let codeIdx = headers.findIndex(function (h) { return h.indexOf('codigo') !== -1; });
  let nameIdx = headers.findIndex(function (h) { return h === 'epp' || h.indexOf('descripcion') !== -1 || h.indexOf('nombre') !== -1; });
  let costIdx = headers.findIndex(function (h) { return h.indexOf('costo') !== -1 || h.indexOf('precio') !== -1 || h.indexOf('valor') !== -1; });
  let catIdx = headers.findIndex(function (h) { return h.indexOf('categoria') !== -1; });

  if (codeIdx === -1) codeIdx = 0;
  if (nameIdx === -1) nameIdx = 1;
  if (costIdx === -1) costIdx = 2;

  const result = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const codigoEpp = String(row[codeIdx] || '').trim();
    const epp = String(row[nameIdx] || '').trim();
    if (!codigoEpp && !epp) continue;
    const rawCost = String(row[costIdx] || '0').replace(/[^0-9.-]/g, '');
    result.push({
      codigoEpp: codigoEpp,
      epp: epp,
      costo: Math.round(Number(rawCost) || 0),
      categoria: catIdx !== -1 ? String(row[catIdx] || 'EPP') : 'EPP',
    });
  }
  return result;
}

/**
 * Lee los registros de entregas de la hoja Entrega Epp´s
 */
function readDeliveries_(ss) {
  const tz = ss.getSpreadsheetTimeZone();
  const sheet = findSheet_(ss, ["Entrega Epp´s", "Entrega Epp's", "Entrega Epps", "Entrega Epp´s MG"]);
  if (!sheet || sheet.getLastRow() < 2) return [];

  const lastRow = sheet.getLastRow();
  const numCols = Math.max(sheet.getLastColumn(), 19);
  const data = sheet.getRange(2, 1, lastRow - 1, numCols).getValues();
  const records = [];

  for (let i = 0; i < data.length; i++) {
    const r = data[i];
    const idEpp = String(r[0] || '').trim();
    const nombre = String(r[6] || '').trim();
    const cedula = String(r[5] || '').trim();
    if (!idEpp && !nombre && !cedula) continue;

    const rawCosto = String(r[13] || '0').replace(/[^0-9.-]/g, '');
    const fechaISO = formatDateISO_(r[1], tz);

    records.push({
      id: 'drive-epp-' + (idEpp || (i + 2)),
      Id_Epp: idEpp || ('EPP-' + (i + 2)),
      Fecha: fechaISO,
      Año: Number(r[2]) || (fechaISO ? Number(fechaISO.split('-')[0]) : new Date().getFullYear()),
      Mes: r[3] || (fechaISO ? Number(fechaISO.split('-')[1]) : 1),
      Sede: String(r[4] || 'MG-HA').trim(),
      Cédula: cedula,
      Nombre: nombre,
      Labor: String(r[7] || '').trim(),
      Area: String(r[8] || '').trim(),
      Supervisor: String(r[9] || '').trim(),
      Código_Epp: String(r[10] || '').split(' - ')[0].trim(),
      Epp: String(r[11] || '').trim(),
      Tipo_Entrega: String(r[12] || 'REPOSICIÓN').trim(),
      Costo: Math.round(Number(rawCosto) || 0),
      Estado: String(r[14] || 'Entregado y Firmado').trim(),
      Foto_Entrega: r[15] ? String(r[15]).trim() : '',
      Firma_Trabajador: r[16] ? String(r[16]).trim() : '',
      Responsable_SST: String(r[17] || 'Supervisor SST').trim(),
      Firma_SST: r[18] ? String(r[18]).trim() : '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'Google Drive (Apps Script)',
    });
  }

  return records.reverse(); // Más recientes primero
}

/**
 * Busca el archivo "App_SST MG" en la carpeta App_SST MG.V2 para leer Maestro y Usuario
 */
function readAppSstMgData_() {
  const output = { maestro: [], usuarios: [] };
  try {
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const files = folder.getFiles();
    let appSstId = null;

    while (files.hasNext()) {
      const f = files.next();
      const name = f.getName().toLowerCase();
      if (
        (name.indexOf('app_sst mg') !== -1 || name.indexOf('app_sst') !== -1) &&
        f.getMimeType() === MimeType.GOOGLE_SHEETS
      ) {
        appSstId = f.getId();
        break;
      }
    }

    if (!appSstId) return output;

    const ss = SpreadsheetApp.openById(appSstId);

    // 1. Leer hoja Maestro
    const maestroSheet = findSheet_(ss, ['Maestro', 'Personal', 'Trabajadores']);
    if (maestroSheet && maestroSheet.getLastRow() >= 2) {
      const mData = maestroSheet.getDataRange().getValues();
      const mHeaders = mData[0].map(normalizeSheetName_);
      const idxCed = mHeaders.findIndex(function (h) { return h.indexOf('cedula') !== -1 || h.indexOf('documento') !== -1 || h.indexOf('identificacion') !== -1; });
      const idxNom = mHeaders.findIndex(function (h) { return h.indexOf('nombre') !== -1; });
      const idxSede = mHeaders.findIndex(function (h) { return h.indexOf('sede') !== -1; });
      const idxCargo = mHeaders.findIndex(function (h) { return h.indexOf('labor') !== -1 || h.indexOf('cargo') !== -1 || h.indexOf('puesto') !== -1; });
      const idxArea = mHeaders.findIndex(function (h) { return h.indexOf('area') !== -1; });
      const idxSup = mHeaders.findIndex(function (h) { return h.indexOf('supervisor') !== -1; });
      const idxEst = mHeaders.findIndex(function (h) { return h.indexOf('estado') !== -1; });

      for (let i = 1; i < mData.length; i++) {
        const row = mData[i];
        const cedula = String(row[idxCed !== -1 ? idxCed : 0] || '').trim();
        const nombre = String(row[idxNom !== -1 ? idxNom : 1] || '').trim();
        if (!cedula || !nombre) continue;

        output.maestro.push({
          id: cedula,
          cedula: cedula,
          nombre: nombre,
          sedeId: idxSede !== -1 ? String(row[idxSede] || 'MG-HA').trim() : 'MG-HA',
          puesto: idxCargo !== -1 ? String(row[idxCargo] || '').trim() : '',
          area: idxArea !== -1 ? String(row[idxArea] || '').trim() : '',
          supervisor: idxSup !== -1 ? String(row[idxSup] || '').trim() : '',
          estado: idxEst !== -1 && String(row[idxEst]).toUpperCase().indexOf('INACTIVO') !== -1 ? 'INACTIVO' : 'ACTIVO',
          fechaNacimiento: '',
          edad: 0,
          genero: 'M',
          fechaIngreso: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // 2. Leer hoja Usuario / Usuarios
    const userSheet = findSheet_(ss, ['Usuario', 'Usuarios']);
    if (userSheet && userSheet.getLastRow() >= 2) {
      const uData = userSheet.getDataRange().getValues();
      const uHeaders = uData[0].map(normalizeSheetName_);
      output.usuarios = uData.slice(1).map(function (row) {
        const obj = {};
        uHeaders.forEach(function (h, idx) {
          obj[h] = String(row[idx] || '').trim();
        });
        return obj;
      });
    }
  } catch (err) {
    // Silencioso si no tiene permisos sobre App_SST MG aún
  }
  return output;
}

/**
 * Endpoint GET - Sincronización automática de catálogos y registros
 */
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'getAll';
    const ss = getTargetSpreadsheet_();

    if (action === 'ping') {
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        app: 'Entrega Epp´s MG - SG-SST',
        spreadsheetName: ss.getName(),
        sheets: ss.getSheets().map(function (s) { return s.getName(); }),
        timestamp: new Date().toISOString(),
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const deliveries = readDeliveries_(ss);
    const epps = readEppsCatalog_(ss);
    const labores = readSingleColumnCatalog_(ss, ['Labores', 'Labor']);
    const areas = readSingleColumnCatalog_(ss, ['Area', 'Areas', 'Área']);
    const tiposEntrega = readSingleColumnCatalog_(ss, ['Tipo_Entrega', 'Tipo Entrega', 'Tipos']);
    const appSstData = readAppSstMgData_();

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      spreadsheetName: ss.getName(),
      deliveries: deliveries,
      epps: epps,
      labores: labores,
      areas: areas,
      tiposEntrega: tiposEntrega,
      maestro: appSstData.maestro,
      usuarios: appSstData.usuarios,
      timestamp: new Date().toISOString(),
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: err.message || String(err),
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Endpoint POST - Guardar o actualizar automáticamente registros en Entrega Epp´s MG
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) ? e.postData.contents : '{}');
    const action = body.action || 'appendEntregaEPP';
    const ss = getTargetSpreadsheet_();
    const sheet = findSheet_(ss, ["Entrega Epp´s", "Entrega Epp's", "Entrega Epps", "Entrega Epp´s MG"]);
    if (!sheet) {
      throw new Error('No se encontró la hoja "Entrega Epp´s" en el libro.');
    }

    if (action === 'deleteEntregaEPP') {
      const targetId = String(body.idEpp || (body.record && body.record.Id_Epp) || '').trim();
      if (!targetId) {
        throw new Error('Falta Id_Epp para eliminar el registro.');
      }
      const lastRow = sheet.getLastRow();
      let deletedRow = -1;
      if (lastRow >= 2) {
        const existingIds = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (let i = 0; i < existingIds.length; i++) {
          if (String(existingIds[i][0]).trim() === targetId) {
            deletedRow = i + 2;
            sheet.deleteRow(deletedRow);
            break;
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        deleted: deletedRow !== -1,
        idEpp: targetId,
        row: deletedRow,
        sheetName: sheet.getName(),
        message: deletedRow !== -1
          ? 'Registro ' + targetId + ' eliminado de "' + sheet.getName() + '".'
          : 'El registro ' + targetId + ' ya no estaba en la hoja.',
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const record = body.record || body;

    if (!record || !record.Cédula || !record.Nombre) {
      throw new Error('Faltan campos obligatorios (Cédula o Nombre) para guardar el registro.');
    }

    const idEpp = String(record.Id_Epp || ('EPP-' + Date.now())).trim();
    const fechaFormateada = formatDateSheets_(record.Fecha);
    const cleanCedula = String(record.Cédula || '').trim();
    const cleanNombre = String(record.Nombre || '').trim();
    const cleanCodigoEpp = String(record.Código_Epp || '').split(' - ')[0].trim();
    const cleanEpp = String(record.Epp || '').trim();

    // Guardar imagen de evidencia en Drive si viene en Base64
    const stamp = Utilities.formatDate(new Date(), ss.getSpreadsheetTimeZone(), 'dd-MM-yyyy-HHmmss');
    let fotoVal = record.Foto_Entrega || '';
    if (fotoVal && fotoVal.startsWith('data:image')) {
      fotoVal = saveBase64ImageToDrive_(fotoVal, stamp + '_' + cleanCedula + '_FOTO_ENTREGA.jpg');
    }

    let firmaTrabVal = record.Firma_Trabajador || '';
    if (firmaTrabVal && firmaTrabVal.startsWith('data:image')) {
      firmaTrabVal = saveBase64ImageToDrive_(firmaTrabVal, stamp + '_' + cleanCedula + '_FIRMA_TRAB.png');
    }

    let firmaSstVal = record.Firma_SST || '';
    if (firmaSstVal && firmaSstVal.startsWith('data:image')) {
      firmaSstVal = saveBase64ImageToDrive_(firmaSstVal, stamp + '_' + cleanCedula + '_FIRMA_SST.png');
    }

    const rowValues = [
      idEpp,
      fechaFormateada,
      Number(record.Año) || new Date().getFullYear(),
      Number(record.Mes) || (new Date().getMonth() + 1),
      String(record.Sede || 'MG-HA').trim(),
      cleanCedula,
      cleanNombre,
      String(record.Labor || '').trim(),
      String(record.Area || '').trim(),
      String(record.Supervisor || '').trim(),
      cleanCodigoEpp,
      cleanEpp,
      String(record.Tipo_Entrega || 'REPOSICIÓN').trim(),
      Number(record.Costo) || 0,
      String(record.Estado || 'Entregado y Firmado').trim(),
      fotoVal,
      firmaTrabVal || 'Pendiente',
      String(record.Responsable_SST || 'Supervisor SST').trim(),
      firmaSstVal || 'Pendiente',
    ];

    // Verificar si ya existe el Id_Epp para actualizar en lugar de duplicar
    let targetRow = -1;
    const lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      const existingIds = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (let i = 0; i < existingIds.length; i++) {
        if (String(existingIds[i][0]).trim() === idEpp) {
          targetRow = i + 2;
          break;
        }
      }
    }

    if (targetRow !== -1) {
      sheet.getRange(targetRow, 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
      targetRow = sheet.getLastRow();
    }

    // Aplicar formato moneda en columna Costo (N = columna 14)
    sheet.getRange(targetRow, 14).setNumberFormat('$#,##0');

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      idEpp: idEpp,
      row: targetRow,
      sheetName: sheet.getName(),
      message: 'Registro ' + idEpp + ' guardado automáticamente en "' + sheet.getName() + '".',
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: err.message || String(err),
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
`;
