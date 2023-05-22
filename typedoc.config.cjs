/** @type {import('typedoc').TypeDocOptions} */

const execSync = require('child_process').execSync;
const readFileSync = require('fs').readFileSync;

const repo = 'https://github.com/Concordium/concordium-node-sdk-js';
const gitRef = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();

function handleUrl(match ) {
    const gitPath = match.split(':')[1]

    const gitUrl = repo + '/tree/' + gitRef + '/' + gitPath
    return gitUrl
}

function handleExample(match ) {
    let [gitPath, lines] = match.split(':')[1].split('#')

    gitPath = '/examples/' + gitPath;
    const gitUrl = repo + '/tree/' + gitRef + gitPath;

    if (!lines) {
        lines = '0,-1'
    }

    const lns = lines.split(',');
    const file = readFileSync('.' + gitPath, 'utf8');
    const split = file.split('\n');
    const contentsArray = split.slice(lns[0]-1, lns[1]);
    const example = contentsArray.join("\n");

    return 'Example:\n```ts\n' + example + '\n```\nClick [here]('+gitUrl+') for full example'
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
                pattern: "(git:\\S+)",
                //flags: "gi",
                replace: (match) => {
                    return handleUrl(match);
                },
            },
            {
                pattern: "(example:\\S+)",
                //flags: "gi",
                replace: (match) => {
                    return handleExample(match);
                },
            },
        ],
    },
};