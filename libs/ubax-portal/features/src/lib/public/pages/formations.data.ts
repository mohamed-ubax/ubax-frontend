export interface GuideSection {
  heading?: string;
  paragraphs: string[];
  list?: string[];
}

export interface Guide {
  slug: string;
  image: string;
  heroImage: string;
  title: string;
  excerpt: string;
  date: string;
  sections: GuideSection[];
}

export const ALL_GUIDES: Guide[] = [
  {
    slug: 'role-agence-immobiliere',
    image: 'assets/portal-assets/formations/images/Rectangle 240648229.png',
    heroImage: 'assets/portal-assets/formation-details/images/source/large-building-site.jpg',
    title: "Le rôle d'une agence immobilière et pourquoi passer par elle",
    excerpt:
      "Découvrez pourquoi travailler avec une agence immobilière peut vous aider à éviter des problèmes et sécuriser votre achat ou votre location.",
    date: 'Lundi 10 Mars 2026',
    sections: [
      {
        paragraphs: [
          "En Côte d'Ivoire, le marché immobilier est dynamique mais peut être complexe à naviguer. Faire appel à une agence immobilière peut faire toute la différence entre une transaction réussie et une expérience décevante.",
        ],
      },
      {
        heading: "Qu'est-ce qu'une agence immobilière ?",
        paragraphs: [
          "Une agence immobilière est une structure professionnelle qui met en relation les vendeurs, les acheteurs, les propriétaires et les locataires. Elle est généralement dirigée par un agent immobilier agréé.",
          "L'agence joue le rôle d'intermédiaire et facilite les démarches administratives, juridiques et financières liées aux transactions immobilières.",
        ],
      },
      {
        heading: 'Les avantages de passer par une agence',
        paragraphs: ['Faire appel à une agence immobilière présente plusieurs avantages majeurs :'],
        list: [
          'Accès à un large portefeuille de biens',
          'Vérification de la légalité des documents',
          'Négociation professionnelle du prix',
          'Accompagnement dans les démarches administratives',
          "Réduction des risques d'arnaques",
        ],
      },
      {
        heading: 'Quand faire appel à une agence ?',
        paragraphs: [
          "Il est conseillé de contacter une agence immobilière dès le début de votre projet, que ce soit pour acheter, vendre ou louer un bien. L'agence peut vous guider sur le marché local, les prix pratiqués et les quartiers à privilégier.",
        ],
      },
      {
        heading: 'Conclusion',
        paragraphs: [
          "Passer par une agence immobilière est un choix judicieux pour sécuriser votre investissement et éviter les mauvaises surprises. Choisissez une agence de confiance, reconnue et expérimentée sur le marché ivoirien.",
        ],
      },
    ],
  },
  {
    slug: 'construire-maison-cote-ivoire',
    image: 'assets/portal-assets/formations/images/Rectangle 240648229-1.png',
    heroImage: 'assets/portal-assets/formation-details/images/source/large-building-site.jpg',
    title: "Construire une maison en Côte d'Ivoire : les étapes importantes",
    excerpt:
      "Du choix du terrain jusqu'à la construction, voici les étapes à suivre pour réaliser votre projet immobilier dans les règles.",
    date: 'Mercredi 11 Mars 2026',
    sections: [
      {
        paragraphs: [
          "Construire sa propre maison en Côte d'Ivoire est le rêve de beaucoup d'Ivoiriens. Mais ce projet nécessite une bonne préparation et le respect de certaines étapes pour éviter les problèmes.",
        ],
      },
      {
        heading: 'Choisir et sécuriser le terrain',
        paragraphs: [
          "La première étape est de trouver un terrain dans une zone urbanisée ou lotie. Il est essentiel de vérifier les documents du terrain avant tout achat :",
        ],
        list: [
          "Vérifier l'existence d'un ACD ou d'un titre foncier",
          'Confirmer que le terrain est constructible',
          'Consulter le plan de lotissement en mairie',
        ],
      },
      {
        heading: 'Obtenir le permis de construire',
        paragraphs: [
          "Le permis de construire est obligatoire pour toute construction. Pour l'obtenir, vous devez déposer un dossier à la mairie comprenant les plans architecturaux, le titre de propriété du terrain et le formulaire de demande.",
          "Le délai d'obtention peut varier de 1 à 3 mois selon la commune.",
        ],
      },
      {
        heading: 'Les étapes de construction',
        paragraphs: ['Une fois le permis obtenu, vous pouvez débuter les travaux :'],
        list: [
          'Fondation et gros œuvre',
          'Maçonnerie et structure',
          'Couverture (toiture)',
          'Second œuvre (plomberie, électricité)',
          'Finitions et aménagement',
        ],
      },
      {
        heading: 'Conclusion',
        paragraphs: [
          "Construire une maison en Côte d'Ivoire est possible avec une bonne organisation et le respect des étapes légales. Entourez-vous de professionnels compétents et n'hésitez pas à demander conseil avant de débuter les travaux.",
        ],
      },
    ],
  },
  {
    slug: 'acheter-terrain-cote-ivoire',
    image: 'assets/portal-assets/formations/images/Rectangle 240648229-2.png',
    heroImage: 'assets/portal-assets/formation-details/images/source/attestation-de-droit-dusage-coutumier.jpg',
    title: "Comment acheter un terrain en Côte d'Ivoire en toute sécurité",
    excerpt:
      "Découvrez les étapes essentielles pour acheter un terrain sans risque en Côte d'Ivoire, les documents à vérifier et les erreurs à éviter avant de payer.",
    date: 'Jeudi 12 Mars 2026',
    sections: [
      {
        paragraphs: [
          "L'achat d'un terrain est l'une des décisions financières les plus importantes de votre vie. En Côte d'Ivoire, certaines précautions s'imposent pour éviter les arnaques et sécuriser votre investissement.",
        ],
      },
      {
        heading: 'Vérifier la légalité du terrain',
        paragraphs: [
          "Avant toute chose, il faut s'assurer que le terrain est légalement vendable. Pour cela :",
        ],
        list: [
          "Demandez l'ACD ou le titre foncier original",
          "Vérifiez l'identité du vendeur à la conservation foncière",
          'Consultez la mairie pour confirmer le statut du terrain',
          "Évitez les terrains vendus uniquement avec une attestation villageoise",
        ],
      },
      {
        heading: 'Les documents indispensables',
        paragraphs: ['Pour sécuriser votre achat, vous devez disposer des documents suivants :'],
        list: [
          'Arrêté de Concession Définitive (ACD)',
          'Titre foncier ou PFR',
          'Reçu de paiement officiel',
          'Acte notarié de vente',
        ],
      },
      {
        heading: 'Les arnaques courantes à éviter',
        paragraphs: [
          'Le marché immobilier ivoirien est malheureusement touché par de nombreuses arnaques. Voici les plus courantes :',
        ],
        list: [
          'Vente du même terrain à plusieurs acheteurs',
          'Faux documents officiels',
          "Vendeur qui n'est pas le vrai propriétaire",
          'Terrain en zone inconstructible vendu comme constructible',
        ],
      },
      {
        heading: 'Faire appel à un notaire',
        paragraphs: [
          "Il est fortement recommandé de finaliser votre achat devant un notaire. Le notaire vérifie l'authenticité des documents, sécurise le transfert de propriété et enregistre officiellement la transaction.",
        ],
      },
      {
        heading: 'Conclusion',
        paragraphs: [
          "Acheter un terrain en toute sécurité en Côte d'Ivoire nécessite de la prudence et de la vigilance. Prenez le temps de vérifier tous les documents et n'hésitez pas à faire appel à des professionnels pour vous accompagner.",
        ],
      },
    ],
  },
  {
    slug: 'comprendre-acd-titre-foncier',
    image: 'assets/portal-assets/formations/images/Rectangle 240648229-3.png',
    heroImage: 'assets/portal-assets/formation-details/images/source/attestation-de-droit-dusage-coutumier.jpg',
    title: "Comprendre l'ACD, le titre foncier et l'attestation villageoise",
    excerpt:
      "Apprenez la différence entre les principaux documents immobiliers en Côte d'Ivoire et pourquoi ils sont importants.",
    date: 'Lundi 16 Mars 2026',
    sections: [
      {
        paragraphs: [
          "En Côte d'Ivoire, l'achat d'un terrain ou d'une maison nécessite de vérifier certains documents importants. Les plus connus sont l'ACD, le titre foncier et l'attestation villageoise.",
          "Comprendre la différence entre ces documents permet d'éviter les erreurs et de sécuriser son investissement immobilier.",
        ],
      },
      {
        heading: "L'ACD (Arrêté de Concession Définitive)",
        paragraphs: [
          "L'ACD est un document officiel délivré par l'État ivoirien qui confirme qu'une personne est le propriétaire légal d'un terrain urbain.",
          "Un terrain avec ACD est considéré comme sécurisé car il est reconnu par le Ministère de la Construction.",
          "Avec un ACD, il est possible de :",
        ],
        list: [
          'construire légalement',
          'vendre le terrain',
          'obtenir un permis de construire',
          'éviter les litiges',
        ],
      },
      {
        heading: 'Le titre foncier',
        paragraphs: [
          "Le titre foncier est aussi un document officiel qui prouve la propriété d'un terrain inscrit au registre foncier.",
          "Il offre un bon niveau de sécurité et protège le propriétaire contre les conflits.",
          "On le retrouve souvent sur les anciens terrains ou les grandes propriétés.",
          "Un terrain avec titre foncier peut être :",
        ],
        list: ['vendu', 'transmis', 'utilisé pour construire'],
      },
      {
        heading: "L'attestation villageoise",
        paragraphs: [
          "L'attestation villageoise est un document délivré par le village ou la communauté qui confirme qu'un terrain appartient à une personne.",
          "Ce document est fréquent dans les zones rurales ou les nouveaux lotissements.",
          "Cependant, l'attestation villageoise seule ne garantit pas la propriété devant l'État.",
          "Il est souvent nécessaire de faire une procédure pour obtenir un ACD afin de sécuriser le terrain.",
          "Risques possibles :",
        ],
        list: [
          'terrain vendu à plusieurs personnes',
          'litiges',
          'refus de permis de construire',
        ],
      },
      {
        heading: 'Conclusion',
        paragraphs: [
          "Avant d'acheter un terrain en Côte d'Ivoire, il est très important de vérifier les documents.",
          "Un terrain avec ACD ou titre foncier est plus sûr, tandis qu'un terrain avec attestation villageoise doit être vérifié avec attention.",
          "Se former et bien s'informer permet d'éviter les arnaques et de réussir son projet immobilier.",
        ],
      },
    ],
  },
  {
    slug: 'erreurs-eviter-achat-immobilier',
    image: 'assets/portal-assets/formations/images/Rectangle 240648229-4.png',
    heroImage: 'assets/portal-assets/formation-details/images/source/family-broken-home.jpg',
    title: "Les erreurs à éviter lors d'un achat immobilier",
    excerpt:
      "Beaucoup d'acheteurs perdent de l'argent à cause d'erreurs simples. Voici les précautions à prendre avant d'acheter une maison ou un terrain.",
    date: 'Mardi 17 Mars 2026',
    sections: [
      {
        paragraphs: [
          "Beaucoup d'acheteurs, notamment les primo-accédants, commettent des erreurs qui peuvent leur coûter très cher. En connaître les principales permet de les éviter et de réussir son projet immobilier.",
        ],
      },
      {
        heading: 'Ne pas vérifier les documents du bien',
        paragraphs: [
          "C'est l'erreur la plus grave et la plus fréquente. Certains acheteurs paient sans vérifier si le vendeur est bien le propriétaire légal ou si les documents sont authentiques.",
          "Toujours faire vérifier par un notaire ou un avocat spécialisé l'ensemble des documents du bien.",
        ],
      },
      {
        heading: 'Sous-estimer les frais annexes',
        paragraphs: [
          "Le prix d'achat n'est pas le seul coût à prévoir. Il faut aussi budgéter :",
        ],
        list: [
          'Les frais de notaire (entre 5 et 10 % du prix)',
          "Les frais d'agence immobilière",
          'Les taxes et impôts fonciers',
          'Les travaux éventuels',
          'Les frais de déménagement',
        ],
      },
      {
        heading: 'Acheter sans visiter le bien',
        paragraphs: [
          "Ne jamais acheter un bien sans l'avoir visité en personne, même plusieurs fois à différentes heures. Certains problèmes (humidité, bruit, voisinage) ne se révèlent qu'à la visite.",
        ],
      },
      {
        heading: "Négliger l'environnement du bien",
        paragraphs: [
          "L'emplacement est souvent plus important que le bien lui-même. Vérifiez la proximité des services essentiels, l'accessibilité, la sécurité du quartier et les projets de développement environnants.",
        ],
      },
      {
        heading: 'Conclusion',
        paragraphs: [
          "Un achat immobilier réussi est avant tout un achat bien préparé. Prenez le temps de vous former, de vous entourer de professionnels compétents et de vérifier chaque étape du processus.",
        ],
      },
    ],
  },
  {
    slug: 'investir-immobilier-cote-ivoire',
    image: 'assets/portal-assets/formations/images/Rectangle 240648229-5.png',
    heroImage: 'assets/portal-assets/formation-details/images/source/6329c9b63a88a-investissement immobilier.jpg',
    title: "Investir dans l'immobilier en Côte d'Ivoire : par où commencer ?",
    excerpt:
      "Conseils pratiques pour débuter dans l'investissement immobilier, même avec un petit budget, et comprendre les opportunités du marché ivoirien.",
    date: 'Mercredi 18 Mars 2026',
    sections: [
      {
        paragraphs: [
          "La Côte d'Ivoire connaît une croissance économique soutenue qui se reflète dans son marché immobilier. Investir dans l'immobilier peut être une excellente façon de constituer un patrimoine durable, même avec un budget limité.",
        ],
      },
      {
        heading: "Pourquoi investir dans l'immobilier en Côte d'Ivoire ?",
        paragraphs: [
          "Le marché immobilier ivoirien offre plusieurs avantages pour les investisseurs :",
        ],
        list: [
          'Une demande locative forte et en croissance',
          'Des rendements locatifs attrayants (7 à 12 %)',
          'Une appréciation constante des prix dans les zones urbaines',
          "Une économie en croissance portée par l'urbanisation",
        ],
      },
      {
        heading: 'Par où commencer ?',
        paragraphs: [
          "Pour débuter dans l'investissement immobilier, voici les premières étapes à suivre :",
        ],
        list: [
          "Définir votre budget et votre capacité d'épargne",
          "Choisir le type d'investissement (terrain, appartement, maison)",
          'Étudier les différents quartiers et leur potentiel',
          'Vous former sur les aspects juridiques et fiscaux',
          'Construire un réseau de professionnels de confiance',
        ],
      },
      {
        heading: "Les types d'investissement accessibles",
        paragraphs: [
          "Plusieurs formes d'investissement immobilier sont accessibles, même avec un petit budget :",
        ],
        list: [
          'Achat d\'un terrain à valoriser',
          "Acquisition d'un studio ou appartement à louer",
          'Construction progressive par phases',
          'Investissement en copropriété',
        ],
      },
      {
        heading: 'Conclusion',
        paragraphs: [
          "L'immobilier en Côte d'Ivoire représente une excellente opportunité d'investissement pour qui sait s'y prendre. Commencez petit, formez-vous continuellement et entourez-vous des bons professionnels pour maximiser vos chances de succès.",
        ],
      },
    ],
  },
  {
    slug: 'comprendre-bail-location',
    image: 'assets/portal-assets/formations/images/Rectangle 240648229.png',
    heroImage: 'assets/portal-assets/formation-details/images/source/family-broken-home.jpg',
    title: "Comprendre le bail de location en Côte d'Ivoire",
    excerpt:
      "Tout ce que locataires et bailleurs doivent savoir sur le contrat de bail, leurs droits et obligations légaux.",
    date: 'Jeudi 12 Mars 2026',
    sections: [
      {
        paragraphs: [
          "Le bail de location est un contrat qui régit les relations entre le propriétaire (bailleur) et le locataire. En Côte d'Ivoire, ce contrat est encadré par la loi et doit respecter certaines règles pour être valable.",
        ],
      },
      {
        heading: "Le contenu obligatoire d'un bail",
        paragraphs: ["Un bail de location doit obligatoirement mentionner :"],
        list: [
          'L\'identité du bailleur et du locataire',
          'La description précise du logement',
          'Le montant du loyer et les conditions de révision',
          'La durée du bail',
          'Le montant du dépôt de garantie',
          'Les charges locatives',
        ],
      },
      {
        heading: 'Les droits du locataire',
        paragraphs: ['En tant que locataire, vous avez des droits fondamentaux :'],
        list: [
          'Jouir paisiblement du logement',
          'Recevoir un logement en bon état',
          'Bénéficier de la privacité du domicile',
          'Obtenir une quittance de loyer',
        ],
      },
      {
        heading: 'Les obligations du locataire',
        paragraphs: ['Le locataire a également des obligations à respecter :'],
        list: [
          'Payer le loyer à la date convenue',
          'Entretenir le logement',
          'Ne pas sous-louer sans autorisation',
          'Respecter le règlement de la copropriété',
        ],
      },
      {
        heading: 'Conclusion',
        paragraphs: [
          "Qu'on soit locataire ou bailleur, connaître ses droits et obligations est essentiel pour éviter les conflits. Un bail bien rédigé, clair et complet protège les deux parties et assure une relation sereine.",
        ],
      },
    ],
  },
  {
    slug: 'frais-caches-achat-bien',
    image: 'assets/portal-assets/formations/images/Rectangle 240648229-1.png',
    heroImage: 'assets/portal-assets/formation-details/images/source/6329c9b63a88a-investissement immobilier.jpg',
    title: "Les frais cachés à connaître avant d'acheter un bien",
    excerpt:
      "Au-delà du prix affiché, découvrez tous les frais annexes qui peuvent alourdir votre budget d'acquisition immobilière.",
    date: 'Vendredi 13 Mars 2026',
    sections: [
      {
        paragraphs: [
          "Beaucoup d'acheteurs sont surpris par des frais supplémentaires qui s'ajoutent au prix du bien immobilier. Pour éviter les mauvaises surprises, voici tout ce que vous devez anticiper avant de signer.",
        ],
      },
      {
        heading: 'Les frais de notaire',
        paragraphs: [
          "En Côte d'Ivoire, les frais de notaire représentent en général entre 5 et 10 % du prix d'achat du bien. Ils comprennent les honoraires du notaire, les droits d'enregistrement et les frais de publication.",
          "Ces frais sont généralement à la charge de l'acheteur et doivent être prévus dans votre budget.",
        ],
      },
      {
        heading: "Les frais d'agence",
        paragraphs: [
          "Si vous passez par une agence immobilière, des commissions sont à prévoir. Ces frais varient selon les agences mais représentent généralement entre 3 et 5 % du prix de vente.",
        ],
      },
      {
        heading: 'Les taxes et impôts',
        paragraphs: ['Plusieurs taxes sont liées à l\'acquisition d\'un bien immobilier :'],
        list: [
          'La taxe de mutation (transfert de propriété)',
          'L\'impôt foncier annuel',
          'La TVA pour les biens neufs',
        ],
      },
      {
        heading: 'Conclusion',
        paragraphs: [
          "Pour réussir votre achat immobilier, prévoyez toujours une marge de 15 à 20 % au-dessus du prix affiché pour couvrir tous les frais annexes. Une bonne préparation financière est la clé d'une transaction sereine.",
        ],
      },
    ],
  },
  {
    slug: 'negocier-prix-immobilier',
    image: 'assets/portal-assets/formations/images/Rectangle 240648229-2.png',
    heroImage: 'assets/portal-assets/formation-details/images/source/6329c9b63a88a-investissement immobilier.jpg',
    title: "Comment négocier le prix d'un bien immobilier",
    excerpt:
      "Les meilleures stratégies pour négocier efficacement et obtenir le meilleur prix lors de votre prochain achat immobilier.",
    date: 'Samedi 14 Mars 2026',
    sections: [
      {
        paragraphs: [
          "La négociation du prix est une étape cruciale dans tout achat immobilier. Avec les bonnes stratégies, vous pouvez obtenir un prix inférieur au prix affiché et réaliser de belles économies.",
        ],
      },
      {
        heading: 'Se préparer avant de négocier',
        paragraphs: ['Une bonne négociation commence bien avant la première rencontre avec le vendeur. Il est essentiel de :'],
        list: [
          'Étudier les prix du marché dans la zone ciblée',
          'Visiter plusieurs biens similaires pour comparer',
          'Identifier les points faibles du bien (ancienneté, travaux à faire)',
          'Définir votre prix maximum acceptable',
        ],
      },
      {
        heading: 'Les stratégies de négociation efficaces',
        paragraphs: ['Voici les techniques les plus efficaces pour négocier :'],
        list: [
          'Commencer avec une offre basse mais réaliste',
          'Mettre en avant les défauts du bien',
          'Mentionner la concurrence (autres biens similaires moins chers)',
          'Proposer des contreparties (paiement rapide, achat en l\'état)',
          "Ne pas montrer trop d'enthousiasme",
        ],
      },
      {
        heading: 'Conclusion',
        paragraphs: [
          "La négociation immobilière est un art qui s'apprend. Avec de la préparation, de la patience et les bonnes stratégies, vous pouvez obtenir le bien de vos rêves à un prix avantageux.",
        ],
      },
    ],
  },
  {
    slug: 'financement-immobilier',
    image: 'assets/portal-assets/formations/images/Rectangle 240648229-3.png',
    heroImage: 'assets/portal-assets/formation-details/images/source/large-building-site.jpg',
    title: "Financement immobilier : options disponibles en Côte d'Ivoire",
    excerpt:
      "Tour d'horizon des solutions de financement accessibles aux particuliers pour concrétiser leur projet immobilier.",
    date: 'Dimanche 15 Mars 2026',
    sections: [
      {
        paragraphs: [
          "Financer un projet immobilier en Côte d'Ivoire peut sembler complexe, mais il existe plusieurs options adaptées à différents profils d'acheteurs.",
        ],
      },
      {
        heading: "L'épargne personnelle",
        paragraphs: [
          "La solution la plus simple et sans risque est de financer votre projet avec votre épargne personnelle. Cela vous évite les intérêts et les contraintes d'un prêt, mais nécessite une discipline financière sur le long terme.",
        ],
      },
      {
        heading: 'Le crédit bancaire',
        paragraphs: ['Les banques ivoiriennes proposent des prêts immobiliers. Les éléments clés à comparer sont :'],
        list: [
          'Le taux d\'intérêt (fixe ou variable)',
          'La durée de remboursement',
          "L'apport personnel exigé",
          'Les garanties demandées',
          'Les frais de dossier',
        ],
      },
      {
        heading: 'Les programmes gouvernementaux',
        paragraphs: [
          "L'État ivoirien propose parfois des programmes de logement social. La Caisse Nationale de Prévoyance Sociale (CNPS) peut également offrir des prêts aux affiliés pour l'acquisition de logements.",
        ],
      },
      {
        heading: 'Conclusion',
        paragraphs: [
          "Chaque option de financement a ses avantages et ses inconvénients. L'idéal est souvent de combiner plusieurs sources de financement. Consultez un conseiller financier pour trouver la solution la mieux adaptée à votre situation.",
        ],
      },
    ],
  },
  {
    slug: 'gerer-propriete-locative',
    image: 'assets/portal-assets/formations/images/Rectangle 240648229-4.png',
    heroImage: 'assets/portal-assets/formation-details/images/source/family-broken-home.jpg',
    title: 'Gérer sa propriété locative comme un professionnel',
    excerpt:
      "Astuces et bonnes pratiques pour maximiser la rentabilité de votre bien et entretenir une relation saine avec vos locataires.",
    date: 'Lundi 16 Mars 2026',
    sections: [
      {
        paragraphs: [
          "Posséder un bien locatif est une excellente source de revenus passifs, mais cela demande une gestion rigoureuse pour être vraiment rentable et éviter les problèmes avec les locataires.",
        ],
      },
      {
        heading: 'Fixer le bon loyer',
        paragraphs: [
          "Un loyer trop élevé peut décourager les candidats sérieux. Un loyer trop bas réduit votre rentabilité. Pour fixer le bon loyer :",
        ],
        list: [
          'Comparez avec les biens similaires dans le quartier',
          'Tenez compte des charges incluses',
          "Adaptez le loyer à l'état et aux équipements du bien",
          'Réévaluez régulièrement (une fois par an maximum)',
        ],
      },
      {
        heading: 'Bien sélectionner vos locataires',
        paragraphs: ['La sélection des locataires est cruciale pour éviter les impayés. Demandez systématiquement :'],
        list: [
          "Une pièce d'identité valide",
          'Les justificatifs de revenus des 3 derniers mois',
          'Une lettre de garantie ou cautionnement',
          'Les références des anciens propriétaires',
        ],
      },
      {
        heading: 'Entretenir le bien',
        paragraphs: [
          "Un bien bien entretenu attire de meilleurs locataires et se loue plus facilement. Planifiez les travaux d'entretien réguliers et intervenez rapidement en cas de problèmes.",
        ],
      },
      {
        heading: 'Conclusion',
        paragraphs: [
          "Une gestion locative professionnelle passe par une bonne organisation, une communication claire avec vos locataires et un entretien régulier de votre bien. Avec les bonnes pratiques, votre investissement locatif sera rentable sur le long terme.",
        ],
      },
    ],
  },
  {
    slug: 'quartiers-fort-potentiel-abidjan',
    image: 'assets/portal-assets/formations/images/Rectangle 240648229-5.png',
    heroImage: 'assets/portal-assets/formation-details/images/source/large-building-site.jpg',
    title: 'Les quartiers à fort potentiel à Abidjan en 2026',
    excerpt:
      "Analyse des zones en plein essor où investir en immobilier résidentiel ou commercial peut offrir d'excellentes perspectives.",
    date: 'Mercredi 18 Mars 2026',
    sections: [
      {
        paragraphs: [
          "Abidjan, capitale économique de la Côte d'Ivoire, est en pleine expansion. Plusieurs quartiers offrent aujourd'hui des opportunités d'investissement immobilier particulièrement intéressantes pour 2026 et au-delà.",
        ],
      },
      {
        heading: "Pourquoi Abidjan ?",
        paragraphs: [
          "Abidjan concentre plus de 50 % de l'activité économique du pays et accueille chaque année de nouveaux habitants. Cette croissance démographique crée une demande immobilière soutenue.",
        ],
      },
      {
        heading: 'Les quartiers les plus prometteurs',
        paragraphs: ['Voici les zones qui présentent le meilleur potentiel de valorisation en 2026 :'],
        list: [
          'Bingerville : en plein développement avec de nombreux projets résidentiels',
          'Grand-Bassam : attractif grâce à la proximité de la plage et au potentiel touristique',
          'Abobo : demande locative forte avec des prix encore accessibles',
          'Yopougon : grand pôle résidentiel en constante expansion',
          'Cocody (zones périphériques) : valorisation continue grâce au prestige du quartier',
        ],
      },
      {
        heading: 'Les critères pour bien choisir',
        paragraphs: ["Pour identifier un quartier à fort potentiel, analysez :"],
        list: [
          "Les projets d'infrastructure à venir (routes, transports)",
          "La proximité des zones d'emploi",
          "L'évolution des prix sur les 5 dernières années",
          'La qualité des services disponibles (eau, électricité, sécurité)',
        ],
      },
      {
        heading: 'Conclusion',
        paragraphs: [
          "Investir dans les bons quartiers d'Abidjan en 2026 peut être une excellente décision financière. Faites vos recherches, comparez les opportunités et entourez-vous de professionnels locaux pour maximiser la rentabilité de votre investissement.",
        ],
      },
    ],
  },
];

export const GUIDES_MAP = new Map<string, Guide>(ALL_GUIDES.map((g) => [g.slug, g]));
