# api-pos

API base reutilizable en TypeScript. Estructura, configuración y middlewares
listos para empezar a construir features sin perder tiempo en el andamiaje.

## Stack

- Node.js 18+ / TypeScript
- Express 4
- Mongoose (MongoDB)
- Socket.IO
- node-cron (jobs programados)
- Winston (logging)
- Zod (validación)
- JWT + bcrypt (auth)

## Estructura

```
api-pos/
├── config/             Conexión a DB, env, CORS, push, pdf, etc.
├── controllers/        Capa de entrada HTTP. Orquesta request/response.
├── services/           Lógica de negocio. Independiente de Express.
├── routes/             Routers de Express, agrupados por dominio.
├── models/             Schemas y modelos de Mongoose.
├── middlewares/        Middlewares Express (auth, validación, errores...).
├── validators/         Esquemas de validación con Zod.
├── mappers/            Conversión modelo ⇄ DTO.
├── jobs/               Tareas programadas (cron).
├── sockets/            Servidor Socket.IO y handlers en tiempo real.
├── providers/          Adaptadores a servicios externos (APIs de terceros).
├── hooks/              Hooks de modelo / lifecycle reutilizables.
├── utils/              Helpers transversales (logger, errores, paginación...).
├── types/              Tipos TypeScript compartidos.
├── templatesEmail/     Plantillas Handlebars para correos.
├── migration/          Scripts de migración / seed.
├── docs/               Documentación interna.
├── data/               Archivos de datos / fixtures.
├── logs/               Logs en runtime.
├── uploads/            Archivos subidos en runtime.
├── index.ts            Punto de entrada de la API.
├── package.json
├── tsconfig.json
└── .env.example
```

## Setup

```bash
# 1. Instalar dependencias
npm install

# 2. Crear el .env desde el ejemplo y rellenar valores
cp .env.example .env

# 3. Levantar en desarrollo
npm run dev

# 4. Build + arranque productivo
npm run start
```

La API queda escuchando en `http://localhost:${PORT}` (default `5000`).
Health check: `GET /health`.

## Crear un nuevo módulo

El módulo `example` está incluido como plantilla. Para crear uno nuevo
(`product`, por ejemplo):

1. **Modelo** — `models/Product.ts`
2. **Service** — `services/product.service.ts` (lógica de negocio)
3. **Validator** — `validators/product.validator.ts` (Zod schemas)
4. **Mapper** — `mappers/product.mapper.ts` (DTOs)
5. **Controller** — `controllers/product/product.controller.ts`
6. **Routes** — `routes/product.routes.ts`
7. **Registrar la ruta** en `index.ts`:

   ```ts
   import productRoutes from "./routes/product.routes";
   app.use(`/api/v${VERSION}/products`, productRoutes);
   ```

## Convenciones

- **Respuestas**: usar `ok()`, `created()` y `fail()` de `utils/response.util.ts`.
- **Errores**: lanzar instancias de `AppError` (ver `utils/errors.ts`); el
  `errorHandler` global se encarga de serializarlos.
- **Validación**: middleware ligero (`validateFields`) para campos requeridos;
  Zod para validación rica.
- **Auth**: proteger rutas con `authMiddleware` y, si aplica, `requireRole([...])`.
- **Logging**: `import { logger } from "./utils/Logger"`.
- **Paginación**: `getPagination(req)` + `paginatedResponse(...)`.

## Notas

- Los webhooks que requieren body crudo (Stripe, HMAC) deben montarse antes de
  `express.json()` usando `express.raw({ type: "application/json" })`. Hay un
  comentario recordatorio en `index.ts`.
- Para múltiples bases de datos, replicar el patrón de `config/db.ts` usando
  `mongoose.createConnection()` en archivos separados.
