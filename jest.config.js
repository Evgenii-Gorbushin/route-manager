'use strict';
// eslint-disable-next-line no-undef
module.exports = {
  verbose: true,
  setupFilesAfterEnv: [
    '<rootDir>/src/jest/configureAdapter.js',
  ],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/src/jest/configureExtension.js',
    '\\.(css|less)$': 'identity-obj-proxy',
  },
};
