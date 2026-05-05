import {
  inject,
  Injectable,
  NgZone,
  OnDestroy,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthStore } from '@ubax-workspace/ubax-web-data-access/auth-store';
import { AuthService } from '@ubax-workspace/shared-data-access';

/** Durée d'inactivité avant déconnexion automatique (30 minutes). */
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;

/**
 * Événements DOM considérés comme une activité utilisateur.
 * On utilise `capture: true` pour intercepter même les événements
 * stoppés par des composants enfants.
 */
const ACTIVITY_EVENTS: ReadonlyArray<string> = [
  'mousemove',
  'mousedown',
  'keydown',
  'touchstart',
  'scroll',
  'wheel',
  'click',
];

/**
 * Service de déconnexion par inactivité.
 *
 * Démarre un timer de 30 minutes dès l'appel à `start()`.
 * Chaque interaction utilisateur réinitialise le timer.
 *
 * À l'expiration du timer :
 *  1. Tente un refresh token silencieux pour prolonger la session.
 *  2. Si le refresh réussit → le timer repart pour 30 minutes supplémentaires.
 *  3. Si le refresh échoue (refresh token expiré ou révoqué) → déconnexion.
 *
 * Utiliser `stop()` pour désactiver le service (ex. : page de connexion).
 */
@Injectable({ providedIn: 'root' })
export class InactivityService implements OnDestroy {
  private readonly authStore = inject(AuthStore);
  private readonly authService = inject(AuthService);
  private readonly ngZone = inject(NgZone);
  private readonly platformId = inject(PLATFORM_ID);

  private timerId: ReturnType<typeof setTimeout> | null = null;
  private readonly boundReset = this.resetTimer.bind(this);
  private running = false;

  /** Démarre la surveillance d'inactivité. Idempotent. */
  start(): void {
    if (!isPlatformBrowser(this.platformId) || this.running) {
      return;
    }

    this.running = true;

    // Les listeners DOM sont enregistrés hors de la zone Angular pour éviter
    // de déclencher la détection de changements à chaque mouvement de souris.
    this.ngZone.runOutsideAngular(() => {
      for (const event of ACTIVITY_EVENTS) {
        document.addEventListener(event, this.boundReset, {
          passive: true,
          capture: true,
        });
      }
    });

    this.scheduleTimeout();
  }

  /** Arrête la surveillance et annule le timer en cours. */
  stop(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.running = false;
    this.clearTimer();

    for (const event of ACTIVITY_EVENTS) {
      document.removeEventListener(event, this.boundReset, { capture: true });
    }
  }

  ngOnDestroy(): void {
    this.stop();
  }

  private resetTimer(): void {
    this.clearTimer();
    this.scheduleTimeout();
  }

  private scheduleTimeout(): void {
    this.timerId = setTimeout(() => {
      // Repasser dans la zone Angular pour que les appels HTTP et la navigation
      // fonctionnent correctement.
      this.ngZone.run(() => {
        this.onInactivityTimeout();
      });
    }, INACTIVITY_TIMEOUT_MS);
  }

  /**
   * Appelé après 30 minutes d'inactivité.
   * Tente un refresh silencieux avant de décider de déconnecter.
   */
  private onInactivityTimeout(): void {
    this.authService.refreshToken().subscribe({
      next: (response) => {
        if (response.access_token) {
          // Refresh réussi : on met à jour le token en store et on repart
          // pour 30 minutes supplémentaires.
          this.authStore.setToken(response.access_token);
          // Le timer a déjà été consommé — on le replanifie.
          this.scheduleTimeout();
        } else {
          // Réponse inattendue sans access_token → déconnexion.
          this.stop();
          this.authStore.expireSession();
        }
      },
      error: () => {
        // Refresh token expiré ou révoqué → déconnexion.
        this.stop();
        this.authStore.expireSession();
      },
    });
  }

  private clearTimer(): void {
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }
}
