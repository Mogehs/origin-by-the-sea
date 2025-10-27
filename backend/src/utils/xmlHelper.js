/**
 * Escape XML special characters
 * @param {*} unsafe - String to escape
 * @returns {string} Escaped string safe for XML
 */
function escapeXml(unsafe) {
  if (unsafe === null || unsafe === undefined) return "";
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

module.exports = { escapeXml };
