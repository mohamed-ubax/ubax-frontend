import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

@Component({
  selector: 'ubax-bien-edit-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './bien-edit-page.component.html',
  styleUrl: './bien-edit-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BienEditPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly propertyId = this.route.snapshot.paramMap.get('id') ?? '';

  protected goBack(): void {
    void this.router.navigate(['/biens', this.propertyId]);
  }
}
