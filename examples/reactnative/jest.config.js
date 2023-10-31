const esModules = ['@noble/ed25519', 'react-native', '@react-native'].join('|');

module.exports = {
    preset: 'react-native',
    setupFiles: ['./jest/setup.ts'],
    transformIgnorePatterns: [`node_modules/(?!${esModules})`],
};
