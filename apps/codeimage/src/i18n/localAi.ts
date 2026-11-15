export const localAi = {
  en: {
    localAi: {
      command: 'Ask local AI…',
      ask: 'Ask AI',
      title: 'Local AI',
      request: 'Request',
      placeholder: 'Use Dracula, padding 64, export PNG 2x',
      send: 'Send',
      thinking: 'Thinking…',
      showAll: 'Show all',
      showLess: 'Show less',
      turnLimit:
        'Stopped after {{count}} turns without an answer. Try a smaller request.',
      cannotStart: {
        resources:
          'Chrome could not start the on-device model. Check free disk space and chrome://on-device-internals.',
        unsupported:
          "Chrome's on-device model can't run tools in this browser. The console has the details.",
      },
      failed: 'The model could not answer. {{message}}',
      steps: 'Steps',
      newChat: 'New chat',
      chatFull: 'This chat is full. Starting a new one.',
      experiment: 'Local AI',
      experimentHint:
        "Adds Ask AI under the canvas and in the command menu, on a computer: Chrome's on-device model makes the change with the editor's tools.",
      experimentSwitch: 'Use local AI',
      provider: 'Tool calling',
      providerHint:
        "Native needs Chrome's tool use flag; structured asks the model for JSON steps. Auto picks native when Chrome can run it.",
      providerAuto: 'Auto',
      providerNative: 'Native',
      providerStructured: 'Structured',
      model: 'On-device model',
      modelReady: 'Ready on this device.',
      modelDownloadable: 'Chrome downloads it once, a few GB.',
      modelDownloading:
        'Downloading. You can keep editing, the progress shows here.',
      modelNoProgress: "Downloading… Chrome doesn't report progress yet.",
      modelUnavailable: 'Chrome says it cannot run on this device.',
      checkAgain: 'Check again',
      modelFailed: 'The download failed ({{message}}).',
      requirementsTitle: 'What Chrome needs',
      status: {met: 'Met', unmet: 'Not met', unknown: 'Check yourself'},
      requirement: {
        browser: 'Chrome 148 or later, on a computer',
        os: 'Windows 10 or 11, macOS 13 or later, Linux, or ChromeOS on a Chromebook Plus',
        cpu: '4 CPU cores or more',
        memory: '16 GB of RAM, or a GPU with more than 4 GB of VRAM',
        disk: 'About 20 GB free on the disk with your Chrome profile',
        setting: 'On-device AI turned on in Chrome settings',
      },
      found: {
        browser: 'Chrome {{version}}',
        cpu: '{{cores}} cores',
        memory: 'Only {{gb}} GB of RAM, so it needs the GPU',
      },
      unknown: {
        browser: 'The page cannot read the version',
        os: 'The page cannot read the system',
        cpu: 'The page cannot read the cores',
        memory: 'The page cannot read RAM above 8 GB, or the GPU',
        disk: 'On-device internals shows the free space',
        setting: 'Chrome settings show it',
      },
      settingsAddress: 'Turn on On-device AI',
      internalsAddress: 'Why Chrome says it cannot run, such as disk space',
      downloadAddress: 'Shows the live download status',
      pasteHint:
        'Chrome does not open these addresses from a page. Copy one and paste it in the address bar.',
      copy: 'Copy',
      copyAddress: 'Copy {{address}}',
      copied: 'Copied',
      download: 'Download model',
      retry: 'Retry',
      restartDownload: 'Restart download',
      notReady:
        'The on-device model is not ready. Download it in Settings, under Experiments.',
    },
  },
  it: {
    localAi: {
      command: "Chiedi all'AI locale…",
      ask: "Chiedi all'AI",
      title: 'AI locale',
      request: 'Richiesta',
      placeholder: 'Usa Dracula, padding 64, esporta PNG 2x',
      send: 'Invia',
      thinking: 'Ragionamento…',
      showAll: 'Mostra tutto',
      showLess: 'Mostra meno',
      turnLimit:
        'Interrotto dopo {{count}} turni senza risposta. Prova una richiesta più piccola.',
      cannotStart: {
        resources:
          'Chrome non è riuscito ad avviare il modello on-device. Controlla lo spazio libero su disco e chrome://on-device-internals.',
        unsupported:
          'Il modello on-device di Chrome non può usare strumenti in questo browser. La console ha i dettagli.',
      },
      failed: 'Il modello non ha risposto. {{message}}',
      steps: 'Passi',
      newChat: 'Nuova chat',
      chatFull: 'Questa chat è piena. Ne inizio una nuova.',
      experiment: 'AI locale',
      experimentHint:
        "Aggiunge Chiedi all'AI sotto il canvas e nel menu dei comandi, su computer: il modello on-device di Chrome fa la modifica con gli strumenti dell'editor.",
      experimentSwitch: "Usa l'AI locale",
      provider: 'Chiamata degli strumenti',
      providerHint:
        'La nativa richiede il flag tool use di Chrome; la strutturata chiede al modello passi in JSON. Auto sceglie la nativa quando Chrome la supporta.',
      providerAuto: 'Auto',
      providerNative: 'Nativa',
      providerStructured: 'Strutturata',
      model: 'Modello on-device',
      modelReady: 'Pronto su questo dispositivo.',
      modelDownloadable: 'Chrome lo scarica una volta, qualche GB.',
      modelDownloading:
        "Download in corso. Puoi continuare a modificare, l'avanzamento è qui.",
      modelNoProgress:
        "Download in corso… Chrome non riporta ancora l'avanzamento.",
      modelUnavailable:
        'Chrome dice che non può funzionare su questo dispositivo.',
      checkAgain: 'Controlla di nuovo',
      modelFailed: 'Il download non è riuscito ({{message}}).',
      requirementsTitle: 'Cosa serve a Chrome',
      status: {
        met: 'Soddisfatto',
        unmet: 'Non soddisfatto',
        unknown: 'Da verificare',
      },
      requirement: {
        browser: 'Chrome 148 o successivo, su un computer',
        os: 'Windows 10 o 11, macOS 13 o successivo, Linux, o ChromeOS su un Chromebook Plus',
        cpu: 'Almeno 4 core di CPU',
        memory: '16 GB di RAM, o una GPU con più di 4 GB di VRAM',
        disk: 'Circa 20 GB liberi sul disco del profilo di Chrome',
        setting: 'On-device AI attivo nelle impostazioni di Chrome',
      },
      found: {
        browser: 'Chrome {{version}}',
        cpu: '{{cores}} core',
        memory: 'Solo {{gb}} GB di RAM, quindi serve la GPU',
      },
      unknown: {
        browser: 'La pagina non può leggere la versione',
        os: 'La pagina non può leggere il sistema',
        cpu: 'La pagina non può leggere i core',
        memory: 'La pagina non legge la RAM oltre 8 GB, né la GPU',
        disk: 'On-device internals mostra lo spazio libero',
        setting: 'Lo mostrano le impostazioni di Chrome',
      },
      settingsAddress: 'Attiva On-device AI',
      internalsAddress:
        'Perché Chrome dice che non può funzionare, ad esempio lo spazio su disco',
      downloadAddress: 'Mostra lo stato del download in tempo reale',
      pasteHint:
        'Chrome non apre questi indirizzi da una pagina. Copiane uno e incollalo nella barra degli indirizzi.',
      copy: 'Copia',
      copyAddress: 'Copia {{address}}',
      copied: 'Copiato',
      download: 'Scarica il modello',
      retry: 'Riprova',
      restartDownload: 'Riavvia il download',
      notReady:
        'Il modello on-device non è pronto. Scaricalo in Impostazioni, sotto Esperimenti.',
    },
  },
  de: {
    localAi: {
      command: 'Lokale KI fragen…',
      ask: 'KI fragen',
      title: 'Lokale KI',
      request: 'Anfrage',
      placeholder: 'Nutze Dracula, Abstand 64, exportiere PNG 2x',
      send: 'Senden',
      thinking: 'Denkt nach…',
      showAll: 'Alles anzeigen',
      showLess: 'Weniger anzeigen',
      turnLimit:
        'Nach {{count}} Runden ohne Antwort abgebrochen. Versuche eine kleinere Anfrage.',
      cannotStart: {
        resources:
          'Chrome konnte das On-Device-Modell nicht starten. Prüfe den freien Speicherplatz und chrome://on-device-internals.',
        unsupported:
          'Das On-Device-Modell von Chrome kann in diesem Browser keine Werkzeuge nutzen. Details stehen in der Konsole.',
      },
      failed: 'Das Modell konnte nicht antworten. {{message}}',
      steps: 'Schritte',
      newChat: 'Neuer Chat',
      chatFull: 'Dieser Chat ist voll. Ein neuer beginnt.',
      experiment: 'Lokale KI',
      experimentHint:
        'Fügt KI fragen unter der Leinwand und im Befehlsmenü hinzu, auf dem Computer: Das On-Device-Modell von Chrome nimmt die Änderung mit den Werkzeugen des Editors vor.',
      experimentSwitch: 'Lokale KI verwenden',
      provider: 'Tool-Aufrufe',
      providerHint:
        'Nativ braucht Chromes Tool-Use-Flag; strukturiert lässt das Modell JSON-Schritte antworten. Auto wählt nativ, wenn Chrome es ausführen kann.',
      providerAuto: 'Auto',
      providerNative: 'Nativ',
      providerStructured: 'Strukturiert',
      model: 'On-Device-Modell',
      modelReady: 'Bereit auf diesem Gerät.',
      modelDownloadable: 'Chrome lädt es einmal herunter, einige GB.',
      modelDownloading:
        'Wird heruntergeladen. Du kannst weiter bearbeiten, der Fortschritt steht hier.',
      modelNoProgress:
        'Wird heruntergeladen… Chrome meldet noch keinen Fortschritt.',
      modelUnavailable: 'Laut Chrome kann es auf diesem Gerät nicht laufen.',
      checkAgain: 'Erneut prüfen',
      modelFailed: 'Der Download ist fehlgeschlagen ({{message}}).',
      requirementsTitle: 'Was Chrome braucht',
      status: {
        met: 'Erfüllt',
        unmet: 'Nicht erfüllt',
        unknown: 'Selbst prüfen',
      },
      requirement: {
        browser: 'Chrome 148 oder neuer, auf einem Computer',
        os: 'Windows 10 oder 11, macOS 13 oder neuer, Linux, oder ChromeOS auf einem Chromebook Plus',
        cpu: 'Mindestens 4 CPU-Kerne',
        memory: '16 GB RAM, oder eine GPU mit mehr als 4 GB VRAM',
        disk: 'Etwa 20 GB frei auf dem Laufwerk deines Chrome-Profils',
        setting: 'On-device AI in den Chrome-Einstellungen aktiviert',
      },
      found: {
        browser: 'Chrome {{version}}',
        cpu: '{{cores}} Kerne',
        memory: 'Nur {{gb}} GB RAM, also braucht es die GPU',
      },
      unknown: {
        browser: 'Die Seite kann die Version nicht lesen',
        os: 'Die Seite kann das System nicht lesen',
        cpu: 'Die Seite kann die Kerne nicht lesen',
        memory: 'Die Seite liest RAM nur bis 8 GB und die GPU gar nicht',
        disk: 'On-device internals zeigt den freien Speicher',
        setting: 'Die Chrome-Einstellungen zeigen es',
      },
      settingsAddress: 'On-device AI aktivieren',
      internalsAddress:
        'Warum Chrome es nicht ausführen kann, etwa wegen Speicherplatz',
      downloadAddress: 'Zeigt den Download-Status live',
      pasteHint:
        'Chrome öffnet diese Adressen nicht aus einer Seite. Kopiere eine und füge sie in die Adressleiste ein.',
      copy: 'Kopieren',
      copyAddress: '{{address}} kopieren',
      copied: 'Kopiert',
      download: 'Modell herunterladen',
      retry: 'Erneut versuchen',
      restartDownload: 'Download neu starten',
      notReady:
        'Das On-Device-Modell ist nicht bereit. Lade es in den Einstellungen unter Experimente herunter.',
    },
  },
  es: {
    localAi: {
      command: 'Preguntar a la IA local…',
      ask: 'Preguntar a la IA',
      title: 'IA local',
      request: 'Petición',
      placeholder: 'Usa Dracula, espaciado 64, exporta PNG 2x',
      send: 'Enviar',
      thinking: 'Pensando…',
      showAll: 'Mostrar todo',
      showLess: 'Mostrar menos',
      turnLimit:
        'Detenido tras {{count}} turnos sin respuesta. Prueba con una petición más pequeña.',
      cannotStart: {
        resources:
          'Chrome no pudo iniciar el modelo en el dispositivo. Revisa el espacio libre en disco y chrome://on-device-internals.',
        unsupported:
          'El modelo en el dispositivo de Chrome no puede usar herramientas en este navegador. La consola tiene los detalles.',
      },
      failed: 'El modelo no pudo responder. {{message}}',
      steps: 'Pasos',
      newChat: 'Nuevo chat',
      chatFull: 'Este chat está lleno. Empiezo uno nuevo.',
      experiment: 'IA local',
      experimentHint:
        'Añade Preguntar a la IA bajo el lienzo y en el menú de comandos, en un ordenador: el modelo en el dispositivo de Chrome hace el cambio con las herramientas del editor.',
      experimentSwitch: 'Usar la IA local',
      provider: 'Llamada a herramientas',
      providerHint:
        'La nativa necesita el flag tool use de Chrome; la estructurada pide al modelo pasos en JSON. Auto elige la nativa cuando Chrome puede ejecutarla.',
      providerAuto: 'Auto',
      providerNative: 'Nativa',
      providerStructured: 'Estructurada',
      model: 'Modelo en el dispositivo',
      modelReady: 'Listo en este dispositivo.',
      modelDownloadable: 'Chrome lo descarga una vez, unos pocos GB.',
      modelDownloading:
        'Descargando. Puedes seguir editando, el progreso se ve aquí.',
      modelNoProgress: 'Descargando… Chrome aún no informa del progreso.',
      modelUnavailable:
        'Chrome dice que no puede funcionar en este dispositivo.',
      checkAgain: 'Comprobar de nuevo',
      modelFailed: 'La descarga falló ({{message}}).',
      requirementsTitle: 'Lo que Chrome necesita',
      status: {
        met: 'Cumplido',
        unmet: 'No cumplido',
        unknown: 'Compruébalo tú',
      },
      requirement: {
        browser: 'Chrome 148 o posterior, en un ordenador',
        os: 'Windows 10 u 11, macOS 13 o posterior, Linux, o ChromeOS en un Chromebook Plus',
        cpu: '4 núcleos de CPU o más',
        memory: '16 GB de RAM, o una GPU con más de 4 GB de VRAM',
        disk: 'Unos 20 GB libres en el disco de tu perfil de Chrome',
        setting: 'On-device AI activado en los ajustes de Chrome',
      },
      found: {
        browser: 'Chrome {{version}}',
        cpu: '{{cores}} núcleos',
        memory: 'Solo {{gb}} GB de RAM, así que necesita la GPU',
      },
      unknown: {
        browser: 'La página no puede leer la versión',
        os: 'La página no puede leer el sistema',
        cpu: 'La página no puede leer los núcleos',
        memory: 'La página no lee la RAM por encima de 8 GB, ni la GPU',
        disk: 'On-device internals muestra el espacio libre',
        setting: 'Lo muestran los ajustes de Chrome',
      },
      settingsAddress: 'Activa On-device AI',
      internalsAddress:
        'Por qué Chrome dice que no puede funcionar, como el espacio en disco',
      downloadAddress: 'Muestra el estado de la descarga en directo',
      pasteHint:
        'Chrome no abre estas direcciones desde una página. Copia una y pégala en la barra de direcciones.',
      copy: 'Copiar',
      copyAddress: 'Copiar {{address}}',
      copied: 'Copiado',
      download: 'Descargar el modelo',
      retry: 'Reintentar',
      restartDownload: 'Reiniciar la descarga',
      notReady:
        'El modelo en el dispositivo no está listo. Descárgalo en Ajustes, en Experimentos.',
    },
  },
};
