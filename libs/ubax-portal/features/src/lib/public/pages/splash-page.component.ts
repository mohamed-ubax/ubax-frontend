import {
  Component,
  HostBinding,
  HostListener,
  OnInit,
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
export class SplashPageComponent implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly designWidth = 1731;
  private readonly designHeight = 1095;

  @HostBinding('style.--splash-scene-scale')
  protected sceneScale = '1';

  @HostBinding('style.--splash-orbit-shift-x')
  protected orbitShiftX = '92px';

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.updateResponsiveVars();
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    // resize only fires in the browser — no platform guard needed
    this.updateResponsiveVars();
  }

  private updateResponsiveVars(): void {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (viewportWidth <= 768) {
      // Mobile: CSS manages layout — no design-space scaling
      this.sceneScale = '1';
      this.orbitShiftX = '0px';
      return;
    }

    const scaleX = viewportWidth / this.designWidth;
    const scaleY = viewportHeight / this.designHeight;
    const rawScale = Math.min(scaleX, scaleY);

    // Allow up to 1.5 for large/4K displays; floor at 0.42 for small tablets
    const clampedScale = Math.min(1.5, Math.max(0.42, rawScale));

    // Orbit shift interpolates 24 → 92px over the 0.42 → 1.0 scale range
    const normalized = Math.max(0, Math.min(1, (clampedScale - 0.42) / 0.58));
    const orbitShift = 24 + normalized * 68;

    this.sceneScale = clampedScale.toFixed(4);
    this.orbitShiftX = `${orbitShift.toFixed(1)}px`;
  }
}
