# Arquitectura — Expense Control

App que detecta operaciones bancarias del teléfono (pagos con tarjeta vía wallets, Yape, Plin, transferencias), las registra con categoría, envía un correo de registro por cada operación y calcula el balance mensual de gastos.

## Hallazgo clave

La detección pasiva solo es posible en **Android**:

- `NotificationListenerService` permite leer notificaciones de otras apps (Yape, Plin, apps de banca, Google Wallet, Mercado Pago). Permiso especial que el usuario activa en Ajustes.
- SMS bancarios: posible con `READ_SMS`, pero Google Play exige justificarlo bajo la excepción "gestión de dinero por SMS". En Perú los bancos migran a push → fuente secundaria, fuera del MVP.
- iOS no expone API alguna para leer notificaciones ni SMS de terceros. En iOS el alcance es: correo bancario parseado en servidor + entrada manual.

Estrategia: **Android-first**, iOS en fase posterior con alcance reducido.

## Fuentes de detección

| Fuente | Android | iOS | Cobertura | Restricciones |
|---|---|---|---|---|
| Notificaciones push | Sí | No | Yape, Plin, banca, Google Wallet, Mercado Pago | Permiso en Ajustes; formatos cambian con cada update de la app emisora |
| SMS bancarios | Con declaración | No | Compras/cargos que el banco aún envía por SMS | Declaración ante Play; cobertura decreciente |
| Correo bancario (servidor) | Sí | Sí | Confirmaciones por email de bancos; no Yape/Plin | Gmail API o buzón de reenvío; única fuente pasiva en iOS |
| Open banking (Belvo…) | Sí | Sí | Cuentas agregadas | Cobertura Perú limitada, no cubre wallets; fase futura |
| Entrada manual | Sí | Sí | Efectivo, no detectados, correcciones | Respaldo universal; base del flujo en iOS |

## Flujo de una operación

1. La app emisora publica una notificación ("Yapeaste S/ 15.00 a Juan P."). El listener la recibe aun con la app cerrada (tarea headless).
2. El parser por emisor extrae monto, moneda, dirección y contraparte.
3. Deduplicación por huella (monto + ventana de 5 min + contraparte normalizada + dirección) descarta el evento si ya llegó por otro canal.
4. El motor de categorías asigna categoría por reglas o aprendizaje; si no hay certeza → bandeja "por revisar".
5. Persiste en SQLite local y encola el evento al backend (outbox con reintentos).
6. El backend envía el correo de registro y respalda el historial.
7. El balance mensual se recalcula en el dispositivo, por categoría y medio de pago.

## Componentes

- **App (React Native + Expo dev build)**: captura (módulo Kotlin propio + headless JS), parser con reglas versionadas, dedup, motor de categorías, SQLite (Drizzle + SQLCipher), cola outbox, UI (Expo Router).
- **Backend (Supabase)**: auth magic-link, Postgres con RLS, Edge Functions: `events` (ingesta + encola correo), `email-worker` (SES/SendGrid), `parser-rules` (distribución versionada), `mail-parser` (correo bancario → evento), cron de resumen diario.
- **Reglas de parseo remotas**: JSON versionado por app emisora; actualizar el formato de Yape no requiere release.

## Modelo de datos

| Entidad | Campos clave |
|---|---|
| transaction | id, amount, currency, direction, occurred_at, counterparty, payment_method, category_id, status, fingerprint, source, raw_excerpt |
| category | id, name, icon, parent_id, is_default |
| category_rule | pattern, category_id, hit_count, origin (seed/learned) |
| source_app | package_name, display_name, parser_version, enabled |
| parser_rule | source_app, locale, regex/template, field_map, version |
| email_log | transaction_id, type, sent_at, status |
| outbox_event | payload, attempts, next_retry_at |
| budget | month, category_id, limit_amount |

## Riesgos principales

- Formatos de notificación cambian → reglas remotas + bandeja "sin parsear" + alerta de tasa de fallo.
- Google Wallet a veces no incluye monto → cruce por huella con correo/SMS; si no, "por confirmar".
- Doze/OEM mata el listener → health check diario + guía de exclusión de batería.
- iOS sin detección pasiva → decisión de producto (correo + manual).
- Usuario con notificaciones desactivadas en la app emisora → checklist de onboarding.
- Privacidad: procesamiento on-device, cifrado en reposo, backend mínimo.
