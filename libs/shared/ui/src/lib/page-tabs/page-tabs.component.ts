import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
  output,
} from '@angular/core';

export interface PageTab {
  label: string;
  value: string;
}

@Component({
  selector: 'ubax-page-tabs',
  standalone: true,
  imports: [],
  templateUrl: './page-tabs.component.html',
  styleUrl: './page-tabs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageTabsComponent {
  readonly tabs = input.required<PageTab[]>();
  readonly activeTab = model.required<string>();
  readonly tabChange = output<string>();

  protected select(value: string): void {
    this.activeTab.set(value);
    this.tabChange.emit(value);
  }
}
