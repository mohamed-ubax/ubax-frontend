import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

type AddBienMedia = {
  readonly src: string;
  readonly alt: string;};

type AddBienCounter = {
  readonly label: string;
  readonly value: string;};

type AddBienCommodity = {
  readonly label: string;
  readonly selected: boolean;};

type AddBienStep = {
  readonly label: string;};

type AddBienSummaryItem = {
  readonly text: string;};

const STEPS: readonly AddBienStep[] = [
  { label: 'Informations générales' },
  { label: 'Détails & Tarification' },
  { label: 'Finalisation' },
];

const STEP_ONE_MEDIA: readonly AddBienMedia[] = [
  {
    src: 'biens/add/step1-thumb-01.webp',
    alt: 'Photo complémentaire du bien 1',
  },
  {
    src: 'biens/add/step1-thumb-02.webp',
    alt: 'Photo complémentaire du bien 2',
  },
  {
    src: 'biens/add/step1-thumb-03.webp',
    alt: 'Photo complémentaire du bien 3',
  },
  {
    src: 'biens/add/step1-thumb-04.webp',
    alt: 'Photo complémentaire du bien 4',
  },
  {
    src: 'biens/add/step1-thumb-05.webp',
    alt: 'Photo complémentaire du bien 5',
  },
] as const;

const STEP_THREE_MEDIA: readonly AddBienMedia[] = [
  { src: 'biens/add/step3-thumb-01.webp', alt: 'Miniature finale 1' },
  { src: 'biens/add/step3-thumb-02.webp', alt: 'Miniature finale 2' },
  { src: 'biens/add/step3-thumb-03.webp', alt: 'Miniature finale 3' },
] as const;

const COUNTERS: readonly AddBienCounter[] = [
  { label: 'Nombre de pièces', value: '4' },
  { label: 'Nombre de chambres', value: '3' },
  { label: 'salles de bain', value: '2' },
  { label: 'Surface (m²)', value: '150' },
] as const;

const PRICE_MODES = ['Mensuelle', 'Nuitée', 'Vente'] as const;

const COMMODITIES: readonly AddBienCommodity[] = [
  { label: 'Climatisation', selected: true },
  { label: 'Parking', selected: false },
  { label: 'Piscine', selected: true },
  { label: 'Groupe électrogène', selected: false },
  { label: 'Sécurité 24h/24', selected: false },
  { label: 'Ascenseur', selected: true },
] as const;

const SUMMARY_ITEMS: readonly AddBienSummaryItem[] = [
  {
    text: 'Location - 150 m2 - 3 chambre - 2 salle de bains',
  },
  {
    text: 'Prix : 450 000 FCFA',
  },
  {
    text: 'Adresse : Abidjan , Cocody',
  },
  {
    text: 'Bailleur  : Jean Dupont',
  },
] as const;

@Component({
  selector: 'ubax-bien-add-page',
  standalone: true,
  imports: [],
  templateUrl: './bien-add-page.component.html',
  styleUrl: './bien-add-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BienAddPageComponent {
  protected readonly steps = STEPS;
  protected readonly activeStep = signal(0);
  protected readonly stepOneMedia = STEP_ONE_MEDIA;
  protected readonly stepThreeMedia = STEP_THREE_MEDIA;
  protected readonly counters = COUNTERS;
  protected readonly pricingModes = PRICE_MODES;
  protected readonly selectedPricingMode =
    signal<(typeof PRICE_MODES)[number]>('Mensuelle');
  protected readonly commodities = COMMODITIES;
  protected readonly summaryItems = SUMMARY_ITEMS;
  protected readonly title =
    'Appartement 4 pièces – Riviera Golf Résidence Prestige';
  protected readonly category = 'Appartement';
  protected readonly listingType = 'Location';
  protected readonly owner = 'Sélectionner le propriétaire';
  protected readonly ownerPhone = '+225 07 58 42 19 63';
  protected readonly ubaxId = 'UBX-LOC-0245';
  protected readonly price = '450 000 fCFA';
  protected readonly description =
    'Découvrez ce magnifique appartement de 3 pièces situé dans le quartier résidentiel prisé de Cocody Riviera. Conçu pour offrir un confort optimal et un cadre de vie paisible, ce bien combine modernité, fonctionnalité et sécurité. Dès l’entrée, vous êtes accueilli par un vaste séjour lumineux bénéficiant de grandes baies vitrées qui laissent entrer une lumière naturelle abondante tout au long de la journée. Le salon s’ouvre sur un balcon spacieux, idéal pour vos moments de détente ou pour recevoir des invités.';

  protected selectPricingMode(mode: (typeof PRICE_MODES)[number]): void {
    this.selectedPricingMode.set(mode);
  }

  protected isReachedStep(index: number): boolean {
    return index <= this.activeStep();
  }

  protected isCompletedStep(index: number): boolean {
    return index < this.activeStep();
  }

  protected nextStep(): void {
    this.activeStep.update((current) =>
      Math.min(current + 1, this.steps.length - 1),
    );
  }

  protected previousStep(): void {
    this.activeStep.update((current) => Math.max(current - 1, 0));
  }
}
