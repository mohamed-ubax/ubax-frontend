import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

export type CommercialRequestDetail = {
  readonly firstName: string;
  readonly lastName: string;
  readonly phone: string;
  readonly property: string;
  readonly requestType: string;
  readonly date: string;
  readonly requestTitle: string;
  readonly requestMessage: readonly string[];
  readonly replyTitle: string;
  readonly replyMessage: string;};

@Component({
  selector: 'ubax-demande-detail-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './demande-detail-panel.component.html',
  styleUrl: './demande-detail-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'closePanel()',
  },
})
export class DemandeDetailPanelComponent {
  readonly request = input.required<CommercialRequestDetail>();
  readonly title = input<string>('Détails demande d’information');
  readonly closeIconSrc = input.required<string>();

  readonly close = output<void>();

  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }

  protected closePanel(): void {
    this.close.emit();
  }
}
