import type {HighlightId, ReleaseId} from '../state/whats-new/registry';

type WhatsNewMessages = Record<
  Exclude<keyof typeof en, 'highlights' | 'releases'>,
  string
> & {
  highlights: Record<HighlightId, {title: string; body: string}>;
  releases: Record<ReleaseId, {title: string}>;
};

const en = {
  newOne: '1 new thing',
  newMany: '{{count}} new things',
  see: 'See',
  next: 'Next',
  done: 'Done',
  showMe: 'Show me',
  dismiss: "Dismiss what's new",
  step: 'Step {{step}} of {{count}}',
  gotIt: 'Got it',
  newLabel: 'New: {{title}}',
  experiment: 'Experiment',
  hero: 'New tools and choices for your editor.',
  start: 'Start creating',
  intro: 'Features added to CodeImage, newest first.',
  older: 'Older releases on GitHub',
  releases: {
    '2026-11': {
      title: 'CodeImage 2026',
    },
  } satisfies Record<ReleaseId, {title: string}>,
  highlights: {
    redact: {
      title: 'Hide secrets',
      body: 'Code that looks like an API key, token or password gets a warning. Redact replaces it with dots before you export.',
    },
    tabs: {
      title: 'One image per tab',
      body: 'Export each tab as its own image, together in one zip. It needs two tabs or more.',
    },
    'command-menu': {
      title: 'Command menu',
      body: 'Find a control or run an action with Cmd/Ctrl+K.',
    },
    layouts: {
      title: 'Editor layouts',
      body: 'Choose Inspector, Dock or Studio in Settings, Experiments.',
    },
    'theme-cards': {
      title: 'Theme card styles',
      body: 'Choose Window, Orb or Aa list for the theme picker in Settings, Experiments.',
    },
  } satisfies Record<HighlightId, {title: string; body: string}>,
};

const it = {
  newOne: '1 novità',
  newMany: '{{count}} novità',
  see: 'Vedi',
  next: 'Avanti',
  done: 'Fine',
  showMe: 'Mostrami',
  dismiss: 'Chiudi le novità',
  step: 'Passaggio {{step}} di {{count}}',
  gotIt: 'Capito',
  newLabel: 'Novità: {{title}}',
  experiment: 'Esperimento',
  hero: 'Nuovi strumenti e opzioni per il tuo editor.',
  start: 'Inizia a creare',
  intro: 'Le funzioni aggiunte a CodeImage, dalle più recenti.',
  older: 'Versioni precedenti su GitHub',
  releases: {
    '2026-11': {
      title: 'CodeImage 2026',
    },
  },
  highlights: {
    redact: {
      title: 'Nascondi i segreti',
      body: 'Il codice che sembra una chiave API, un token o una password riceve un avviso. Oscura lo sostituisce con puntini prima di esportare.',
    },
    tabs: {
      title: "Un'immagine per scheda",
      body: "Esporta ogni scheda come un'immagine separata, tutte in uno zip. Servono almeno due schede.",
    },
    'command-menu': {
      title: 'Menu dei comandi',
      body: "Trova un controllo o esegui un'azione con Cmd/Ctrl+K.",
    },
    layouts: {
      title: "Disposizioni dell'editor",
      body: 'Scegli Ispettore, Dock o Studio in Impostazioni, Esperimenti.',
    },
    'theme-cards': {
      title: 'Stili delle schede dei temi',
      body: 'Scegli Finestra, Sfera o Elenco Aa per il selettore temi in Impostazioni, Esperimenti.',
    },
  },
} satisfies WhatsNewMessages;

const de = {
  newOne: '1 Neuerung',
  newMany: '{{count}} Neuerungen',
  see: 'Ansehen',
  next: 'Weiter',
  done: 'Fertig',
  showMe: 'Zeig mir',
  dismiss: 'Neuigkeiten schließen',
  step: 'Schritt {{step}} von {{count}}',
  gotIt: 'Verstanden',
  newLabel: 'Neu: {{title}}',
  experiment: 'Experiment',
  hero: 'Neue Werkzeuge und Optionen für deinen Editor.',
  start: 'Jetzt erstellen',
  intro: 'Neue Funktionen in CodeImage, die neuesten zuerst.',
  older: 'Ältere Versionen auf GitHub',
  releases: {
    '2026-11': {
      title: 'CodeImage 2026',
    },
  },
  highlights: {
    redact: {
      title: 'Geheimnisse verbergen',
      body: 'Code, der wie ein API-Schlüssel, Token oder Passwort aussieht, erhält eine Warnung. Maskieren ersetzt ihn vor dem Export durch Punkte.',
    },
    tabs: {
      title: 'Ein Bild pro Tab',
      body: 'Exportiere jeden Tab als eigenes Bild, zusammen in einer ZIP-Datei. Dafür brauchst du mindestens zwei Tabs.',
    },
    'command-menu': {
      title: 'Befehlsmenü',
      body: 'Finde ein Steuerelement oder führe eine Aktion mit Cmd/Ctrl+K aus.',
    },
    layouts: {
      title: 'Editor-Layouts',
      body: 'Wähle Inspektor, Dock oder Studio unter Einstellungen, Experimente.',
    },
    'theme-cards': {
      title: 'Stile der Themenkarten',
      body: 'Wähle Fenster, Kugel oder Aa-Liste für die Themenauswahl unter Einstellungen, Experimente.',
    },
  },
} satisfies WhatsNewMessages;

const es = {
  newOne: '1 novedad',
  newMany: '{{count}} novedades',
  see: 'Ver',
  next: 'Siguiente',
  done: 'Listo',
  showMe: 'Muéstrame',
  dismiss: 'Cerrar las novedades',
  step: 'Paso {{step}} de {{count}}',
  gotIt: 'Entendido',
  newLabel: 'Nuevo: {{title}}',
  experiment: 'Experimento',
  hero: 'Nuevas herramientas y opciones para tu editor.',
  start: 'Empieza a crear',
  intro: 'Las funciones añadidas a CodeImage, de más recientes a más antiguas.',
  older: 'Versiones anteriores en GitHub',
  releases: {
    '2026-11': {
      title: 'CodeImage 2026',
    },
  },
  highlights: {
    redact: {
      title: 'Oculta los secretos',
      body: 'El código que parece una clave API, un token o una contraseña recibe un aviso. Ocultar lo sustituye por puntos antes de exportar.',
    },
    tabs: {
      title: 'Una imagen por pestaña',
      body: 'Exporta cada pestaña como una imagen separada, todas en un archivo zip. Se necesitan al menos dos pestañas.',
    },
    'command-menu': {
      title: 'Menú de comandos',
      body: 'Busca un control o ejecuta una acción con Cmd/Ctrl+K.',
    },
    layouts: {
      title: 'Diseños del editor',
      body: 'Elige Inspector, Dock o Estudio en Ajustes, Experimentos.',
    },
    'theme-cards': {
      title: 'Estilos de tarjetas de temas',
      body: 'Elige Ventana, Esfera o Lista Aa para el selector de temas en Ajustes, Experimentos.',
    },
  },
} satisfies WhatsNewMessages;

export const whatsNewLocale = {
  en: {whatsNew: en},
  it: {whatsNew: it},
  de: {whatsNew: de},
  es: {whatsNew: es},
};
