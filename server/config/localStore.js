import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('[LocalStore] Could not create data directory:', err.message);
  }
}

/**
 * Loads a collection from disk (JSON file) into a Map
 * @param {string} collectionName
 * @returns {Map<string, object>}
 */
export const loadDiskCollection = (collectionName) => {
  const filePath = path.join(DATA_DIR, `${collectionName}.json`);
  const map = new Map();

  if (fs.existsSync(filePath)) {
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      const items = JSON.parse(raw);
      if (Array.isArray(items)) {
        for (const item of items) {
          if (item && item._id) {
            map.set(item._id.toString(), item);
          }
        }
      }
    } catch (err) {
      console.warn(`[LocalStore] Failed reading ${collectionName}.json:`, err.message);
    }
  }

  return map;
};

/**
 * Saves a Map collection to disk as formatted JSON
 * @param {string} collectionName
 * @param {Map<string, object>|Array<object>} data
 */
export const saveDiskCollection = (collectionName, data) => {
  const filePath = path.join(DATA_DIR, `${collectionName}.json`);
  try {
    const list = data instanceof Map ? Array.from(data.values()) : data;
    fs.writeFileSync(filePath, JSON.stringify(list, null, 2), 'utf8');
  } catch (err) {
    console.error(`[LocalStore] Failed writing ${collectionName}.json:`, err.message);
  }
};

export default {
  loadDiskCollection,
  saveDiskCollection,
};
