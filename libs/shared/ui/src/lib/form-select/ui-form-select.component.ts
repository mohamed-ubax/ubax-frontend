import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  input,
  model,
  signal,
} from '@angular/core';

@Component({
  selector: 'ubax-ui-form-select',
  standalone: true,
  templateUrl: './ui-form-select.component.html',
  styleUrl: './ui-form-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiFormSelectComponent {
  readonly label = input('');
  readonly options = input<readonly string[]>([]);
  readonly leadingIconSrc = input('');
  readonly disabled = input(false);
  readonly value = model('');

  protected readonly isOpen = signal(false);

  private readonly el = inject(ElementRef<HTMLElement>);

  protected toggle(): void {
    if (!this.disabled()) {
      this.isOpen.update((v) => !v);
    }
  }

  protected select(option: string): void {
    this.value.set(option);
    this.isOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (!this.el.nativeElement.contains(event.target as Node)) {
      this.isOpen.set(false);
    }
  }
}
