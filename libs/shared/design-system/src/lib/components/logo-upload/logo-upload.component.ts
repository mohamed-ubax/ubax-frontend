import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  forwardRef,
  input,
  model,
  OnDestroy,
  output,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ButtonModule } from 'primeng/button';

export type LogoUploadSize = 'sm' | 'md' | 'lg';

const SIZE_CLASSES: Record<LogoUploadSize, string> = {
  sm: 'min-h-[134px] p-4',
  md: 'min-h-[185px] p-6',
  lg: 'min-h-[220px] p-6',
};

/**
 * UbaxLogoUpload — Logo upload zone with preview circle.
 */
@Component({
  selector: 'ubax-logo-upload',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => LogoUploadComponent),
      multi: true,
    },
  ],
  template: `
    <div
      class="flex flex-col gap-4 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 shadow-card"
      [ngClass]="sizeClasses()"
      data-ubax-motion="surface"
    >
      <div
        class="flex flex-1 flex-col items-center justify-center gap-4 text-center"
      >
        <div
          class="flex size-24 items-center justify-center overflow-hidden rounded-full border border-neutral-300 bg-surface-card"
        >
          @if (displayUrl()) {
            <img
              [src]="displayUrl()"
              [alt]="altText()"
              class="size-full object-cover"
            />
          } @else {
            <i class="pi pi-cloud-upload text-5xl text-neutral-500"></i>
          }
        </div>

        <div class="flex flex-col gap-1">
          <p class="text-2xl font-semibold text-neutral-900">
            {{ title() }}
          </p>
          <p class="text-md text-neutral-500">
            {{ subtitle() }}
          </p>
        </div>

        <div class="flex items-center gap-3">
          <p-button
            label="Importer mon logo"
            icon="pi pi-upload"
            severity="secondary"
            [disabled]="disabled()"
            (onClick)="fileInput.click()"
          />

          @if (hasLogo()) {
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-sm border border-neutral-300 bg-surface-card px-4 py-2 text-md font-medium text-neutral-900 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
              [disabled]="disabled()"
              (click)="removeLogo()"
            >
              Retirer
            </button>
          }
        </div>
      </div>

      <input
        #fileInput
        type="file"
        class="hidden"
        accept="image/*"
        [disabled]="disabled()"
        (change)="onFileChange(fileInput.files, fileInput)"
      />
    </div>
  `,
})
export class LogoUploadComponent implements ControlValueAccessor, OnDestroy {
  readonly previewUrl = input<string | null>(null);
  readonly size = input<LogoUploadSize>('md');
  readonly title = input<string>('Importer mon logo');
  readonly subtitle = input<string>(
    'PNG ou JPG, de préférence sur fond transparent.',
  );
  readonly altText = input<string>('Prévisualisation du logo');

  readonly disabled = model<boolean>(false);
  readonly value = model<File | null>(null);
  readonly localPreviewUrl = model<string | null>(null);
  readonly imageSelected = output<File>();
  readonly imageRemoved = output<void>();

  readonly hasLogo = computed(() => Boolean(this.displayUrl()));
  readonly sizeClasses = computed(() => SIZE_CLASSES[this.size()]);
  readonly displayUrl = computed(
    () => this.localPreviewUrl() ?? this.previewUrl(),
  );

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onChange: (value: File | null) => void = () => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onTouched: () => void = () => {};
  private objectUrl: string | null = null;

  writeValue(value: File | null): void {
    this.value.set(value);
    this.syncPreview(value);
  }

  registerOnChange(fn: (value: File | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  onFileChange(files: FileList | null, input: HTMLInputElement): void {
    if (this.disabled()) {
      return;
    }

    const file = files?.item(0) ?? null;
    this.applyFile(file);
    input.value = '';
    this.onTouched();
  }

  removeLogo(): void {
    if (this.disabled()) {
      return;
    }

    this.applyFile(null);
    this.imageRemoved.emit();
    this.onTouched();
  }

  ngOnDestroy(): void {
    this.revokeObjectUrl();
  }

  private applyFile(file: File | null): void {
    this.value.set(file);
    this.syncPreview(file);
    this.onChange(file);

    if (file) {
      this.imageSelected.emit(file);
    }
  }

  private syncPreview(file: File | null): void {
    this.revokeObjectUrl();

    if (!file) {
      this.localPreviewUrl.set(null);
      return;
    }

    this.objectUrl = URL.createObjectURL(file);
    this.localPreviewUrl.set(this.objectUrl);
  }

  private revokeObjectUrl(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }
}
