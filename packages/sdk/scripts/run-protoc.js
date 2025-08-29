import { spawnSync } from "child_process";
import path from "path";
import fs from "fs";

const isWindows = process.platform === "win32";

const protoc = path.resolve("../../node_modules/.bin",
    isWindows ? "grpc_tools_node_protoc.cmd" : "grpc_tools_node_protoc");

const protocGenTs = isWindows ?
    path.resolve("scripts", "protoc-gen-ts.cmd") :
    path.resolve("../../node_modules/@protobuf-ts/plugin/bin", "protoc-gen-ts");

const grpcApiDir = path.resolve("../../deps/concordium-base/concordium-grpc-api");
const protoDir = path.join(grpcApiDir, "v2", "concordium");
const protoFiles = fs.readdirSync(protoDir)
    .filter((file) => file.endsWith(".proto"))
    .map((file) => path.join(protoDir, file));

const args = [
    `--plugin=protoc-gen-ts=${protocGenTs}`,
    "--ts_opt", "optimize_code_size",
    "--ts_out=src/grpc-api",
    "-I", grpcApiDir,
    ...protoFiles,
];

const result = spawnSync(protoc, args, { stdio: 'inherit', shell: isWindows });
process.exit(result.status ?? 1);