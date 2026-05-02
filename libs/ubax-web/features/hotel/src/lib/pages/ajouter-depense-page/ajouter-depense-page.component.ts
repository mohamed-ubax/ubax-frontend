import { ChangeDetectionStrategy, Component } from '@angular/core';

type Category = {
  label: string;
  color: string;};

@Component({
  standalone: true,
  selector: 'ubax-ajouter-depense-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './ajouter-depense-page.component.scss',
  templateUrl: './ajouter-depense-page.component.html',
})
export class AjouterDepensePageComponent {
  activeStep = 1;
  activeStatus = 'Payés';

  readonly categories: Category[] = [
    { label: 'Maintenance', color: '#ffae00' },
    { label: 'Restauration', color: '#ff6b35' },
    { label: 'Charge', color: '#008bff' },
    { label: 'Fournitures', color: '#16b55b' },
    { label: 'Salaires', color: '#e87d1e' },
    { label: 'Autres', color: '#878787' },
  ];

  selectedCategory: string | null = null;

  readonly statuses = [
    {
      key: 'Payés',
      label: 'Payés',
      sub: 'La dépense a été réglé',
      color: '#16b55b',
    },
    {
      key: 'En attente',
      label: 'En attente',
      sub: 'Paiement à effectuer',
      color: '#e87d1e',
    },
    {
      key: 'Brouillon',
      label: 'Brouillon',
      sub: 'À compléter ultérieurement',
      color: '#878787',
    },
  ];

  readonly steps = [
    { num: 1, label: 'Informations générales' },
    { num: 2, label: 'Fournisseur & Montant' },
    { num: 3, label: 'Pièces justificatives' },
  ];

  nextStep(): void {
    if (this.activeStep < 3) this.activeStep++;
  }

  prevStep(): void {
    if (this.activeStep > 1) this.activeStep--;
  }

  isStepDone(num: number): boolean {
    return num < this.activeStep;
  }

  isStepActive(num: number): boolean {
    return num === this.activeStep;
  }

  get sectionIcon(): string {
    return this.activeStep === 1
      ? 'pi-file-edit'
      : this.activeStep === 2
        ? 'pi-dollar'
        : 'pi-paperclip';
  }

  get sectionTitle(): string {
    return this.activeStep === 1
      ? 'Informations générales'
      : this.activeStep === 2
        ? 'Fournisseur & Montant'
        : 'Pièces justificatives';
  }

  get sectionSubtitle(): string {
    return this.activeStep === 1
      ? 'Identité et classification de la dépense'
      : this.activeStep === 2
        ? 'Détails financiers de la transaction'
        : 'Factures, reçus ou documents associés';
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }
}
