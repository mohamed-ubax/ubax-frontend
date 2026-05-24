import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, type SafeResourceUrl } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { ApiConfiguration, generateReadUrl } from '@ubax-workspace/shared-api-types';

const DOCUMENT_READ_URL_TTL_MS = 240_000;

function isPreviewImage(url: string): boolean {
  return /(\.png|\.jpe?g|\.webp|\.gif|\.bmp|\.svg)(\?|$|\s)/i.test(url);
}

function extractReadUrlFromResponse(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const direct = body as { readUrl?: unknown };
  if (typeof direct.readUrl === 'string' && direct.readUrl.length > 0) return direct.readUrl;
  const wrapped = body as { data?: unknown };
  if (wrapped.data && typeof wrapped.data === 'object') {
    const nested = wrapped.data as { readUrl?: unknown };
    if (typeof nested.readUrl === 'string' && nested.readUrl.length > 0) return nested.readUrl;
  }
  return null;
}

/**
 * UbaxDocumentPreviewComponent — Prévisualisation de document (PDF ou image)
 *
 * Gère la résolution de l'URL présignée via l'API storage, le cache TTL,
 * le mode plein écran et l'ouverture dans un nouvel onglet.
 *
 * Usage :
 * ```html
 * <ubax-document-preview
 *   [fileUrl]="contract.signedFileUrl"
 *   documentName="Contrat signé"
 *   buttonLabel="Prévisualiser le PDF"
 * />
 * ```
 *
 * Ou en mode contrôlé (sans bouton intégré) :
 * ```html
 * <ubax-document-preview
 *   [fileUrl]="payment.receiptUrl"
 *   documentName="Reçu de paiement"
 *   [showTriggerButton]="false"
 * />
 * <!-- Déclencher manuellement via ViewChild ou signal partagé -->
 * ```
 */
@Component({
  selector: 'ubax-document-preview',
  standalone: true,
  imports: [],
  templateUrl: './document-preview.component.html',
  styleUrl: './document-preview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentPreviewComponent {
  private readonly doc = inject(DOCUMENT);
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfiguration);
  private readonly sanitizer = inject(DomSanitizer);

  // ── Inputs ──────────────────────────────────────────────────────────────────

  /** URL brute du fichier (S3 key ou URL directe). Peut être null/undefined. */
  readonly fileUrl = input<string | null | undefined>(null);

  /** Nom affiché dans l'en-tête du modal de prévisualisation. */
  readonly documentName = input<string>('Document');

  /** Label du bouton déclencheur intégré. */
  readonly buttonLabel = input<string>('Prévisualiser');

  /** Affiche le bouton déclencheur intégré (true par défaut). */
  readonly showTriggerButton = input<boolean>(true);

  /** Icône PrimeNG du bouton déclencheur (ex: "pi pi-eye"). */
  readonly buttonIcon = input<string>('pi pi-eye');

  // ── Outputs ─────────────────────────────────────────────────────────────────

  /** Émis quand le modal s'ouvre. */
  readonly opened = output<void>();

  /** Émis quand le modal se ferme. */
  readonly closed = output<void>();

  // ── État interne ─────────────────────────────────────────────────────────────

  readonly opening = signal(false);
  readonly previewUrl = signal<string | null>(null);
  readonly previewIsImage = signal(false);
  readonly previewFullscreen = signal(false);

  readonly safePreviewUrl = computed<SafeResourceUrl | null>(() => {
    const url = this.previewUrl();
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });

  readonly isOpen = computed(() => !!this.previewUrl());

  // ── Cache TTL ────────────────────────────────────────────────────────────────

  private prefetchedSource: string | null = null;
  private prefetchedUrl: string | null = null;
  private prefetchedAt: number | null = null;
  private prefetchedPromise: Promise<string | null> | null = null;

  constructor() {
    // Gestion de la classe body pour les overlays
    effect((onCleanup) => {
      const open = this.isOpen();
      this.doc.body.classList.toggle('ubax-overlay-open', open);
      onCleanup(() => {
        if (open) this.doc.body.classList.remove('ubax-overlay-open');
      });
    });

    // Pré-chargement de l'URL dès que fileUrl est disponible
    effect(() => {
      const url = this.fileUrl();
      if (!url) {
        this.clearCache();
        return;
      }
      if (this.getFreshCachedUrl(url) || this.prefetchedPromise) return;
      void this.prefetchUrl(url);
    });
  }

  // ── API publique ─────────────────────────────────────────────────────────────

  async open(): Promise<void> {
    const fileUrl = this.fileUrl();
    if (!fileUrl || this.opening()) return;

    const cached = this.getFreshCachedUrl(fileUrl);
    if (cached) {
      this.showPreview(cached);
      return;
    }

    this.opening.set(true);
    try {
      const resolved = this.prefetchedPromise
        ? await this.prefetchedPromise
        : await this.resolveReadUrl(fileUrl);

      if (!resolved) throw new Error('Missing read url');
      this.cacheUrl(fileUrl, resolved);
      this.showPreview(resolved);
    } catch {
      // Fallback : URL brute si la présignature échoue
      this.showPreview(fileUrl);
    } finally {
      this.opening.set(false);
    }
  }

  close(): void {
    this.previewUrl.set(null);
    this.previewIsImage.set(false);
    this.previewFullscreen.set(false);
    this.closed.emit();
  }

  toggleFullscreen(): void {
    this.previewFullscreen.update((v) => !v);
  }

  // ── Privé ────────────────────────────────────────────────────────────────────

  private showPreview(url: string): void {
    this.previewIsImage.set(isPreviewImage(url));
    this.previewUrl.set(url);
    this.previewFullscreen.set(false);
    this.opened.emit();
  }

  private async resolveReadUrl(fileUrl: string): Promise<string | null> {
    const response = await firstValueFrom(
      generateReadUrl(this.http, this.apiConfig.rootUrl, { fileUrl }),
    );
    return extractReadUrlFromResponse(response.body);
  }

  private async prefetchUrl(fileUrl: string): Promise<string | null> {
    if (this.prefetchedPromise) return this.prefetchedPromise;
    this.prefetchedPromise = this.resolveReadUrl(fileUrl)
      .then((url) => {
        if (url) this.cacheUrl(fileUrl, url);
        return url;
      })
      .catch(() => null)
      .finally(() => { this.prefetchedPromise = null; });
    return this.prefetchedPromise;
  }

  private cacheUrl(source: string, resolved: string): void {
    this.prefetchedSource = source;
    this.prefetchedUrl = resolved;
    this.prefetchedAt = Date.now();
  }

  private getFreshCachedUrl(source: string): string | null {
    if (
      this.prefetchedSource !== source ||
      !this.prefetchedUrl ||
      this.prefetchedAt == null
    ) return null;
    if (Date.now() - this.prefetchedAt > DOCUMENT_READ_URL_TTL_MS) {
      this.clearCache();
      return null;
    }
    return this.prefetchedUrl;
  }

  private clearCache(): void {
    this.prefetchedSource = null;
    this.prefetchedUrl = null;
    this.prefetchedAt = null;
    this.prefetchedPromise = null;
  }
}
