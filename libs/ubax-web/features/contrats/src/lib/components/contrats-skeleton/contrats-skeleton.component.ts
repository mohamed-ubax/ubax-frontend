import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ubax-contrats-skeleton',
  standalone: true,
  template: `
    <div class="sk-wrap">
      <div class="sk-header">
        <div class="sk-block sk-title"></div>
        <div class="sk-block sk-btn"></div>
      </div>
      <div class="sk-chips">
        @for (c of [1,2,3,4]; track c) {
          <div class="sk-block sk-chip"></div>
        }
      </div>
      <div class="sk-tabs">
        @for (t of [1,2,3,4,5]; track t) {
          <div class="sk-block sk-tab"></div>
        }
      </div>
      <div class="sk-table">
        <div class="sk-thead">
          @for (c of cols; track c) { <div class="sk-block sk-th"></div> }
        </div>
        @for (r of rows; track r) {
          <div class="sk-row">
            <div class="sk-block sk-td"></div>
            <div class="sk-block sk-td-sm"></div>
            <div class="sk-block sk-td-sm"></div>
            <div class="sk-block sk-td-sm"></div>
            <div class="sk-block sk-td-badge"></div>
            <div class="sk-block sk-td-sm"></div>
            <div class="sk-block sk-td-sm"></div>
            <div class="sk-block sk-td-icon"></div>
          </div>
        }
      </div>
    </div>
  `,
  styleUrl: './contrats-skeleton.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContratsSkeletonComponent {
  readonly cols = [1, 2, 3, 4, 5, 6, 7, 8];
  readonly rows = [1, 2, 3, 4, 5];
}
