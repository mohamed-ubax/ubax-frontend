import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  UbaxMorphTabsDirective,
  UbaxPaginatorComponent,
} from '@ubax-workspace/shared-ui';
import type { TabId, EmployeRow } from '../../types/employes-list.types';
import {
  EMPLOYES_TABS,
  EMPLOYES_ROWS_BY_TAB,
  normalizeSearchText,
} from '../../constants/employes-list.constants';

@Component({
  selector: 'ubax-employes-list-page',
  standalone: true,
  imports: [RouterLink, UbaxMorphTabsDirective, UbaxPaginatorComponent],
  templateUrl: './employes-list-page.component.html',
  styleUrl: './employes-list-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployesListPageComponent {
  readonly activeTab = signal<TabId>('all');
  readonly currentPage = signal(3);
  readonly totalPages = 5;
  readonly searchValue = signal('');
  readonly selectedEmployeIds = signal<Set<string>>(new Set<string>());

  readonly tabs = EMPLOYES_TABS;

  readonly filteredEmployes = computed(() => {
    const search = normalizeSearchText(this.searchValue().trim());
    const employes = EMPLOYES_ROWS_BY_TAB[this.activeTab()];

    if (!search) {
      return employes;
    }

    return employes.filter((employe) =>
      normalizeSearchText(
        [
          employe.nom,
          employe.poste,
          employe.description,
          employe.joursTravail,
          employe.horaires,
          employe.telephone,
        ].join(' '),
      ).includes(search),
    );
  });

  readonly filteredEmployeIds = computed(() =>
    this.filteredEmployes().map((employe) => employe.id),
  );

  readonly allFilteredEmployesSelected = computed(() => {
    const filteredIds = this.filteredEmployeIds();

    if (!filteredIds.length) {
      return false;
    }

    const selectedIds = this.selectedEmployeIds();
    return filteredIds.every((id) => selectedIds.has(id));
  });

  readonly someFilteredEmployesSelected = computed(() => {
    const filteredIds = this.filteredEmployeIds();

    if (!filteredIds.length) {
      return false;
    }

    const selectedIds = this.selectedEmployeIds();
    let selectedCount = 0;

    filteredIds.forEach((id) => {
      if (selectedIds.has(id)) {
        selectedCount += 1;
      }
    });

    return selectedCount > 0 && selectedCount < filteredIds.length;
  });

  setTab(id: TabId): void {
    this.activeTab.set(id);
  }

  isEmployeSelected(id: string): boolean {
    return this.selectedEmployeIds().has(id);
  }

  toggleSelectAll(event: Event): void {
    const shouldSelect = this.readCheckboxState(event);
    const filteredIds = this.filteredEmployeIds();

    this.selectedEmployeIds.update((current) => {
      const next = new Set(current);

      filteredIds.forEach((id) => {
        if (shouldSelect) {
          next.add(id);
          return;
        }

        next.delete(id);
      });

      return next;
    });
  }

  toggleEmployeSelection(id: string, event: Event): void {
    const shouldSelect = this.readCheckboxState(event);

    this.selectedEmployeIds.update((current) => {
      const next = new Set(current);

      if (shouldSelect) {
        next.add(id);
      } else {
        next.delete(id);
      }

      return next;
    });
  }

  updateSearch(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLInputElement) {
      this.searchValue.set(target.value);
    }
  }

  private readCheckboxState(event: Event): boolean {
    const target = event.target;
    return target instanceof HTMLInputElement ? target.checked : false;
  }
}
