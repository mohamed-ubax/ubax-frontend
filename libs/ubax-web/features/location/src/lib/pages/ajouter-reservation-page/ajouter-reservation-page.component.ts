import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

type RoomType = 'chambre' | 'conference' | 'evenement';
type DiscountType = 'none' | '5' | '10' | '15' | '30' | 'promo';

@Component({
  selector: 'ubax-ajouter-reservation-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './ajouter-reservation-page.component.html',
  styleUrl: './ajouter-reservation-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AjouterReservationPageComponent {
  currentStep = signal(1);

  // Step 1
  roomType = signal<RoomType>('chambre');
  nom = signal('');
  prenom = signal('');
  telephone = signal('');
  email = signal('');
  uploadedDocs = signal(['Passeport', 'Facture']);

  // Step 2
  arrivalDate = signal('15 juillet 2026');
  departureDate = signal('17 juillet 2026');
  nights = signal(2);
  adults = signal(2);
  children = signal(0);
  adultRate = signal(20);

  // Step 3
  selectedOptions = signal<boolean[]>(Array(16).fill(false));

  // Step 4
  discount = signal<DiscountType>('none');
  promoCode = signal('');
  taxes = signal(0);

  readonly BASE_NIGHT_PRICE = 45_000;

  readonly STEP_LABELS = [
    'Informations client',
    'Détails du séjour',
    'Options supplémentaires',
    'Tarification et paiement',
    'Récapitulatif',
  ];

  readonly SIDEBAR_TITLES = [
    'Ajout réservation',
    'Détails du séjour',
    'Options supplémentaires',
    'Tarification et paiement',
    'Récapitulatif',
  ];

  readonly EXTRA_OPTIONS = [
    'Petit déjeuner inclus', 'Navette Aéroport', 'Lit supplémentaire', 'Room service',
    'Coffre-fort', 'Télévision écran plat', 'Bureau de travail', 'Service de ménage quotidien',
    'Piscine', 'Navette Aéroport', 'Mini-bar', 'Check in anticipé',
    'Salle de bain privée', 'Baignoire', 'Parking gratuit', 'Service de ménage quotidien',
  ];

  readonly roomPreviewImg = 'https://www.figma.com/api/mcp/asset/118a55c9-7936-41df-89b5-be684fc45dd5';

  readonly roomPhotos = [
    'https://www.figma.com/api/mcp/asset/67d222df-23aa-4e25-8acd-c3fedd0abd68',
    'https://www.figma.com/api/mcp/asset/b854eabc-1ef0-4e74-bf67-d13c581e6feb',
    'https://www.figma.com/api/mcp/asset/4b37b6d8-78d3-49e2-bccf-7a8b52d29f70',
    'https://www.figma.com/api/mcp/asset/67d222df-23aa-4e25-8acd-c3fedd0abd68',
    'https://www.figma.com/api/mcp/asset/b854eabc-1ef0-4e74-bf67-d13c581e6feb',
    'https://www.figma.com/api/mcp/asset/4b37b6d8-78d3-49e2-bccf-7a8b52d29f70',
  ];

  // Computed
  readonly sidebarTitle = computed(() => this.SIDEBAR_TITLES[this.currentStep() - 1]);

  readonly adultsTotal = computed(() => this.BASE_NIGHT_PRICE * this.adults() * this.nights());
  readonly childrenNightPrice = computed(() => Math.round(this.BASE_NIGHT_PRICE * this.adultRate() / 100));
  readonly childrenTotal = computed(() => this.childrenNightPrice() * this.children() * this.nights());
  readonly subtotal = computed(() => this.adultsTotal() + this.childrenTotal());
  readonly discountAmount = computed(() => {
    const pct =
      this.discount() === '5'  ? 0.05 :
      this.discount() === '10' ? 0.10 :
      this.discount() === '15' ? 0.15 :
      this.discount() === '30' ? 0.30 : 0;
    return Math.round(this.subtotal() * pct);
  });
  readonly totalToPay = computed(() => this.subtotal() + this.taxes() - this.discountAmount());
  readonly perNight = computed(() => Math.round(this.subtotal() / this.nights()));

  readonly sliderPercent = computed(() => ((this.adultRate() - 20) / 40) * 100);
  readonly sliderBg = computed(() => {
    const p = this.sliderPercent();
    return `linear-gradient(to right, #e87d1e 0%, #e87d1e ${p}%, #1a3047 ${p}%, #1a3047 100%)`;
  });

  // Carousel step 5
  photoOffset = signal(0);
  readonly photosTranslate = computed(() => {
    const step = 310 + 14; // photo width + gap
    return `translateX(-${this.photoOffset() * step}px)`;
  });

  readonly selectedOptionNames = computed(() =>
    this.EXTRA_OPTIONS.filter((_, i) => this.selectedOptions()[i]).join(', ')
  );

  nextStep(): void {
    if (this.currentStep() < 5) this.currentStep.update(s => s + 1);
  }

  prevStep(): void {
    if (this.currentStep() > 1) this.currentStep.update(s => s - 1);
  }

  removeDoc(index: number): void {
    this.uploadedDocs.update(docs => docs.filter((_, i) => i !== index));
  }

  adjustNights(d: number): void { this.nights.update(v => Math.max(1, v + d)); }
  adjustAdults(d: number): void { this.adults.update(v => Math.max(1, v + d)); }
  adjustChildren(d: number): void { this.children.update(v => Math.max(0, v + d)); }

  nextPhoto(): void {
    this.photoOffset.update(i => (i + 1) % this.roomPhotos.length);
  }

  prevPhoto(): void {
    this.photoOffset.update(i => Math.max(0, i - 1));
  }

  goToStep(step: number): void {
    if (step < this.currentStep()) {
      this.currentStep.set(step);
    }
  }

  toggleOption(i: number): void {
    this.selectedOptions.update(opts => {
      const copy = [...opts];
      copy[i] = !copy[i];
      return copy;
    });
  }

  fmt(n: number): string {
    return n.toLocaleString('fr-FR');
  }
}
