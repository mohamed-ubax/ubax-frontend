import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, type SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AdminHotelDetailStore,
  type MemberResponse,
} from '@ubax-workspace/ubax-admin-data-access';
import { NOTIFICATION_HANDLER } from '@ubax-workspace/shared-data-access';
import {
  ConfirmDialogComponent,
  StatusBadgeComponent,
} from '@ubax-workspace/shared-design-system';
import type {
  PaymentResponse,
  PropertyResponse,
  ReservationResponse,
} from '@ubax-workspace/shared-api-types';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';

type HotelAction = 'activate' | 'suspend';

const DEFAULT_SUBSCRIPTION_PLAN_OPTIONS = [
  { label: 'FREE', value: 'FREE' },
  { label: 'PRO', value: 'PRO' },
  { label: 'PREMIUM', value: 'PREMIUM' },
];

interface MetricCard {
  iconClass: string;
  label: string;
  toneClass: string;
  value: string;
}

interface ActivityItem {
  iconClass: string;
  tone: 'blue' | 'green' | 'orange' | 'purple' | 'red';
  title: string;
  description: string;
  timestamp: string | null;
}

interface PaymentRow {
  amount: string;
  date: string;
  method: string;
  reference: string;
  status: string;
  statusTone: 'success' | 'warning' | 'danger' | 'neutral';
  operator: string;
}

