import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Input,
  ViewChild,
  afterNextRender,
  inject,
} from '@angular/core';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LenisService } from '../lenis.service';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'ubax-back-to-top',
  standalone: true,
  template: `
    <button
      #bttBtn
      class="btt"
      aria-label="Remonter en haut de page"
      (click)="scrollToTop()"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <polyline points="18 15 12 9 6 15"></polyline>
      </svg>
    </button>
  `,
  styleUrl: './back-to-top.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackToTopComponent {
  /** Scroll offset in pixels after which the button appears. */
  @Input() offset = 300;

  private readonly _lenis = inject(LenisService);
  private readonly _destroyRef = inject(DestroyRef);

  @ViewChild('bttBtn') private readonly _bttRef!: ElementRef<HTMLButtonElement>;

  constructor() {
    afterNextRender(() => this._init());
  }

  scrollToTop(): void {
    const lenis = this._lenis.instance;
    if (lenis) {
      lenis.scrollTo(0, {
        duration: 2,
        easing: (t: number) => 1 - Math.pow(1 - t, 4),
      });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  private _init(): void {
    gsap.registerPlugin(ScrollTrigger);
    const btt = this._bttRef.nativeElement;

    const st = ScrollTrigger.create({
      trigger: document.documentElement,
      start: `top+=${this.offset} top`,
      onEnter: () =>
        gsap.to(btt, {
          opacity: 1,
          y: 0,
          duration: 0.55,
          ease: 'power3.out',
          pointerEvents: 'auto',
          overwrite: true,
        }),
      onLeaveBack: () =>
        gsap.to(btt, {
          opacity: 0,
          y: 18,
          duration: 0.4,
          ease: 'power2.in',
          pointerEvents: 'none',
          overwrite: true,
        }),
    });

    this._destroyRef.onDestroy(() => st.kill());
  }
}
