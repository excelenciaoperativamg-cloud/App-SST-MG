/**
 * Tipos para la conexión dinámica del libro de Google Drive "Inspección Emergencias"
 * y sus múltiples hojas (Extintores, Cilindros, Camillas, Kit Derrames, Sensores de humo, etc.)
 */

export interface EmergencySheetRow {
  rowNumber?: number;
  rowId: string;
  values: Record<string, string>;
}

export interface EmergencySheetData {
  sheetName: string;
  headers: string[];
  rows: EmergencySheetRow[];
  suggestions?: Record<string, string[]>;
}
