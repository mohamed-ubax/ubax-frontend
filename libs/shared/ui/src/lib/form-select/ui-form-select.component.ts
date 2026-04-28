import {
  ChangeDetectionStrategy,
  Component,
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

@Component({
  selector: 'ubax-ui-form-select',
  standalone: true,
  templateUrl: './ui-form-select.component.html',
  styleUrl: './ui-form-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiFormSelectComponent implements OnDestroy {
  readonly label = input('');
  readonly options = input<readonly string[]>([]);
  readonly leadingIconSrc = input('');
  readonly disabled = input(false);
  readonly value = model('');

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

  protected toggle(): void {
    if (this.disabled()) {
      return;
    }

    if (this.isOpen()) {
      this.close();
      return;
    }

    this.updateMenuPosition();
    this.isOpen.set(true);
    this.menuView = this.vcr.createEmbeddedView(this.menuTpl);
    this.menuView.detectChanges();
    this.menuEl =
      this.menuView.rootNodes.find(
        (node): node is HTMLElement => node.nodeType === Node.ELEMENT_NODE,
      ) ?? null;

    if (this.menuEl) {
      this.renderer.appendChild(document.body, this.menuEl);
    }
  }

  protected select(option: string): void {
    this.value.set(option);
    this.close();
  }

  ngOnDestroy(): void {
    this.destroyMenu(true);
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
    if (this.isOpen()) {
      this.updateMenuPosition();
    }
  }

  private close(): void {
    if (!this.isOpen()) {
      return;
    }

    this.isOpen.set(false);
    this.destroyMenu();
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
    const width = Math.min(rect.width, viewportWidth - horizontalMargin * 2);
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
