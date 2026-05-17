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
import { Select } from 'primeng/select';
import { type CreateTicketRequest } from '@ubax-workspace/shared-api-types';
import {
  ContratsStore,
  type ContractResponse,
  TicketCategory,
  TicketingStore,
  TicketPriority,
} from '@ubax-workspace/ubax-web-data-access';
import type {
  CategoryOption,
  PriorityOption,
} from '../../types/ticket-create-page.types';
import {
  resolveCategoryIcon,
  resolvePriorityOption,
} from '../../constants/ticket-create-page.constants';

type ContractOption = {
  value: string;
  label: string;
  meta: string;
  icon: string;
};

@Component({
  selector: 'ubax-ticket-create-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Select],
  templateUrl: './ticket-create-page.component.html',
  styleUrl: './ticket-create-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TicketCreatePageComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  readonly store = inject(TicketingStore);
  readonly contractsStore = inject(ContratsStore);

  readonly priorityOptions = computed<readonly PriorityOption[]>(() =>
    this.store
      .ticketPriorityOptions()
      .map((option) => resolvePriorityOption(option.value, option.label)),
  );
  readonly categoryOptions = computed<readonly CategoryOption[]>(() =>
    this.store.ticketCategoryOptions().map((option) => ({
      ...option,
      icon: resolveCategoryIcon(option.value, option.label),
    })),
  );
  readonly contractOptions = computed<ContractOption[]>(() =>
    this.contractsStore
      .entities()
      .filter((contract) => Boolean(contract.id))
      .map((contract) => ({
        value: contract.id,
        label: this.resolveContractLabel(contract),
        meta: this.resolveContractMeta(contract),
        icon: 'pi-file-contract',
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

  readonly selectedPriority = computed(() => {
    const selectedValue = this.form.get('priority')?.value ?? 'NORMAL';

    return (
      this.priorityOptions().find((p) => p.value === selectedValue) ??
      resolvePriorityOption(selectedValue)
    );
  });

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
    if (ctrl?.hasError('required')) return 'Veuillez sélectionner un contrat.';
    return null;
  });

  constructor() {
    if (
      this.store.ticketCategoryOptions().length === 0 &&
      !this.store.categoryCodeListLoading()
    ) {
      this.store.loadTicketCategories();
    }

    if (
      this.store.ticketPriorityOptions().length === 0 &&
      !this.store.priorityCodeListLoading()
    ) {
      this.store.loadTicketPriorities();
    }

    if (
      this.contractsStore.entities().length === 0 &&
      !this.contractsStore.loading()
    ) {
      this.contractsStore.load?.({ pageable: {} });
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

    const createTicket = this.store.create;

    if (!createTicket) {
      return;
    }

    const { title, description, category, priority, contractId } =
      this.form.getRawValue();

    createTicket({
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

  private resolveContractLabel(contract: ContractResponse): string {
    return (
      contract.referenceNumber?.trim() ||
      contract.propertyTitle?.trim() ||
      contract.tenantName?.trim() ||
      contract.id
    );
  }

  private resolveContractMeta(contract: ContractResponse): string {
    const segments = [
      contract.propertyAddress,
      contract.propertyType,
      contract.status,
    ]
      .filter((value): value is string => Boolean(value?.trim()))
      .map((value) => value.trim());

    return segments.join(' · ') || 'Contrat rattache a votre agence';
  }
}
