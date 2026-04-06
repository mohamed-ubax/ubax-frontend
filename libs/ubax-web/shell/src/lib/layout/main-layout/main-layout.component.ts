import { ChangeDetectionStrategy, Component, inject, isDevMode, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthStore, Role } from '@ubax-workspace/ubax-web-data-access';
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
    if (!this.authStore.token()) return;

    if (isDevMode() && !this.authStore.user()) {
      // Mock user en dev — retirer quand le backend est connecté
      this.authStore.setUser({
        id: 'dev-001',
        nom: 'Kouassi',
        prenom: 'Jean-Marc',
        email: 'jm.kouassi@ubax.io',
        role: Role.DG,
      });
      return;
    }

    if (!this.authStore.user()) {
      this.authStore.loadMe();
    }
  }
}
