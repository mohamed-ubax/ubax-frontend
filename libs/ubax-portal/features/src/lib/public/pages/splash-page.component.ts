import { Component, HostBinding, HostListener, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'ubax-splash-page',
  imports: [RouterLink],
  templateUrl: './splash-page.component.html',
  styleUrl: './splash-page.component.scss',
})
export class SplashPageComponent implements OnInit {
  private readonly designWidth = 1731;
  private readonly designHeight = 1095;

  @HostBinding('style.--splash-scene-scale')
  protected sceneScale = '1';

  @HostBinding('style.--splash-orbit-shift-x')
  protected orbitShiftX = '92px';

  ngOnInit(): void {
    this.updateResponsiveVars();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.updateResponsiveVars();
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
