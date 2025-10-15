import { openDB } from "idb";

const DB_NAME = "offlineFormDB";
const STORE_NAME = "entries";

// Inicializa la base de datos
export const initDB = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
    },
  });
};

// Agrega un nuevo registro
export const addEntry = async (entry: { title: string; description: string; date?: string }) => {
  const db = await initDB();
  // Añadir fecha si no viene en el objeto
  const entryWithDate = { ...entry, date: entry.date || new Date().toISOString() };
  await db.add(STORE_NAME, entryWithDate);
};

// Obtener todos los registros
export const getAllEntries = async () => {
  const db = await initDB();
  return db.getAll(STORE_NAME);
};

// Opcional: eliminar un entry por ID (útil después de sincronizar)
export const deleteEntry = async (id: number) => {
  const db = await initDB();
  await db.delete(STORE_NAME, id);
};
