import {notFound} from './ notFound';
import {dashboard} from './dashboard';
import sidebarLocale from './sidebar';
import {uiLocale} from './ui';
import {bottomBar} from './bottombar';

export const locale = {
  it: {
    common: {
      close: 'Chiudi',
      confirm: 'Conferma',
      yes: 'Si',
      no: 'No',
      show: 'Mostra',
      hide: 'Nascondi',
      reload: 'Ricarica',
      clone: 'Clona',
      new: 'Nuovo',
    },
    canvas: {
      copiedToClipboard: 'Snippet copiato negli appunti',
      linkGeneratedToClipboard: 'Link copiato negli appunti',
      formattedCode: 'Il codice é stato formattato',
      errorFormattedCode: 'Il codice da formattare non è valido',
    },
    readOnlyBanner: {
      title:
        "Stai visualizzando l'editor in modalitá sola-lettura. Clona lo snippet per salvarlo nel workspace e modificarlo",
    },
    locales: {
      it: 'Italiano',
      en: 'Inglese',
      de: 'Tedesco',
      es: 'Spagnolo',
    },
    toolbar: {
      export: 'Exporta',
      openNewTab: 'Apri',
      loadingNewTab: 'Preparando link...',
      share: 'Condividi',
      copyToCliboard: 'Copy to clipboard',
      generateLink: 'Genera link',
      toggleTheme: 'Modifica tema',
      changeLanguage: 'Modifica lingua',
      exportLoading: 'Exportando...',
    },
    pwa: {
      offline: 'App pronta per lavorare offline',
      update:
        'Nuovo contenuto disponibile, ricarica il contenuto per aggiornare',
      close: 'Chiudi',
      reload: 'Ricarica',
    },
    export: {
      title: 'Esporta immagine',
      shareMode: 'Condividi il tuo codice',
      shareHint: 'Questa modalità usa la nuova',
      noOpacitySupportedWithThisExtension:
        'La transparenza personalizzata non è compatibile con questa estensione',
      exportMode: 'Esporta come immagine',
      fileName: 'Nome file',
      fileNamePlaceholder: 'Inserisci nome file...',
      extensionType: 'Estensione file',
      pixelRatio: 'Scala',
      genericSaveError: 'Si è verificato un errore durante il salvataggio',
      quality: 'Qualità',
    },
    shortcut: {
      esc: 'Esc',
      buttonAction: 'Scorciatoie tastiera',
      focusCodeEditor: 'Focus editor di codice',
      unFocusCodeEditor: 'Unfocus editor di codice',
      toggleBackground: 'Attiva/disattiva background',
      toggleDarkMode: 'Attiva/disattiva modalitá dark',
      toggleHeader: 'Mostra/nascondi intestazione',
      toggleWatermark: 'Mostra/nascondi watermark',
      selectLanguage: 'Seleziona lingua',
      changePadding: 'Modifica padding',
      pickRandomTheme: 'Seleziona tema random',
      export: 'Esporta',
      exportNewTab: 'Esporta in una nuova tab',
      copyLink: 'Copia link',
      copySnippet: 'Copy snippet',
      openShortcuts: 'Apri scorciatoie',
    },
    themeSwitcher: {
      search: 'Cerca tema...',
    },
    presets: {
      userPresets: "Preimpostazioni dell'utente",
      addPreset: 'Aggiungi una nuova Preimpostazione',
    },
    ...sidebarLocale.it,
    ...dashboard.it,
    ...uiLocale.it,
    ...bottomBar.it,
    ...notFound.it,
  },
  en: {
    canvas: {
      copiedToClipboard: 'Snippet copied to clipboard',
      linkGeneratedToClipboard: 'Link copied to clipboard',
      formattedCode: 'Code has been formatted',
      errorFormattedCode: 'Invalid code while formatting',
    },
    common: {
      close: 'Close',
      confirm: 'Confirm',
      yes: 'Yes',
      no: 'No',
      show: 'Show',
      hide: 'Hide',
      reload: 'Reload',
      clone: 'Clone',
      new: 'New',
    },
    locales: {
      it: 'Italian',
      en: 'English',
      de: 'German',
      es: 'Spanish',
    },
    readOnlyBanner: {
      title:
        'You are viewing the editor in read-only modality. Clone the snippet to save in your workspace and edit it.',
    },
    toolbar: {
      export: 'Export',
      openNewTab: 'Open',
      loadingNewTab: 'Preparing link...',
      share: 'Share',
      generateLink: 'Generate link',
      toggleTheme: 'Toggle theme',
      changeLanguage: 'Change language',
      exportLoading: 'Exporting...',
    },
    pwa: {
      offline: 'App ready to work offline',
      update: 'New content available, click on reload button to update',
      close: 'Close',
      reload: 'Reload',
    },
    export: {
      title: 'Export image',
      shareMode: 'Share your code',
      shareHint: 'This modality uses the new',
      exportMode: 'Export as image',
      fileName: 'File name',
      fileNamePlaceholder: 'Enter file name...',
      extensionType: 'File extension',
      pixelRatio: 'Scale',
      genericSaveError: 'An error occurred while saving',
      noOpacitySupportedWithThisExtension:
        'The custom transparency is not compatible with this extension',
      quality: 'Quality',
    },
    shortcut: {
      esc: 'Esc',
      buttonAction: 'Keyboard shortcuts',
      focusCodeEditor: 'Focus code editor',
      unFocusCodeEditor: 'Unfocus code editor',
      toggleBackground: 'Toggle background',
      toggleDarkMode: 'Toggle dark mode',
      toggleHeader: 'Toggle header',
      toggleWatermark: 'Toggle watermark',
      changePadding: 'Change padding',
      pickRandomTheme: 'Pick random theme',
      export: 'Export',
      exportNewTab: 'Export in a new tab',
      copyLink: 'Copy link',
      copySnippet: 'Copy snippet',
      openShortcuts: 'Open shortcuts',
    },
    themeSwitcher: {
      search: 'Search theme...',
    },
    presets: {
      userPresets: "User's Presets",
    },
    ...uiLocale.en,
    ...bottomBar.en,
    ...sidebarLocale.en,
    ...dashboard.en,
    ...notFound.en,
  },
  de: {
    common: {
      close: 'Schließen',
      confirm: 'Bestätigen',
      yes: 'Ja',
      no: 'Nein',
      show: 'Anzeigen',
      hide: 'Verstecken',
      reload: 'Reload',
      clone: 'Clone',
      new: 'Neu',
    },
    canvas: {
      copiedToClipboard: 'Code-Schnipsel in Zwischenablage kopiert',
      linkGeneratedToClipboard: 'Link in Zwischenablage kopiert',
      formattedCode: 'Code has been formatted',
      errorFormattedCode: 'Invalid code while formatting',
    },
    readOnlyBanner: {
      title:
        'You are viewing the editor in read-only modality. Clone the snippet to save in your workspace and edit it.',
    },
    locales: {
      it: 'Italienisch',
      en: 'Englisch',
      de: 'Deutsch',
      es: 'Spanisch',
    },
    toolbar: {
      export: 'Export',
      share: 'Teilen',
      openNewTab: 'Öffnen',
      loadingNewTab: 'Link vorbereiten...',
      toggleTheme: 'Thema umschalten',
      changeLanguage: 'Sprache wechseln',
      generateLink: 'Link erstellen',
      exportLoading: 'Exportieren...',
    },
    pwa: {
      offline: 'App bereit, um offline zu arbeiten',
      update:
        'Neuer Inhalt verfügbar, um, ihn anzuzeigenm, auf "Neu laden" klicken',
      close: 'Schließen',
      reload: 'Neu laden',
    },
    export: {
      title: 'Bild exportieren',
      shareMode: 'Code teilen',
      shareHint: 'Diese Funktion verwendet die neue',
      exportMode: 'Als Bild exportieren',
      fileName: 'Dateiname',
      fileNamePlaceholder: 'Dateinamen eingeben...',
      extensionType: 'Dateierweiterung',
      pixelRatio: 'Skalierung',
      genericSaveError: 'Beim Speichern ist ein Fehler aufgetreten',
      noOpacitySupportedWithThisExtension:
        'Die benutzerdefinierte Transparenz ist mit dieser Erweiterung nicht kompatibel',
      quality: 'Qualität',
    },
    shortcut: {
      esc: 'Esc',
      buttonAction: 'Tastatürkürzel',
      focusCodeEditor: 'Code Editor fokussieren',
      unFocusCodeEditor: 'Fokus von Code Editor nehmen',
      toggleBackground: 'Hintergrund umschalten',
      toggleDarkMode: 'Dunkelmodus umschalten',
      toggleHeader: 'Kopfzeile umschalten',
      toggleWatermark: 'Wasserzeichen umschalten',
      changePadding: 'Abstand wechseln',
      pickRandomTheme: 'Zufälliges Thema wählen',
      export: 'Export',
      exportNewTab: 'In neuem Tab exportieren',
      copySnippet: 'Code-Schnipsel kopieren',
      copyLink: 'Link kopieren',
      openShortcuts: 'Tastaturkürzel öffnen',
    },
    themeSwitcher: {
      search: 'Thema suchen...',
    },
    presets: {
      userPresets: 'Voreinstellungen des Benutzers',
    },
    ...sidebarLocale.de,
    ...uiLocale.de,
    ...bottomBar.de,
    ...dashboard.de,
    ...notFound.de,
  },
  es: {
    common: {
      close: 'Cerrar',
      confirm: 'Confirmar',
      yes: 'Si',
      no: 'No',
      show: 'Mostrar',
      hide: 'Esconder',
      reload: 'Reload',
      clone: 'Clone',
      new: 'Nuevo',
    },
    canvas: {
      copiedToClipboard: 'Snippet copiado al portapapeles',
      linkGeneratedToClipboard: 'Link copiado al portapapeles',
      formattedCode: 'Code has been formatted',
      errorFormattedCode: 'Invalid code while formatting',
    },
    readOnlyBanner: {
      title:
        'You are viewing the editor in read-only modality. Clone the snippet to save in your workspace and edit it.',
    },
    locales: {
      it: 'Italiano',
      en: 'Inglés',
      de: 'Alemán',
      es: 'Español',
    },
    toolbar: {
      export: 'Exportar',
      openNewTab: 'Abrir',
      loadingNewTab: 'Preparando enlace...',
      share: 'Compartir',
      generateLink: 'Generar enlace',
      toggleTheme: 'Editar tema',
      changeLanguage: 'Editar lenguaje',
      exportLoading: 'Exportando...',
    },
    pwa: {
      offline: 'App lista para trabajar sin conexión',
      update: 'Nuevo contenido disponible, recarga la pagina para actualizar',
      close: 'Cerrar',
      reload: 'Recargar',
    },
    export: {
      title: 'Exporta imagen',
      shareMode: 'Comparte tu código',
      shareHint: 'Esta modalidad utiliza el nuevo',
      noOpacitySupportedWithThisExtension:
        'La transparencia personalizada no es compatible con esta extensión',
      exportMode: 'Exportar como imagen',
      fileName: 'Nombre del archivo',
      fileNamePlaceholder: 'Inserta el nombre del archivo...',
      extensionType: 'Extensión de archivo',
      pixelRatio: 'Escala',
      genericSaveError: 'Se produjo un error al guardar',
      quality: 'Calidad',
    },
    shortcut: {
      esc: 'Esc',
      buttonAction: 'Atajos de teclado',
      focusCodeEditor: 'Focus editor de codigo',
      unFocusCodeEditor: 'Unfocus editor de codigo',
      toggleBackground: 'Activa/Desactiva fondo',
      toggleDarkMode: 'Activa/Desactiva modalitá dark',
      toggleHeader: 'Muestra/Esconde intestazione',
      toggleWatermark: 'Muestra/Esconde watermark',
      selectLanguage: 'Selecciona lenguaje',
      changePadding: 'Modifica padding',
      pickRandomTheme: 'Selecciona tema random',
      export: 'Exporta',
      exportNewTab: 'Exporta en una nueva tab',
      copyLink: 'Copia enlace',
      copySnippet: 'Copia snippet',
      openShortcuts: 'Abre atajo',
    },
    themeSwitcher: {
      search: 'Busca tema...',
    },
    presets: {
      userPresets: 'Preajuste de usuario',
    },
    ...sidebarLocale.es,
    ...uiLocale.es,
    ...bottomBar.es,
    ...dashboard.es,
    ...notFound.es,
  },
};

export type AppLocaleEntries = typeof locale;
