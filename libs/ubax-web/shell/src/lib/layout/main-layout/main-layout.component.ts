import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toast } from 'primeng/toast';
import { AuthStore } from '@ubax-workspace/ubax-web-data-access/auth-store';
import { DevRoleSwitcherComponent } from '../dev-role-switcher/dev-role-switcher.component';
import { UbaxAutoMotionDirective } from '../motion/auto-motion.directive';
import { TopbarComponent } from '../topbar/topbar.component';
import { InactivityService } from '../../services/inactivity.service';

@Component({
  selector: 'ubax-main-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    Toast,
    TopbarComponent,
    DevRoleSwitcherComponent,
    UbaxAutoMotionDirective,
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  readonly authStore = inject(AuthStore);
  private readonly inactivity = inject(InactivityService);

  ngOnInit(): void {
    // Le profil principal vient du JWT, puis les sous-rôles/scope sont
    // enrichis depuis l'API quand une session persistée existe.
    if (this.authStore.token()) {
      this.authStore.loadMe();
      // Démarre la surveillance d'inactivité (30 min → déconnexion auto).
      this.inactivity.start();
    }
  }

  ngOnDestroy(): void {
    this.inactivity.stop();
  }
}
