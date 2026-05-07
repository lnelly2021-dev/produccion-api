import cron from "node-cron";

/**
 * Plantilla de job programado.
 *
 * Patrón:
 *  - Cada job es una clase con un método `start()` estático.
 *  - `start()` registra el cron y se llama una sola vez desde index.ts.
 *  - La lógica real va en un método `run()` separado, que también
 *    puedes invocar manualmente desde tests o endpoints admin.
 */
export class ExampleJob {
  private static cronTask: cron.ScheduledTask | null = null;

  static start(): void {
    if (ExampleJob.cronTask) return;

    // Cada día a las 03:00 — ajusta a tu necesidad
    ExampleJob.cronTask = cron.schedule("0 3 * * *", async () => {
      console.log("[ExampleJob] Tick");
      try {
        await ExampleJob.run();
      } catch (err) {
        console.error("[ExampleJob] Error:", (err as Error).message);
      }
    });

    console.log("[ExampleJob] Cron scheduled: every day at 03:00");
  }

  static async run(): Promise<void> {
    // TODO: implementar lógica del job
  }
}
