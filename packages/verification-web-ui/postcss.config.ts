import tailwindcss from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';

import postcssRemoveEmptyLayers from './postcss-remove-empty-layers.js';

export default {
    plugins: [tailwindcss, autoprefixer, postcssRemoveEmptyLayers],
};
