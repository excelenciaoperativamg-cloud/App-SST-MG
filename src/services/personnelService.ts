import * as XLSX from 'xlsx';
import { PersonnelWorker, MasterImportDiff } from '../types';
import { storageService } from './storageService';

export const personnelService = {
  /**
   * Generates and triggers download of the standard Excel template
   */
  downloadTemplate() {
    const templateData = [
      {
        'Cédula': '1017000111',
        'Nombre': 'Ejemplo Juan Pérez Restrepo',
        'Fecha de nacimiento': '1990-05-15',
        'Edad': 36,
        'Género': 'M',
        'Sede': 'MG-MG',
        'Fecha de ingreso': '2022-01-15',
        'Puesto': 'Técnico Operativo',
        'EPS': 'SURA EPS',
        'ARL': 'ARL SURA',
      },
      {
        'Cédula': '1020000222',
        'Nombre': 'Ejemplo María Gómez Cano',
        'Fecha de nacimiento': '1995-10-22',
        'Edad': 31,
        'Género': 'F',
        'Sede': 'MG-HA',
        'Fecha de ingreso': '2023-04-01',
        'Puesto': 'Supervisora de Planta',
        'EPS': 'Sanitas EPS',
        'ARL': 'ARL SURA',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Maestro');

    // Auto-fit column widths
    const maxCols = [15, 30, 20, 8, 8, 12, 18, 25, 18, 18];
    worksheet['!cols'] = maxCols.map((w) => ({ wch: w }));

    XLSX.writeFile(workbook, 'Plantilla_Maestro_Personal_MG_SST.xlsx');
  },

  /**
   * Parse an uploaded Excel/CSV file and calculate diff against existing database
   */
  async parseAndValidateExcel(
    file: File,
    isFullReplacement: boolean
  ): Promise<MasterImportDiff> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array', cellDates: true });

          // Pick the sheet: prefer 'Maestro' or first sheet (ignore 'Maestro ADM')
          let sheetName = 'Maestro';
          if (!workbook.SheetNames.includes('Maestro')) {
            const candidate = workbook.SheetNames.find((s) => s.toLowerCase() !== 'maestro adm');
            sheetName = candidate || workbook.SheetNames[0];
          }

          const worksheet = workbook.Sheets[sheetName];
          if (!worksheet) {
            throw new Error('No se encontró una hoja válida para procesar en el archivo.');
          }

          const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
          if (rawRows.length === 0) {
            throw new Error('El archivo está vacío o no contiene filas de datos.');
          }

          const existingWorkers = storageService.getWorkers();
          const existingMap = new Map<string, PersonnelWorker>();
          existingWorkers.forEach((w) => existingMap.set(String(w.cedula).trim(), w));

          const validationErrors: Array<{ row: number; cedula?: string; error: string }> = [];
          const newWorkers: PersonnelWorker[] = [];
          const updatedWorkers: Array<{
            existing: PersonnelWorker;
            updated: PersonnelWorker;
            changes: string[];
          }> = [];
          let unchangedCount = 0;
          const processedCedulas = new Set<string>();

          rawRows.forEach((row, index) => {
            const rowNumber = index + 2; // Row 1 is header

            // Standardize field names by normalizing keys
            const getVal = (possibleKeys: string[]) => {
              for (const k of possibleKeys) {
                const foundKey = Object.keys(row).find(
                  (rk) => rk.toLowerCase().trim() === k.toLowerCase().trim()
                );
                if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) {
                  return String(row[foundKey]).trim();
                }
              }
              return '';
            };

            const cedula = getVal(['Cédula', 'Cedula', 'Documento', 'ID']);
            const nombre = getVal(['Nombre', 'Nombres y Apellidos', 'Trabajador']);
            const fechaNac = getVal(['Fecha de nacimiento', 'Fecha Nacimiento', 'F. Nacimiento', 'Nacimiento']);
            const edadRaw = getVal(['Edad']);
            const generoRaw = getVal(['Género', 'Genero', 'Sexo']).toUpperCase();
            const sede = getVal(['Sede', 'SedeId', 'Centro de Trabajo']);
            const fechaIngreso = getVal(['Fecha de ingreso', 'Fecha Ingreso', 'F. Ingreso', 'Ingreso']);
            const puesto = getVal(['Puesto', 'Cargo', 'Ocupación', 'Ocupacion']);
            const eps = getVal(['EPS', 'Entidad de Salud']);
            const arl = getVal(['ARL', 'Aseguradora de Riesgos']);

            // Validate required fields
            if (!cedula) {
              validationErrors.push({ row: rowNumber, error: 'La Cédula es obligatoria.' });
              return;
            }
            if (!/^\d{5,12}$/.test(cedula)) {
              validationErrors.push({
                row: rowNumber,
                cedula,
                error: 'Formato de cédula inválido (debe contener solo dígitos numéricos).',
              });
              return;
            }
            if (processedCedulas.has(cedula)) {
              validationErrors.push({
                row: rowNumber,
                cedula,
                error: `Cédula duplicada detectada en el mismo archivo.`,
              });
              return;
            }
            processedCedulas.add(cedula);

            if (!nombre) {
              validationErrors.push({ row: rowNumber, cedula, error: 'El Nombre del trabajador es obligatorio.' });
              return;
            }

            // Normalizing gender
            let genero: 'M' | 'F' | 'OTRO' = 'M';
            if (generoRaw.startsWith('F') || generoRaw === 'MUJER') genero = 'F';
            else if (generoRaw.startsWith('M') || generoRaw === 'HOMBRE') genero = 'M';
            else if (generoRaw) genero = 'OTRO';

            // Calculate or parse age
            let edad = parseInt(edadRaw, 10);
            if (isNaN(edad) || edad <= 0) {
              if (fechaNac) {
                const birthYear = new Date(fechaNac).getFullYear();
                if (!isNaN(birthYear)) {
                  edad = new Date().getFullYear() - birthYear;
                }
              }
            }
            if (isNaN(edad)) edad = 30; // fallback

            const now = new Date().toISOString();
            const formattedWorker: PersonnelWorker = {
              id: cedula,
              cedula,
              nombre,
              fechaNacimiento: fechaNac || '1990-01-01',
              edad,
              genero,
              sedeId: sede || 'MG-MG',
              fechaIngreso: fechaIngreso || now.split('T')[0],
              puesto: puesto || 'Operario',
              eps: eps || undefined,
              arl: arl || undefined,
              estado: 'ACTIVO',
              createdAt: now,
              updatedAt: now,
            };

            const existing = existingMap.get(cedula);
            if (!existing) {
              newWorkers.push(formattedWorker);
            } else {
              // Check changes
              const changes: string[] = [];
              if (existing.nombre !== formattedWorker.nombre) {
                changes.push(`Nombre: "${existing.nombre}" ➔ "${formattedWorker.nombre}"`);
              }
              if (existing.sedeId !== formattedWorker.sedeId) {
                changes.push(`Sede: "${existing.sedeId}" ➔ "${formattedWorker.sedeId}"`);
              }
              if (existing.puesto !== formattedWorker.puesto) {
                changes.push(`Puesto: "${existing.puesto}" ➔ "${formattedWorker.puesto}"`);
              }
              if (existing.eps && formattedWorker.eps && existing.eps !== formattedWorker.eps) {
                changes.push(`EPS: "${existing.eps}" ➔ "${formattedWorker.eps}"`);
              }
              if (existing.arl && formattedWorker.arl && existing.arl !== formattedWorker.arl) {
                changes.push(`ARL: "${existing.arl}" ➔ "${formattedWorker.arl}"`);
              }
              if (existing.estado === 'INACTIVO') {
                changes.push(`Estado: Reactivado de INACTIVO ➔ ACTIVO`);
              }

              if (changes.length > 0) {
                updatedWorkers.push({
                  existing,
                  updated: {
                    ...existing,
                    ...formattedWorker,
                    id: existing.id,
                    estado: 'ACTIVO', // Reactivate if present in fresh file
                    updatedAt: now,
                  },
                  changes,
                });
              } else {
                unchangedCount++;
              }
            }
          });

          // Detect workers currently in DB that do NOT appear in the uploaded file
          const missingInFile: PersonnelWorker[] = [];
          if (isFullReplacement) {
            existingWorkers.forEach((w) => {
              if (w.estado === 'ACTIVO' && !processedCedulas.has(w.cedula)) {
                missingInFile.push(w);
              }
            });
          }

          resolve({
            totalInFile: rawRows.length,
            newWorkers,
            updatedWorkers,
            unchangedCount,
            missingInFile,
            validationErrors,
            isFullReplacement,
          });
        } catch (err: any) {
          reject(err);
        }
      };

      reader.onerror = () => reject(new Error('No se pudo leer el archivo seleccionado.'));
      reader.readAsArrayBuffer(file);
    });
  },
};
