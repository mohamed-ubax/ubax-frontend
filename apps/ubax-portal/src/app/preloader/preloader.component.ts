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
      duration: 1.05,
      ease: 'power4.out',
      stagger: 0.13,
    });

    // ── 2. Counter + fill bar tick (runs from t=0.1, parallel) ───────────
    tl.to(
      proxy,
      {
        v: 100,
        duration: 2.15,
        ease: 'power2.inOut',
        onUpdate: () => {
          const v = Math.round(proxy.v);
          count.textContent = String(v).padStart(2, '0');
          fill.style.transform = `scaleX(${v / 100})`;
        },
      },
      0.1,
    );

    // ── 3. Slight hold at 100 ─────────────────────────────────────────────
    tl.to({}, { duration: 0.18 });

    // ── 4. Words collapse UPWARD (stagger reverse order) ─────────────────
    tl.to([w3, w2, w1], {
      yPercent: -120,
      duration: 0.5,
      ease: 'power4.in',
      stagger: 0.09,
    });

    // ── 5. Entire panel slides up, revealing the page beneath ─────────────
    tl.to(
      host,
      {
        yPercent: -100,
        duration: 0.88,
        ease: 'expo.inOut',
        onComplete: () => this.done.emit(),
      },
      '-=0.3',
    );
  }
}
