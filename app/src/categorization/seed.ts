import type { Category, CategoryRule } from './engine';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'comida', name: 'Comida', isDefault: true },
  { id: 'transporte', name: 'Transporte', isDefault: true },
  { id: 'servicios', name: 'Servicios', isDefault: true },
  { id: 'salud', name: 'Salud', isDefault: true },
  { id: 'ocio', name: 'Ocio', isDefault: true },
  { id: 'compras', name: 'Compras', isDefault: true },
  { id: 'suscripciones', name: 'Suscripciones', isDefault: true },
  { id: 'transferencias', name: 'Transferencias', isDefault: true },
  { id: 'otros', name: 'Otros', isDefault: true },
];

/** Reglas semilla comercio→categoría (se extienden con lo que aprende del usuario). */
export const SEED_CATEGORY_RULES: CategoryRule[] = [
  { id: 'seed-rappi', pattern: 'Rappi', categoryId: 'comida', hits: 10, origin: 'seed' },
  { id: 'seed-pedidosya', pattern: 'PedidosYa', categoryId: 'comida', hits: 10, origin: 'seed' },
  { id: 'seed-plazavea', pattern: 'Plaza Vea', categoryId: 'comida', hits: 10, origin: 'seed' },
  { id: 'seed-tottus', pattern: 'Tottus', categoryId: 'comida', hits: 10, origin: 'seed' },
  { id: 'seed-wong', pattern: 'Wong', categoryId: 'comida', hits: 10, origin: 'seed' },
  { id: 'seed-metro', pattern: 'Metro', categoryId: 'comida', hits: 10, origin: 'seed' },
  { id: 'seed-uber', pattern: 'Uber', categoryId: 'transporte', hits: 10, origin: 'seed' },
  { id: 'seed-cabify', pattern: 'Cabify', categoryId: 'transporte', hits: 10, origin: 'seed' },
  { id: 'seed-didi', pattern: 'DiDi', categoryId: 'transporte', hits: 10, origin: 'seed' },
  { id: 'seed-inkafarma', pattern: 'Inkafarma', categoryId: 'salud', hits: 10, origin: 'seed' },
  { id: 'seed-mifarma', pattern: 'Mifarma', categoryId: 'salud', hits: 10, origin: 'seed' },
  { id: 'seed-netflix', pattern: 'Netflix', categoryId: 'suscripciones', hits: 10, origin: 'seed' },
  { id: 'seed-spotify', pattern: 'Spotify', categoryId: 'suscripciones', hits: 10, origin: 'seed' },
  { id: 'seed-prime', pattern: 'Amazon Prime', categoryId: 'suscripciones', hits: 10, origin: 'seed' },
  { id: 'seed-luzdelsur', pattern: 'Luz del Sur', categoryId: 'servicios', hits: 10, origin: 'seed' },
  { id: 'seed-enel', pattern: 'Enel', categoryId: 'servicios', hits: 10, origin: 'seed' },
  { id: 'seed-movistar', pattern: 'Movistar', categoryId: 'servicios', hits: 10, origin: 'seed' },
  { id: 'seed-claro', pattern: 'Claro', categoryId: 'servicios', hits: 10, origin: 'seed' },
  { id: 'seed-cineplanet', pattern: 'Cineplanet', categoryId: 'ocio', hits: 10, origin: 'seed' },
  { id: 'seed-cinemark', pattern: 'Cinemark', categoryId: 'ocio', hits: 10, origin: 'seed' },
];
