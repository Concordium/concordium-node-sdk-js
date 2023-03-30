#!/usr/bin/env bash
path=$(find client common -name "*$1*" | grep '\.ts$' | head)
yarn ts-node $path "${@:2}"
