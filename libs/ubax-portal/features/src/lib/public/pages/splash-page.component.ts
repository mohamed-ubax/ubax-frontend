import {
  Component,
  HostBinding,
  HostListener,
  OnInit,
  OnDestroy,
  ElementRef,
  inject,
  afterNextRender,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { gsap } from 'gsap';

@Component({
  selector: 'ubax-splash-page',
  imports: [RouterLink],
  templateUrl: './splash-page.component.html',
  styleUrl: './splash-page.component.scss',
})
export class SplashPageComponent implements OnInit, OnDestroy {
  private readonly _el = inject(ElementRef<HTMLElement>);
  private readonly designWidth = 1731;
  private readonly designHeight = 1095;

  private _mouseX = 0;
  private _mouseY = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _tickerFn?: (...args: any[]) => void;
  private _mouseMoveHandler?: (e: MouseEvent) => void;

  @HostBinding('style.--splash-scene-scale')
  protected sceneScale = '1';

  @HostBinding('style.--splash-orbit-shift-x')
  protected orbitShiftX = '92px';

  constructor() {
    afterNextRender(() => this._initParallax());
  }

  ngOnInit(): void {
    this.updateResponsiveVars();
  }

  ngOnDestroy(): void {
    if (this._mouseMoveHandler) {
      document.removeEventListener('mousemove', this._mouseMoveHandler);
    }
    if (this._tickerFn) {
      gsap.ticker.remove(this._tickerFn);
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.updateResponsiveVars();
  }

  private _initParallax(): void {
    const host = this._el.nativeElement as HTMLElement;
    const photos = Array.from(
      host.querySelectorAll<HTMLElement>('.orbit-photo'),
    );
    const logoMark = host.querySelector<HTMLElement>('.center-logo-mark');
    const logoBg = host.querySelector<HTMLElement>('.center-logo-bg');
    const dots = Array.from(host.querySelectorAll<HTMLElement>('.orbit-dot'));

    // Per-element parallax depths (px at normalized mouse ±1)
    const photoDepths = [18, 14, 22, 12, 20, 16];
    const dotDepths = [10, 13, 7, 11, 9, 12];

    // Flat list: photos → logoMark → logoBg → dots
    const allEls: HTMLElement[] = [
      ...photos,
      ...(logoMark ? [logoMark] : []),
      ...(logoBg ? [logoBg] : []),
      ...dots,
    ];
    const allDepths = [
      ...photoDepths,
      ...(logoMark ? [8] : []),
      ...(logoBg ? [6] : []),
      ...dotDepths.slice(0, dots.length),
    ];

    // Lerp accumulators
    const lerpX = new Array(allEls.length).fill(0);
    const lerpY = new Array(allEls.length).fill(0);

    this._mouseMoveHandler = (e: MouseEvent) => {
      this._mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      this._mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    this._tickerFn = () => {
      allEls.forEach((el, i) => {
        // Smooth lerp (factor 0.07 ≈ nice eased lag)
        lerpX[i] += (this._mouseX * allDepths[i] - lerpX[i]) * 0.07;
        lerpY[i] += (this._mouseY * allDepths[i] - lerpY[i]) * 0.07;
        el.style.setProperty('--px', `${lerpX[i].toFixed(2)}px`);
        el.style.setProperty('--py', `${lerpY[i].toFixed(2)}px`);
      });
    };

    document.addEventListener('mousemove', this._mouseMoveHandler);
    gsap.ticker.add(this._tickerFn);
  }

  private updateResponsiveVars(): void {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const scaleX = viewportWidth / this.designWidth;
    const scaleY = viewportHeight / this.designHeight;
    const minScale = viewportWidth <= 768 ? 0.34 : 0.42;
    const clampedScale = Math.min(
      1,
      Math.max(minScale, Math.min(scaleX, scaleY)),
    );

    const normalized = Math.max(0, Math.min(1, (clampedScale - 0.42) / 0.58));
    const orbitShift = 24 + normalized * 68;

    this.sceneScale = clampedScale.toFixed(4);
    this.orbitShiftX = `${orbitShift.toFixed(1)}px`;
  }
}
