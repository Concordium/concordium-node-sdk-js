# concordium-web-sdk

[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.0-4baaaa.svg)](https://github.com/Concordium/.github/blob/main/.github/CODE_OF_CONDUCT.md)

Wrappers for interacting with the Concordium node, for the web environment.

## Building for a release
To build the package run
```
yarn build
```

This transpiles the project to javascript. Then it uses webpack to create a single, pure-js file, which is put in dist.

Note that the dependent packages must already have been built. To easily do this, build from the package root instead.

## Publishing a release
Before publishing a new release it is essential that it has been built first. So make sure that 
you have just built the up-to-date code you want to publish. To publish the release run
```
yarn publish
```
and step through the steps precented to you.


## Examples

### Alias.html
A very minimal example of a webpage showing alias'es of a given address, using the bundled blob.

(The project should be built before running the example) 


