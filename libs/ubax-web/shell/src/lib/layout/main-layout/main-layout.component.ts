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
import { UbaxAutoMotionDirective } from '../motion/auto-motion.directive';
import { TopbarComponent } from '../topbar/topbar.component';
import { InactivityService } from '../../services/inactivity.service';

@Component({
  selector: 'ubax-main-layout',
  standalone: true,
  imports: [RouterOutlet, Toast, TopbarComponent, UbaxAutoMotionDirective],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  readonly authStore = inject(AuthStore);
  private readonly inactivity = inject(InactivityService);

  ngOnInit(): void {
    if (this.authStore.token()) {
      this.inactivity.start();
    }
  }

  ngOnDestroy(): void {
    this.inactivity.stop();
  }
}
