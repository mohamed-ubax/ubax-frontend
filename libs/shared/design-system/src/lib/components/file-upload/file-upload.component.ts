import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  forwardRef,
  input,
  model,
  output,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ButtonModule } from 'primeng/button';

type FileUploadValue = File | File[] | null;

function normalizeAcceptList(accept: string): string[] {
  return accept
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function matchesAccept(file: File, accept: string): boolean {
  const rules = normalizeAcceptList(accept);

  if (rules.length === 0) {
    return true;
  }

  return rules.some((rule) => {
    if (rule === '*/*') {
      return true;
    }

    if (rule.startsWith('.')) {
      return file.name.toLowerCase().endsWith(rule.toLowerCase());
    }

    if (rule.endsWith('/*')) {
      return file.type.startsWith(rule.slice(0, -1));
    }

    return (
      file.type === rule ||
      file.name
        .toLowerCase()
        .endsWith(`.${rule.split('/').pop()?.toLowerCase() ?? ''}`)
    );
  });
}

/**
 * UbaxFileUpload — Document upload zone with file preview and removal.
 */
@Component({
  selector: 'ubax-file-upload',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FileUploadComponent),
      multi: true,
    },
  ],
  template: `
    <div
      class="flex flex-col gap-4 rounded-xl border border-dashed border-neutral-300 bg-surface-card p-6 shadow-card"
      data-ubax-motion="surface"
    >
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="min-w-0">
          @if (label()) {
            <p class="text-2xl font-semibold text-neutral-900">
              {{ label() }}
            </p>
          }
          <p class="text-md text-neutral-500">
            Formats acceptés : PDF, JPG, PNG. Taille max {{ maxSizeMb() }} Mo.
          </p>
        </div>

        <p-button
          label="Choisir un fichier"
          icon="pi pi-upload"
          severity="secondary"
          [disabled]="disabled()"
          (onClick)="fileInput.click()"
        />
      </div>

      <input
        #fileInput
        type="file"
        class="hidden"
        [accept]="accept()"
        [multiple]="multiple()"
        [disabled]="disabled()"
        (change)="onFileChange(fileInput.files, fileInput)"
      />

      @if (selectedFiles().length === 0) {
        <div
          class="rounded-md border border-neutral-300 bg-neutral-50 px-4 py-3 text-md text-neutral-500"
        >
          Aucun fichier choisi
        </div>
      } @else {
        <div class="flex flex-col gap-2">
          @for (file of selectedFiles(); track file.name + file.size) {
            <div
              class="flex items-center justify-between gap-3 rounded-md border border-neutral-300 bg-neutral-50 px-4 py-3"
            >
              <div class="flex min-w-0 items-center gap-3">
                <span
                  class="flex size-10 items-center justify-center rounded-full bg-info-bg text-info"
                >
                  <i class="pi pi-file"></i>
                </span>
                <div class="min-w-0">
                  <p class="truncate text-md font-medium text-neutral-900">
                    {{ file.name }}
                  </p>
                  <p class="text-sm text-neutral-500">
                    {{ formatFileSize(file.size) }}
                  </p>
                </div>
              </div>

              <button
                type="button"
                class="inline-flex size-9 items-center justify-center rounded-sm text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                [disabled]="disabled()"
                (click)="removeFile(file)"
                [attr.aria-label]="'Supprimer ' + file.name"
              >
                <i class="pi pi-times"></i>
              </button>
            </div>
          }
        </div>
      }

      @if (errorMessage()) {
        <p class="text-sm text-danger">
          {{ errorMessage() }}
        </p>
      }
    </div>
  `,
})
export class FileUploadComponent implements ControlValueAccessor {
  readonly label = input<string>('');
  readonly accept = input<string>('application/pdf,image/*');
  readonly maxSizeMb = input<number>(5);
  readonly multiple = input<boolean>(false);
  readonly disabled = model<boolean>(false);

  readonly value = model<FileUploadValue>(null);
  readonly selectedFiles = model<File[]>([]);
  readonly errorMessage = model<string>('');
  readonly fileSelected = output<File>();
  readonly fileRemoved = output<void>();

  readonly hasSelection = computed(() => this.selectedFiles().length > 0);

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onChange: (value: FileUploadValue) => void = () => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onTouched: () => void = () => {};

  writeValue(value: FileUploadValue): void {
    if (!value) {
      this.selectedFiles.set([]);
      this.value.set(null);
      return;
    }

    const files = Array.isArray(value) ? value : [value];
    this.selectedFiles.set(files);
    this.value.set(this.multiple() ? files : files[0]);
  }

  registerOnChange(fn: (value: FileUploadValue) => void): void {
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

    const incomingFiles = Array.from(files ?? []);
    const acceptedFiles: File[] = [];
    const maxSizeBytes = this.maxSizeMb() * 1024 * 1024;

    for (const file of incomingFiles) {
      if (!matchesAccept(file, this.accept())) {
        this.errorMessage.set(`Le fichier ${file.name} n'est pas autorisé.`);
        continue;
      }

      if (file.size > maxSizeBytes) {
        this.errorMessage.set(
          `Le fichier ${file.name} dépasse ${this.maxSizeMb()} Mo.`,
        );
        continue;
      }

      acceptedFiles.push(file);
      if (!this.multiple()) {
        break;
      }
    }

    if (acceptedFiles.length === 0) {
      input.value = '';
      return;
    }

    this.errorMessage.set('');
    this.applySelection(acceptedFiles);
    acceptedFiles.forEach((file) => this.fileSelected.emit(file));
    input.value = '';
    this.onTouched();
  }

  removeFile(fileToRemove: File): void {
    if (this.disabled()) {
      return;
    }

    const nextFiles = this.selectedFiles().filter(
      (file) => file !== fileToRemove,
    );
    this.applySelection(nextFiles);
    this.fileRemoved.emit();
    this.onTouched();
  }

  formatFileSize(size: number): string {
    if (size < 1024) {
      return `${size} o`;
    }

    const sizeKb = size / 1024;
    if (sizeKb < 1024) {
      return `${sizeKb.toFixed(1)} Ko`;
    }

    return `${(sizeKb / 1024).toFixed(1)} Mo`;
  }

  private applySelection(files: File[]): void {
    const nextValue: FileUploadValue = this.multiple()
      ? files
      : (files[0] ?? null);
    this.selectedFiles.set(files);
    this.value.set(nextValue);
    this.onChange(nextValue);
  }
}
