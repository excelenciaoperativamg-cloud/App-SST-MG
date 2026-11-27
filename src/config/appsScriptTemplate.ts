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
 * Obtiene o busca el libro principal "App_SST MG" en la carpeta App_SST MG.V2
 */
function getAppSstSpreadsheet_() {
  try {
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const files = folder.getFiles();
    while (files.hasNext()) {
      const f = files.next();
      const name = f.getName().toLowerCase();
      if (
        (name.indexOf('app_sst mg') !== -1 || name.indexOf('app_sst') !== -1) &&
        f.getMimeType() === MimeType.GOOGLE_SHEETS
      ) {
        return SpreadsheetApp.openById(f.getId());
      }
    }
  } catch (err) {
    // Fallback al libro objetivo
  }
  return getTargetSpreadsheet_();
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
      let idxCargo = mHeaders.findIndex(function (h) { return h === 'cargo' || h.indexOf('cargo') !== -1; });
      let idxPuesto = mHeaders.findIndex(function (h) { return h === 'puesto' || h === 'labor' || h.indexOf('puesto') !== -1 || h.indexOf('labor') !== -1; });
      if (idxCargo === -1) idxCargo = idxPuesto;
      if (idxPuesto === -1) idxPuesto = idxCargo;
      const idxArea = mHeaders.findIndex(function (h) { return h.indexOf('area') !== -1; });
      const idxSup = mHeaders.findIndex(function (h) { return h.indexOf('supervisor') !== -1; });
      const idxEst = mHeaders.findIndex(function (h) { return h.indexOf('estado') !== -1; });

      for (let i = 1; i < mData.length; i++) {
        const row = mData[i];
        const cedula = String(row[idxCed !== -1 ? idxCed : 0] || '').trim();
        const nombre = String(row[idxNom !== -1 ? idxNom : 1] || '').trim();
        if (!cedula || !nombre) continue;

        const cargoVal = idxCargo !== -1 ? String(row[idxCargo] || '').trim() : '';
        const puestoVal = idxPuesto !== -1 ? String(row[idxPuesto] || '').trim() : cargoVal;

        output.maestro.push({
          id: cedula,
          cedula: cedula,
          nombre: nombre,
          sedeId: idxSede !== -1 ? String(row[idxSede] || 'MG-HA').trim() : 'MG-HA',
          puesto: puestoVal || cargoVal,
          cargo: cargoVal || puestoVal,
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
 * Busca el libro "Inspección Emergencias" por ID o en la carpeta App_SST MG.V2
 */
function getEmergencySpreadsheet_(customId) {
  if (customId) {
    return SpreadsheetApp.openById(String(customId).trim());
  }
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active && normalizeSheetName_(active.getName()).indexOf('emergencia') !== -1) {
    return active;
  }
  const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  const files = folder.getFiles();
  while (files.hasNext()) {
    const f = files.next();
    if (f.getMimeType() === MimeType.GOOGLE_SHEETS) {
      const normName = normalizeSheetName_(f.getName());
      if (normName.indexOf('emergencia') !== -1) {
        return SpreadsheetApp.openById(f.getId());
      }
    }
  }
  throw new Error('No se encontró el archivo "Inspección Emergencias" en la carpeta App_SST MG.V2. Indica el ID del archivo en la configuración.');
}

function isExcludedEmergencySheet_(name) {
  const norm = normalizeSheetName_(name).replace(/[^a-z0-9]+/g, ' ').trim();
  const excluded = [
    'tipo extintor',
    'tipos extintor',
    'datos extintores',
    'datos extintor',
    'datos kit',
    'estado ie',
    'estados ie',
    'responsables sst',
    'responsable sst',
  ];
  return excluded.indexOf(norm) !== -1;
}

function readEmergencyWorkbook_(ss) {
  const tz = ss.getSpreadsheetTimeZone();
  const sheets = ss.getSheets();
  const result = [];

  for (let s = 0; s < sheets.length; s++) {
    const sheet = sheets[s];
    if (isExcludedEmergencySheet_(sheet.getName())) continue;
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow < 1 || lastCol < 1) continue;

    const rawHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    const headers = [];
    for (let c = 0; c < rawHeaders.length; c++) {
      const h = String(rawHeaders[c] || '').trim();
      if (h) headers.push({ name: h, colIdx: c });
    }
    if (headers.length === 0) continue;

    const headerNames = headers.map(function (h) { return h.name; });
    const rows = [];
    const suggestionsMap = {};
    headerNames.forEach(function (hn) { suggestionsMap[hn] = {}; });

    if (lastRow >= 2) {
      const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
      for (let r = 0; r < data.length; r++) {
        const rowArr = data[r];
        let hasAny = false;
        const valuesObj = {};

        for (let hIdx = 0; hIdx < headers.length; hIdx++) {
          const hInfo = headers[hIdx];
          const cellVal = rowArr[hInfo.colIdx];
          let strVal = '';
          if (cellVal instanceof Date) {
            strVal = formatDateISO_(cellVal, tz);
          } else if (cellVal !== null && cellVal !== undefined) {
            strVal = String(cellVal).trim();
            // Convert DD/MM/YYYY to YYYY-MM-DD when header looks like date
            if (normalizeSheetName_(hInfo.name).indexOf('fecha') !== -1) {
              strVal = formatDateISO_(strVal, tz);
            }
          }
          if (strVal !== '') hasAny = true;
          valuesObj[hInfo.name] = strVal;

          if (strVal && !strVal.startsWith('data:image') && strVal.length <= 60) {
            suggestionsMap[hInfo.name][strVal] = true;
          }
        }

        if (!hasAny) continue;
        const firstColVal = valuesObj[headerNames[0]] || ('ROW-' + (r + 2));
        rows.push({
          rowNumber: r + 2,
          rowId: String(firstColVal),
          values: valuesObj,
        });
      }
    }

    const suggestions = {};
    headerNames.forEach(function (hn) {
      const keys = Object.keys(suggestionsMap[hn]);
      if (keys.length > 0 && keys.length <= 40) {
        suggestions[hn] = keys.sort();
      }
    });

    result.push({
      sheetName: sheet.getName(),
      headers: headerNames,
      rows: rows.reverse(),
      suggestions: suggestions,
    });
  }

  return result;
}

const SST_RECORDS_HEADERS = [
  'Id',
  'NumeroRegistro',
  'MenuId',
  'SubMenuId',
  'Modulo',
  'Submodulo',
  'Fecha',
  'Sede',
  'Area',
  'Supervisor',
  'CedulaTrabajador',
  'NombreTrabajador',
  'PuestoTrabajador',
  'ResponsableRegistro',
  'ResponsableEmail',
  'Estado',
  'Observaciones',
  'Hallazgos',
  'AccionesPropuestas',
  'Evidencias',
  'CreatedAt',
  'UpdatedAt',
  'CreatedBy',
];

function getOrCreateSSTRecordsSheet_(ss, createIfMissing) {
  let sheet = findSheet_(ss, ['Registros_SST', 'Registros SST', 'SST_Registros']);
  if (!sheet && createIfMissing) {
    sheet = ss.insertSheet('Registros_SST');
    sheet.getRange(1, 1, 1, SST_RECORDS_HEADERS.length).setValues([SST_RECORDS_HEADERS]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function readSSTRecords_(ss) {
  const tz = ss.getSpreadsheetTimeZone();
  const sheet = getOrCreateSSTRecordsSheet_(ss, false);
  if (!sheet || sheet.getLastRow() < 2) return [];

  const lastRow = sheet.getLastRow();
  const numCols = Math.max(sheet.getLastColumn(), SST_RECORDS_HEADERS.length);
  const data = sheet.getRange(2, 1, lastRow - 1, numCols).getValues();
  const records = [];

  for (let i = 0; i < data.length; i++) {
    const r = data[i];
    const id = String(r[0] || '').trim();
    const menuId = String(r[2] || '').trim();
    const subMenuId = String(r[3] || '').trim();
    if (!id && !menuId) continue;

    let evidencias = [];
    const rawEv = String(r[19] || '').trim();
    if (rawEv) {
      try {
        const parsedEv = JSON.parse(rawEv);
        if (Array.isArray(parsedEv)) evidencias = parsedEv;
      } catch (err) {
        evidencias = rawEv.split(',').map(function (item, idx) {
          const cleanItem = item.trim();
          return {
            id: 'ev-drive-' + i + '-' + idx,
            nombre: cleanItem.split('/').pop() || 'Evidencia',
            url: cleanItem,
            tipo: 'image/jpeg',
            fecha: formatDateISO_(r[6], tz),
          };
        }).filter(function (ev) { return Boolean(ev.url); });
      }
    }

    records.push({
      id: id || ('rec-drive-' + (i + 2)),
      numeroRegistro: String(r[1] || ('SST-' + (i + 2))).trim(),
      menuId: menuId,
      subMenuId: subMenuId,
      moduloNombre: String(r[4] || '').trim(),
      subModuloNombre: String(r[5] || '').trim(),
      fecha: formatDateISO_(r[6], tz),
      sedeId: String(r[7] || 'MG-MG').trim(),
      area: String(r[8] || '').trim(),
      supervisor: String(r[9] || '').trim() || undefined,
      cedulaTrabajador: String(r[10] || '').trim() || undefined,
      nombreTrabajador: String(r[11] || '').trim() || undefined,
      puestoTrabajador: String(r[12] || '').trim() || undefined,
      responsableRegistro: String(r[13] || 'Responsable SST').trim(),
      responsableEmail: String(r[14] || 'sst@mgconsultores.com').trim(),
      estado: String(r[15] || 'EN_PROCESO').trim(),
      observaciones: String(r[16] || '').trim(),
      hallazgos: String(r[17] || '').trim() || undefined,
      accionesPropuestas: String(r[18] || '').trim() || undefined,
      evidencias: evidencias,
      createdAt: String(r[20] || new Date().toISOString()).trim(),
      updatedAt: String(r[21] || new Date().toISOString()).trim(),
      createdBy: String(r[22] || 'Google Drive').trim(),
    });
  }

  return records.reverse();
}

/**
 * Endpoint GET - Sincronización automática de catálogos y registros de todos los formularios
 */
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'getAll';

    if (action === 'getEmergencySheets') {
      const customId = (e && e.parameter && e.parameter.spreadsheetId) ? e.parameter.spreadsheetId : '';
      const emSs = getEmergencySpreadsheet_(customId);
      const emSheets = readEmergencyWorkbook_(emSs);
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        spreadsheetId: emSs.getId(),
        spreadsheetName: emSs.getName(),
        sheets: emSheets,
        timestamp: new Date().toISOString(),
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'getSSTRecords') {
      const appSs = getAppSstSpreadsheet_();
      const sstRecords = readSSTRecords_(appSs);
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        spreadsheetId: appSs.getId(),
        spreadsheetName: appSs.getName(),
        records: sstRecords,
        timestamp: new Date().toISOString(),
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const ss = getTargetSpreadsheet_();

    if (action === 'ping') {
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        app: 'SG-SST MG Consultores - Conexión Unificada',
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
    let sstRecords = [];
    try {
      sstRecords = readSSTRecords_(getAppSstSpreadsheet_());
    } catch (err) {
      sstRecords = [];
    }

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
      sstRecords: sstRecords,
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

    if (action === 'appendEmergencyRow' || action === 'deleteEmergencyRow') {
      const emSs = getEmergencySpreadsheet_(body.spreadsheetId || '');
      const targetSheet = findSheet_(emSs, [body.sheetName]);
      if (!targetSheet) {
        throw new Error('No se encontró la hoja "' + (body.sheetName || '') + '" en Inspección Emergencias.');
      }

      if (action === 'deleteEmergencyRow') {
        const targetRowId = String(body.rowId || '').trim();
        let deletedRow = -1;
        const lastRowEm = targetSheet.getLastRow();
        if (body.rowNumber && Number(body.rowNumber) >= 2 && Number(body.rowNumber) <= lastRowEm) {
          const cellVal = String(targetSheet.getRange(Number(body.rowNumber), 1).getValue() || '').trim();
          if (!targetRowId || cellVal === targetRowId) {
            deletedRow = Number(body.rowNumber);
          }
        }
        if (deletedRow === -1 && targetRowId && lastRowEm >= 2) {
          const ids = targetSheet.getRange(2, 1, lastRowEm - 1, 1).getValues();
          for (let i = 0; i < ids.length; i++) {
            if (String(ids[i][0] || '').trim() === targetRowId) {
              deletedRow = i + 2;
              break;
            }
          }
        }
        if (deletedRow !== -1) {
          targetSheet.deleteRow(deletedRow);
        }
        return ContentService.createTextOutput(JSON.stringify({
          success: true,
          deleted: deletedRow !== -1,
          row: deletedRow,
          sheetName: targetSheet.getName(),
          message: deletedRow !== -1
            ? 'Registro eliminado de la hoja "' + targetSheet.getName() + '".'
            : 'No se encontró el registro en "' + targetSheet.getName() + '".',
        })).setMimeType(ContentService.MimeType.JSON);
      }

      // appendEmergencyRow
      const lastColEm = Math.max(targetSheet.getLastColumn(), 1);
      const rawHeaders = targetSheet.getRange(1, 1, 1, lastColEm).getValues()[0];
      const valuesObj = body.values || {};
      const stampEm = Utilities.formatDate(new Date(), emSs.getSpreadsheetTimeZone(), 'dd-MM-yyyy-HHmmss');
      const rowArray = [];

      for (let c = 0; c < rawHeaders.length; c++) {
        const header = String(rawHeaders[c] || '').trim();
        if (!header) {
          rowArray.push('');
          continue;
        }
        let val = valuesObj[header] !== undefined ? valuesObj[header] : '';
        const normH = normalizeSheetName_(header);

        if (typeof val === 'string' && val.startsWith('data:image')) {
          const safeSheet = normalizeSheetName_(targetSheet.getName()).replace(/[^a-z0-9]/g, '_');
          const safeCol = normH.replace(/[^a-z0-9]/g, '_');
          val = saveBase64ImageToDrive_(val, stampEm + '_' + safeSheet + '_' + safeCol + '.jpg');
        } else if (normH.indexOf('fecha') !== -1 && typeof val === 'string') {
          val = formatDateSheets_(val);
        }
        rowArray.push(val);
      }

      let updateRow = -1;
      const lastRowEm = targetSheet.getLastRow();
      const rowIdVal = String(body.rowId || (rawHeaders[0] ? valuesObj[String(rawHeaders[0]).trim()] : '') || '').trim();
      if (body.rowNumber && Number(body.rowNumber) >= 2 && Number(body.rowNumber) <= lastRowEm) {
        updateRow = Number(body.rowNumber);
      } else if (rowIdVal && lastRowEm >= 2) {
        const existingIds = targetSheet.getRange(2, 1, lastRowEm - 1, 1).getValues();
        for (let i = 0; i < existingIds.length; i++) {
          if (String(existingIds[i][0] || '').trim() === rowIdVal) {
            updateRow = i + 2;
            break;
          }
        }
      }

      if (updateRow !== -1) {
        targetSheet.getRange(updateRow, 1, 1, rowArray.length).setValues([rowArray]);
      } else {
        targetSheet.appendRow(rowArray);
        updateRow = targetSheet.getLastRow();
      }

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        row: updateRow,
        rowId: rowIdVal,
        sheetName: targetSheet.getName(),
        message: 'Registro guardado en la hoja "' + targetSheet.getName() + '" (Inspección Emergencias).',
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'appendSSTRecord' || action === 'deleteSSTRecord') {
      const appSs = getAppSstSpreadsheet_();
      const recSheet = getOrCreateSSTRecordsSheet_(appSs, action === 'appendSSTRecord');

      if (action === 'deleteSSTRecord') {
        if (!recSheet) {
          return ContentService.createTextOutput(JSON.stringify({
            success: true,
            deleted: false,
            message: 'No existe hoja Registros_SST en Drive aún.',
          })).setMimeType(ContentService.MimeType.JSON);
        }
        const targetId = String(body.id || '').trim();
        const targetNum = String(body.numeroRegistro || '').trim();
        let deletedRow = -1;
        const lastRowSst = recSheet.getLastRow();
        if (lastRowSst >= 2) {
          const ids = recSheet.getRange(2, 1, lastRowSst - 1, 2).getValues();
          for (let i = 0; i < ids.length; i++) {
            const cId = String(ids[i][0] || '').trim();
            const cNum = String(ids[i][1] || '').trim();
            if ((targetId && cId === targetId) || (targetNum && cNum === targetNum)) {
              deletedRow = i + 2;
              recSheet.deleteRow(deletedRow);
              break;
            }
          }
        }
        return ContentService.createTextOutput(JSON.stringify({
          success: true,
          deleted: deletedRow !== -1,
          row: deletedRow,
          sheetName: recSheet.getName(),
          message: deletedRow !== -1
            ? 'Registro eliminado de "' + recSheet.getName() + '" en Drive.'
            : 'El registro ya no estaba en Drive.',
        })).setMimeType(ContentService.MimeType.JSON);
      }

      const rec = body.record || body;
      if (!rec || !rec.menuId) {
        throw new Error('Faltan datos del registro SST para guardar en Drive.');
      }

      const stampSst = Utilities.formatDate(new Date(), appSs.getSpreadsheetTimeZone(), 'dd-MM-yyyy-HHmmss');
      const rawEvList = Array.isArray(rec.evidencias) ? rec.evidencias : [];
      const savedEvList = rawEvList.map(function (ev, idx) {
        let evUrl = ev && ev.url ? String(ev.url) : '';
        if (evUrl.startsWith('data:image')) {
          const safeMod = normalizeSheetName_(rec.subModuloNombre || rec.moduloNombre || 'sst').replace(/[^a-z0-9]/g, '_');
          evUrl = saveBase64ImageToDrive_(evUrl, stampSst + '_' + safeMod + '_' + idx + '.jpg');
        }
        return {
          id: (ev && ev.id) || ('ev-' + idx),
          nombre: (ev && ev.nombre) || ('Evidencia_' + (idx + 1)),
          url: evUrl,
          tipo: (ev && ev.tipo) || 'image/jpeg',
          tamanoKb: (ev && ev.tamanoKb) || undefined,
          fecha: (ev && ev.fecha) || rec.fecha,
        };
      });

      const recRow = [
        String(rec.id || ('rec-' + Date.now())).trim(),
        String(rec.numeroRegistro || '').trim(),
        String(rec.menuId || '').trim(),
        String(rec.subMenuId || '').trim(),
        String(rec.moduloNombre || '').trim(),
        String(rec.subModuloNombre || '').trim(),
        formatDateSheets_(rec.fecha),
        String(rec.sedeId || 'MG-MG').trim(),
        String(rec.area || '').trim(),
        String(rec.supervisor || '').trim(),
        String(rec.cedulaTrabajador || '').trim(),
        String(rec.nombreTrabajador || '').trim(),
        String(rec.puestoTrabajador || '').trim(),
        String(rec.responsableRegistro || '').trim(),
        String(rec.responsableEmail || '').trim(),
        String(rec.estado || 'EN_PROCESO').trim(),
        String(rec.observaciones || '').trim(),
        String(rec.hallazgos || '').trim(),
        String(rec.accionesPropuestas || '').trim(),
        savedEvList.length > 0 ? JSON.stringify(savedEvList) : '',
        String(rec.createdAt || new Date().toISOString()).trim(),
        String(rec.updatedAt || new Date().toISOString()).trim(),
        String(rec.createdBy || '').trim(),
      ];

      let targetSstRow = -1;
      const lastRowSst = recSheet.getLastRow();
      if (lastRowSst >= 2) {
        const existing = recSheet.getRange(2, 1, lastRowSst - 1, 2).getValues();
        for (let i = 0; i < existing.length; i++) {
          const cId = String(existing[i][0] || '').trim();
          const cNum = String(existing[i][1] || '').trim();
          if ((recRow[0] && cId === recRow[0]) || (recRow[1] && cNum === recRow[1])) {
            targetSstRow = i + 2;
            break;
          }
        }
      }

      if (targetSstRow !== -1) {
        recSheet.getRange(targetSstRow, 1, 1, recRow.length).setValues([recRow]);
      } else {
        recSheet.appendRow(recRow);
        targetSstRow = recSheet.getLastRow();
      }

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        row: targetSstRow,
        id: recRow[0],
        sheetName: recSheet.getName(),
        message: 'Registro guardado automáticamente en "' + recSheet.getName() + '" (' + appSs.getName() + ').',
      })).setMimeType(ContentService.MimeType.JSON);
    }

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

export const EMERGENCY_APPS_SCRIPT_CODE = `// ============================================================================
// GOOGLE APPS SCRIPT - CONEXIÓN AUTOMÁTICA INSPECCIÓN EMERGENCIAS
// MG Consultores S.A.S. - Sistema SG-SST
// Pégalo en Extensiones -> Apps Script dentro del archivo "Inspección Emergencias"
// ============================================================================

const DRIVE_FOLDER_ID = '1LrtkMgzlxsTz9j_jX-bIATPK5CmF0DV7';
const EMERGENCY_IMAGES_SUBFOLDER = 'Inspeccion_Emergencias_Images';

function getEmergencyTargetSpreadsheet_(customId) {
  if (customId) {
    return SpreadsheetApp.openById(String(customId).trim());
  }
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;
  const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  const files = folder.getFiles();
  while (files.hasNext()) {
    const f = files.next();
    if (f.getMimeType() === MimeType.GOOGLE_SHEETS && normalizeName_(f.getName()).indexOf('emergencia') !== -1) {
      return SpreadsheetApp.openById(f.getId());
    }
  }
  throw new Error('No se pudo abrir el libro de Inspección Emergencias.');
}

function normalizeName_(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[´'’]/g, '')
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '')
    .replace(/\\s+/g, ' ')
    .trim();
}

function findSheetByName_(ss, targetName) {
  const exact = ss.getSheetByName(targetName);
  if (exact) return exact;
  const normTarget = normalizeName_(targetName);
  const sheets = ss.getSheets();
  for (let i = 0; i < sheets.length; i++) {
    if (normalizeName_(sheets[i].getName()) === normTarget) {
      return sheets[i];
    }
  }
  return null;
}

function formatDateISO_(val, tz) {
  if (!val) return '';
  if (val instanceof Date) {
    return Utilities.formatDate(val, tz || Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  const str = String(val).trim();
  const dmy = str.match(/^(\\d{1,2})\\/(\\d{1,2})\\/(\\d{4})$/);
  if (dmy) {
    return dmy[3] + '-' + dmy[2].padStart(2, '0') + '-' + dmy[1].padStart(2, '0');
  }
  return str;
}

function formatDateSheets_(fechaStr) {
  if (!fechaStr) return '';
  const str = String(fechaStr).trim();
  const ymd = str.match(/^(\\d{4})-(\\d{2})-(\\d{2})$/);
  if (ymd) {
    return ymd[3] + '/' + ymd[2] + '/' + ymd[1];
  }
  return str;
}

function getOrCreateEmergencyImagesFolder_() {
  const parent = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  const folders = parent.getFoldersByName(EMERGENCY_IMAGES_SUBFOLDER);
  if (folders.hasNext()) return folders.next();
  return parent.createFolder(EMERGENCY_IMAGES_SUBFOLDER);
}

function saveEmergencyImageToDrive_(dataUrl, fileName) {
  if (!dataUrl || typeof dataUrl !== 'string') return '';
  if (!dataUrl.startsWith('data:image')) return dataUrl;
  try {
    const parts = dataUrl.split(',');
    const meta = parts[0] || '';
    const base64Data = parts[1];
    if (!base64Data) return '';
    const mimeMatch = meta.match(/data:(image\\/[a-zA-Z0-9.+-]+);base64/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bytes = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(bytes, mimeType, fileName);
    const folder = getOrCreateEmergencyImagesFolder_();
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return EMERGENCY_IMAGES_SUBFOLDER + '/' + file.getName();
  } catch (err) {
    return 'Imagen adjunta (Drive)';
  }
}

function isExcludedEmergencySheetName_(name) {
  const norm = normalizeName_(name).replace(/[^a-z0-9]+/g, ' ').trim();
  const excluded = [
    'tipo extintor',
    'tipos extintor',
    'datos extintores',
    'datos extintor',
    'datos kit',
    'estado ie',
    'estados ie',
    'responsables sst',
    'responsable sst',
  ];
  return excluded.indexOf(norm) !== -1;
}

function readAllEmergencySheets_(ss) {
  const tz = ss.getSpreadsheetTimeZone();
  const sheets = ss.getSheets();
  const result = [];

  for (let s = 0; s < sheets.length; s++) {
    const sheet = sheets[s];
    if (isExcludedEmergencySheetName_(sheet.getName())) continue;
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow < 1 || lastCol < 1) continue;

    const rawHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    const headers = [];
    for (let c = 0; c < rawHeaders.length; c++) {
      const h = String(rawHeaders[c] || '').trim();
      if (h) headers.push({ name: h, colIdx: c });
    }
    if (headers.length === 0) continue;

    const headerNames = headers.map(function (h) { return h.name; });
    const rows = [];
    const suggestionsMap = {};
    headerNames.forEach(function (hn) { suggestionsMap[hn] = {}; });

    if (lastRow >= 2) {
      const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
      for (let r = 0; r < data.length; r++) {
        const rowArr = data[r];
        let hasAny = false;
        const valuesObj = {};

        for (let hIdx = 0; hIdx < headers.length; hIdx++) {
          const hInfo = headers[hIdx];
          const cellVal = rowArr[hInfo.colIdx];
          let strVal = '';
          if (cellVal instanceof Date) {
            strVal = formatDateISO_(cellVal, tz);
          } else if (cellVal !== null && cellVal !== undefined) {
            strVal = String(cellVal).trim();
            if (normalizeName_(hInfo.name).indexOf('fecha') !== -1) {
              strVal = formatDateISO_(strVal, tz);
            }
          }
          if (strVal !== '') hasAny = true;
          valuesObj[hInfo.name] = strVal;

          if (strVal && !strVal.startsWith('data:image') && strVal.length <= 60) {
            suggestionsMap[hInfo.name][strVal] = true;
          }
        }

        if (!hasAny) continue;
        const firstColVal = valuesObj[headerNames[0]] || ('ROW-' + (r + 2));
        rows.push({
          rowNumber: r + 2,
          rowId: String(firstColVal),
          values: valuesObj,
        });
      }
    }

    const suggestions = {};
    headerNames.forEach(function (hn) {
      const keys = Object.keys(suggestionsMap[hn]);
      if (keys.length > 0 && keys.length <= 40) {
        suggestions[hn] = keys.sort();
      }
    });

    result.push({
      sheetName: sheet.getName(),
      headers: headerNames,
      rows: rows.reverse(),
      suggestions: suggestions,
    });
  }

  return result;
}

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'getEmergencySheets';
    const customId = (e && e.parameter && e.parameter.spreadsheetId) ? e.parameter.spreadsheetId : '';
    const ss = getEmergencyTargetSpreadsheet_(customId);

    if (action === 'ping') {
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        app: 'Inspección Emergencias - SG-SST',
        spreadsheetId: ss.getId(),
        spreadsheetName: ss.getName(),
        sheets: ss.getSheets().map(function (s) { return s.getName(); }),
        timestamp: new Date().toISOString(),
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const sheets = readAllEmergencySheets_(ss);
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      spreadsheetId: ss.getId(),
      spreadsheetName: ss.getName(),
      sheets: sheets,
      timestamp: new Date().toISOString(),
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: err.message || String(err),
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) ? e.postData.contents : '{}');
    const action = body.action || 'appendEmergencyRow';
    const ss = getEmergencyTargetSpreadsheet_(body.spreadsheetId || '');
    const targetSheet = findSheetByName_(ss, body.sheetName);

    if (!targetSheet) {
      throw new Error('No se encontró la hoja "' + (body.sheetName || '') + '" en el archivo.');
    }

    if (action === 'deleteEmergencyRow') {
      const targetRowId = String(body.rowId || '').trim();
      let deletedRow = -1;
      const lastRow = targetSheet.getLastRow();

      if (body.rowNumber && Number(body.rowNumber) >= 2 && Number(body.rowNumber) <= lastRow) {
        const cellVal = String(targetSheet.getRange(Number(body.rowNumber), 1).getValue() || '').trim();
        if (!targetRowId || cellVal === targetRowId) {
          deletedRow = Number(body.rowNumber);
        }
      }
      if (deletedRow === -1 && targetRowId && lastRow >= 2) {
        const ids = targetSheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (let i = 0; i < ids.length; i++) {
          if (String(ids[i][0] || '').trim() === targetRowId) {
            deletedRow = i + 2;
            break;
          }
        }
      }
      if (deletedRow !== -1) {
        targetSheet.deleteRow(deletedRow);
      }

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        deleted: deletedRow !== -1,
        row: deletedRow,
        sheetName: targetSheet.getName(),
        message: deletedRow !== -1
          ? 'Registro eliminado de "' + targetSheet.getName() + '".'
          : 'El registro ya no se encontraba en la hoja.',
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const lastCol = Math.max(targetSheet.getLastColumn(), 1);
    const rawHeaders = targetSheet.getRange(1, 1, 1, lastCol).getValues()[0];
    const valuesObj = body.values || {};
    const stamp = Utilities.formatDate(new Date(), ss.getSpreadsheetTimeZone(), 'dd-MM-yyyy-HHmmss');
    const rowArray = [];

    for (let c = 0; c < rawHeaders.length; c++) {
      const header = String(rawHeaders[c] || '').trim();
      if (!header) {
        rowArray.push('');
        continue;
      }
      let val = valuesObj[header] !== undefined ? valuesObj[header] : '';
      const normH = normalizeName_(header);

      if (typeof val === 'string' && val.startsWith('data:image')) {
        const safeSheet = normalizeName_(targetSheet.getName()).replace(/[^a-z0-9]/g, '_');
        const safeCol = normH.replace(/[^a-z0-9]/g, '_');
        val = saveEmergencyImageToDrive_(val, stamp + '_' + safeSheet + '_' + safeCol + '.jpg');
      } else if (normH.indexOf('fecha') !== -1 && typeof val === 'string') {
        val = formatDateSheets_(val);
      }
      rowArray.push(val);
    }

    let updateRow = -1;
    const lastRow = targetSheet.getLastRow();
    const rowIdVal = String(body.rowId || (rawHeaders[0] ? valuesObj[String(rawHeaders[0]).trim()] : '') || '').trim();

    if (body.rowNumber && Number(body.rowNumber) >= 2 && Number(body.rowNumber) <= lastRow) {
      updateRow = Number(body.rowNumber);
    } else if (rowIdVal && lastRow >= 2) {
      const existingIds = targetSheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (let i = 0; i < existingIds.length; i++) {
        if (String(existingIds[i][0] || '').trim() === rowIdVal) {
          updateRow = i + 2;
          break;
        }
      }
    }

    if (updateRow !== -1) {
      targetSheet.getRange(updateRow, 1, 1, rowArray.length).setValues([rowArray]);
    } else {
      targetSheet.appendRow(rowArray);
      updateRow = targetSheet.getLastRow();
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      row: updateRow,
      rowId: rowIdVal,
      sheetName: targetSheet.getName(),
      message: 'Registro guardado en la hoja "' + targetSheet.getName() + '".',
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
