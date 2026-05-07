import webpush from "web-push";

/**
 * Configuración de Web Push (notificaciones push del navegador).
 * Genera tus claves VAPID con `npx web-push generate-vapid-keys`
 * y guárdalas en .env como VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY.
 */
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || "mailto:admin@example.com",
  process.env.VAPID_PUBLIC_KEY || "",
  process.env.VAPID_PRIVATE_KEY || ""
);

export default webpush;