@Component({
  selector: 'ubax-admin-hotel-detail-page',
  standalone: true,
  imports: [
    FormsModule,
    DatePickerModule,
    SelectModule,
    ConfirmDialogComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './hotel-detail-page.component.html',
  styleUrls: ['./hotel-detail-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HotelDetailPageComponent implements OnInit {
  private readonly store = inject(AdminHotelDetailStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notif = inject(NOTIFICATION_HANDLER);
  private readonly sanitizer = inject(DomSanitizer);

  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  protected readonly hotelId = computed(
    () => this.params().get('hotelId') ?? '',
  );
  protected readonly loading = this.store.loading;
  protected readonly error = this.store.error;
  protected readonly hotel = this.store.hotel;
  protected readonly properties = this.store.properties;
  protected readonly reservations = this.store.reservations;
  protected readonly payments = this.store.payments;
  protected readonly clients = this.store.clients;
  protected readonly activeMembers = this.store.activeMembers;
  protected readonly inactiveMembers = this.store.inactiveMembers;

  protected readonly showConfirm = signal(false);
  protected readonly currentAction = signal<HotelAction | null>(null);
  protected readonly showSubscriptionDialog = signal(false);
  protected readonly subscriptionPlanValue = signal<string | null>(null);
  protected readonly subscriptionExpiresAtValue = signal<Date | null>(null);
  protected readonly today = new Date();

  protected readonly subscriptionPlanOptions = computed(() => {
    const currentPlan = this.hotel()?.subscriptionPlan?.trim().toUpperCase();
    const options = [...DEFAULT_SUBSCRIPTION_PLAN_OPTIONS];

    if (
      currentPlan &&
      !options.some((option) => option.value === currentPlan)
    ) {
      options.unshift({ label: currentPlan, value: currentPlan });
    }

    return options;
  });

  protected readonly selectedHotel = computed(() => this.hotel());

  protected readonly hotelReference = computed(() =>
    this.referenceLabel(this.hotel()?.id),
  );

  protected readonly subscriptionBadgeLabel = computed(() => {
    const plan = this.hotel()?.subscriptionPlan?.trim().toUpperCase();
    return plan ? `Plan ${plan}` : 'Plan non défini';
  });

  protected readonly locationLabel = computed(() => {
    const hotel = this.hotel();
    const firstProperty = this.properties()[0] ?? null;
    const parts = [hotel?.city, firstProperty?.district].filter(
      (value): value is string => Boolean(value && value.trim().length > 0),
    );

    return parts.length > 0 ? parts.join(', ') : 'Localisation non renseignée';
  });

  protected readonly hotelSinceLabel = computed(() =>
    this.formatMonthYear(this.hotel()?.createdAt),
  );

  protected readonly primaryMember = computed(() => {
    const activeMembers = this.activeMembers();
    const inactiveMembers = this.inactiveMembers();
    return activeMembers[0] ?? inactiveMembers[0] ?? null;
  });

  protected readonly revenueMetricValue = computed(() =>
    this.formatCurrency(this.totalRevenue(this.payments())),
  );

  protected readonly reservationsMetricValue = computed(() =>
    this.formatInteger(this.reservations().length),
  );

  protected readonly occupancyMetricValue = computed(
    () => `${this.occupancyRate(this.properties(), this.reservations())}%`,
  );

  protected readonly availabilitySummary = computed(() => {
    const properties = this.properties();
    const reservations = this.reservations();

    const totalUnits = properties.reduce(
      (sum, property) => sum + (property.unitCount ?? 1),
      0,
    );
    const occupiedUnits = reservations.filter(
      (reservation) => reservation.status === 'CONFIRMED',
    ).length;
    const outOfServiceUnits = properties.reduce(
      (sum, property) =>
        property.status === 'PUBLISHED' ? sum : sum + (property.unitCount ?? 1),
      0,
    );
    const availableUnits = Math.max(
      totalUnits - occupiedUnits - outOfServiceUnits,
      0,
    );

    return {
      total: totalUnits,
      available: availableUnits,
      occupied: occupiedUnits,
      outOfService: outOfServiceUnits,
      availablePct:
        totalUnits > 0 ? Math.round((availableUnits / totalUnits) * 100) : 0,
      occupiedPct:
        totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0,
      outOfServicePct:
        totalUnits > 0 ? Math.round((outOfServiceUnits / totalUnits) * 100) : 0,
    };
  });

  protected readonly availabilityRingStyle = computed(() => {
    const summary = this.availabilitySummary();
    const availableEnd = summary.availablePct;
    const occupiedEnd = availableEnd + summary.occupiedPct;

    return `conic-gradient(#39c36b 0% ${availableEnd}%, #3a78ff ${availableEnd}% ${occupiedEnd}%, #a7a7a7 ${occupiedEnd}% 100%)`;
  });

  protected readonly recentActivities = computed<ActivityItem[]>(() => {
    const activities = [
      ...this.buildReservationActivities(this.reservations().slice(0, 6)),
      ...this.buildPaymentActivities(this.payments().slice(0, 6)),
      ...this.buildPropertyActivities(this.properties().slice(0, 4)),
    ];

    return this.sortActivities(activities).slice(0, 8);
  });

  protected readonly paymentRows = computed<PaymentRow[]>(() =>
    this.payments()
      .slice(0, 8)
      .map((payment) => ({
        amount: this.formatCurrency(payment.amountPaid ?? payment.amount),
        date: this.formatDateTime(
          payment.paidDate ?? payment.createdAt ?? payment.updatedAt,
        ),
        method: payment.paymentMethod ?? '—',
        reference: payment.reference ?? payment.id ?? '—',
        status: this.paymentStatusLabel(payment.status),
        statusTone: this.paymentStatusTone(payment),
        operator: payment.recordedByName ?? 'Système',
      })),
  );

  protected readonly confirmTitle = computed(() =>
    this.currentAction() === 'activate'
      ? "Activer l'hôtel"
      : "Suspendre l'hôtel",
  );

  protected readonly confirmMessage = computed(() => {
    const hotel = this.hotel();
    const hotelName = hotel?.name ?? 'cet hôtel';

    return this.currentAction() === 'activate'
      ? `Voulez-vous réactiver ${hotelName} ?`
      : `Voulez-vous suspendre ${hotelName} ? Les données restent conservées.`;
  });

  protected readonly confirmLabel = computed(() =>
    this.currentAction() === 'activate' ? 'Activer' : 'Suspendre',
  );

  protected readonly confirmSeverity = computed(() =>
    this.currentAction() === 'activate' ? 'success' : 'danger',
  );

  ngOnInit(): void {
    void this.loadHotel();
  }

  protected async loadHotel(): Promise<void> {
    const hotelId = this.hotelId();
    if (!hotelId) {
      this.notif.error("Identifiant d'hôtel manquant.");
      return;
    }

    try {
      await this.store.load(hotelId);
    } catch {
      this.notif.error(this.store.error() ?? "Impossible de charger l'hôtel.");
    }
  }

  protected retryLoad(): void {
    void this.loadHotel();
  }

  protected goBack(): void {
    void this.router.navigate(['/hotels']);
  }

  protected openSubscriptionDialog(): void {
    const hotel = this.hotel();
    if (!hotel) {
      return;
    }

    this.subscriptionPlanValue.set(
      hotel.subscriptionPlan?.trim().toUpperCase() ?? null,
    );
    this.subscriptionExpiresAtValue.set(
      hotel.subscriptionExpiresAt
        ? new Date(hotel.subscriptionExpiresAt)
        : null,
    );
    this.showSubscriptionDialog.set(true);
  }

  protected closeSubscriptionDialog(): void {
    this.showSubscriptionDialog.set(false);
    this.subscriptionPlanValue.set(null);
    this.subscriptionExpiresAtValue.set(null);
  }

  protected promptToggle(): void {
    this.currentAction.set(this.hotel()?.active ? 'suspend' : 'activate');
    this.showConfirm.set(true);
  }

  protected async confirmToggle(): Promise<void> {
    const hotel = this.hotel();
    if (!hotel?.id) {
      return;
    }

    try {
      if (this.currentAction() === 'activate') {
        await this.store.activate(hotel.id);
      } else {
        await this.store.suspend(hotel.id);
      }

      this.notif.success(
        this.currentAction() === 'activate'
          ? 'Hôtel activé.'
          : 'Hôtel suspendu.',
      );
      this.showConfirm.set(false);
    } catch {
      this.notif.error(this.store.error() ?? 'L’opération a échoué.');
    }
  }

  protected async saveSubscription(): Promise<void> {
    const hotel = this.hotel();
    const plan = this.subscriptionPlanValue();
    const expiresAt = this.subscriptionExpiresAtValue();

    if (!hotel?.id || !plan || !expiresAt) {
      this.notif.error("Veuillez renseigner un plan et une date d'expiration.");
      return;
    }

    try {
      await this.store.updateSubscription(hotel.id, {
        subscriptionPlan: plan,
        subscriptionExpiresAt: this.toIsoDateTime(expiresAt),
      });
      this.notif.success('Abonnement mis à jour.');
      this.closeSubscriptionDialog();
    } catch {
      this.notif.error(
        this.store.error() ?? "Impossible de mettre à jour l'abonnement.",
      );
    }
  }

  protected viewReservations(): void {
    void this.router.navigate(['/reservations']);
  }

  protected hotelInitials(value?: string | null): string {
    return (value ?? 'HT').slice(0, 2).toUpperCase();
  }

  protected memberName(member: MemberResponse | null): string {
    if (!member) {
      return '—';
    }

    return (
      `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim() ||
      member.email ||
      '—'
    );
  }

  protected memberRoleLabel(member: MemberResponse | null): string {
    if (!member) {
      return 'Responsable';
    }

    if (
      member.roles?.includes('ADMIN') ||
      member.roles?.includes('SUPER_ADMIN')
    ) {
      return 'Administrateur';
    }

    return this.memberIsInactive(member) ? 'Membre inactif' : 'Membre actif';
  }

  protected formatDateTime(value?: string | null): string {
    if (!value) {
      return '—';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }

    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  protected formatMonthYear(value?: string | null): string {
    if (!value) {
      return '—';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }

    return new Intl.DateTimeFormat('fr-FR', {
      month: 'long',
      year: 'numeric',
    }).format(date);
  }

  protected formatDateOnly(value?: string | null): string {
    if (!value) {
      return '—';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }

    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  protected formatInteger(value: number | null | undefined): string {
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(
      value ?? 0,
    );
  }

  protected formatCurrency(value: number | null | undefined): string {
    return `${new Intl.NumberFormat('fr-FR', {
      maximumFractionDigits: 0,
    }).format(value ?? 0)} FCFA`;
  }

  protected operatorInitials(value?: string | null): string {
    if (!value) {
      return 'SY';
    }

    const words = value.trim().split(/\s+/).filter(Boolean).slice(0, 2);

    if (words.length === 0) {
      return 'SY';
    }

    return words
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  }

  protected relativeTime(value?: string | null): string {
    if (!value) {
      return 'à l’instant';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }

    const deltaMinutes = Math.max(
      1,
      Math.floor((Date.now() - date.getTime()) / 60000),
    );

    if (deltaMinutes < 60) {
      return `Il y a ${deltaMinutes} min`;
    }

    const deltaHours = Math.floor(deltaMinutes / 60);
    if (deltaHours < 24) {
      return `Il y a ${deltaHours} h`;
    }

    const deltaDays = Math.floor(deltaHours / 24);
    return `Il y a ${deltaDays} j`;
  }

  protected occupancyRate(
    properties: PropertyResponse[],
    reservations: ReservationResponse[],
  ): number {
    const totalUnits = properties.reduce(
      (sum, property) => sum + (property.unitCount ?? 1),
      0,
    );

    if (totalUnits <= 0) {
      return 0;
    }

    const confirmedReservations = reservations.filter(
      (reservation) => reservation.status === 'CONFIRMED',
    ).length;

    return Math.min(
      100,
      Math.round((confirmedReservations / totalUnits) * 100),
    );
  }

  protected paymentStatusTone(
    payment: PaymentResponse,
  ): PaymentRow['statusTone'] {
    switch (payment.status) {
      case 'PAID':
        return 'success';
      case 'PARTIAL':
      case 'PENDING':
        return 'warning';
      case 'LATE':
        return 'danger';
      default:
        return 'neutral';
    }
  }

  protected buildReservationActivities(
    reservations: ReservationResponse[],
  ): ActivityItem[] {
    return reservations.map((reservation) => ({
      iconClass: 'pi pi-calendar',
      tone: this.reservationTone(reservation),
      title: this.reservationActivityTitle(reservation),
      description: `${reservation.clientFullName ?? 'Client'} · ${reservation.propertyTitle ?? 'Bien hôtelier'} · ${this.formatCurrency(reservation.totalAmount)}`,
      timestamp:
        reservation.confirmedAt ??
        reservation.createdAt ??
        reservation.updatedAt ??
        null,
    }));
  }

  protected buildPaymentActivities(
    payments: PaymentResponse[],
  ): ActivityItem[] {
    return payments.map((payment) => ({
      iconClass: 'pi pi-credit-card',
      tone: this.paymentTone(payment),
      title: this.paymentActivityTitle(payment),
      description: `${this.formatCurrency(payment.amountPaid ?? payment.amount)} · ${payment.paymentMethod ?? '—'}`,
      timestamp:
        payment.paidDate ?? payment.createdAt ?? payment.updatedAt ?? null,
    }));
  }

  protected buildPropertyActivities(
    properties: PropertyResponse[],
  ): ActivityItem[] {
    return properties.map((property) => ({
      iconClass: 'pi pi-building',
      tone: property.status === 'PUBLISHED' ? 'purple' : 'orange',
      title: property.title ?? 'Bien hôtelier',
      description: `${property.propertyType ?? '—'} · ${property.city ?? '—'}`,
      timestamp:
        property.updatedAt ??
        property.publishedAt ??
        property.createdAt ??
        null,
    }));
  }

  protected reservationTone(
    reservation: ReservationResponse,
  ): ActivityItem['tone'] {
    if (reservation.status === 'CONFIRMED') {
      return 'green';
    }

    if (reservation.status === 'CANCELLED') {
      return 'red';
    }

    return 'blue';
  }

  protected reservationActivityTitle(reservation: ReservationResponse): string {
    if (!reservation.id) {
      return 'Réservation hôtel';
    }

    return `Réservation #${this.shortId(reservation.id)}`;
  }

  protected paymentTone(payment: PaymentResponse): ActivityItem['tone'] {
    if (payment.status === 'PAID') {
      return 'green';
    }

    if (payment.status === 'LATE') {
      return 'red';
    }

    return 'orange';
  }

  protected paymentActivityTitle(payment: PaymentResponse): string {
    if (!payment.reference) {
      return 'Paiement hôtel';
    }

    return `Paiement #${this.shortId(payment.reference)}`;
  }

  protected paymentStatusLabel(status?: string | null): string {
    switch (status) {
      case 'PAID':
        return 'Réussi';
      case 'PARTIAL':
        return 'Partiel';
      case 'PENDING':
        return 'En attente';
      case 'LATE':
        return 'En retard';
      case 'FAILED':
        return 'Échoué';
      default:
        return 'Inconnu';
    }
  }

  private sortActivities(items: ActivityItem[]): ActivityItem[] {
    return [...items].sort((left, right) => {
      const leftTime = left.timestamp ? new Date(left.timestamp).getTime() : 0;
      const rightTime = right.timestamp
        ? new Date(right.timestamp).getTime()
        : 0;

      return rightTime - leftTime;
    });
  }

  protected readonly mapCoordinates = computed(() => {
    const hotelCoordinates = this.extractHotelCoordinates();
    if (hotelCoordinates) {
      return hotelCoordinates;
    }

    const propertyWithCoords = this.properties().find(
      (property) =>
        this.parseCoordinate(property.latitude) !== null &&
        this.parseCoordinate(property.longitude) !== null,
    );

    if (!propertyWithCoords) {
      return null;
    }

    const latitude = this.parseCoordinate(propertyWithCoords.latitude);
    const longitude = this.parseCoordinate(propertyWithCoords.longitude);

    if (latitude === null || longitude === null) {
      return null;
    }

    return { latitude, longitude };
  });

  protected readonly mapEmbedUrl = computed<SafeResourceUrl | null>(() => {
    const coordinates = this.mapCoordinates();
    if (!coordinates) {
      return null;
    }

    const delta = 0.01;
    const minLon = coordinates.longitude - delta;
    const maxLon = coordinates.longitude + delta;
    const minLat = coordinates.latitude - delta;
    const maxLat = coordinates.latitude + delta;

    const embedUrl =
      'https://www.openstreetmap.org/export/embed.html?' +
      `bbox=${minLon}%2C${minLat}%2C${maxLon}%2C${maxLat}` +
      `&layer=mapnik&marker=${coordinates.latitude}%2C${coordinates.longitude}`;

    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  });

  protected hotelAddress(): string {
    const hotel = this.hotel();
    const firstProperty = this.properties()[0] ?? null;
    const parts = [
      hotel?.city,
      firstProperty?.district,
      firstProperty?.address,
    ].filter((value): value is string =>
      Boolean(value && value.trim().length > 0),
    );

    return parts.length > 0 ? parts.join(' · ') : 'Adresse non renseignée';
  }

  protected mapAltLabel(hotelName?: string | null): string {
    return hotelName ?? "Localisation de l'hôtel";
  }

  protected mapFrameTitle(hotelName?: string | null): string {
    return hotelName
      ? `Carte de localisation de ${hotelName}`
      : "Carte de localisation de l'hôtel";
  }

  private extractHotelCoordinates(): {
    latitude: number;
    longitude: number;
  } | null {
    const hotel = this.hotel() as unknown as Record<string, unknown> | null;

    if (!hotel) {
      return null;
    }

    const latitude = this.parseCoordinate(
      hotel['latitude'] ?? hotel['lat'] ?? hotel['gpsLat'] ?? hotel['y'],
    );
    const longitude = this.parseCoordinate(
      hotel['longitude'] ??
        hotel['lng'] ??
        hotel['lon'] ??
        hotel['gpsLng'] ??
        hotel['x'],
    );

    if (latitude !== null && longitude !== null) {
      return { latitude, longitude };
    }

    const location = hotel['location'];
    if (location && typeof location === 'object') {
      const locationRecord = location as Record<string, unknown>;
      const nestedLatitude = this.parseCoordinate(
        locationRecord['latitude'] ??
          locationRecord['lat'] ??
          locationRecord['gpsLat'] ??
          locationRecord['y'],
      );
      const nestedLongitude = this.parseCoordinate(
        locationRecord['longitude'] ??
          locationRecord['lng'] ??
          locationRecord['lon'] ??
          locationRecord['gpsLng'] ??
          locationRecord['x'],
      );

      if (nestedLatitude !== null && nestedLongitude !== null) {
        return { latitude: nestedLatitude, longitude: nestedLongitude };
      }
    }

    return null;
  }

  protected totalRevenue(payments: PaymentResponse[]): number {
    return payments.reduce(
      (sum, payment) => sum + (payment.amountPaid ?? payment.amount ?? 0),
      0,
    );
  }

  protected totalPaidRevenue(payments: PaymentResponse[]): number {
    return payments.reduce(
      (sum, payment) =>
        payment.status === 'PAID'
          ? sum + (payment.amountPaid ?? payment.amount ?? 0)
          : sum,
      0,
    );
  }

  protected firstCoverPhoto(): string | null {
    return (
      this.properties().find((property) => Boolean(property.coverPhotoUrl))
        ?.coverPhotoUrl ?? null
    );
  }

  protected referenceLabel(id?: string | null): string {
    if (!id) {
      return '—';
    }

    return `#${id.slice(0, 8).toUpperCase()}`;
  }

  protected shortId(value?: string | null): string {
    if (!value) {
      return '—';
    }

    return value
      .replace(/[^A-Za-z0-9]/g, '')
      .slice(0, 8)
      .toUpperCase();
  }

  protected memberIsInactive(member: MemberResponse): boolean {
    return member.active === false || Boolean(member.deletedAt);
  }

  private toIsoDateTime(value: Date): string {
    const copy = new Date(value);
    copy.setSeconds(0, 0);
    return copy.toISOString();
  }

  private parseCoordinate(value: unknown): number | null {
    if (value === null || value === undefined) {
      return null;
    }

    let parsed: number;
    if (typeof value === 'number') {
      parsed = value;
    } else if (typeof value === 'string') {
      const normalized = value.trim().replace(',', '.');
      parsed = Number.parseFloat(normalized);
    } else {
      return null;
    }

    return Number.isFinite(parsed) ? parsed : null;
  }
}
