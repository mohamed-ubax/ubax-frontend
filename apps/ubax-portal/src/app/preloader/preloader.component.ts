import {
  Component,
  ElementRef,
  EventEmitter,
  Output,
  ViewChild,
  afterNextRender,
} from '@angular/core';
import { gsap } from 'gsap';

@Component({
  selector: 'ubax-portal-preloader',
  templateUrl: './preloader.component.html',
  styleUrl: './preloader.component.scss',
})
export class PreloaderComponent {
  @Output() readonly done = new EventEmitter<void>();

  @ViewChild('hostEl') private readonly hostRef!: ElementRef<HTMLElement>;
  @ViewChild('word1El') private readonly w1Ref!: ElementRef<HTMLElement>;
  @ViewChild('word2El') private readonly w2Ref!: ElementRef<HTMLElement>;
  @ViewChild('word3El') private readonly w3Ref!: ElementRef<HTMLElement>;
  @ViewChild('countEl') private readonly countRef!: ElementRef<HTMLElement>;
  @ViewChild('fillEl') private readonly fillRef!: ElementRef<HTMLElement>;

  constructor() {
    afterNextRender(() => this._play());
  }

  private _play(): void {
    const host = this.hostRef.nativeElement;
    const w1 = this.w1Ref.nativeElement;
    const w2 = this.w2Ref.nativeElement;
    const w3 = this.w3Ref.nativeElement;
    const count = this.countRef.nativeElement;
    const fill = this.fillRef.nativeElement;

    const proxy = { v: 0 };
    const tl = gsap.timeline();

    // ── 1. Words sweep UP into view from below ────────────────────────────
    tl.from([w1, w2, w3], {
      yPercent: 120,
      duration: 1.4,
      ease: 'power4.out',
      stagger: 0.2,
    });

    // ── 2. Counter + fill bar tick (runs from t=0.1, parallel) ───────────
    tl.to(
      proxy,
      {
        v: 100,
        duration: 3.8,
        ease: 'power1.inOut',
        onUpdate: () => {
          const v = Math.round(proxy.v);
          count.textContent = String(v).padStart(2, '0');
          fill.style.transform = `scaleX(${v / 100})`;
        },
      },
      0.1,
    );

    // ── 3. Hold at 100 — let the viewer breathe ───────────────────────────
    tl.to({}, { duration: 0.9 });

    // ── 4. Words collapse UPWARD (stagger reverse order) ─────────────────
    tl.to([w3, w2, w1], {
      yPercent: -120,
      duration: 0.72,
      ease: 'power3.in',
      stagger: 0.13,
    });

    // ── 5. Entire panel slides up, revealing the page beneath ─────────────
    tl.to(
      host,
      {
        yPercent: -100,
        duration: 1.2,
        ease: 'expo.inOut',
        onComplete: () => this.done.emit(),
      },
      '-=0.35',
    );
  }
}
