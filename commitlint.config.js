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
        'dom-export',
        // Only using changeset
        'changeset',
        // Must be used for ci only or deploy commit
        'release',
        'vanilla-extract',
        'api',
        'website',
      ],
    ],
  },
};
