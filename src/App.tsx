import { useState, useEffect } from "react";
import { openDB } from "idb";
import { registerPushNotifications } from "./PushManager"; // importa tu archivo PushManager

const DB_NAME = "sync-db";
const STORE_NAME = "entries";

// 🧩 Guarda datos en IndexedDB
async function saveEntryOffline(entry: any) {
  const db = await openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });
      }
    },
  });

  await db.add(STORE_NAME, entry);

  // 🟡 Registrar Background Sync de forma segura
  if ("serviceWorker" in navigator && "SyncManager" in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register("sync-entries");
      console.log("⏳ Datos guardados offline y sincronización registrada");
    } catch (err) {
      console.error("❌ Error registrando Background Sync:", err);
    }
  } else {
    console.warn("⚠️ Background Sync no soportado en este navegador");
  }
}

export default function App() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Primero nos aseguramos de que el Service Worker esté listo
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then(() => {
        // Ahora registramos Push Notifications
        registerPushNotifications();
      });
    }
  }, []); // [] asegura que solo se ejecute una vez al montar el componente

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = {
      name,
      message,
      timestamp: Date.now(),
    };

    if (navigator.onLine) {
      try {
        const res = await fetch("/api/entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (!res.ok) throw new Error("Fallo al enviar al servidor");

        console.log("✅ Datos enviados online");
      } catch (error) {
        console.warn("⚠️ Error enviando online, guardando offline:", error);
        await saveEntryOffline(formData);
      }
    } else {
      await saveEntryOffline(formData);
    }

    setName("");
    setMessage("");
  }

  return (
    <main className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-3">📮 Enviar mensaje</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre"
          required
          className="w-full border rounded p-2"
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Mensaje"
          required
          className="w-full border rounded p-2"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Enviar
        </button>
      </form>
    </main>
  );
}
