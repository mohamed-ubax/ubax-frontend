import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PublicShellComponent } from '@ubax-workspace/ubax-portal-layout';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ALL_GUIDES, Guide, GUIDES_MAP } from './formations.data';

@Component({
  selector: 'ubax-formation-detail-page',
  imports: [PublicShellComponent, RouterLink],
  templateUrl: './formation-detail-page.component.html',
  styleUrl: './formation-detail-page.component.scss',
})
export class FormationDetailPageComponent {
  private readonly _el = inject(ElementRef<HTMLElement>);
  private readonly _destroyRef = inject(DestroyRef);
  private _gsapCtx: gsap.Context | null = null;

  protected readonly guide: Guide | null;
  protected readonly relatedGuides: Guide[];

  constructor() {
    const slug = inject(ActivatedRoute).snapshot.paramMap.get('slug') ?? '';
    this.guide = GUIDES_MAP.get(slug) ?? null;
    this.relatedGuides = ALL_GUIDES.filter((g) => g.slug !== slug).slice(0, 3);

    if (!this.guide) {
      inject(Router).navigate(['/formations']);
      return;
    }

    afterNextRender(() => this._initAnimations());
  }

  private _initAnimations(): void {
    const el = this._el.nativeElement as HTMLElement;
    gsap.registerPlugin(ScrollTrigger);

    this._gsapCtx = gsap.context(() => {
      // Hero image reveal
      gsap.from('.fdp-hero__img', {
        scale: 1.06,
        opacity: 0,
        duration: 1.1,
        ease: 'power3.out',
      });

      // Title slide up
      gsap.from('.fdp-hero__title', {
        y: 40,
        opacity: 0,
        duration: 0.9,
        delay: 0.2,
        ease: 'power3.out',
      });

      // Date badge
      gsap.from('.fdp-hero__date', {
        y: 16,
        opacity: 0,
        duration: 0.7,
        delay: 0.45,
        ease: 'power3.out',
      });

      // Article body
      gsap.from('.fdp-article', {
        scrollTrigger: { trigger: '.fdp-content', start: 'top 82%' },
        y: 40,
        opacity: 0,
        duration: 0.85,
        ease: 'power3.out',
      });

      // Sidebar
      gsap.from('.fdp-sidebar', {
        scrollTrigger: { trigger: '.fdp-content', start: 'top 82%' },
        y: 40,
        opacity: 0,
        duration: 0.85,
        delay: 0.15,
        ease: 'power3.out',
      });
    }, el);

    this._destroyRef.onDestroy(() => {
      this._gsapCtx?.revert();
      this._gsapCtx = null;
    });
  }
}
