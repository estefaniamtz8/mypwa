import React, { useState, useEffect } from "react";
import { addEntry, getAllEntries } from "../db";

// 👉 Función auxiliar para registrar sincronización en segundo plano
async function registerBackgroundSync(tag: string) {
  if (!("serviceWorker" in navigator)) return;
  if (!("SyncManager" in window)) {
    console.warn("⚠️ Background Sync no soportado en este navegador");
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await (registration as any).sync.register(tag);
    console.log(`🟢 Sync registrado correctamente: ${tag}`);
  } catch (err) {
    console.error("❌ Error registrando Sync:", err);
  }
}

export default function OfflineForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [entries, setEntries] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Escuchar cambios de conexión
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    loadEntries();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const loadEntries = async () => {
    const data = await getAllEntries();
    setEntries(data.reverse());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newEntry = {
      title,
      description,
      date: new Date().toLocaleString(),
    };

    // Guardar en IndexedDB
    await addEntry(newEntry);

    // Registrar sincronización (si el navegador lo soporta)
    await registerBackgroundSync("sync-entries");

    // Limpiar formulario
    setTitle("");
    setDescription("");

    loadEntries();
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-2">📋 Formulario Offline</h2>

      <p
        className={`mb-4 font-semibold ${
          isOnline ? "text-green-600" : "text-red-600"
        }`}
      >
        {isOnline ? "🟢 En línea" : "🔴 Sin conexión"}
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          placeholder="Título"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <textarea
          placeholder="Descripción"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Guardar
        </button>
      </form>

      <hr className="my-4" />

      <h3 className="font-semibold mb-2">🗂 Registros guardados</h3>
      <ul>
        {entries.map((e) => (
          <li key={e.id} className="border p-2 mb-2 rounded">
            <strong>{e.title}</strong>
            <p>{e.description}</p>
            <small>{e.date}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}
