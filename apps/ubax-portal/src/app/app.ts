import { Component, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PreloaderComponent } from './preloader/preloader.component';

@Component({
  imports: [RouterModule, PreloaderComponent],
  selector: 'ubax-portal-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly showPreloader = signal(
    !sessionStorage.getItem('ubax-loaded'),
  );

  protected onPreloaderDone(): void {
    sessionStorage.setItem('ubax-loaded', '1');
    this.showPreloader.set(false);
  }
}
