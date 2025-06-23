# syntax=docker/dockerfile:1

ARG build_image="node:16-slim"
FROM ${build_image} AS build
WORKDIR /build
# Note that 'yarn.lock' isn't included as it resides in the root of the repository.
COPY package.json .
RUN yarn install
COPY . .
RUN yarn build

FROM httpd:2-alpine
COPY --from=build /build/build /usr/local/apache2/htdocs
