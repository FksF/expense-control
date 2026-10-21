# Expense Control

App móvil (React Native + Expo) que detecta operaciones bancarias del teléfono — Yape, Plin, wallets, banca — registra cada gasto con su categoría, envía un correo de registro y muestra el balance mensual.

## Estado

En planificación. Ver documentos:

- [docs/arquitectura.md](docs/arquitectura.md) — análisis de fuentes de detección, arquitectura, modelo de datos, stack y riesgos.
- [docs/plan-implementacion.md](docs/plan-implementacion.md) — estructura del repo, contratos de componentes, orden de implementación y entorno.

## Restricción clave

La detección automática solo es posible en **Android** (listener de notificaciones). iOS no expone APIs para leer notificaciones ni SMS de otras apps: ahí el alcance es correo bancario + entrada manual.
