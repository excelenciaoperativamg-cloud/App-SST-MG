import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SSTRecord, PersonnelWorker } from '../types';
import { auditService } from './auditService';

export const exportService = {
  /**
   * Export SST records to Excel file (.xlsx)
   */
  exportRecordsToExcel(records: SSTRecord[], fileName = 'Reporte_SST_MG_Consultores') {
    const formattedData = records.map((r, i) => ({
      'Item': i + 1,
      'N° Registro': r.numeroRegistro,
      'Módulo': r.moduloNombre,
      'Submódulo': r.subModuloNombre,
      'Fecha': r.fecha,
      'Sede': r.sedeId,
      'Área': r.area,
      'Supervisor': r.supervisor || 'N/A',
      'Cédula Trabajador': r.cedulaTrabajador || 'N/A',
      'Nombre Trabajador': r.nombreTrabajador || 'N/A',
      'Puesto': r.puestoTrabajador || 'N/A',
      'Responsable Registro': r.responsableRegistro,
      'Estado': r.estado,
      'Observaciones / Hallazgos': r.observaciones,
      'Acciones Propuestas': r.accionesPropuestas || 'N/A',
      'Fecha Creación': r.createdAt ? new Date(r.createdAt).toLocaleString('es-CO') : '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Registros_SST');

    // Auto-fit column widths
    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 16 },
      { wch: 22 },
      { wch: 22 },
      { wch: 12 },
      { wch: 10 },
      { wch: 18 },
      { wch: 24 },
      { wch: 16 },
      { wch: 28 },
      { wch: 22 },
      { wch: 22 },
      { wch: 14 },
      { wch: 45 },
      { wch: 35 },
      { wch: 20 },
    ];

    XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
  },

  /**
   * Export Master Personnel to Excel (.xlsx)
   */
  exportPersonnelToExcel(workers: PersonnelWorker[], fileName = 'Maestro_Personal_MG_SST') {
    const data = workers.map((w, i) => ({
      'Item': i + 1,
      'Cédula': w.cedula,
      'Nombre': w.nombre,
      'Fecha Nacimiento': w.fechaNacimiento,
      'Edad': w.edad,
      'Género': w.genero,
      'Sede': w.sedeId,
      'Fecha Ingreso': w.fechaIngreso,
      'Puesto / Cargo': w.puesto,
      'EPS': w.eps || 'N/A',
      'ARL': w.arl || 'N/A',
      'Estado': w.estado,
      'Fecha Retiro': w.fechaRetiro || '',
      'Motivo Retiro': w.motivoRetiro || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Maestro_Personal');

    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 14 },
      { wch: 30 },
      { wch: 16 },
      { wch: 8 },
      { wch: 8 },
      { wch: 10 },
      { wch: 14 },
      { wch: 25 },
      { wch: 18 },
      { wch: 18 },
      { wch: 12 },
      { wch: 14 },
      { wch: 30 },
    ];

    XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
  },

  /**
   * Generates a formal corporate PDF for a single SST Record or report
   */
  generateRecordPDF(record: SSTRecord) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Top Header Banner with corporate colors
    // Navy header bar: #0A2958
    doc.setFillColor(10, 41, 88);
    doc.rect(0, 0, pageWidth, 26, 'F');

    // Red accent stripe: #E60000
    doc.setFillColor(230, 0, 0);
    doc.rect(0, 26, pageWidth, 3, 'F');

    // Header Text
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('MG CONSULTORES S.A.S.', 14, 14);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('SISTEMA DE GESTIÓN DE SEGURIDAD Y SALUD EN EL TRABAJO (SG-SST)', 14, 21);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`REGISTRO N°: ${record.numeroRegistro}`, pageWidth - 14, 16, { align: 'right' });

    // Title Section
    doc.setTextColor(10, 41, 88);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`${record.moduloNombre.toUpperCase()} - ${record.subModuloNombre.toUpperCase()}`, 14, 38);

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text(`Documento generado el: ${new Date().toLocaleString('es-CO')}`, 14, 44);

    // Meta Information Table
    const metaData = [
      ['Fecha de Registro:', record.fecha, 'Estado Operativo:', record.estado],
      ['Sede de Operación:', record.sedeId, 'Área / Sección:', record.area],
      ['Supervisor a Cargo:', record.supervisor || 'N/A', 'Responsable Registro:', record.responsableRegistro],
    ];

    if (record.cedulaTrabajador || record.nombreTrabajador) {
      metaData.push([
        'Trabajador Asociado:',
        record.nombreTrabajador || 'N/A',
        'Cédula / Documento:',
        record.cedulaTrabajador || 'N/A',
      ]);
      metaData.push([
        'Puesto / Cargo:',
        record.puestoTrabajador || 'N/A',
        'Correo Responsable:',
        record.responsableEmail,
      ]);
    }

    autoTable(doc, {
      startY: 48,
      body: metaData,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 3,
        textColor: [30, 41, 59],
      },
      columnStyles: {
        0: { fontStyle: 'bold', fillColor: [248, 250, 252], textColor: [10, 41, 88], cellWidth: 42 },
        1: { cellWidth: 52 },
        2: { fontStyle: 'bold', fillColor: [248, 250, 252], textColor: [10, 41, 88], cellWidth: 42 },
        3: { cellWidth: 52 },
      },
    });

    // Content: Observaciones y Hallazgos
    let currentY = (doc as any).lastAutoTable.finalY + 8;

    doc.setFontSize(11);
    doc.setTextColor(10, 41, 88);
    doc.setFont('helvetica', 'bold');
    doc.text('1. Observaciones y Descripción de la Actividad', 14, currentY);

    autoTable(doc, {
      startY: currentY + 3,
      body: [[record.observaciones || 'Sin observaciones registradas.']],
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 4,
        textColor: [51, 65, 85],
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;

    if (record.hallazgos || record.accionesPropuestas) {
      doc.setFontSize(11);
      doc.setTextColor(10, 41, 88);
      doc.setFont('helvetica', 'bold');
      doc.text('2. Hallazgos y Acciones Correctivas / Preventivas', 14, currentY);

      const actionData = [
        ['Hallazgos Detectados:', record.hallazgos || 'Ninguno especificado.'],
        ['Acciones Inmediatas / Propuestas:', record.accionesPropuestas || 'Medidas estándar de control aplicadas.'],
      ];

      autoTable(doc, {
        startY: currentY + 3,
        body: actionData,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 55, fillColor: [248, 250, 252], textColor: [10, 41, 88] },
          1: { cellWidth: 133 },
        },
      });

      currentY = (doc as any).lastAutoTable.finalY + 8;
    }

    // Signatures Section
    const remainingSpace = doc.internal.pageSize.getHeight() - currentY;
    if (remainingSpace < 45) {
      doc.addPage();
      currentY = 25;
    }

    doc.setFontSize(10);
    doc.setTextColor(10, 41, 88);
    doc.setFont('helvetica', 'bold');
    doc.text('Firmas y Aprobaciones Responsables:', 14, currentY + 10);

    const sigY = currentY + 32;

    // Signature 1: Responsable SST
    doc.setDrawColor(148, 163, 184);
    doc.line(16, sigY, 90, sigY);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(record.responsableRegistro || 'Responsable SST', 16, sigY + 5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Líder / Inspector SST', 16, sigY + 9);

    // Signature 2: Trabajador / Supervisor
    doc.line(110, sigY, 184, sigY);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(record.nombreTrabajador || record.supervisor || 'Trabajador / Supervisor de Área', 110, sigY + 5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Firma de Conformidad / Enterado', 110, sigY + 9);

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 10;
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'MG Consultores S.A.S. - Sistema de Gestión SST | Cumplimiento Decreto 1072/2015 y Resolución 0312/2019',
      pageWidth / 2,
      footerY,
      { align: 'center' }
    );

    doc.save(`Registro_${record.numeroRegistro}.pdf`);
  },
};
