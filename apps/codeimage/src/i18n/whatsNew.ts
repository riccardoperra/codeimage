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
  hero: 'A redesigned editor, code animations and a command-line tool.',
  start: 'Start creating',
  intro: 'What each release added, newest first.',
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
    browser: 'Browser',
    exportImage: 'Export image',
  },
  highlights: {
    animate: {
      title: 'Code animations',
      body: 'Add steps to a snippet and CodeImage animates the code from one to the next. Set how long each step holds and how it moves, then export a video from your browser.',
    },
    cli: {
      title: 'CodeImage CLI',
      body: 'Run codeimage on a source file to get the same image the editor exports, with the same themes and presets. It also runs in CI.',
    },
    redact: {
      title: 'Hide secrets',
      body: 'CodeImage warns you when your code contains what looks like an API key, token or password. Redact replaces it with dots before you export.',
    },
    tabs: {
      title: 'One image per tab',
      body: 'Export every tab as its own image, in one zip file. You need at least two tabs.',
    },
    social: {
      title: 'Social sizes',
      body: 'Export at the exact size a social network asks for. The whole code window stays inside the frame.',
    },
    signature: {
      title: 'Signatures',
      body: 'Put your handle on the image as plain text, a pill or a card with your avatar. Save up to three signatures and pick a default.',
    },
    marks: {
      title: 'Line marks',
      body: 'Mark a line as added, removed, highlighted or focused. Paste a diff and CodeImage marks its lines for you.',
    },
    alt: {
      title: 'Copy alt text',
      body: "Copies a description with the snippet's language, tab name, line range and code. Paste it as the alt text of your image.",
    },
    'window-styles': {
      title: 'Window styles',
      body: 'Show your code in a Card, Editor or Terminal window. The new Hairline border and Accent wash surface take their colour from the theme.',
    },
    'command-menu': {
      title: 'Command menu',
      body: 'Press Cmd/Ctrl+K to find a control or run an action.',
    },
    takumi: {
      title: 'Takumi export engine',
      body: 'An optional export engine you turn on in Settings, under Experiments. If Takumi cannot render an image, CodeImage exports it with the browser instead.',
    },
    layouts: {
      title: 'A redesigned editor',
      body: 'Inspector is the new default layout, with every control in one side panel. Dock and Studio are two other layouts you can try in Settings, under Experiments.',
    },
    'theme-cards': {
      title: 'Theme card styles',
      body: 'Show themes in the picker as Window, Orb or Aa list cards. Choose in Settings, under Experiments.',
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
  hero: 'Un editor ridisegnato, le animazioni del codice e uno strumento da riga di comando.',
  start: 'Inizia a creare',
  intro: 'Cosa ha aggiunto ogni versione, dalla più recente.',
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
    browser: 'Browser',
    exportImage: 'Esporta immagine',
  },
  highlights: {
    animate: {
      title: 'Animazioni del codice',
      body: "Aggiungi dei passaggi a uno snippet e CodeImage anima il codice dall'uno all'altro. Imposta quanto dura ogni passaggio e come si muove, poi esporta un video dal browser.",
    },
    cli: {
      title: 'CodeImage CLI',
      body: "Esegui codeimage su un file sorgente per ottenere la stessa immagine che esporta l'editor, con gli stessi temi e preset. Funziona anche in CI.",
    },
    redact: {
      title: 'Nascondi i segreti',
      body: "CodeImage ti avvisa quando il codice contiene qualcosa che sembra una chiave API, un token o una password. L'oscuramento lo sostituisce con dei puntini prima dell'esportazione.",
    },
    tabs: {
      title: "Un'immagine per scheda",
      body: 'Esporta ogni scheda come immagine separata, in un unico file zip. Servono almeno due schede.',
    },
    social: {
      title: 'Formati social',
      body: "Esporta nelle dimensioni esatte richieste da un social network. L'intera finestra del codice resta dentro la cornice.",
    },
    signature: {
      title: 'Firme',
      body: "Metti il tuo handle sull'immagine come testo semplice, pillola o card con il tuo avatar. Salva fino a tre firme e scegli quella predefinita.",
    },
    marks: {
      title: 'Segni sulle righe',
      body: 'Segna una riga come aggiunta, rimossa, evidenziata o in primo piano. Incolla un diff e CodeImage segna le righe per te.',
    },
    alt: {
      title: 'Copia il testo alternativo',
      body: "Copia una descrizione con il linguaggio dello snippet, il nome della scheda, l'intervallo di righe e il codice. Incollala come testo alternativo dell'immagine.",
    },
    'window-styles': {
      title: 'Stili della finestra',
      body: 'Mostra il codice in una finestra Card, Editor o Terminal. Il nuovo bordo Hairline e la superficie Accent wash prendono il colore dal tema.',
    },
    'command-menu': {
      title: 'Menu dei comandi',
      body: "Premi Cmd/Ctrl+K per trovare un controllo o eseguire un'azione.",
    },
    takumi: {
      title: 'Motore di esportazione Takumi',
      body: "Un motore di esportazione opzionale che attivi in Impostazioni, sotto Esperimenti. Se Takumi non riesce a generare un'immagine, CodeImage la esporta con il browser.",
    },
    layouts: {
      title: 'Un editor ridisegnato',
      body: 'Ispettore è la nuova disposizione predefinita, con tutti i controlli in un pannello laterale. Dock e Studio sono altre due disposizioni che puoi provare in Impostazioni, sotto Esperimenti.',
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
  hero: 'Ein neu gestalteter Editor, Code-Animationen und ein Kommandozeilen-Tool.',
  start: 'Jetzt erstellen',
  intro: 'Was jede Version gebracht hat, die neueste zuerst.',
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
    browser: 'Browser',
    exportImage: 'Bild exportieren',
  },
  highlights: {
    animate: {
      title: 'Code-Animationen',
      body: 'Füge einem Snippet Schritte hinzu, und CodeImage animiert den Code von einem zum nächsten. Lege fest, wie lange jeder Schritt steht und wie er sich bewegt, und exportiere dann ein Video aus dem Browser.',
    },
    cli: {
      title: 'CodeImage CLI',
      body: 'Führe codeimage mit einer Quelldatei aus und erhalte dasselbe Bild, das der Editor exportiert, mit denselben Themes und Vorlagen. Es läuft auch in CI.',
    },
    redact: {
      title: 'Geheimnisse verbergen',
      body: 'CodeImage warnt dich, wenn dein Code etwas enthält, das wie ein API-Schlüssel, ein Token oder ein Passwort aussieht. Maskieren ersetzt es vor dem Export durch Punkte.',
    },
    tabs: {
      title: 'Ein Bild pro Tab',
      body: 'Exportiere jeden Tab als eigenes Bild in einer Zip-Datei. Du brauchst mindestens zwei Tabs.',
    },
    social: {
      title: 'Formate für soziale Medien',
      body: 'Exportiere in genau der Größe, die ein soziales Netzwerk verlangt. Das ganze Codefenster bleibt im Rahmen.',
    },
    signature: {
      title: 'Signaturen',
      body: 'Setze deinen Handle als einfachen Text, als Pill oder als Card mit deinem Avatar auf das Bild. Speichere bis zu drei Signaturen und wähle einen Standard.',
    },
    marks: {
      title: 'Zeilenmarkierungen',
      body: 'Markiere eine Zeile als hinzugefügt, entfernt, hervorgehoben oder fokussiert. Füge einen Diff ein, und CodeImage markiert die Zeilen für dich.',
    },
    alt: {
      title: 'Alternativtext kopieren',
      body: 'Kopiert eine Beschreibung mit Sprache, Tab-Namen, Zeilenbereich und Code des Snippets. Füge sie als Alt-Text deines Bildes ein.',
    },
    'window-styles': {
      title: 'Fensterstile',
      body: 'Zeige deinen Code in einem Card-, Editor- oder Terminal-Fenster. Der neue Hairline-Rahmen und die Accent-wash-Oberfläche übernehmen ihre Farbe aus dem Theme.',
    },
    'command-menu': {
      title: 'Befehlsmenü',
      body: 'Drücke Cmd/Ctrl+K, um eine Einstellung zu finden oder eine Aktion auszuführen.',
    },
    takumi: {
      title: 'Takumi-Exportengine',
      body: 'Eine optionale Export-Engine, die du in den Einstellungen unter Experimente einschaltest. Kann Takumi ein Bild nicht rendern, exportiert CodeImage es mit dem Browser.',
    },
    layouts: {
      title: 'Ein neu gestalteter Editor',
      body: 'Inspektor ist das neue Standardlayout, mit allen Einstellungen in einer Seitenleiste. Dock und Studio sind zwei weitere Layouts, die du in den Einstellungen unter Experimente ausprobieren kannst.',
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
  hero: 'Un editor rediseñado, animaciones de código y una herramienta de línea de comandos.',
  start: 'Empieza a crear',
  intro: 'Lo que añadió cada versión, de la más reciente a la más antigua.',
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
    browser: 'Navegador',
    exportImage: 'Exportar imagen',
  },
  highlights: {
    animate: {
      title: 'Animaciones de código',
      body: 'Añade pasos a un fragmento y CodeImage anima el código de uno al siguiente. Define cuánto dura cada paso y cómo se mueve, y exporta un vídeo desde el navegador.',
    },
    cli: {
      title: 'CodeImage CLI',
      body: 'Ejecuta codeimage sobre un archivo fuente y obtén la misma imagen que exporta el editor, con los mismos temas y preajustes. También funciona en CI.',
    },
    redact: {
      title: 'Ocultar secretos',
      body: 'CodeImage te avisa cuando tu código contiene algo que parece una clave de API, un token o una contraseña. Ocultar lo sustituye por puntos antes de exportar.',
    },
    tabs: {
      title: 'Una imagen por pestaña',
      body: 'Exporta cada pestaña como una imagen propia, en un solo archivo zip. Necesitas al menos dos pestañas.',
    },
    social: {
      title: 'Formatos para redes sociales',
      body: 'Exporta con el tamaño exacto que pide una red social. Toda la ventana de código queda dentro del marco.',
    },
    signature: {
      title: 'Firmas',
      body: 'Pon tu nombre de usuario en la imagen como texto simple, como Pill o como Card con tu avatar. Guarda hasta tres firmas y elige una predeterminada.',
    },
    marks: {
      title: 'Marcas de línea',
      body: 'Marca una línea como añadida, eliminada, resaltada o enfocada. Pega un diff y CodeImage marca las líneas por ti.',
    },
    alt: {
      title: 'Copiar texto alternativo',
      body: 'Copia una descripción con el lenguaje del fragmento, el nombre de la pestaña, el rango de líneas y el código. Pégala como texto alternativo de tu imagen.',
    },
    'window-styles': {
      title: 'Estilos de ventana',
      body: 'Muestra tu código en una ventana Card, Editor o Terminal. El nuevo borde Hairline y la superficie Accent wash toman su color del tema.',
    },
    'command-menu': {
      title: 'Menú de comandos',
      body: 'Pulsa Cmd/Ctrl+K para encontrar un control o ejecutar una acción.',
    },
    takumi: {
      title: 'Motor de exportación Takumi',
      body: 'Un motor de exportación opcional que activas en Ajustes, en Experimentos. Si Takumi no puede generar una imagen, CodeImage la exporta con el navegador.',
    },
    layouts: {
      title: 'Un editor rediseñado',
      body: 'Inspector es el nuevo diseño predeterminado, con todos los controles en un panel lateral. Dock y Estudio son otros dos diseños que puedes probar en Ajustes, en Experimentos.',
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
