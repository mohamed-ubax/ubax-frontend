import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
  input,
  output,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'ubax-contrat-cancel-dialog',
  standalone: true,
  templateUrl: './contrat-cancel-dialog.component.html',
  styleUrl: './contrat-cancel-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContratCancelDialogComponent implements OnInit, OnDestroy {
  private readonly doc = inject(DOCUMENT);

  readonly loading = input<boolean>(false);
  readonly confirm = output<void>();
  readonly dismissed = output<void>();

  ngOnInit(): void {
    this.doc.body.classList.add('ubax-overlay-open');
  }

  ngOnDestroy(): void {
    this.doc.body.classList.remove('ubax-overlay-open');
  }
}
