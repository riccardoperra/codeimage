import {signatureLimit} from '@codeimage/store/signatures/bridge';

const en = {
  savedSignatures: {
    saved: 'Saved',
    notSaved: 'Not saved',
    menu: 'Saved signatures',
    empty: 'No saved signatures yet',
    saveAsNew: 'Save as new',
    limit: `You can keep ${signatureLimit} signatures. Delete one to save another.`,
    update: 'Update “{{name}}”',
    rename: 'Rename',
    delete: 'Delete',
    setDefault: 'Set as default',
    unsetDefault: 'Remove as default',
    default: 'Default',
    defaultHint: 'New snippets start with it',
    edited: 'edited',
    nameLabel: 'Signature name',
    newName: 'Signature {{n}}',
    save: 'Save',
    cancel: 'Cancel',
  },
};

const it: typeof en = {
  savedSignatures: {
    saved: 'Salvate',
    notSaved: 'Non salvata',
    menu: 'Firme salvate',
    empty: 'Nessuna firma salvata',
    saveAsNew: 'Salva come nuova',
    limit: `Puoi tenere ${signatureLimit} firme. Eliminane una per salvarne un'altra.`,
    update: 'Aggiorna “{{name}}”',
    rename: 'Rinomina',
    delete: 'Elimina',
    setDefault: 'Imposta come predefinita',
    unsetDefault: 'Rimuovi come predefinita',
    default: 'Predefinita',
    defaultHint: 'I nuovi snippet partono con questa',
    edited: 'modificata',
    nameLabel: 'Nome della firma',
    newName: 'Firma {{n}}',
    save: 'Salva',
    cancel: 'Annulla',
  },
};

// German and Spanish have no translation yet and show the English text.
export const signatures = {it, en, de: en, es: en};
