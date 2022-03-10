export const locale = {
  it: {
    locales: {
      it: 'Italiano',
      en: 'Inglese',
    },
    toolbar: {
      export: 'Esporta',
      share: 'Condividi',
      exportLoading: 'Esportando...',
    },
    pwa: {
      offline: 'App pronta per lavorare offline',
      update:
        'Nuovo contenuto disponibile, ricarica il contenuto per aggiornare',
      close: 'Chiudi',
      reload: 'Ricarica',
    },
  },
  en: {
    locales: {
      it: 'Italian',
      en: 'English',
    },
    toolbar: {
      export: 'Export',
      share: 'Share',
      exportLoading: 'Exporting...',
    },
    pwa: {
      offline: 'App ready to work offline',
      update: 'New content available, click on reload button to update',
      close: 'Close',
      reload: 'Reload',
    },
  },
};

export type AppLocaleEntries = typeof locale;
