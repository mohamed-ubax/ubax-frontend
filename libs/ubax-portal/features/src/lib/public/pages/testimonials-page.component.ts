import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
} from '@angular/core';
import { PublicShellComponent } from '@ubax-workspace/ubax-portal-layout';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

@Component({
  selector: 'ubax-testimonials-page',
  imports: [PublicShellComponent],
  templateUrl: './testimonials-page.component.html',
  styleUrl: './testimonials-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestimonialsPageComponent {
  private readonly elRef = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private gsapCtx: gsap.Context | undefined;

  protected readonly cards = [
    {
      name: 'Jean-Marc Bédi',
      role: 'Locataire',
      image: '/assets/portal-assets/rectangle-25189.webp',
      duration: '10 : 42',
    },
    {
      name: 'Ibrahim Diabaté',
      role: 'Locataire',
      image: '/assets/portal-assets/11.webp',
      duration: '05 : 47',
    },
    {
      name: 'Nadia Coulibaly',
      role: 'Locataire',
      image: '/assets/portal-assets/12.webp',
      duration: '10 : 42',
    },
    {
      name: 'Serge Koffi',
      role: 'Bailleur',
      image: '/assets/portal-assets/13.webp',
      duration: '10 : 42',
    },
    {
      name: 'Fatou Koné',
      role: 'Locataire',
      image: '/assets/portal-assets/14.webp',
      duration: '05 : 47',
    },
    {
      name: 'Jules Gomis',
      role: 'Locataire',
      image: '/assets/portal-assets/15.webp',
      duration: '10 : 42',
    },
  ];

  constructor() {
    afterNextRender(() => {
      gsap.registerPlugin(ScrollTrigger, SplitText);
      this.gsapCtx = gsap.context(
        () => this.initAnimations(),
        this.elRef.nativeElement,
      );
    });

    this.destroyRef.onDestroy(() => {
      this.gsapCtx?.revert();
    });
  }

  private initAnimations(): void {
    const ease = 'power3.out';

    // ── Title: SplitText line-by-line mask reveal ─────────────────────────────
    const h1 = this.elRef.nativeElement.querySelector(
      '.testimonials-header h1',
    ) as HTMLElement;

    const split = new SplitText(h1, {
      type: 'lines',
      mask: 'lines', // GSAP wraps each line in overflow:hidden automatically
    });

    gsap.from(split.lines, {
      y: '110%',
      duration: 1.2,
      ease: 'power3.out',
      stagger: 0.22,
    });

    // Divider expands after the last line lands
    const lastLineDelay = (split.lines.length - 1) * 0.22 + 1.2;
    gsap.to('.testimonials-divider', {
      scaleX: 1,
      duration: 0.7,
      delay: lastLineDelay + 0.1,
      ease: 'power2.inOut',
    });

    // Subtitle appears just after the divider starts expanding
    gsap.from('.testimonials-header p', {
      y: 20,
      opacity: 0,
      duration: 0.85,
      delay: lastLineDelay + 0.35,
      ease,
    });

    // Cards — masonry-style stagger reveal from bottom + slight scale
    const cards = document.querySelectorAll('.card');
    gsap.from(cards, {
      scrollTrigger: {
        trigger: '.cards-grid',
        start: 'top 82%',
      },
      y: 80,
      opacity: 0,
      scale: 0.92,
      duration: 0.75,
      stagger: {
        amount: 0.55,
        from: 'random',
      },
      ease: 'power3.out',
    });

    // Hover tilt effect — mouse tracking per card
    cards.forEach((card) => {
      const el = card as HTMLElement;

      el.addEventListener('mousemove', (e: MouseEvent) => {
        const rect = el.getBoundingClientRect();
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        const rx = ((e.clientY - rect.top - cy) / cy) * -8;
        const ry = ((e.clientX - rect.left - cx) / cx) * 8;
        gsap.to(el, {
          rotateX: rx,
          rotateY: ry,
          scale: 1.04,
          duration: 0.35,
          ease: 'power2.out',
          transformPerspective: 800,
          transformOrigin: 'center center',
        });
      });

      el.addEventListener('mouseleave', () => {
        gsap.to(el, {
          rotateX: 0,
          rotateY: 0,
          scale: 1,
          duration: 0.55,
          ease: 'elastic.out(1, 0.65)',
        });
      });
    });
  }
}
