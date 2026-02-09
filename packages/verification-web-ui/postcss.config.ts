import postcssRemoveEmptyLayers from './postcss-remove-empty-layers.js';

export default {
  plugins: [
    require('@tailwindcss/postcss'),
    require('autoprefixer'),
    postcssRemoveEmptyLayers,
  ],
};
