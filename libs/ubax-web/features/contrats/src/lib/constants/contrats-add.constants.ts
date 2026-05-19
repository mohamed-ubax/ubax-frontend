import type { StepConfig } from '../types/contrats-add.types';

export const CONTRATS_ADD_STEP_CONFIG: readonly StepConfig[] = [
  {
    step: 1,
    icon: 'pi-user',
    title: 'Locataire',
    desc: 'Locataire qualifié sans contrat actif.',
  },
  {
    step: 2,
    icon: 'pi-home',
    title: 'Sélection du bien',
    desc: 'Pré-rempli depuis le dossier locataire.',
  },
  {
    step: 3,
    icon: 'pi-file-edit',
    title: 'Type de contrat',
    desc: 'Définissez la nature du contrat.',
  },
  {
    step: 4,
    icon: 'pi-calendar',
    title: 'Conditions',
    desc: 'Montants, dates et clauses.',
  },
  {
    step: 5,
    icon: 'pi-check-circle',
    title: 'Récapitulatif',
    desc: 'Vérifiez et confirmez.',
  },
];
