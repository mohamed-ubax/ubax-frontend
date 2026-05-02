import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
  output,
} from '@angular/core';
import { UbaxMorphTabsDirective } from '../morph-tabs/morph-tabs.directive';

export type PageTab = {
  label: string;
  value: string;};

@Component({
  selector: 'ubax-page-tabs',
  standalone: true,
  imports: [UbaxMorphTabsDirective],
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
