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
  AdminAgencyDetailStore,
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
} from '@ubax-workspace/shared-api-types';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';

type AgencyAction = 'activate' | 'suspend';

const DEFAULT_SUBSCRIPTION_PLAN_OPTIONS = [
  { label: 'FREE', value: 'FREE' },
  { label: 'PRO', value: 'PRO' },
  { label: 'PREMIUM', value: 'PREMIUM' },
];

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
  selector: 'ubax-admin-agency-detail-page',
  standalone: true,
  imports: [
    FormsModule,
    DatePickerModule,
    DialogModule,
    SelectModule,
    ConfirmDialogComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './agency-detail-page.component.html',
  styleUrls: ['./agency-detail-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgencyDetailPageComponent implements OnInit {
  private readonly store = inject(AdminAgencyDetailStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notif = inject(NOTIFICATION_HANDLER);
  private readonly sanitizer = inject(DomSanitizer);

  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  protected readonly agencyId = computed(
    () => this.params().get('agencyId') ?? '',
  );
  protected readonly loading = this.store.loading;
  protected readonly error = this.store.error;
  protected readonly agency = this.store.agency;
  protected readonly properties = this.store.properties;
  protected readonly payments = this.store.payments;
  protected readonly clients = this.store.clients;
  protected readonly activeMembers = this.store.activeMembers;
  protected readonly inactiveMembers = this.store.inactiveMembers;

  protected readonly showConfirm = signal(false);
  protected readonly currentAction = signal<AgencyAction | null>(null);
  protected readonly showSubscriptionDialog = signal(false);
  protected readonly subscriptionLoading = signal(false);
  protected readonly actionLoading = signal(false);
  protected subscriptionPlanValue: string | null = null;
  protected subscriptionExpiresAtValue: Date | null = null;
  protected readonly today = new Date();

  protected readonly subscriptionPlanOptions = computed(() => {
    const currentPlan = this.agency()?.subscriptionPlan?.trim().toUpperCase();
    const options = [...DEFAULT_SUBSCRIPTION_PLAN_OPTIONS];

    if (
      currentPlan &&
      !options.some((option) => option.value === currentPlan)
    ) {
      options.unshift({ label: currentPlan, value: currentPlan });
    }

    return options;
  });

  protected readonly selectedAgency = computed(() => this.agency());

  protected readonly agencyReference = computed(() =>
    this.referenceLabel(this.agency()?.id),
  );

  protected readonly subscriptionBadgeLabel = computed(() => {
    const plan = this.agency()?.subscriptionPlan?.trim().toUpperCase();
    return plan ? `Plan ${plan}` : 'Plan non défini';
  });

  protected readonly locationLabel = computed(() => {
    const agency = this.agency();
    const firstProperty = this.properties()[0] ?? null;
    const parts = [agency?.city, firstProperty?.district].filter(
      (value): value is string => Boolean(value && value.trim().length > 0),
    );

    return parts.length > 0 ? parts.join(', ') : 'Localisation non renseignée';
  });

  protected readonly agencySinceLabel = computed(() =>
    this.formatMonthYear(this.agency()?.createdAt),
  );

  protected readonly primaryMember = computed(() => {
    const activeMembers = this.activeMembers();
    const inactiveMembers = this.inactiveMembers();
    return activeMembers[0] ?? inactiveMembers[0] ?? null;
  });

  protected readonly revenueMetricValue = computed(() =>
    this.formatCurrency(this.totalRevenue(this.payments())),
  );

  protected readonly propertiesMetricValue = computed(() =>
    this.formatInteger(this.properties().length),
  );

  protected readonly availabilityRateMetricValue = computed(
    () => `${this.availabilityRate(this.properties())}%`,
  );

  protected readonly availabilitySummary = computed(() => {
    const properties = this.properties();

    const publishedCount = properties.filter(
      (p) => p.status === 'PUBLISHED',
    ).length;
    const reservedCount = properties.filter(
      (p) => p.status === 'RESERVED',
    ).length;
    const inactiveCount = properties.filter(
      (p) =>
        p.status !== 'PUBLISHED' && p.status !== 'RESERVED',
    ).length;
    const totalCount = properties.length;

    return {
      total: totalCount,
      available: publishedCount,
      rented: reservedCount,
      inactive: inactiveCount,
      availablePct:
        totalCount > 0 ? Math.round((publishedCount / totalCount) * 100) : 0,
      rentedPct:
        totalCount > 0 ? Math.round((reservedCount / totalCount) * 100) : 0,
      inactivePct:
        totalCount > 0 ? Math.round((inactiveCount / totalCount) * 100) : 0,
    };
  });

  protected readonly availabilityRingStyle = computed(() => {
    const summary = this.availabilitySummary();
    const availableEnd = summary.availablePct;
    const rentedEnd = availableEnd + summary.rentedPct;

    return `conic-gradient(#39c36b 0% ${availableEnd}%, #3a78ff ${availableEnd}% ${rentedEnd}%, #a7a7a7 ${rentedEnd}% 100%)`;
  });

  protected readonly recentActivities = computed<ActivityItem[]>(() => {
    const activities = [
      ...this.buildPropertyActivities(this.properties().slice(0, 6)),
      ...this.buildPaymentActivities(this.payments().slice(0, 6)),
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

  protected get confirmTitle(): string {
    return this.currentAction() === 'activate'
      ? "Activer l'agence"
      : "Suspendre l'agence";
  }

  protected get confirmMessage(): string {
    const agencyName = this.agency()?.name ?? 'cette agence';
    return this.currentAction() === 'activate'
      ? `Activer ${agencyName} lui permettra d'accéder à nouveau à la plateforme.`
      : `Suspendre ${agencyName} bloquera l'accès à la plateforme pour cette agence.`;
  }

  protected get confirmLabel(): string {
    return this.currentAction() === 'activate' ? 'Activer' : 'Suspendre';
  }

  protected get confirmSeverity(): 'success' | 'warn' {
    return this.currentAction() === 'activate' ? 'success' : 'warn';
  }

  protected get subscriptionSaveDisabled(): boolean {
    return (
      this.subscriptionLoading() ||
      !this.subscriptionPlanValue ||
      !this.subscriptionExpiresAtValue
    );
  }

  ngOnInit(): void {
    void this.loadAgency();
  }

  protected async loadAgency(): Promise<void> {
    const agencyId = this.agencyId();
    if (!agencyId) {
      this.notif.error("Identifiant d'agence manquant.");
      return;
    }

    try {
      await this.store.load(agencyId);
    } catch {
      this.notif.error(
        this.store.error() ?? "Impossible de charger l'agence.",
      );
    }
  }

  protected retryLoad(): void {
    void this.loadAgency();
  }

  protected goBack(): void {
    void this.router.navigate(['/agences']);
  }

  protected openSubscriptionDialog(): void {
    const agency = this.agency();
    if (!agency) {
      return;
    }

    this.subscriptionPlanValue =
      agency.subscriptionPlan?.trim().toUpperCase() ?? null;
    this.subscriptionExpiresAtValue = agency.subscriptionExpiresAt
      ? new Date(agency.subscriptionExpiresAt)
      : null;
    this.showSubscriptionDialog.set(true);
  }

  protected closeSubscriptionDialog(): void {
    this.showSubscriptionDialog.set(false);
    this.subscriptionPlanValue = null;
    this.subscriptionExpiresAtValue = null;
  }

  protected promptToggle(): void {
    this.currentAction.set(this.agency()?.active ? 'suspend' : 'activate');
    this.showConfirm.set(true);
  }

  protected async confirmToggle(): Promise<void> {
    const agency = this.agency();
    if (!agency?.id) {
      return;
    }

    this.actionLoading.set(true);
    try {
      const action = this.currentAction();
      if (action === 'activate') {
        await this.store.activate(agency.id);
      } else {
        await this.store.suspend(agency.id);
      }

      this.notif.success(
        action === 'activate' ? 'Agence activée.' : 'Agence suspendue.',
      );
      this.showConfirm.set(false);
    } catch {
      this.notif.error(this.store.error() ?? "L'opération a échoué.");
    } finally {
      this.actionLoading.set(false);
    }
  }

  protected async saveSubscription(): Promise<void> {
    const agency = this.agency();
    if (
      !agency?.id ||
      !this.subscriptionPlanValue ||
      !this.subscriptionExpiresAtValue
    ) {
      this.notif.error("Veuillez renseigner un plan et une date d'expiration.");
      return;
    }

    this.subscriptionLoading.set(true);
    try {
      await this.store.updateSubscription(agency.id, {
        subscriptionPlan: this.subscriptionPlanValue,
        subscriptionExpiresAt: this.toIsoDateTime(this.subscriptionExpiresAtValue),
      });
      this.notif.success("Abonnement de l'agence mis à jour.");
      this.closeSubscriptionDialog();
    } catch {
      this.notif.error(
        this.store.error() ?? "Impossible de mettre à jour l'abonnement.",
      );
    } finally {
      this.subscriptionLoading.set(false);
    }
  }

  protected viewMembers(): void {
    const agencyId = this.agencyId();
    if (!agencyId) {
      return;
    }

    void this.router.navigate(['/agences', agencyId, 'membres']);
  }

  protected agencyInitials(value?: string | null): string {
    return (value ?? 'AG').slice(0, 2).toUpperCase();
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
      return "à l'instant";
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

  protected availabilityRate(properties: PropertyResponse[]): number {
    const total = properties.length;

    if (total <= 0) {
      return 0;
    }

    const available = properties.filter(
      (p) => p.status === 'PUBLISHED',
    ).length;

    return Math.min(100, Math.round((available / total) * 100));
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

  protected buildPropertyActivities(
    properties: PropertyResponse[],
  ): ActivityItem[] {
    return properties.map((property) => ({
      iconClass: 'pi pi-home',
      tone: this.propertyTone(property),
      title: property.title ?? 'Bien immobilier',
      description: `${property.propertyType ?? '—'} · ${property.city ?? '—'} · ${this.formatCurrency(property.price)}`,
      timestamp:
        property.updatedAt ??
        property.publishedAt ??
        property.createdAt ??
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

  protected propertyTone(property: PropertyResponse): ActivityItem['tone'] {
    if (property.status === 'PUBLISHED') {
      return 'green';
    }

    if (property.status === 'RESERVED') {
      return 'blue';
    }

    if (
      property.status === 'REJECTED' ||
      property.status === 'ARCHIVED'
    ) {
      return 'red';
    }

    return 'orange';
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
      return 'Paiement agence';
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

  protected agencyAddress(): string {
    const agency = this.agency();
    const firstProperty = this.properties()[0] ?? null;
    const parts = [
      agency?.city,
      firstProperty?.district,
      firstProperty?.address,
    ].filter((value): value is string =>
      Boolean(value && value.trim().length > 0),
    );

    return parts.length > 0 ? parts.join(' · ') : 'Adresse non renseignée';
  }

  protected mapFrameTitle(agencyName?: string | null): string {
    return agencyName
      ? `Carte de localisation de ${agencyName}`
      : "Carte de localisation de l'agence";
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
