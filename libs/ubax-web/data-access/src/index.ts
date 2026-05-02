// ─── Auth ────────────────────────────────────────────────────────────────────
export {
  AUTH_REFRESH_TOKEN_STORAGE_KEY,
  AUTH_TOKEN_STORAGE_KEY,
  AuthService,
  buildPortalLoginUrl,
  clearStoredAuthSession,
  clearStoredAuthToken,
  clearStoredRefreshToken,
  currentBrowserPath,
  DEFAULT_UBAX_WEB_HOME_PATH,
  deriveUserFromAuthToken,
  persistAuthSession,
  persistAuthToken,
  persistRefreshToken,
  readStoredAuthToken,
  readStoredRefreshToken,
  redirectBrowserToPortalLogin,
  resolveUbaxWebRedirectTarget,
  UbaxRole,
  UbaxSubRole,
} from '@ubax-workspace/shared-data-access';
export type {
  LoginRequest,
  LoginResponse,
  StoredAuthSession,
  UbaxScope,
  User,
} from '@ubax-workspace/shared-data-access';
export * from './lib/models/role-access.model';
export * from './lib/store/auth/auth.store';

// ─── Stores avec logique métier (workflow, opérations domaine) ───────────────
export { DemandesStore } from './lib/store/demandes/demandes.store';
export type { Ticket } from './lib/store/demandes/demandes.store';
export * from './lib/store/location/location.store'; // qualifier, rejeter
export * from './lib/store/hotel/hotel.store'; // inviterMembre, assignerSousRoles

// ─── Configs API prêtes à l'emploi avec createApiStore ───────────────────────
// Usage : const BiensStore = createApiStore(biensApiConfig);
//         @Component({ providers: [BiensStore] }) class MyComponent { store = inject(BiensStore) }
export * from './lib/api-configs/admin.config';
export * from './lib/api-configs/bailleur.config';
export * from './lib/api-configs/biens.config';
export * from './lib/api-configs/code-list.config';
export * from './lib/api-configs/dashboard.config';
export * from './lib/api-configs/finance.config';
export * from './lib/api-configs/partner.config';
export * from './lib/api-configs/storage.config';
