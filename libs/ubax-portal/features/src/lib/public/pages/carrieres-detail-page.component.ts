import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  BackToTopComponent,
  PublicShellComponent,
} from '@ubax-workspace/ubax-portal-layout';

interface JobSection {
  label: string;
  content: string;
}

@Component({
  selector: 'ubax-carrieres-detail-page',
  imports: [PublicShellComponent, BackToTopComponent, RouterLink],
  templateUrl: './carrieres-detail-page.component.html',
  styleUrl: './carrieres-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CarrieresDetailPageComponent {
  protected readonly ubaxIcon =
    'assets/portal-assets/careers/icons/Group 1171274746-2.svg';

  // Mock data — à remplacer par un service en production
  protected readonly job = {
    company: 'Ubax',
    title: 'Responsable Commercial',
    location: 'Abidjan',
    contractType: 'CDD',
    availability: 'Immédiate',
    remuneration: 'Fixe + commissions',
    id: 1,
  };

  protected readonly sections: JobSection[] = [
    {
      label: 'À propos de UBAX',
      content:
        "UBAX est une plateforme web et mobile innovante qui digitalise l'ensemble des processus du secteur immobilier. Elle permet aux agences, promoteurs et particuliers de gérer, vendre, louer et suivre leurs biens de manière simple, rapide et efficace.\n\nDans le cadre de notre croissance, nous recrutons un Responsable Commercial pour accompagner le développement de notre plateforme.",
    },
    {
      label: 'Missions principales',
      content:
        "Définir et piloter la stratégie commerciale de la plateforme UBAX\nDévelopper le portefeuille clients (agences immobilières, promoteurs, entreprises)\nProspecter et signer de nouveaux partenaires\nPrésenter et vendre la solution UBAX aux professionnels de l'immobilier\nEncadrer et animer l'équipe commerciale\nSuivre les performances et atteindre les objectifs de vente\nAssurer la satisfaction et la fidélisation des clients\nProduire des rapports d'activité (reporting)",
    },
    {
      label: 'Profil recherché',
      content:
        "Bac +3 minimum en commerce, marketing ou gestion\nExpérience de 3 ans minimum en vente ou développement commercial\nExpérience dans l'immobilier ou le digital (un plus)\nExcellentes capacités de négociation et de communication\nExpérience en gestion d'équipe\nEsprit stratégique et orienté résultats\nBonne maîtrise des outils digitaux et CRM",
    },
    {
      label: 'Compétences clés',
      content:
        'Leadership • Vente • Négociation • Prospection • Stratégie commerciale • CRM • Communication • Relation client • Analyse • Performance',
    },
    {
      label: 'Avantages',
      content:
        "Participation à une startup innovante dans la PropTech\nOpportunités d'évolution rapide\nPrimes basées sur la performance\nEnvironnement dynamique et digital\nFormation continue",
    },
    {
      label: 'Comment postuler ?',
      content:
        'Envoyez votre CV à :\n📧 recrutement@ubax.io\n\nOu postulez directement via la plateforme UBAX.',
    },
  ];
}
