import { pushNotificationsApi } from "../api/notifications";

const SERVICE_WORKER_URL = "/sw.js";
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

function ensureSupported() {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Push notifications are not supported by this browser.");
  }
  if (!("PushManager" in window)) {
    throw new Error("Push notifications are not supported by this browser.");
  }
  if (!VAPID_PUBLIC_KEY) {
    throw new Error("Meetwise push notifications are not configured. Add VITE_VAPID_PUBLIC_KEY.");
  }
}

export async function registerPushServiceWorker() {
  ensureSupported();
  return navigator.serviceWorker.register(SERVICE_WORKER_URL, { scope: "/" });
}

export async function getLocalPushSubscription() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
  const registration = await navigator.serviceWorker.getRegistration(SERVICE_WORKER_URL);
  if (!registration) return null;
  return registration.pushManager.getSubscription();
}

export async function getPushStatus() {
  return pushNotificationsApi.status();
}

export async function enablePushNotifications() {
  ensureSupported();

  if (Notification.permission === "denied") {
    throw new Error("Notifications are blocked for Meetwise. Allow notifications in your browser settings, then try again.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Notification permission was not granted.");
  }

 await registerPushServiceWorker();

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    throw new Error("The browser returned an incomplete push subscription. Please try again.");
  }

  const status = await pushNotificationsApi.subscribe({
    endpoint: json.endpoint,
    keys: {
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
    },
  });

  return { subscription, status };
}
