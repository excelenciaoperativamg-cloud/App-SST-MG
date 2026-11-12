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

  /**
   * Generates official Acta de Entrega de EPP (PDF)
  /**
   * Exporta la Hoja Oficial "Entrega Epp´s MG" a Excel (.xlsx) con los 19 campos exactos
   */
  exportEntregaEPPMGToExcel(records: import('../types/epp').EntregaEPPMGRecord[], fileName = 'Entrega_Epps_MG') {
    const formattedData = records.map((r) => ({
      'Id_Epp': r.Id_Epp,
      'Fecha': r.Fecha,
      'Año': r.Año,
      'Mes': r.Mes,
      'Sede': r.Sede,
      'Cédula': r.Cédula,
      'Nombre': r.Nombre,
      'Labor': r.Labor,
      'Area': r.Area,
      'Supervisor': r.Supervisor,
      'Código Epp': r.Código_Epp,
      'Epp': r.Epp,
      'Tipo_Entrega': r.Tipo_Entrega,
      'Costo': r.Costo,
      'Estado': r.Estado,
      'Foto_Entrega': r.Foto_Entrega ? 'Foto Adjunta' : 'Sin Foto',
      'Firma_Trabajador': r.Firma_Trabajador ? 'Firmado Digitalmente' : 'Pendiente',
      'Responsable SST': r.Responsable_SST,
      'Firma SST': r.Firma_SST ? 'Firmado Digitalmente' : 'Pendiente',
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    // Nombre de la hoja requerido: "Entrega Epp´s MG"
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Entrega Epp´s MG');

    // Auto-fit column widths
    worksheet['!cols'] = [
      { wch: 16 }, // Id_Epp
      { wch: 12 }, // Fecha
      { wch: 8 },  // Año
      { wch: 12 }, // Mes
      { wch: 10 }, // Sede
      { wch: 14 }, // Cédula
      { wch: 28 }, // Nombre
      { wch: 22 }, // Labor
      { wch: 18 }, // Area
      { wch: 24 }, // Supervisor
      { wch: 14 }, // Código Epp
      { wch: 38 }, // Epp
      { wch: 22 }, // Tipo_Entrega
      { wch: 14 }, // Costo
      { wch: 20 }, // Estado
      { wch: 16 }, // Foto_Entrega
      { wch: 20 }, // Firma_Trabajador
      { wch: 28 }, // Responsable SST
      { wch: 20 }, // Firma SST
    ];

    XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
  },

  /**
   * Generates official Acta de Entrega de EPP (PDF) con los 19 campos y firmas digitales
   */
  generateEPPDeliveryPDF(delivery: any) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Data normalization
    const idActa = delivery.Id_Epp || delivery.numeroActa || 'EPP-001';
    const fecha = delivery.Fecha || delivery.fecha || new Date().toISOString().split('T')[0];
    const anio = delivery.Año || new Date(fecha).getFullYear();
    const mes = delivery.Mes || 'Marzo';
    const sede = delivery.Sede || delivery.sedeId || 'MG-MG';
    const cedula = delivery.Cédula || delivery.cedulaTrabajador || 'N/A';
    const nombre = delivery.Nombre || delivery.nombreTrabajador || 'N/A';
    const labor = delivery.Labor || delivery.puestoTrabajador || 'N/A';
    const area = delivery.Area || delivery.area || 'Operaciones';
    const supervisor = delivery.Supervisor || delivery.supervisor || 'N/A';
    const codigoEpp = delivery.Código_Epp || delivery.codigoEpp || 'EPP-001';
    const eppNombre = delivery.Epp || delivery.epp || 'Elemento EPP';
    const tipoEntrega = delivery.Tipo_Entrega || delivery.motivo || 'Dotación Periódica';
    const costo = delivery.Costo || 0;
    const estado = delivery.Estado || delivery.estado || 'Entregado y Firmado';
    const responsableSST = delivery.Responsable_SST || delivery.responsableEntrega || 'Responsable SST';

    // Top Header Banner
    doc.setFillColor(10, 41, 88); // #0A2958
    doc.rect(0, 0, pageWidth, 28, 'F');

    // Red accent stripe
    doc.setFillColor(230, 0, 0); // #E60000
    doc.rect(0, 28, pageWidth, 3, 'F');

    // Header Text
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('MG CONSULTORES S.A.S.', 14, 13);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('SISTEMA DE GESTIÓN DE SEGURIDAD Y SALUD EN EL TRABAJO (SG-SST)', 14, 19);
    doc.text('HOJA Y FORMULARIO OFICIAL: ENTREGA EPP´S MG', 14, 25);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`ID EPP: ${idActa}`, pageWidth - 14, 16, { align: 'right' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Sede: ${sede} | Periodo: ${mes} ${anio}`, pageWidth - 14, 23, { align: 'right' });

    // Title Section
    doc.setTextColor(10, 41, 88);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('ACTA OFICIAL DE ENTREGA DE ELEMENTOS DE PROTECCIÓN PERSONAL', 14, 38);

    // Meta Information Table (19 Campos)
    const metaData = [
      ['Id_Epp:', idActa, 'Fecha / Periodo:', `${fecha} (${mes} ${anio})`],
      ['Sede Operativa:', sede, 'Estado de Registro:', estado],
      ['Trabajador Receptor:', nombre, 'Cédula de Ciudadanía:', `C.C. ${cedula}`],
      ['Labor / Puesto:', labor, 'Área / Sección:', area],
      ['Supervisor a Cargo:', supervisor, 'Tipo de Entrega:', tipoEntrega],
      ['Responsable SST:', responsableSST, 'Costo EPP (Hoja Epp´s):', `$ ${Number(costo).toLocaleString('es-CO')} COP`],
    ];

    autoTable(doc, {
      startY: 42,
      body: metaData,
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 2.5, textColor: [30, 41, 59] },
      columnStyles: {
        0: { fontStyle: 'bold', fillColor: [248, 250, 252], textColor: [10, 41, 88], cellWidth: 40 },
        1: { cellWidth: 55 },
        2: { fontStyle: 'bold', fillColor: [248, 250, 252], textColor: [10, 41, 88], cellWidth: 38 },
        3: { cellWidth: 57 },
      },
    });

    // Delivered Items Table
    let currentY = (doc as any).lastAutoTable.finalY + 6;

    doc.setFontSize(10);
    doc.setTextColor(10, 41, 88);
    doc.setFont('helvetica', 'bold');
    doc.text('1. Detalle del Elemento Suministrado (Hoja Epp´s)', 14, currentY);

    const itemsRows = [
      ['1', codigoEpp, eppNombre, tipoEntrega, `$ ${Number(costo).toLocaleString('es-CO')}`, estado],
    ];

    autoTable(doc, {
      startY: currentY + 3,
      head: [['#', 'Código Epp', 'Descripción EPP', 'Tipo Entrega', 'Costo Unit.', 'Estado']],
      body: itemsRows,
      theme: 'grid',
      headStyles: { fillColor: [10, 41, 88], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 2.8 },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 30, fontStyle: 'bold', textColor: [10, 41, 88] },
        2: { cellWidth: 80 },
        3: { cellWidth: 30 },
        4: { cellWidth: 22, halign: 'right', fontStyle: 'bold', textColor: [16, 120, 60] },
        5: { cellWidth: 18, halign: 'center' },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;

    // Observations
    if (delivery.observaciones) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(10, 41, 88);
      doc.text('2. Observaciones de Entrega', 14, currentY);
      autoTable(doc, {
        startY: currentY + 2,
        body: [[delivery.observaciones]],
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2.5, textColor: [51, 65, 85] },
      });
      currentY = (doc as any).lastAutoTable.finalY + 6;
    }

    // Legal Commitment Clause
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(10, 41, 88);
    doc.text('3. Declaración de Recepción y Compromiso del Trabajador', 14, currentY);

    const legalText =
      'Certifico haber recibido en perfecto estado de funcionamiento, calidad y asepsia el Elemento de Protección Personal (EPP) relacionado en este registro. Recibí instrucción técnica sobre su correcto uso, inspección rutinaria, limpieza y reposición en MG Consultores S.A.S. Asumo el compromiso legal de utilizarlo de forma permanente y obligatoria en el desempeño de mis labores (Res. 2400/1979 y Dec. 1072/2015).';

    autoTable(doc, {
      startY: currentY + 2,
      body: [[legalText]],
      theme: 'plain',
      styles: { fontSize: 7.5, cellPadding: 3, textColor: [71, 85, 105], fontStyle: 'italic' },
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;

    // Check space for signatures
    if (doc.internal.pageSize.getHeight() - currentY < 45) {
      doc.addPage();
      currentY = 20;
    }

    // Embed Digital Signatures if available
    const sigY = currentY + 26;

    // Worker Signature Image
    if (delivery.Firma_Trabajador && delivery.Firma_Trabajador.startsWith('data:image')) {
      try {
        doc.addImage(delivery.Firma_Trabajador, 'PNG', 115, sigY - 20, 50, 18);
      } catch (e) {}
    }

    // SST Signature Image
    if (delivery.Firma_SST && delivery.Firma_SST.startsWith('data:image')) {
      try {
        doc.addImage(delivery.Firma_SST, 'PNG', 20, sigY - 20, 50, 18);
      } catch (e) {}
    }

    // Signature 1: Responsable SST
    doc.setDrawColor(148, 163, 184);
    doc.line(14, sigY, 90, sigY);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(responsableSST, 14, sigY + 4);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Entregado por: Responsable SST MG Consultores', 14, sigY + 8);

    // Signature 2: Trabajador Receptor
    doc.line(110, sigY, 196, sigY);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(nombre, 110, sigY + 4);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Recibido conforme - C.C. ${cedula}`, 110, sigY + 8);

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 8;
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'MG Consultores S.A.S. | Hoja Oficial Entrega Epp´s MG | Cumplimiento SG-SST',
      pageWidth / 2,
      footerY,
      { align: 'center' }
    );

    doc.save(`Entrega_EPP_${idActa}.pdf`);
  },
};

