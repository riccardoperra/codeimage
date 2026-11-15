import type {ContentHighlightId, ReleaseId} from '../state/whats-new/registry';

type WhatsNewMessages = Record<
  Exclude<keyof typeof en, 'highlights' | 'releases' | 'illustration'>,
  string
> & {
  illustration: Record<keyof typeof en.illustration, string>;
  highlights: Record<ContentHighlightId, {title: string; body: string}>;
  releases: Record<ReleaseId, {title: string}>;
};

const en = {
  minimize: "Minimize what's new",
  alsoNew: 'Also new',
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
  hero: 'New tools and choices for your editor.',
  start: 'Start creating',
  intro: 'Features added to CodeImage, newest first.',
  older: 'Older releases on GitHub',
  releases: {
    '2.0': {
      title: 'CodeImage 2.0',
    },
  } satisfies Record<ReleaseId, {title: string}>,
  illustration: {
    secretHidden: '1 secret hidden',
    altDescription:
      'TypeScript snippet with a Counter component built on createSignal.',
    alt: 'ALT',
    cliOutput: 'same image as the web export',
    optional: 'Optional engine',
    exportImage: 'Export image',
  },
  highlights: {
    animate: {
      title: 'Animate your code',
      body: 'Turn code steps into an animation. Adjust pauses, transitions and easing, then preview the sequence.',
    },
    cli: {
      title: 'CodeImage in your terminal',
      body: 'Render source files or standard input with the same themes and presets as the web app, from your terminal or CI.',
    },
    redact: {
      title: 'Hide secrets',
      body: 'Code that looks like an API key, token or password gets a warning. Redact replaces it with dots before you export.',
    },
    tabs: {
      title: 'One image per tab',
      body: 'Export each tab as its own image, together in one zip. It needs two tabs or more.',
    },
    social: {
      title: 'Social sizes',
      body: 'Choose an exact export size for a social post. The whole code window fits inside the frame.',
    },
    signature: {
      title: 'Signatures',
      body: 'Add your handle in Minimal, Pill or Card style. Save up to three signatures and choose a default.',
    },
    marks: {
      title: 'Line marks',
      body: 'Mark lines as added, removed, highlighted or focused. Pasted diffs bring their marks with them.',
    },
    alt: {
      title: 'Copy alt text',
      body: 'Copy the snippet’s language, tab name, line range and code to paste alongside your image.',
    },
    'window-styles': {
      title: 'Window styles',
      body: 'Choose Card, Editor or Terminal, with Accent wash surfaces, Hairline borders and Ambient frame colours.',
    },
    'command-menu': {
      title: 'Command menu',
      body: 'Find a control or run an action with Cmd/Ctrl+K.',
    },
    takumi: {
      title: 'Takumi export engine',
      body: 'Try the optional Takumi engine in Settings, Experiments. If it cannot render an export, CodeImage automatically uses the current exporter.',
    },
    layouts: {
      title: 'Editor layouts',
      body: 'Choose Inspector, Dock or Studio in Settings, Experiments.',
    },
    'theme-cards': {
      title: 'Theme card styles',
      body: 'Choose Window, Orb or Aa list for the theme picker in Settings, Experiments.',
    },
  } satisfies Record<ContentHighlightId, {title: string; body: string}>,
};

