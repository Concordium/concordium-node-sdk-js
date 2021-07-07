import { credentials, Metadata } from "@grpc/grpc-js/";
import ConcordiumNodeClient from "../src/client";

/**
 * Creates a client to communicate with a local concordium-node
 * used for automatic tests.
 */
export default function getNodeClient(): ConcordiumNodeClient {
    const metadata = new Metadata();
    metadata.add("authentication", "rpcadmin");
    return new ConcordiumNodeClient(
        "127.0.0.1",
        10000,
        credentials.createInsecure(),
        metadata,
        15000
    );
}
