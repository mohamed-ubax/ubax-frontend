import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { UiAccordionItem } from './ui-accordion.types';

@Component({
  selector: 'ubax-ui-accordion',
  standalone: true,
  templateUrl: './ui-accordion.component.html',
  styleUrl: './ui-accordion.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiAccordionComponent {
  readonly items = input<UiAccordionItem[]>([]);
  protected openIndex = 0;

  protected toggle(index: number): void {
    this.openIndex = this.openIndex === index ? -1 : index;
  }
}
