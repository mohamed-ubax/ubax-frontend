import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import {
  TicketCategory,
  TicketingStore,
  TicketPriority,
} from '@ubax-workspace/ubax-web-data-access';

type PriorityOption = {
  value: TicketPriority;
  label: string;
  color: string;
  bg: string;
  icon: string;
};

type CategoryOption = {
  value: TicketCategory;
  label: string;
  icon: string;
};

const PRIORITY_OPTIONS: PriorityOption[] = [
  { value: 'LOW', label: 'Faible', color: 'var(--ubax-text-muted)', bg: '#f0f2f6', icon: 'pi pi-arrow-down' },
  { value: 'NORMAL', label: 'Normale', color: 'var(--ubax-info)', bg: 'var(--ubax-blue-soft)', icon: 'pi pi-minus' },
  { value: 'HIGH', label: 'Haute', color: 'var(--ubax-accent)', bg: 'var(--ubax-peach-soft)', icon: 'pi pi-arrow-up' },
  { value: 'URGENT', label: 'Urgente', color: 'var(--ubax-danger)', bg: 'var(--ubax-danger-soft)', icon: 'pi pi-bolt' },
];

const CATEGORY_OPTIONS: CategoryOption[] = [
  { value: 'PLUMBING', label: 'Plomberie', icon: 'pi pi-wrench' },
  { value: 'LEAK', label: 'Fuite', icon: 'pi pi-tint' },
  { value: 'ELECTRICAL', label: 'Électricité', icon: 'pi pi-bolt' },
  { value: 'LOCK', label: 'Serrurerie', icon: 'pi pi-lock' },
  { value: 'APPLIANCE', label: 'Électroménager', icon: 'pi pi-desktop' },
  { value: 'STRUCTURE', label: 'Structure', icon: 'pi pi-building' },
  { value: 'PEST', label: 'Nuisibles', icon: 'pi pi-exclamation-circle' },
  { value: 'COMMON_AREA', label: 'Parties communes', icon: 'pi pi-users' },
  { value: 'OTHER', label: 'Autre', icon: 'pi pi-question-circle' },
];

@Component({
  selector: 'ubax-ticket-create-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ticket-create-page.component.html',
  styleUrl: './ticket-create-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TicketCreatePageComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  readonly store = inject(TicketingStore);

  readonly priorityOptions = PRIORITY_OPTIONS;
  readonly categoryOptions = CATEGORY_OPTIONS;

  readonly submitted = signal(false);
  readonly uploadedFiles = signal<File[]>([]);
  readonly uploadPreviews = signal<string[]>([]);

  readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    description: ['', [Validators.required, Validators.minLength(20)]],
    category: ['' as TicketCategory, Validators.required],
    priority: ['NORMAL' as TicketPriority, Validators.required],
    contractId: ['', Validators.required],
  });

  readonly selectedPriority = computed(() =>
    PRIORITY_OPTIONS.find((p) => p.value === this.form.get('priority')?.value) ?? PRIORITY_OPTIONS[1],
  );

  readonly isFormValid = computed(() => this.form.valid);

  readonly titleError = computed(() => {
    const ctrl = this.form.get('title');
    if (!ctrl?.touched && !this.submitted()) return null;
    if (ctrl?.hasError('required')) return 'Le titre est obligatoire.';
    if (ctrl?.hasError('minlength')) return 'Minimum 3 caractères.';
    if (ctrl?.hasError('maxlength')) return 'Maximum 120 caractères.';
    return null;
  });

  readonly descriptionError = computed(() => {
    const ctrl = this.form.get('description');
    if (!ctrl?.touched && !this.submitted()) return null;
    if (ctrl?.hasError('required')) return 'La description est obligatoire.';
    if (ctrl?.hasError('minlength')) return 'Minimum 20 caractères.';
    return null;
  });

  readonly categoryError = computed(() => {
    const ctrl = this.form.get('category');
    if (!ctrl?.touched && !this.submitted()) return null;
    if (ctrl?.hasError('required')) return 'Veuillez sélectionner une catégorie.';
    return null;
  });

  readonly contractError = computed(() => {
    const ctrl = this.form.get('contractId');
    if (!ctrl?.touched && !this.submitted()) return null;
    if (ctrl?.hasError('required')) return 'L\'identifiant du contrat est obligatoire.';
    return null;
  });

  selectCategory(cat: TicketCategory): void {
    this.form.get('category')?.setValue(cat);
    this.form.get('category')?.markAsTouched();
  }

  selectPriority(priority: TicketPriority): void {
    this.form.get('priority')?.setValue(priority);
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    const files = Array.from(input.files);
    this.uploadedFiles.update((prev) => [...prev, ...files]);

    files.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.uploadPreviews.update((prev) => [
            ...prev,
            e.target?.result as string,
          ]);
        };
        reader.readAsDataURL(file);
      } else {
        this.uploadPreviews.update((prev) => [...prev, '']);
      }
    });
  }

  removeFile(index: number): void {
    this.uploadedFiles.update((files) => files.filter((_, i) => i !== index));
    this.uploadPreviews.update((previews) =>
      previews.filter((_, i) => i !== index),
    );
  }

  submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { title, description, category, priority, contractId } =
      this.form.getRawValue();

    this.store.create!({
      body: {
        title: title || undefined,
        description: description || undefined,
        category: category || undefined,
        priority: priority || undefined,
        contractId,
      },
    });

    this.router.navigate(['/tickets']);
  }

  cancel(): void {
    this.router.navigate(['/tickets']);
  }
}
