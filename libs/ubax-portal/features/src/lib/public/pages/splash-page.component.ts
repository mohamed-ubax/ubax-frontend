import {
  Component,
  HostBinding,
  HostListener,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'ubax-splash-page',
  imports: [RouterLink],
  templateUrl: './splash-page.component.html',
  styleUrl: './splash-page.component.scss',
})
export class SplashPageComponent {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly designWidth = 1731;
  private readonly designHeight = 1095;
  private resizeTimer?: ReturnType<typeof setTimeout>;

  @HostBinding('style.--splash-scene-scale')
  protected sceneScale: string;

  @HostBinding('style.--splash-orbit-shift-x')
  protected orbitShiftX: string;

  constructor() {
    // Compute layout vars synchronously so the first render uses correct values,
    // preventing the brief layout-jump that occurred when ngOnInit ran post-render.
    const vars = this.computeVars();
    this.sceneScale = vars.scale;
    this.orbitShiftX = vars.shiftX;
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    // Debounce: rapid resize events (e.g. Android URL-bar collapse/expand)
    // used to cause visible distortion by triggering multiple layout recalcs.
    clearTimeout(this.resizeTimer);
    this.resizeTimer = setTimeout(() => {
      const vars = this.computeVars();
      this.sceneScale = vars.scale;
      this.orbitShiftX = vars.shiftX;
    }, 150);
  }

  private computeVars(): { scale: string; shiftX: string } {
    if (!isPlatformBrowser(this.platformId)) {
      return { scale: '1', shiftX: '92px' };
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (viewportWidth <= 768) {
      // Mobile: CSS manages layout — no design-space scaling
      return { scale: '1', shiftX: '0px' };
    }

    const scaleX = viewportWidth / this.designWidth;
    const scaleY = viewportHeight / this.designHeight;
    const rawScale = Math.min(scaleX, scaleY);

    // Allow up to 1.5 for large/4K displays; floor at 0.42 for small tablets
    const clampedScale = Math.min(1.5, Math.max(0.42, rawScale));

    // Orbit shift interpolates 24 → 92px over the 0.42 → 1.0 scale range
    const normalized = Math.max(0, Math.min(1, (clampedScale - 0.42) / 0.58));
    const orbitShift = 24 + normalized * 68;

    return {
      scale: clampedScale.toFixed(4),
      shiftX: `${orbitShift.toFixed(1)}px`,
    };
  }
}
