/**
 * Electron Integration Utilities
 * Provides auto-save and folder opening functionality when running in Electron
 * 
 * Usage:
 * - Check if running in Electron: isElectron()
 * - Save file: saveFile(filePath, data)
 * - Open folder: showItemInFolder(filePath)
 */

/**
 * Check if running in Electron
 */
export const isElectron = () => {
    return typeof window !== 'undefined' && window.electron !== undefined;
};

/**
 * Save file to Downloads folder (Electron only)
 * @param {string} fileName - File name
 * @param {Buffer|Uint8Array} data - File data
 * @returns {Promise<string>} Path to saved file
 */
export const saveFileToDownloads = async (fileName, data) => {
    if (!isElectron()) {
        throw new Error('Not running in Electron');
    }

    if (!window.electron.saveFile) {
        throw new Error('Electron saveFile API not available');
    }

    try {
        const filePath = await window.electron.saveFile(fileName, data);
        console.log('✅ File saved to:', filePath);
        return filePath;
    } catch (error) {
        console.error('❌ Error saving file:', error);
        throw error;
    }
};

/**
 * Show file in folder (Electron only)
 * @param {string} filePath - Path to file
 */
export const showItemInFolder = (filePath) => {
    if (!isElectron()) {
        console.warn('⚠️ Not running in Electron, cannot show item in folder');
        return;
    }

    if (!window.electron.showItemInFolder) {
        console.warn('⚠️ Electron showItemInFolder API not available');
        return;
    }

    try {
        window.electron.showItemInFolder(filePath);
        console.log('✅ Opened folder for:', filePath);
    } catch (error) {
        console.error('❌ Error showing item in folder:', error);
    }
};

/**
 * Get Downloads folder path (Electron only)
 * @returns {Promise<string>} Path to Downloads folder
 */
export const getDownloadsPath = async () => {
    if (!isElectron()) {
        throw new Error('Not running in Electron');
    }

    if (!window.electron.getDownloadsPath) {
        throw new Error('Electron getDownloadsPath API not available');
    }

    try {
        const path = await window.electron.getDownloadsPath();
        return path;
    } catch (error) {
        console.error('❌ Error getting Downloads path:', error);
        throw error;
    }
};
