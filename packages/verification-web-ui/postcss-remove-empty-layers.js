/**
 * PostCSS plugin to unwrap and flatten @layer directives
 * This fixes the issue where Tailwind v4 leaves @layer directives in the output
 * which causes errors in consuming projects that don't have Tailwind setup
 */
export default function postcssRemoveEmptyLayers() {
  return {
    postcssPlugin: 'postcss-remove-empty-layers',
    OnceExit(root) {
      root.walkAtRules('layer', rule => {
        // If the layer has no children, just remove it
        if (!rule.nodes || rule.nodes.length === 0) {
          rule.remove();
          return;
        }

        // Unwrap the layer: move all children to the parent level
        // Insert each child node before the @layer rule
        const parent = rule.parent;
        const index = parent.index(rule);

        // Insert all child nodes at the layer's position
        rule.nodes.forEach((node, i) => {
          parent.insertBefore(rule, node);
        });

        // Remove the now-empty @layer wrapper
        rule.remove();
      });
    },
  };
}

postcssRemoveEmptyLayers.postcss = true;
