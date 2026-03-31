import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  BackToTopComponent,
  PublicShellComponent,
} from '@ubax-workspace/ubax-portal-layout';

interface JobSection {
  label: string;
  content: string;
}

interface JobDetail {
  id: number;
  company: string;
  title: string;
  location: string;
  contractType: string;
  availability: string;
  remuneration: string;
  sections: JobSection[];
}

// ── Mock job database ────────────────────────────────────────────────────────
const JOB_DATABASE: JobDetail[] = [
  {
    id: 1,
    company: 'Ubax',
    title: 'Responsable Commercial',
    location: 'Cocody, Abidjan',
    contractType: 'Temps plein',
    availability: 'Immédiate',
    remuneration: 'Fixe + commissions',
    sections: [
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
    ],
  },
  {
    id: 2,
    company: 'Ubax',
    title: 'Assistant(e) Comptable',
    location: "Abidjan, Côte d'Ivoire",
    contractType: 'CDI',
    availability: 'Immédiate',
    remuneration: 'À définir',
    sections: [
      {
        label: 'À propos de UBAX',
        content:
          "Ubax Côte d'Ivoire est une entreprise innovante spécialisée dans les solutions digitales et services financiers. Dans le cadre du renforcement de son département financier, nous recrutons un(e) Assistant(e) Comptable motivé(e) et rigoureux(se).",
      },
      {
        label: 'Missions principales',
        content:
          "Rattaché(e) au Responsable Comptable, vous interviendrez sur les missions suivantes :\nSaisir les opérations comptables (achats, ventes, banques, caisse)\nAssurer le classement et l'archivage des pièces comptables\nParticiper au suivi des factures fournisseurs et clients\nEffectuer les rapprochements bancaires\nAider à la préparation des déclarations fiscales et sociales\nContribuer à l'élaboration des états financiers (bilan, compte de résultat)\nSuivre les paiements et relancer les clients en cas d'impayés\nAssister lors des clôtures mensuelles et annuelles",
      },
      {
        label: 'Profil recherché',
        content:
          "Formation : Bac +2 / Bac +3 en Comptabilité, Finance ou Gestion\nExpérience : 1 à 3 ans d'expérience dans un poste similaire",
      },
      {
        label: 'Compétences clés',
        content:
          'Bonne maîtrise des principes comptables\nConnaissance des logiciels comptables (Sage, Odoo ou équivalent)\nMaîtrise des outils bureautiques, notamment Excel\nBonne compréhension des obligations fiscales et sociales',
      },
      {
        label: 'Qualités personnelles',
        content:
          "Rigueur et sens du détail\nOrganisation et respect des délais\nEsprit d'analyse\nDiscrétion et intégrité\nBon esprit d'équipe",
      },
      {
        label: 'Pourquoi nous rejoindre ?',
        content:
          "Environnement professionnel structuré et stimulant\nPossibilités d'apprentissage et d'évolution\nImplication dans des projets financiers stratégiques",
      },
      {
        label: 'Comment postuler ?',
        content:
          "Merci d'envoyer votre CV et lettre de motivation à :\n📧 recrutement@ubax.ci\n\nObjet : Assistant(e) Comptable – Ubax CI",
      },
    ],
  },
  {
    id: 3,
    company: 'Ubax',
    title: 'Assistante de Direction',
    location: "Abidjan, Côte d'Ivoire",
    contractType: 'CDI',
    availability: 'Immédiate',
    remuneration: 'À définir',
    sections: [
      {
        label: 'À propos de UBAX',
        content:
          "Ubax Côte d'Ivoire est une entreprise dynamique spécialisée dans les solutions digitales et services financiers. Dans le cadre du renforcement de son organisation interne, nous recherchons une Assistante de Direction rigoureuse et proactive.",
      },
      {
        label: 'Missions principales',
        content:
          "En tant qu'Assistante de Direction, vous aurez pour rôle de soutenir la Direction Générale dans la gestion quotidienne de ses activités :\nAssurer la gestion de l'agenda du Directeur (prise de rendez-vous, organisation des réunions)\nGérer les appels, courriers et emails professionnels\nPréparer et organiser les réunions (convocations, ordre du jour, comptes rendus)\nAssurer le suivi des dossiers administratifs et stratégiques\nCoordiner les échanges entre la direction et les différents services\nOrganiser les déplacements professionnels (réservations, logistique)\nParticiper à la rédaction de documents (rapports, présentations, notes internes)\nGarantir la confidentialité des informations traitées",
      },
      {
        label: 'Profil recherché',
        content:
          "Formation : Bac +2 à Bac +3 en Assistanat de Direction, Gestion, Administration ou équivalent\nExpérience : Minimum 2 ans d'expérience dans un poste similaire",
      },
      {
        label: 'Compétences clés',
        content:
          "Excellente maîtrise des outils bureautiques (Word, Excel, PowerPoint)\nTrès bonnes capacités rédactionnelles\nSens de l'organisation et gestion des priorités\nCapacité à travailler sous pression et à gérer plusieurs tâches simultanément\nBonne présentation et excellent relationnel",
      },
      {
        label: 'Qualités personnelles',
        content:
          'Discrétion et sens de la confidentialité\nProactivité et autonomie\nRigueur et professionnalisme',
      },
      {
        label: 'Pourquoi nous rejoindre ?',
        content:
          "Environnement de travail dynamique et structuré\nOpportunités d'évolution professionnelle\nParticipation à des projets stratégiques de l'entreprise",
      },
      {
        label: 'Comment postuler ?',
        content:
          "Merci d'envoyer votre CV et lettre de motivation à :\n📧 recrutement@ubax.ci\n\nObjet : Assistante de Direction – Ubax CI",
      },
    ],
  },
];

const DEFAULT_JOB = JOB_DATABASE[0];

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

  protected readonly job: JobDetail;
  protected readonly sections: JobSection[];

  constructor() {
    const route = inject(ActivatedRoute);
    const id = Number(route.snapshot.paramMap.get('id'));
    this.job = JOB_DATABASE.find((j) => j.id === id) ?? DEFAULT_JOB;
    this.sections = this.job.sections;
  }
}
