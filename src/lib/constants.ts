/**
 * Application Constants and Configuration
 */

export const APP_NAME = 'Unko Trip';
export const APP_DESCRIPTION = 'Manage group trips with ease';

/**
 * Trip Configuration
 */
export const TRIP_ROLES = {
  ADMIN: 'ADMIN',
  EDITOR: 'EDITOR',
  VIEWER: 'VIEWER',
} as const;

export const TRIP_ROLE_LABELS = {
  ADMIN: 'Administrador',
  EDITOR: 'Editor',
  VIEWER: 'Visualizador',
} as const;

export const TRIP_ROLE_DESCRIPTIONS = {
  ADMIN: 'Control total del viaje: crear, editar, borrar',
  EDITOR: 'Puede agregar panoramas y gastos, pero no eliminar viaje',
  VIEWER: 'Solo lectura',
} as const;

/**
 * Participant Types
 */
export const PARTICIPANT_TYPES = {
  REGISTERED: 'REGISTERED',
  GHOST: 'GHOST',
} as const;

export const PARTICIPANT_TYPE_LABELS = {
  REGISTERED: 'Usuario Registrado',
  GHOST: 'Participante Fantasma',
} as const;

/**
 * Currency Configuration
 */
export const CURRENCIES = {
  CLP: 'CLP',
  JPY: 'JPY',
  USD: 'USD',
  EUR: 'EUR',
  GBP: 'GBP',
  KRW: 'KRW',
  CNY: 'CNY',
  THB: 'THB',
} as const;

export const CURRENCY_SYMBOLS = {
  CLP: '$',
  JPY: '¥',
  USD: '$',
  EUR: '€',
  GBP: '£',
  KRW: '₩',
  CNY: '¥',
  THB: '฿',
} as const;

export const CURRENCY_NAMES = {
  CLP: 'Peso Chileno',
  JPY: 'Yen Japonés',
  USD: 'Dólar Americano',
  EUR: 'Euro',
  GBP: 'Libra Esterlina',
  KRW: 'Won Coreano',
  CNY: 'Yuan Chino',
  THB: 'Baht Tailandés',
} as const;

/**
 * Split Types for Expenses
 */
export const SPLIT_TYPES = {
  EQUAL: 'EQUAL',
  CUSTOM: 'CUSTOM',
} as const;

export const SPLIT_TYPE_LABELS = {
  EQUAL: 'Division Equitativa',
  CUSTOM: 'División Personalizada',
} as const;

/**
 * Pagination
 */
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/**
 * UI/UX Constants
 */
export const TOAST_DURATION = 3000; // milliseconds
export const DEBOUNCE_DELAY = 300; // milliseconds

/**
 * Validation Rules
 */
export const VALIDATION = {
  TRIP_NAME_MIN: 3,
  TRIP_NAME_MAX: 100,
  TRIP_DESCRIPTION_MAX: 500,
  ACTIVITY_TITLE_MIN: 1,
  ACTIVITY_TITLE_MAX: 200,
  ACTIVITY_DESCRIPTION_MAX: 1000,
  HOTEL_NAME_MIN: 3,
  HOTEL_NAME_MAX: 200,
  EXPENSE_DESCRIPTION_MIN: 1,
  EXPENSE_DESCRIPTION_MAX: 200,
  EXPENSE_MIN_AMOUNT: 0,
  EXPENSE_MAX_AMOUNT: 999999,
  EMAIL_MAX_LENGTH: 255,
  NAME_MAX_LENGTH: 255,
} as const;
