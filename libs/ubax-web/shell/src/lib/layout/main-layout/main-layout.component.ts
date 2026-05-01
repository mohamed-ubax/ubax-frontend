import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toast } from 'primeng/toast';
import { AuthStore } from '@ubax-workspace/ubax-web-data-access';
import { DevRoleSwitcherComponent } from '../dev-role-switcher/dev-role-switcher.component';
import { UbaxAutoMotionDirective } from '../motion/auto-motion.directive';
import { TopbarComponent } from '../topbar/topbar.component';

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
export class MainLayoutComponent implements OnInit {
  readonly authStore = inject(AuthStore);

  ngOnInit(): void {
    // Le mock dev n'est injecté que s'il a été activé explicitement. Sinon,
    // toute session persistée est réhydratée depuis l'API réelle.
    if (this.authStore.token() && !this.authStore.user()) {
      this.authStore.loadMe();
    }
  }
}
