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
import { type CreateTicketRequest } from '@ubax-workspace/shared-api-types';
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
  {
    value: 'LOW',
    label: 'Faible',
    color: 'var(--ubax-text-muted)',
    bg: '#f0f2f6',
    icon: 'pi pi-arrow-down',
  },
  {
    value: 'NORMAL',
    label: 'Normale',
    color: 'var(--ubax-info)',
    bg: 'var(--ubax-blue-soft)',
    icon: 'pi pi-minus',
  },
  {
    value: 'HIGH',
    label: 'Haute',
    color: 'var(--ubax-accent)',
    bg: 'var(--ubax-peach-soft)',
    icon: 'pi pi-arrow-up',
  },
  {
    value: 'URGENT',
    label: 'Urgente',
    color: 'var(--ubax-danger)',
    bg: 'var(--ubax-danger-soft)',
    icon: 'pi pi-bolt',
  },
];

const CATEGORY_ICON_MAP = {
  PLUMBING: 'pi pi-wrench',
  LEAK: 'pi pi-tint',
  ELECTRICAL: 'pi pi-bolt',
  LOCK: 'pi pi-lock',
  APPLIANCE: 'pi pi-desktop',
  STRUCTURE: 'pi pi-building',
  PEST: 'pi pi-exclamation-circle',
  COMMON_AREA: 'pi pi-users',
  OTHER: 'pi pi-question-circle',
} as const;

function resolveCategoryIcon(category: TicketCategory): string {
  return (
    CATEGORY_ICON_MAP[category as keyof typeof CATEGORY_ICON_MAP] ??
    'pi pi-briefcase'
  );
}

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
  readonly categoryOptions = computed<readonly CategoryOption[]>(() =>
    this.store.ticketCategoryOptions().map((option) => ({
      ...option,
      icon: resolveCategoryIcon(option.value),
    })),
  );

  readonly submitted = signal(false);
  readonly uploadedFiles = signal<File[]>([]);
  readonly uploadPreviews = signal<string[]>([]);

  readonly form = this.fb.group({
    title: [
      '',
      [Validators.required, Validators.minLength(3), Validators.maxLength(120)],
    ],
    description: ['', [Validators.required, Validators.minLength(20)]],
    category: ['' as TicketCategory, Validators.required],
    priority: ['NORMAL' as TicketPriority, Validators.required],
    contractId: ['', Validators.required],
  });

  readonly selectedPriority = computed(
    () =>
      PRIORITY_OPTIONS.find(
        (p) => p.value === this.form.get('priority')?.value,
      ) ?? PRIORITY_OPTIONS[1],
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
    if (ctrl?.hasError('required'))
      return 'Veuillez sélectionner une catégorie.';
    return null;
  });

  readonly contractError = computed(() => {
    const ctrl = this.form.get('contractId');
    if (!ctrl?.touched && !this.submitted()) return null;
    if (ctrl?.hasError('required'))
      return "L'identifiant du contrat est obligatoire.";
    return null;
  });

  constructor() {
    if (
      this.store.ticketCategoryOptions().length === 0 &&
      !this.store.categoryCodeListLoading()
    ) {
      this.store.loadTicketCategories();
    }
  }

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
        category: (category || undefined) as
          | CreateTicketRequest['category']
          | undefined,
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
