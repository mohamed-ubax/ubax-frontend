import {
  inject,
  Injectable,
  NgZone,
  OnDestroy,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthStore } from '@ubax-workspace/ubax-web-data-access/auth-store';

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
 * À l'expiration du timer, la session est immédiatement révoquée côté client.
 * Le maintien de session pendant l'activité est géré par l'authInterceptor
 * (refresh automatique sur 401).
 *
 * Utiliser `stop()` pour désactiver le service (ex. : page de connexion).
 */
@Injectable({ providedIn: 'root' })
export class InactivityService implements OnDestroy {
  private readonly authStore = inject(AuthStore);
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

  /** Appelé après 30 minutes d'inactivité — déconnexion immédiate. */
  private onInactivityTimeout(): void {
    this.stop();
    this.authStore.expireSession();
  }

  private clearTimer(): void {
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }
}
