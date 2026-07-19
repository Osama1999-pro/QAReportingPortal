// ==========================================================
// Excel export using SheetJS (xlsx).
// Returns a Buffer that controllers stream back as a download.
// ==========================================================
const XLSX = require('xlsx');

/**
 * @param {Array<Object>} rows - plain objects; keys become column headers
 * @param {String} sheetName
 * @returns {Buffer} .xlsx file buffer
 */
function rowsToExcelBuffer(rows, sheetName = 'Report') {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

module.exports = { rowsToExcelBuffer };
