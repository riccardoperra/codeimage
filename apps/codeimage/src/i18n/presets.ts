import { guestLimit, userLimit } from '@codeimage/store/presets/bridge';

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
      share: {
        label: 'Condividi',
        confirm: 'Link preset copiato',
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
      share: {
        label: 'Share',
        confirm: 'Preset has been copied to clipboard',
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
  zh: {
    presets: {
      userPresets: '你的预设',
      updatePreset: {
        label: '更新',
        dialogTitle: '更新预设',
        dialogMessage: '确认用当前编辑器状态更新所选预设',
        old: '旧',
        new: '新',
      },
      share: {
        label: '分享',
        confirm: '预设链接已复制',
      },
      renamePreset: {
        label: '重命名',
        confirmTitle: '重命名预设',
        confirmMessage: '请输入预设的新名称。',
      },
      addPreset: {
        label: '添加预设',
        confirmTitle: '添加新预设',
        confirmMessage: '请输入你的预设名称',
      },
      deletePreset: {
        label: '删除',
        confirmTitle: '删除预设',
        confirmMessage: '此操作不可逆。',
      },
      sync: {
        label: '保存到你的账号',
      },
      openPreset: {
        label: '查看你的预设',
      },
      limit: {
        user: {
          label: `你已达到每位用户最多 ${userLimit} 个预设的限制`,
        },
        guest: {
          label: `你已达到访客最多 ${guestLimit} 个预设的限制`,
          actionLabel: `登录以提升限制`,
        },
      },
    },
  },
};
