import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PageHeaderComponent, PageToolbarComponent, PageTabsComponent, FilterBarComponent, PageTab } from '@ubax-workspace/shared-ui';

@Component({
  selector: 'ubax-archivage-page',
  standalone: true,
  imports: [PageHeaderComponent, PageToolbarComponent, PageTabsComponent, FilterBarComponent],
  template: `
    <ubax-page-header title="Biens Archivés">
    </ubax-page-header>
    <ubax-page-tabs [tabs]="tabs" [(activeTab)]="activeTab" />
    <ubax-filter-bar [showKeyword]="true" [showDateRange]="true" />
    <p class="text-slate-400 text-sm">En cours de développement…</p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArchivagePageComponent {
  protected readonly tabs: PageTab[] = [
    { label: 'Biens Archivés',       value: 'biens' },
    { label: 'Locataires Archivés',  value: 'locataires' },
    { label: 'Factures archivés',    value: 'factures' },
    { label: 'Tickets SAV Archivés', value: 'tickets' },
    { label: 'Documents Archivés',   value: 'documents' },
  ];
  protected readonly activeTab = signal('biens');
}
