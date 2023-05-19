/** @type {import('typedoc').TypeDocOptions} */
const execSync = require('child_process').execSync;

const gitRef = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();

function handleUrl(match ) {
    const [gitPath, _] = match.split(':')[1].split('#')
    const url = 'https://github.com/Concordium/concordium-node-sdk-js/tree/' + gitRef + '/' + gitPath
    return url
}

module.exports = {
    out: "typedoc",
    entryPointStrategy: "expand",
    entryPoints: ["packages/web/src/index.ts", "packages/nodejs/src/index.ts"],
    tsconfig: "tsconfig.json",
    //readme: "MAIN.md",
    plugin: ["typedoc-plugin-replace-text"],
    replaceText: {
        inCodeCommentText: true,
        inCodeCommentTags: true,
        inIncludedFiles: true,
        replacements: [
            {
                pattern: "(GH-(\\d+))",
                replace: "[$1](https://github.com/your-name/the-repo/issues/$2)"
            },
            {
                pattern: "(git:[^ ]+)",
                //flags: "gi",
                replace: (match) => {
                    return handleUrl(match);
                },
            },
        ],
    },
};