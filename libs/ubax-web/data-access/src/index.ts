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

// ─── Team member helpers ──────────────────────────────────────────────────────
export {
  extractSubRolesFromTeamResponse,
  readResolvedTeamMemberRoles,
  resolveTeamMemberId,
} from './lib/store/team/team-member.helpers';
export type { TeamMemberSubRolesMap } from './lib/store/team/team-member.helpers';

// ─── Stores avec logique métier (workflow, opérations domaine) ───────────────
export { DemandesStore } from './lib/store/demandes/demandes.store';
export type { Ticket } from './lib/store/demandes/demandes.store';
export * from './lib/store/location/location.store'; // qualifier, rejeter
export * from './lib/store/hotel/hotel.store'; // inviterMembre, assignerSousRoles
export * from './lib/store/agency/agency.store'; // inviterMembre agence, sous-rôles
export { BienCreationStore } from './lib/store/biens/bien-creation.store';
export type { BienCreationState } from './lib/store/biens/bien-creation.store';
export { MesBiensStore } from './lib/store/biens/mes-biens.store';
export { BienEditStore } from './lib/store/biens/bien-edit.store';
export {
  readPropertyCoverPhotoUrl,
  resolvePropertyCardImage,
} from './lib/property-card-image.helper';

// ─── Ticketing SAV ────────────────────────────────────────────────────────────
export { TicketingStore } from './lib/store/ticketing/ticketing.store';
export type {
  TicketCategory,
  TicketMessage,
  TicketPriority,
  TicketStatus,
  Ticket as TicketSav,
} from './lib/store/ticketing/ticketing.store';

// ─── Espaces hôteliers ────────────────────────────────────────────────────────
export { MesEspacesStore } from './lib/store/espaces/mes-espaces.store';
export type { EspaceStatus } from './lib/store/espaces/mes-espaces.store';
export { ESPACE_STATUS_LABELS } from './lib/store/espaces/mes-espaces.store';
export { EspaceCreationStore } from './lib/store/espaces/espace-creation.store';
export type { EspaceCreationState } from './lib/store/espaces/espace-creation.store';
export { EspaceEditStore } from './lib/store/espaces/espace-edit.store';

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
