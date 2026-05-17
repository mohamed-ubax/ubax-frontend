import type { StepConfig } from '../types/contrats-add.types';

export const CONTRATS_ADD_STEP_CONFIG: readonly StepConfig[] = [
  {
    step: 1,
    icon: 'pi-user',
    title: 'Sélection du locataire',
    desc: 'Locataire qualifié sans contrat actif.',
  },
  {
    step: 2,
    icon: 'pi-home',
    title: 'Sélection du bien',
    desc: 'Bien pré-rempli depuis le dossier.',
  },
  {
    step: 3,
    icon: 'pi-calendar',
    title: 'Conditions du bail',
    desc: 'Montants et dates.',
  },
  {
    step: 4,
    icon: 'pi-check-circle',
    title: "Récapitulatif",
    desc: "Vérifiez et confirmez.",
  },
];
