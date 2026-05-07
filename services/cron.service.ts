import cron from "node-cron";

/**
 * Punto de entrada para tareas cron de "alta frecuencia"
 * que no justifican una clase Job propia.
 *
 * Para jobs más complejos, prefiere crear una clase en `jobs/`
 * (ver `jobs/ExampleJob.ts`).
 */
export const startCronJobs = (): void => {
  // Ejemplo: tarea cada minuto
  cron.schedule("*/1 * * * *", async () => {
    // try { await someTask(); }
    // catch (e) { console.error("❌ cron someTask:", e); }
  });
};
