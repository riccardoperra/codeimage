export const localAi = {
  en: {
    localAi: {
      command: 'Ask local AI…',
      title: 'Local AI',
      intro:
        "Describe the change. Chrome's on-device model plans it and the editor runs each step, without leaving your browser.",
      request: 'Request',
      placeholder:
        'Add a tab with ```print("hi")```, use Dracula, padding 32, export PNG 2x',
      run: 'Run',
      thinking: 'Planning…',
      running: 'Running the steps…',
      noSteps: 'The model found nothing to do. Try saying it another way.',
      failed: 'The model could not answer. {{message}}',
      steps: 'Steps',
      done: 'Done',
      experiment: 'Local AI',
      experimentHint:
        "Adds Ask local AI to the command menu: Chrome's on-device model turns a request into editor changes.",
      experimentSwitch: 'Use local AI',
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
      title: 'AI locale',
      intro:
        "Descrivi la modifica. Il modello on-device di Chrome la pianifica e l'editor esegue ogni passo, senza uscire dal browser.",
      request: 'Richiesta',
      placeholder:
        'Aggiungi una tab con ```print("hi")```, usa Dracula, padding 32, esporta PNG 2x',
      run: 'Esegui',
      thinking: 'Pianificazione…',
      running: 'Esecuzione dei passi…',
      noSteps:
        'Il modello non ha trovato nulla da fare. Prova a dirlo in un altro modo.',
      failed: 'Il modello non ha risposto. {{message}}',
      steps: 'Passi',
      done: 'Fatto',
      experiment: 'AI locale',
      experimentHint:
        "Aggiunge Chiedi all'AI locale al menu dei comandi: il modello on-device di Chrome trasforma una richiesta in modifiche all'editor.",
      experimentSwitch: "Usa l'AI locale",
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
      title: 'Lokale KI',
      intro:
        'Beschreibe die Änderung. Das On-Device-Modell von Chrome plant sie und der Editor führt jeden Schritt aus, ohne deinen Browser zu verlassen.',
      request: 'Anfrage',
      placeholder:
        'Füge einen Tab mit ```print("hi")``` hinzu, nutze Dracula, Abstand 32, exportiere PNG 2x',
      run: 'Ausführen',
      thinking: 'Planung…',
      running: 'Schritte werden ausgeführt…',
      noSteps:
        'Das Modell hat nichts zu tun gefunden. Versuche es anders zu formulieren.',
      failed: 'Das Modell konnte nicht antworten. {{message}}',
      steps: 'Schritte',
      done: 'Erledigt',
      experiment: 'Lokale KI',
      experimentHint:
        'Fügt Lokale KI fragen zum Befehlsmenü hinzu: Das On-Device-Modell von Chrome setzt eine Anfrage in Änderungen am Editor um.',
      experimentSwitch: 'Lokale KI verwenden',
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
      title: 'IA local',
      intro:
        'Describe el cambio. El modelo en el dispositivo de Chrome lo planifica y el editor ejecuta cada paso, sin salir de tu navegador.',
      request: 'Petición',
      placeholder:
        'Añade una pestaña con ```print("hi")```, usa Dracula, espaciado 32, exporta PNG 2x',
      run: 'Ejecutar',
      thinking: 'Planificando…',
      running: 'Ejecutando los pasos…',
      noSteps:
        'El modelo no encontró nada que hacer. Prueba a decirlo de otra forma.',
      failed: 'El modelo no pudo responder. {{message}}',
      steps: 'Pasos',
      done: 'Hecho',
      experiment: 'IA local',
      experimentHint:
        'Añade Preguntar a la IA local al menú de comandos: el modelo en el dispositivo de Chrome convierte una petición en cambios del editor.',
      experimentSwitch: 'Usar la IA local',
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
