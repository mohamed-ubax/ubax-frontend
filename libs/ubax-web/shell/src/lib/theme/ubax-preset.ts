import { definePreset } from '@primeuix/themes';
import AuraBase from '@primeuix/themes/aura/base';
import AuraButton from '@primeuix/themes/aura/button';
import AuraDatePicker from '@primeuix/themes/aura/datepicker';
import AuraInputText from '@primeuix/themes/aura/inputtext';
import AuraSelect from '@primeuix/themes/aura/select';
import AuraTooltip from '@primeuix/themes/aura/tooltip';

export const UbaxPreset = definePreset(AuraBase, {
  components: {
    button: AuraButton,
    datepicker: AuraDatePicker,
    inputtext: AuraInputText,
    select: AuraSelect,
    tooltip: AuraTooltip,
  },
  semantic: {
    primary: {
      50: '#fff4ed',
      100: '#ffe4cc',
      200: '#ffc699',
      300: '#ff9f5c',
      400: '#ff7730',
      500: '#f4602a',
      600: '#e04f1e',
      700: '#b93d15',
      800: '#93310f',
      900: '#782a0e',
      950: '#411205',
    },
    colorScheme: {
      light: {
        surface: {
          0: '#ffffff',
          50: '#f8f9fa',
          100: '#f0f2f5',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      dark: {
        surface: {
          0: '#1a2332',
          50: '#1e2a3a',
          100: '#243347',
          200: '#2d3e55',
          300: '#374d66',
          400: '#4a6280',
          500: '#6b8199',
          600: '#8ea3b8',
          700: '#b4c5d4',
          800: '#d4dfe8',
          900: '#eef2f6',
          950: '#f8fafc',
        },
      },
    },
  },
  // Les overrides fins de composants (borderRadius, shadow, etc.)
  // se font via CSS custom properties dans styles.scss :
  // --p-button-border-radius, --p-card-border-radius, etc.
});