const it = {
  minimize: 'Riduci le novità',
  alsoNew: 'Altre novità',
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
  hero: 'Nuovi strumenti e opzioni per il tuo editor.',
  start: 'Inizia a creare',
  intro: 'Le funzioni aggiunte a CodeImage, dalle più recenti.',
  older: 'Versioni precedenti su GitHub',
  releases: {
    '2.0': {
      title: 'CodeImage 2.0',
    },
  },
  illustration: {
    secretHidden: '1 segreto nascosto',
    altDescription:
      'Snippet TypeScript con un componente Counter basato su createSignal.',
    alt: 'ALT',
    cliOutput: 'stessa immagine dell’esportazione web',
    optional: 'Motore opzionale',
    exportImage: 'Esporta immagine',
  },
  highlights: {
    animate: {
      title: 'Anima il tuo codice',
      body: 'Trasforma i passaggi del codice in un’animazione. Regola pause, transizioni e andamento, poi guarda l’anteprima della sequenza.',
    },
    cli: {
      title: 'CodeImage nel terminale',
      body: 'Genera immagini da file sorgente o dall’ingresso standard con gli stessi temi e preset dell’app web, dal terminale o in CI.',
    },
    redact: {
      title: 'Nascondi i segreti',
      body: "Il codice che sembra una chiave API, un token o una password riceve un avviso. L'oscuramento lo sostituisce con dei puntini prima dell'esportazione.",
    },
    tabs: {
      title: "Un'immagine per scheda",
      body: "Esporta ogni scheda come un'immagine separata, tutte in uno zip. Servono almeno due schede.",
    },
    social: {
      title: 'Formati social',
      body: 'Scegli le dimensioni esatte per un post sui social. L’intera finestra del codice si adatta alla cornice.',
    },
    signature: {
      title: 'Firme',
      body: 'Aggiungi il tuo handle con lo stile Minimal, Pill o Card. Salva fino a tre firme e scegli quella predefinita.',
    },
    marks: {
      title: 'Segni sulle righe',
      body: 'Segna le righe come aggiunte, rimosse, evidenziate o in primo piano. I diff incollati mantengono i loro segni.',
    },
    alt: {
      title: 'Copia il testo alternativo',
      body: 'Copia il linguaggio, il nome della scheda, l’intervallo di righe e il codice da accompagnare all’immagine.',
    },
    'window-styles': {
      title: 'Stili della finestra',
      body: 'Scegli Card, Editor o Terminal, con superfici Accent wash, bordi Hairline e colori Ambient per la cornice.',
    },
    'command-menu': {
      title: 'Menu dei comandi',
      body: "Trova un controllo o esegui un'azione con Cmd/Ctrl+K.",
    },
    takumi: {
      title: 'Motore di esportazione Takumi',
      body: 'Prova il motore opzionale Takumi in Impostazioni, Esperimenti. Se non riesce a generare un’esportazione, CodeImage usa automaticamente il motore attuale.',
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
  minimize: 'Neuigkeiten minimieren',
  alsoNew: 'Außerdem neu',
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
  hero: 'Neue Werkzeuge und Optionen für deinen Editor.',
  start: 'Jetzt erstellen',
  intro: 'Neue Funktionen in CodeImage, die neuesten zuerst.',
  older: 'Ältere Versionen auf GitHub',
  releases: {
    '2.0': {
      title: 'CodeImage 2.0',
    },
  },
  illustration: {
    secretHidden: '1 Geheimnis verborgen',
    altDescription:
      'TypeScript-Snippet mit einer Counter-Komponente auf Basis von createSignal.',
    alt: 'ALT',
    cliOutput: 'gleiches Bild wie beim Web-Export',
    optional: 'Optionale Engine',
    exportImage: 'Bild exportieren',
  },
  highlights: {
    animate: {
      title: 'Animiere deinen Code',
      body: 'Erstelle eine Animation aus Code-Schritten. Passe Pausen, Übergänge und Beschleunigungskurven an und sieh dir die Vorschau an.',
    },
    cli: {
      title: 'CodeImage im Terminal',
      body: 'Erzeuge Bilder aus Quelldateien oder der Standardeingabe mit denselben Themes und Vorlagen wie in der Web-App, im Terminal oder in CI.',
    },
    redact: {
      title: 'Geheimnisse verbergen',
      body: 'Code, der wie ein API-Schlüssel, Token oder Passwort aussieht, erhält eine Warnung. Maskieren ersetzt ihn vor dem Export durch Punkte.',
    },
    tabs: {
      title: 'Ein Bild pro Tab',
      body: 'Exportiere jeden Tab als eigenes Bild, zusammen in einer ZIP-Datei. Dafür brauchst du mindestens zwei Tabs.',
    },
    social: {
      title: 'Formate für soziale Medien',
      body: 'Wähle eine genaue Exportgröße für einen Beitrag. Das ganze Codefenster passt in den Rahmen.',
    },
    signature: {
      title: 'Signaturen',
      body: 'Füge deinen Handle im Stil Minimal, Pill oder Card hinzu. Speichere bis zu drei Signaturen und wähle einen Standard.',
    },
    marks: {
      title: 'Zeilenmarkierungen',
      body: 'Markiere Zeilen als hinzugefügt, entfernt, hervorgehoben oder fokussiert. Eingefügte Diffs übernehmen ihre Markierungen.',
    },
    alt: {
      title: 'Alternativtext kopieren',
      body: 'Kopiere Sprache, Tab-Namen, Zeilenbereich und Code des Snippets als Text zu deinem Bild.',
    },
    'window-styles': {
      title: 'Fensterstile',
      body: 'Wähle Card, Editor oder Terminal mit Accent-wash-Oberflächen, Hairline-Rändern und Ambient-Rahmenfarben.',
    },
    'command-menu': {
      title: 'Befehlsmenü',
      body: 'Finde ein Steuerelement oder führe eine Aktion mit Cmd/Ctrl+K aus.',
    },
    takumi: {
      title: 'Takumi-Exportengine',
      body: 'Probiere die optionale Takumi-Engine unter Einstellungen, Experimente aus. Kann sie einen Export nicht rendern, nutzt CodeImage automatisch den bisherigen Exporter.',
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
  minimize: 'Minimizar las novedades',
  alsoNew: 'Más novedades',
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
  hero: 'Nuevas herramientas y opciones para tu editor.',
  start: 'Empieza a crear',
  intro: 'Las funciones añadidas a CodeImage, de más recientes a más antiguas.',
  older: 'Versiones anteriores en GitHub',
  releases: {
    '2.0': {
      title: 'CodeImage 2.0',
    },
  },
  illustration: {
    secretHidden: '1 secreto oculto',
    altDescription:
      'Fragmento TypeScript con un componente Counter basado en createSignal.',
    alt: 'ALT',
    cliOutput: 'la misma imagen que la exportación web',
    optional: 'Motor opcional',
    exportImage: 'Exportar imagen',
  },
  highlights: {
    animate: {
      title: 'Anima tu código',
      body: 'Crea una animación a partir de pasos de código. Ajusta las pausas, las transiciones y las curvas de aceleración y previsualiza la secuencia.',
    },
    cli: {
      title: 'CodeImage en tu terminal',
      body: 'Genera imágenes a partir de archivos de código o de la entrada estándar con los mismos temas y preajustes que la aplicación web, desde tu terminal o en CI.',
    },
    redact: {
      title: 'Ocultar secretos',
      body: 'El código que parece una clave API, un token o una contraseña recibe un aviso. Ocultar lo sustituye por puntos antes de exportar.',
    },
    tabs: {
      title: 'Una imagen por pestaña',
      body: 'Exporta cada pestaña como una imagen separada, todas en un archivo zip. Se necesitan al menos dos pestañas.',
    },
    social: {
      title: 'Formatos para redes sociales',
      body: 'Elige un tamaño de exportación exacto para una publicación. Toda la ventana de código cabe en el marco.',
    },
    signature: {
      title: 'Firmas',
      body: 'Añade tu nombre de usuario con el estilo Minimal, Pill o Card. Guarda hasta tres firmas y elige una predeterminada.',
    },
    marks: {
      title: 'Marcas de línea',
      body: 'Marca líneas como añadidas, eliminadas, resaltadas o enfocadas. Los diffs pegados conservan sus marcas.',
    },
    alt: {
      title: 'Copiar texto alternativo',
      body: 'Copia el lenguaje, el nombre de la pestaña, el intervalo de líneas y el código para acompañar tu imagen.',
    },
    'window-styles': {
      title: 'Estilos de ventana',
      body: 'Elige Card, Editor o Terminal, con superficies Accent wash, bordes Hairline y colores Ambient para el marco.',
    },
    'command-menu': {
      title: 'Menú de comandos',
      body: 'Busca un control o ejecuta una acción con Cmd/Ctrl+K.',
    },
    takumi: {
      title: 'Motor de exportación Takumi',
      body: 'Prueba el motor opcional Takumi en Ajustes, Experimentos. Si no puede generar una exportación, CodeImage usa automáticamente el exportador actual.',
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
