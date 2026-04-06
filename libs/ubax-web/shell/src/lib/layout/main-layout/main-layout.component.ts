import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthStore } from '@ubax-workspace/ubax-web-data-access';
import { TopbarComponent } from '../topbar/topbar.component';

@Component({
  selector: 'ubax-main-layout',
  standalone: true,
  imports: [RouterOutlet, TopbarComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent implements OnInit {
  readonly authStore = inject(AuthStore);

  ngOnInit(): void {
    // En dev, le user mock est injecté via APP_INITIALIZER (app.config.ts).
    // En prod, on charge le profil depuis l'API si le token existe mais pas le user.
    if (this.authStore.token() && !this.authStore.user()) {
      this.authStore.loadMe();
    }
  }
}
