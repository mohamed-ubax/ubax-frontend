import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  NgZone,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  BackToTopComponent,
  PublicShellComponent,
} from '@ubax-workspace/ubax-portal-layout';
import gsap from 'gsap';

@Component({
  selector: 'ubax-adhesion-validation-page',
  standalone: true,
  imports: [PublicShellComponent, BackToTopComponent, RouterLink],
  templateUrl: './adhesion-validation-page.component.html',
  styleUrl: './adhesion-validation-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdhesionValidationPageComponent {
  private readonly _el = inject(ElementRef<HTMLElement>);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _zone = inject(NgZone);
  private _gsapCtx: gsap.Context | null = null;

  protected readonly orbitAsset =
    'assets/portal-assets/adhesion-success/Ellipse 21900.svg';
  protected readonly elementsAsset =
    'assets/portal-assets/adhesion-success/Elements.svg';
  protected readonly homeAsset =
    'assets/portal-assets/adhesion-success/material-symbols_home.svg';

  constructor() {
    afterNextRender(() => {
      if (
        globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
      ) {
        return;
      }

      this._zone.runOutsideAngular(() => {
        this._gsapCtx = gsap.context(
          () => this._initAnimations(),
          this._el.nativeElement,
        );
      });
    });

    this._destroyRef.onDestroy(() => {
      this._gsapCtx?.revert();
      this._gsapCtx = null;
    });
  }

  private _initAnimations(): void {
    const timeline = gsap.timeline({
      defaults: { ease: 'power3.out' },
    });

    timeline
      .from('.adhesion-validation__card', {
        y: 38,
        autoAlpha: 0,
        scale: 0.985,
        duration: 0.82,
      })
      .from(
        '.adhesion-validation__orbit',
        {
          autoAlpha: 0,
          scale: 0.9,
          duration: 0.62,
        },
        '-=0.48',
      )
      .from(
        '.adhesion-validation__art-elements',
        {
          autoAlpha: 0,
          scale: 0.92,
          duration: 0.5,
        },
        '-=0.34',
      )
      .from(
        '.adhesion-validation__message',
        {
          y: 18,
          autoAlpha: 0,
          duration: 0.58,
        },
        '-=0.28',
      )
      .from(
        '.adhesion-validation__cta',
        {
          y: 16,
          autoAlpha: 0,
          scale: 0.96,
          duration: 0.52,
        },
        '-=0.18',
      );

    gsap.to('.adhesion-validation__art', {
      y: -8,
      duration: 2.8,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });

    gsap.to('.adhesion-validation__art-elements', {
      rotate: 5,
      transformOrigin: '50% 50%',
      duration: 3.2,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });
  }
}
