# Plan de implementación técnica

Desglose ejecutable del [plan de arquitectura](arquitectura.md).

## Defaults asumidos (reversibles)

- Correo por cada operación, configurable; resumen diario opcional.
- Sin `READ_SMS` en el MVP; solo notificaciones + correo.
- Backend en Supabase (auth + Postgres + Edge Functions).
- Desarrollo Android-first; iOS después con alcance reducido.

## Estructura del repo

```
expense-control/
├── app/                          # Expo + React Native
│   ├── src/
│   │   ├── capture/              # bridge al módulo nativo, registro de la tarea headless
│   │   ├── parsing/              # motor de parseo + reglas empaquetadas (fallback)
│   │   ├── dedup/                # huellas y resolución de duplicados
│   │   ├── categorization/       # reglas, aprendizaje, bandeja "por revisar"
│   │   ├── data/                 # esquema SQLite (Drizzle), repositorios, migraciones
│   │   ├── sync/                 # outbox, cliente API, backoff y reintentos
│   │   ├── email/                # plantillas y payloads de correo
│   │   └── ui/                   # pantallas (Expo Router)
│   │       ├── balance/          # mensual por categoría y medio de pago
│   │       ├── transactions/     # lista, detalle, edición
│   │       ├── inbox/            # pendientes y sin parsear
│   │       ├── settings/         # correo, fuentes, categorías, privacidad
│   │       └── onboarding/       # permisos + checklist de notificaciones
│   ├── modules/
│   │   └── notification-listener/  # módulo Expo nativo (Kotlin) propio
│   └── tests/corpus/             # fixtures de notificaciones reales anonimizadas
├── backend/
│   └── supabase/
│       ├── functions/
│       │   ├── events/           # POST /events → encola correo + respaldo
│       │   ├── parser-rules/     # GET — reglas versionadas
│       │   ├── email-worker/     # envío transaccional vía SES/SendGrid
│       │   └── mail-parser/      # correo bancario entrante → evento
│       └── migrations/
├── docs/
└── .github/workflows/            # CI: lint, typecheck, jest, build preview
```

## Contratos de componentes

### Módulo nativo de captura (Kotlin + headless JS)

Servicio `NotificationListenerService` declarado con `BIND_NOTIFICATION_LISTENER_SERVICE`, filtra por paquete emisor y reenvía a una tarea headless registrada en `index.js` — funciona con la app cerrada.

```ts
getPermissionStatus(): 'authorized' | 'denied' | 'unknown'
openPermissionSettings(): void
headlessHandler({ packageName, title, text, bigText, postedAt }): Promise<void>
```

Fallback: la librería `react-native-android-notification-listener` cubre ~80% si el módulo propio se demora.

### Reglas de parseo (JSON versionado)

```json
{
  "id": "yape-out-v1",
  "app": "com.bcp.innovacxion.yapeapp",
  "title_match": "Yape",
  "pattern": "(?<verb>Yapeaste|Pagaste) S\\/? ?(?<amount>[0-9]+\\.[0-9]{2}) a (?<counterparty>.+)",
  "direction": "out",
  "currency": "PEN",
  "version": 3
}
```

Un evento que no casa con ninguna regla se guarda en la bandeja "sin parsear" con su texto crudo (alimenta nuevas reglas y el corpus de tests).

### Deduplicación

`fingerprint = sha256(monto | bucket_5min | contraparte_normalizada | dirección)`. Si dos fuentes reportan la misma operación, se fusionan conservando el registro con más campos.

### Outbox / sync

Cada operación confirmada → `POST /events` con clave de idempotencia `fingerprint + fuente`. Backoff exponencial, funciona offline. El backend responde con `email_log_id`.

## Orden de implementación

### Fase 0 — Corpus y prototipo de parser
1. Repo + scaffold Expo (TypeScript, Expo Router, Jest).
2. **App colectora**: lista todas las notificaciones de los paquetes vigilados y exporta/comparte el log — se instala en el teléfono Android de pruebas.
3. Documentar formatos en `docs/corpus-formatos.md` (Yape out/in, Plin out/in, compra tarjeta, wallet).
4. Parser en TypeScript puro + fixtures del corpus como tests Jest (≥95% extracción).

### Fase 1 — MVP Android local
1. Módulo nativo Kotlin integrado al colector.
2. Esquema SQLite (Drizzle): transaction, category, category_rule, source_app, parser_rule, outbox_event.
3. Pipeline: captura → parseo → dedup → categorización → persistencia.
4. UI: onboarding de permiso, balance mensual, lista de operaciones, bandeja por revisar, entrada manual, ajustes.

### Fase 2 — Backend + correo
1. Supabase: auth magic-link, tablas espejo para respaldo, RLS.
2. Edge functions: events, email-worker (SES), parser-rules, cron de resumen diario.
3. Outbox en la app + sincronización idempotente.
4. Parseador de correo bancario vía buzón de reenvío.
5. Ajustes de correo (por operación / resumen / destinatario).

### Fase 3 — iOS reducido + publicación Android
1. Build iOS con captura desactivada; fuente de correo + entrada manual.
2. Política de privacidad, ficha de Play Store, declaración del listener, video demo.
3. Internal testing → producción; TestFlight para iOS.

## Entorno y CI/CD

| Pieza | Elección | Detalle |
|---|---|---|
| Toolchain | Node 20, pnpm, EAS CLI, Android SDK | Emulador sirve para UI, no para Yape/Plin reales |
| Dispositivo | Android físico | Imprescindible para corpus real y listener en 2º plano |
| CI | GitHub Actions | PR: lint + tsc + jest. Main: EAS Build preview |
| CD | EAS Build + EAS Update | development / preview / production; OTA para cambios solo-JS |
| Pruebas | Jest + corpus fixtures; Maestro E2E | El corpus anonimizado es contrato de regresión |
| Privacidad | Anonimizador | Enmascara nombres/montos del corpus antes de commit |
