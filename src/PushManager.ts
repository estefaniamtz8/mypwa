// src/PushManager.ts
// -----------------------------------------------------------
// ✅ Manejo de notificaciones push (registro + suscripción)
// -----------------------------------------------------------

// Convierte una clave VAPID base64URL a Uint8Array (necesario para Push API)
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Función principal para registrar notificaciones push
export async function registerPushNotifications() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("❌ Push Notifications no soportadas en este navegador");
    return;
  }

  // 1️⃣ Pedir permiso al usuario
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    console.warn("⚠️ El usuario no permitió las notificaciones");
    return;
  }

  // 2️⃣ Obtener Service Worker activo
  const registration = await navigator.serviceWorker.ready;

  // 3️⃣ Clave pública VAPID (de tu backend o generada con web-push)
  const vapidPublicKey = "TU_CLAVE_PUBLICA_VAPID_AQUI"; // 🔸 Reemplázala por tu clave real
  const convertedKey = urlBase64ToUint8Array(vapidPublicKey);

  // 4️⃣ Crear suscripción
  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedKey,
    });

    console.log("🟢 Suscripción Push creada correctamente:", subscription);

    // 5️⃣ Enviar la suscripción a tu backend (para guardar)
    await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription),
    });

    console.log("📡 Suscripción enviada al backend");
  } catch (error) {
    console.error("❌ Error creando la suscripción push:", error);
  }
}
