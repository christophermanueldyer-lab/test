/**
 * Helper Functions
 */

/**
 * Get folder name from category
 * @param {string} category - The classification category
 * @return {string} The Gmail label/folder name
 */
function getFolderName(category) {
  switch (category) {
    case 'Promotional Email':
      return 'Promos';
    case 'Receipt':
      return 'Receipts';
    case 'Summary Email (Already Read)':
      return 'Automations';
    default:
      return 'Unknown';
  }
}
