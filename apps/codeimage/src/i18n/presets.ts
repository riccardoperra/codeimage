import {guestLimit, userLimit} from '@codeimage/store/presets/bridge';

export const presets = {
  it: {
    presets: {
      userPresets: 'I tuoi presets',
      updatePreset: {
        label: 'Aggiorna',
        dialogTitle: 'Aggiorna preset',
        dialogMessage:
          "Conferma per aggiornare il preset selezionato con lo stato corrente dell'editor",
        old: 'Vecchio',
        new: 'Nuovo',
      },
      renamePreset: {
        label: 'Rinomina',
        confirmTitle: 'Rinomina preset',
        confirmMessage: 'Inserisci un nuovo nome per il preset.',
      },
      addPreset: {
        label: 'Nuovo preset',
        confirmTitle: 'Aggiungi un nuovo preset',
        confirmMessage: 'Inserisci un nome per il tuo preset',
      },
      deletePreset: {
        label: 'Elimina',
        confirmTitle: 'Elimina preset',
        confirmMessage: 'Questa azione non è reversibile.',
      },
      sync: {
        label: 'Salva nel tuo account',
      },
      openPreset: {
        label: 'Mostra i tuoi presets',
      },
      limit: {
        user: {
          label: `Hai raggiunto il limite di preset ${userLimit} per utente`,
        },
        guest: {
          label: `Hai raggiunto il limite di ${guestLimit} preset`,
          actionLabel: `per avere più preset`,
        },
      },
    },
  },
  en: {
    presets: {
      userPresets: 'Your presets',
      updatePreset: {
        label: 'Update',
        dialogTitle: 'Update preset',
        dialogMessage:
          'Confirm to update the selected preset to the current editor state',
        old: 'Old',
        new: 'New',
      },
      renamePreset: {
        label: 'Rename',
        confirmTitle: 'Rename preset',
        confirmMessage: 'Enter a new name for the preset.',
      },
      addPreset: {
        label: 'Add preset',
        confirmTitle: 'Add a new preset',
        confirmMessage: 'Enter a name for your preset',
      },
      deletePreset: {
        label: 'Delete',
        confirmTitle: 'Delete preset',
        confirmMessage: 'This action is not reversible.',
      },
      sync: {
        label: 'Save in your account',
      },
      openPreset: {
        label: 'Show your presets',
      },
      limit: {
        user: {
          label: `You reached the maximum number of ${userLimit} presets.`,
        },
        guest: {
          label: `You reached the maximum number of ${guestLimit} presets.`,
          actionLabel: `to increase your limits.`,
        },
      },
    },
  },
  de: {
    presets: {
      userPresets: 'Your presets',
      updatePreset: {
        label: 'Update',
        dialogTitle: 'Update preset',
        dialogMessage:
          'Confirm to update the selected preset to the current editor state',
        old: 'Old',
        new: 'New',
      },
      renamePreset: {
        label: 'Rename',
        confirmTitle: 'Rename preset',
        confirmMessage: 'Enter a new name for the preset.',
      },
      addPreset: {
        label: 'Add preset',
        confirmTitle: 'Add a new preset',
        confirmMessage: 'Enter a name for your preset',
      },
      deletePreset: {
        label: 'Delete',
        confirmTitle: 'Delete preset',
        confirmMessage: 'This action is not reversible.',
      },
      sync: {
        label: 'Save in your account',
      },
      openPreset: {
        label: 'Show your presets',
      },
      limit: {
        user: {
          label: `Sie haben das voreingestellte Limit ${userLimit} pro Benutzer erreicht`,
        },
        guest: {
          label: `Sie haben das Limit von ${guestLimit} Voreinstellungen pro Gastbenutzer erreicht`,
          actionLabel: `um weitere Voreinstellungen zu erhalten`,
        },
      },
    },
  },
  es: {
    presets: {
      userPresets: 'Your presets',
      updatePreset: {
        label: 'Update',
        dialogTitle: 'Update preset',
        dialogMessage:
          'Confirm to update the selected preset to the current editor state',
        old: 'Old',
        new: 'New',
      },
      renamePreset: {
        label: 'Rename',
        confirmTitle: 'Rename preset',
        confirmMessage: 'Enter a new name for the preset.',
      },
      addPreset: {
        label: 'Add preset',
        confirmTitle: 'Add a new preset',
        confirmMessage: 'Enter a name for your preset',
      },
      deletePreset: {
        label: 'Delete',
        confirmTitle: 'Delete preset',
        confirmMessage: 'This action is not reversible.',
      },
      sync: {
        label: 'Save in your account',
      },
      openPreset: {
        label: 'Show your presets',
      },
      limit: {
        user: {
          label: `Alcanzaste el maximo de ${userLimit} presets`,
        },
        guest: {
          label: `Alcanzaste el maximo de ${guestLimit} presets`,
          actionLabel: `para salvar mas presets`,
        },
      },
    },
  },
};
