// ==========================================================
// PDF export using pdfmake (server-side print fonts).
// ==========================================================
const PdfPrinter = require('pdfmake');

// Use PDFKit's built-in standard 14 fonts (Helvetica family). These ship
// inside pdfkit itself as font metrics, not files, so there is nothing to
// install or point at — this can never break on a fresh `npm install`.
// (Newer pdfmake releases stopped bundling actual Roboto .ttf files, which
// is what a file-path font config like the old default would break on.)
const fonts = {
  Roboto: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
};

const printer = new PdfPrinter(fonts);

/**
 * @param {String} title
 * @param {Array<String>} columns - column headers
 * @param {Array<Array<String>>} rows - table body rows
 * @param {String} [subtitle]
 * @returns {Promise<Buffer>}
 */
function buildTablePdf(title, columns, rows, subtitle = '') {
  const docDefinition = {
    pageOrientation: 'landscape',
    pageMargins: [30, 40, 30, 30],
    content: [
      { text: title, style: 'header' },
      subtitle ? { text: subtitle, style: 'subheader', margin: [0, 0, 0, 12] } : {},
      {
        table: {
          headerRows: 1,
          widths: Array(columns.length).fill('*'),
          body: [columns.map((c) => ({ text: c, bold: true, fillColor: '#10192E', color: '#FFFFFF' })), ...rows],
        },
        layout: {
          fillColor: (rowIndex) => (rowIndex === 0 ? null : rowIndex % 2 === 0 ? '#F4F6F9' : null),
        },
      },
    ],
    styles: {
      header: { fontSize: 16, bold: true, margin: [0, 0, 0, 4] },
      subheader: { fontSize: 9, color: '#6B7488' },
    },
    defaultStyle: { fontSize: 8 },
  };

  return new Promise((resolve, reject) => {
    try {
      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      const chunks = [];
      pdfDoc.on('data', (chunk) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', reject);
      pdfDoc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { buildTablePdf };
