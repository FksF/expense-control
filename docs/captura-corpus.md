# Fase 0 — Captura del corpus de notificaciones

Objetivo: registrar el formato **real** de las notificaciones de Yape, Plin,
bancos y wallets en un Android físico, para escribir reglas de parsing con
evidencia en vez de suposiciones.

## Qué incluye el colector

- `modules/notification-collector`: módulo nativo local (Kotlin).
  - `ExpenseNotificationListenerService`: `NotificationListenerService` que
    escribe cada notificación recibida como línea JSON en
    `filesDir/notification-captures.jsonl` (título, `text`, `bigText`,
    `textLines`, `subText`, paquete, `postTime`, etc.). Funciona aunque la app
    no esté abierta.
  - API JS (`isGranted`, `openListenerSettings`, `listCaptures`,
    `clearCaptures`, `captureFilePath`).
- Pestaña **Captura** en la app: estado del permiso, lista de capturas,
  exportar el JSONL por compartir, limpiar el buffer.

## Build del APK

El colector usa código nativo: **no corre en Expo Go**. Hay dos rutas para
generar el APK:

### Opción A — Build local (recomendada, sin cuenta Expo)

Requiere Android Studio + JDK 17 en la Mac:

```bash
cd app
npx expo run:android --variant release
```

El APK queda en `android/app/build/outputs/apk/release/app-release.apk` y se
pasa al Android prestado por cable, Drive, WhatsApp, etc. La carpeta
`android/` generada por el prebuild es local y no se commitea.

### Opción B — EAS (build en la nube)

```bash
cd app
npx eas-cli@latest login            # cuenta Expo gratuita
npx eas-cli@latest build --profile development --platform android
```

EAS devuelve una URL con el APK (`buildType: apk`). Se instala en el Android
prestado directamente desde el navegador del teléfono.

## Captura en el teléfono

1. Instalar el APK y abrir la app → pestaña **Captura**.
2. Pulsar **Abrir ajustes** y habilitar el acceso a notificaciones para
   "Expense Control".
3. Volver a la app: el estado debe pasar a "concedido".
4. Generar operaciones reales: Yapear/recibir Yape, Plin, pagos con la wallet,
   notificaciones de bancos (BCP, BBVA, Interbank, Mercado Pago…). No hace
   falta tener la app abierta.
5. En **Captura** → **Exportar JSONL** y enviarse el archivo (correo, Drive,
   WhatsApp…).
6. Compartir el JSONL con el equipo para escribir las reglas del parser.

## Privacidad

- El corpus se queda **local** en el teléfono hasta que el usuario lo exporta.
- Contiene texto de notificaciones de cualquier app: revisar el JSONL antes de
  compartirlo por si hay notificaciones personales (WhatsApp, SMS, correo).
  El JSONL permite borrar líneas manualmente.
- En la app final el servicio solo leerá los paquetes bancarios configurados y
  el corpus sirve únicamente para desarrollo.

## Siguiente paso (Fase 1)

Con el JSONL capturado: escribir reglas reales en `src/parsing/rules.ts`,
cubrir los formatos con tests (`fixtures` desde el corpus), y reemplazar la
captura-cualquier-cosa del servicio por una lista de paquetes objetivo.
