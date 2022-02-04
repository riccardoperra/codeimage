// @ts-check

const fs = require('fs');
const path = require('path');

module.exports = {
  /**`
   * @param {string[]} filenames - List of modified files.
   * @return {string | string[]} - Single command or list of commands to execute.
   */
  '.lintstagedrc.js': filenames => {
    const filesAsString = filenames.join(' ');
    return [
      `pnpm pre-commit-prettier ${filesAsString}`,
      `pnpm pre-commit-eslint ${filesAsString}`,
    ];
  },
};
