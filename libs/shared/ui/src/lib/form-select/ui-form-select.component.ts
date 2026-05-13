import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  EmbeddedViewRef,
  HostListener,
  inject,
  input,
  model,
  OnDestroy,
  Renderer2,
  signal,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';

export interface UiFormSelectOption {
  label: string;
  value: string;
}

function normalizeSelectOption(
  option: string | UiFormSelectOption | Record<string, unknown>,
): UiFormSelectOption {
  if (typeof option === 'string') {
    return { label: option, value: option };
  }

  const optionRecord = option as Record<string, unknown>;

  const labelCandidate =
    (typeof optionRecord['label'] === 'string' && optionRecord['label']) ||
    (typeof optionRecord['name'] === 'string' && optionRecord['name']) ||
    (typeof optionRecord['title'] === 'string' && optionRecord['title']) ||
    '';

  const valueCandidate =
    (typeof optionRecord['value'] === 'string' && optionRecord['value']) ||
    (typeof optionRecord['id'] === 'string' && optionRecord['id']) ||
    labelCandidate;

  return {
    label: labelCandidate || String(valueCandidate || ''),
    value: valueCandidate || labelCandidate || '',
  };
}

@Component({
  selector: 'ubax-ui-form-select',
  standalone: true,
  templateUrl: './ui-form-select.component.html',
  styleUrl: './ui-form-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiFormSelectComponent implements OnDestroy {
  readonly label = input('');
  readonly options = input<
    readonly (string | UiFormSelectOption | Record<string, unknown>)[]
  >([]);
  readonly leadingIconSrc = input('');
  readonly disabled = input(false);
  readonly value = model('');

  protected readonly normalizedOptions = computed<
    readonly UiFormSelectOption[]
  >(() => this.options().map((option) => normalizeSelectOption(option)));

  protected readonly displayLabel = computed(() => {
    const selectedOption = this.normalizedOptions().find(
      (option) => option.value === this.value(),
    );

    return selectedOption?.label ?? this.value();
  });

  protected readonly isOpen = signal(false);
  protected readonly menuTop = signal(0);
  protected readonly menuLeft = signal(0);
  protected readonly menuWidth = signal(0);
  protected readonly menuMaxHeight = signal(320);

  @ViewChild('menuTpl') private readonly menuTpl!: TemplateRef<void>;

  private menuView: EmbeddedViewRef<void> | null = null;
  private menuEl: HTMLElement | null = null;

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly vcr = inject(ViewContainerRef);
  private readonly renderer = inject(Renderer2);

  /** Listener de scroll — capture phase pour attraper tous les conteneurs scrollables */
  private scrollUnlisten: (() => void) | null = null;

  protected toggle(): void {
    if (this.disabled()) {
      return;
    }

    if (this.isOpen()) {
      this.close();
      return;
    }

    this.isOpen.set(true);
    this.updateMenuPosition();
    this.menuView = this.vcr.createEmbeddedView(this.menuTpl);
    this.menuView.detectChanges();
    this.menuEl =
      this.menuView.rootNodes.find(
        (node): node is HTMLElement => node.nodeType === Node.ELEMENT_NODE,
      ) ?? null;

    if (this.menuEl) {
      this.renderer.appendChild(document.body, this.menuEl);
    }

    queueMicrotask(() => this.updateMenuPosition());

    // addEventListener en capture phase pour attraper le scroll de TOUS les
    // conteneurs (window:scroll ne se déclenche pas sur un div overflow:auto)
    const handler = () => this.repositionMenu();
    document.addEventListener('scroll', handler, {
      capture: true,
      passive: true,
    });
    this.scrollUnlisten = () =>
      document.removeEventListener('scroll', handler, { capture: true });
  }

  protected select(optionValue: string): void {
    this.value.set(optionValue);
    this.close();
  }

  ngOnDestroy(): void {
    this.destroyMenu(true);
    if (this.scrollUnlisten) {
      this.scrollUnlisten();
      this.scrollUnlisten = null;
    }
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node;

    if (
      !this.el.nativeElement.contains(target) &&
      !this.menuEl?.contains(target)
    ) {
      this.close();
    }
  }

  @HostListener('document:keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.isOpen()) {
      event.stopImmediatePropagation();
      this.close();
    }
  }

  @HostListener('window:resize')
  protected onResize(): void {
    this.repositionMenu();
  }

  private close(): void {
    if (!this.isOpen()) {
      return;
    }

    this.isOpen.set(false);
    this.destroyMenu();

    // Nettoyer le listener de scroll
    if (this.scrollUnlisten) {
      this.scrollUnlisten();
      this.scrollUnlisten = null;
    }
  }

  private destroyMenu(skipAnimation = false): void {
    const menuEl = this.menuEl;
    const menuView = this.menuView;

    this.menuEl = null;
    this.menuView = null;

    if (!menuView) {
      return;
    }

    if (!menuEl || skipAnimation) {
      menuView.destroy();
      return;
    }

    menuEl.classList.add('is-leaving');
    menuEl.addEventListener('animationend', () => menuView.destroy(), {
      once: true,
    });
  }

  private repositionMenu(): void {
    if (this.isOpen()) {
      this.updateMenuPosition();
    }
  }

  private updateMenuPosition(): void {
    const trigger = this.el.nativeElement.querySelector(
      '.form-select__trigger',
    ) as HTMLElement | null;

    if (!trigger) {
      return;
    }

    const rect = trigger.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const horizontalMargin = 16;
    const contentWidth = this.menuEl?.scrollWidth ?? rect.width;
    const width = Math.min(
      Math.max(rect.width, contentWidth),
      viewportWidth - horizontalMargin * 2,
    );
    const maxLeft = Math.max(
      horizontalMargin,
      viewportWidth - width - horizontalMargin,
    );
    const left = Math.min(Math.max(rect.left, horizontalMargin), maxLeft);
    const availableHeight = Math.max(
      148,
      window.innerHeight - rect.bottom - 24,
    );

    this.menuTop.set(rect.bottom + 10);
    this.menuLeft.set(left);
    this.menuWidth.set(width);
    this.menuMaxHeight.set(Math.min(320, availableHeight));
  }
}
