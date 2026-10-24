import { EXPORT_COLUMNS, WideExportRow } from './types';

/**
 * Escapes characters for XML content: &, <, >, ", '
 */
export function escapeXml(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generates an Excel-compatible SpreadsheetML (XML Spreadsheet 2003) document.
 * This format is natively supported by Microsoft Excel, LibreOffice Calc,
 * Apple Numbers, and Google Sheets without external dependencies.
 */
export function generateExcelXml(rows: WideExportRow[]): string {
  const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="HeaderStyle">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
   </Borders>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#111827" ss:Bold="1"/>
   <Interior ss:Color="#F3F4F6" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="DateStyle">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#374151"/>
  </Style>
  <Style ss:ID="NumberStyle">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#111827"/>
   <NumberFormat ss:Format="0"/>
  </Style>
  <Style ss:ID="CommentStyle">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#4B5563"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="SMBG Logbook">
  <Table>`;

  // Column definitions for pleasant column widths
  const columnDefs = `
   <Column ss:Width="85"/>
   <Column ss:Width="50"/>
   <Column ss:Width="50"/>
   <Column ss:Width="50"/>
   <Column ss:Width="50"/>
   <Column ss:Width="50"/>
   <Column ss:Width="50"/>
   <Column ss:Width="50"/>
   <Column ss:Width="250"/>`;

  // Header row
  const headerCells = EXPORT_COLUMNS.map(
    (col) => `    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">${escapeXml(col)}</Data></Cell>`
  ).join('\n');
  const headerRow = `   <Row ss:Height="22">\n${headerCells}\n   </Row>`;

  // Data rows
  const dataRows: string[] = [];
  for (const row of rows) {
    const slotCells = [
      row.BB,
      row.AB,
      row.BL,
      row.AL,
      row.BD,
      row.AD,
      row['3AM'],
    ].map((val) => {
      if (val !== null && val !== undefined) {
        return `    <Cell ss:StyleID="NumberStyle"><Data ss:Type="Number">${val}</Data></Cell>`;
      }
      return `    <Cell ss:StyleID="NumberStyle"/>`;
    }).join('\n');

    const commentCell = row.comments
      ? `    <Cell ss:StyleID="CommentStyle"><Data ss:Type="String">${escapeXml(row.comments)}</Data></Cell>`
      : `    <Cell ss:StyleID="CommentStyle"/>`;

    const rowXml = `   <Row ss:Height="20">
    <Cell ss:StyleID="DateStyle"><Data ss:Type="String">${escapeXml(row.date)}</Data></Cell>
${slotCells}
${commentCell}
   </Row>`;
    dataRows.push(rowXml);
  }

  const xmlFooter = `  </Table>
 </Worksheet>
</Workbook>`;

  return [xmlHeader, columnDefs, headerRow, ...dataRows, xmlFooter].join('\n');
}

/**
 * Alias for generateExcelXml to satisfy XLSX writer interface.
 */
export const generateXlsx = generateExcelXml;
