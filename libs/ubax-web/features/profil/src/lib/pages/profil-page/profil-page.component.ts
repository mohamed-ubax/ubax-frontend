import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PageHeaderComponent } from '@ubax-workspace/shared-ui';
import { AuthStore } from '@ubax-workspace/ubax-web-data-access/auth-store';
import {
  ApiConfiguration,
  uploadAvatar,
} from '@ubax-workspace/shared-api-types';

const AVATAR_FALLBACK = 'profil/avatar-placeholder.svg';

@Component({
  selector: 'ubax-profil-page',
  standalone: true,
  imports: [PageHeaderComponent],
  templateUrl: './profil-page.component.html',
  styleUrl: './profil-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilPageComponent {
  readonly authStore = inject(AuthStore);
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfiguration);

  readonly avatarPreview = signal<string | null>(null);
  readonly isUploading = signal(false);
  readonly uploadError = signal<string | null>(null);
  readonly uploadSuccess = signal(false);
  private selectedAvatarFile: File | null = null;

  readonly currentAvatarSrc = computed(() => {
    const preview = this.avatarPreview();
    if (preview) return preview;
    return this.authStore.user()?.avatar ?? AVATAR_FALLBACK;
  });

  readonly userInitials = computed(() => {
    const user = this.authStore.user();
    if (!user) return '?';
    const initials = `${user.prenom?.charAt(0) ?? ''}${user.nom?.charAt(0) ?? ''}`;
    return initials || '?';
  });

  readonly hasAvatarChange = computed(() => this.avatarPreview() !== null);

  onAvatarClick(): void {
    const input = document.getElementById('avatarInput') as HTMLInputElement;
    input?.click();
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    // Validation
    if (!file.type.startsWith('image/')) {
      this.uploadError.set('Veuillez sélectionner une image valide.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.uploadError.set("L'image ne doit pas dépasser 5 Mo.");
      return;
    }

    this.uploadError.set(null);
    this.selectedAvatarFile = file;

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.avatarPreview.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  removeAvatar(event: Event): void {
    event.stopPropagation();
    this.avatarPreview.set(null);
    this.selectedAvatarFile = null;
    this.uploadError.set(null);
    this.uploadSuccess.set(false);

    const input = document.getElementById('avatarInput') as HTMLInputElement;
    if (input) input.value = '';
  }

  cancelChanges(): void {
    this.avatarPreview.set(null);
    this.selectedAvatarFile = null;
    this.uploadError.set(null);
    this.uploadSuccess.set(false);

    const input = document.getElementById('avatarInput') as HTMLInputElement;
    if (input) input.value = '';
  }

  async saveAvatar(): Promise<void> {
    if (!this.selectedAvatarFile) return;

    this.isUploading.set(true);
    this.uploadError.set(null);
    this.uploadSuccess.set(false);

    console.log('[ProfilPage] Starting avatar upload...');

    try {
      const response = await uploadAvatar(this.http, this.apiConfig.rootUrl, {
        body: { file: this.selectedAvatarFile },
      }).toPromise();

      console.log('[ProfilPage] Upload response:', response);
      console.log('[ProfilPage] Upload response body:', response?.body);

      // L'API retourne l'URL de l'avatar dans la réponse
      const responseBody = response?.body as {
        avatarUrl?: string;
        avatar?: string;
      } | null;
      let avatarUrl = responseBody?.avatarUrl ?? responseBody?.avatar;

      console.log('[ProfilPage] Extracted avatar URL (raw):', avatarUrl);

      // Si l'URL est relative, la préfixer avec rootUrl
      if (
        avatarUrl &&
        !avatarUrl.startsWith('http://') &&
        !avatarUrl.startsWith('https://')
      ) {
        const cleanPath = avatarUrl.startsWith('/')
          ? avatarUrl.substring(1)
          : avatarUrl;
        const cleanRootUrl = this.apiConfig.rootUrl.endsWith('/')
          ? this.apiConfig.rootUrl.substring(
              0,
              this.apiConfig.rootUrl.length - 1,
            )
          : this.apiConfig.rootUrl;
        avatarUrl = `${cleanRootUrl}/${cleanPath}`;
        console.log(
          '[ProfilPage] Avatar URL converted to absolute:',
          avatarUrl,
        );
      }

      if (avatarUrl) {
        // Update user in AuthStore
        const currentUser = this.authStore.user();
        console.log('[ProfilPage] Current user before update:', currentUser);

        if (currentUser) {
          const updatedUser = { ...currentUser, avatar: avatarUrl };
          console.log('[ProfilPage] Updating user with:', updatedUser);
          this.authStore.setUser(updatedUser);

          console.log(
            '[ProfilPage] User after setUser:',
            this.authStore.user(),
          );

          // Recharger l'avatar depuis l'API pour s'assurer qu'il est bien synchronisé
          console.log('[ProfilPage] Calling loadAvatar to refresh from API...');
          // this.authStore.loadAvatar();

          // Vérifier que la mise à jour a bien été prise en compte
          setTimeout(() => {
            console.log(
              '[ProfilPage] User after loadAvatar (delayed check):',
              this.authStore.user(),
            );
            console.log(
              '[ProfilPage] Avatar in user (delayed check):',
              this.authStore.user()?.avatar,
            );
          }, 500);
        }

        this.uploadSuccess.set(true);
        this.selectedAvatarFile = null;
        this.avatarPreview.set(null);

        // Clear success message after 3 seconds
        setTimeout(() => {
          this.uploadSuccess.set(false);
        }, 3000);
      } else {
        console.error(
          '[ProfilPage] No avatar URL in response:',
          response?.body,
        );
        this.uploadError.set("Erreur lors de l'upload de l'avatar.");
      }
    } catch (error) {
      console.error('[ProfilPage] Avatar upload error:', error);
      console.error(
        '[ProfilPage] Error details:',
        JSON.stringify(error, null, 2),
      );
      this.uploadError.set(
        "Une erreur est survenue lors de l'upload de l'avatar.",
      );
    } finally {
      this.isUploading.set(false);
    }
  }
}
