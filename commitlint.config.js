module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        'app',
        'ui',
        'theme',
        'config',
        'locale',
        // Must be used for ci only or deploy commit
        'release',
      ],
    ],
  },
};
