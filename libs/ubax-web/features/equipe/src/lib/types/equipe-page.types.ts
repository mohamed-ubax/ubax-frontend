import type { UbaxSubRole } from '@ubax-workspace/ubax-web-data-access';

export type AgencyMemberTableRow = {
  readonly id: string;
  readonly memberId: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly phone: string;
  readonly roleLabel: string;
  readonly roleKeys: readonly string[];
  readonly rolesLoading: boolean;
  readonly rolesError: string | null;
  readonly avatarSrc: string;
};

export type RoleOption = {
  readonly key: UbaxSubRole;
  readonly label: string;
};

export type MemberPanelMode = 'view' | 'edit';
export type ConfirmDialogAction = 'revoke-role' | 'deactivate-member' | null;
