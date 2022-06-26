module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        'app',
        'ui',
        'highlight',
        'config',
        'locale',
        // Only using changeset
        'changeset',
        // Must be used for ci only or deploy commit
        'release',
      ],
    ],
  },
};
