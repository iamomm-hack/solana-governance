import type { RPCEndpoint } from "@/types";

export type KnownSnapshotNetwork = RPCEndpoint;

/**
 * Shown when an action needs the snapshot service but the RPC is not a known cluster.
 */
export const SNAPSHOT_UNAVAILABLE_MESSAGE =
  "Snapshot service unavailable in this network";

/** Shown when there is no snapshot slot set yet. */
export const SNAPSHOT_SLOT_UNSET_MESSAGE = "No snapshot slot has been set yet";

/**
 * Known cluster genesis hashes for each network.
 */
export const CLUSTER_GENESIS_HASHES: Record<KnownSnapshotNetwork, string> = {
  mainnet: "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d",
  devnet: "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG",
  testnet: "4uhcVJyU9pJkvQyS88uRDiswHXSCkY3zQawwpjk2NsNY",
};

export function isKnownSnapshotNetwork(
  network: string | undefined,
): network is KnownSnapshotNetwork {
  return network !== undefined && network in CLUSTER_GENESIS_HASHES;
}

export function networkFromGenesisHash(
  genesisHash: string,
): KnownSnapshotNetwork | undefined {
  return (Object.keys(CLUSTER_GENESIS_HASHES) as KnownSnapshotNetwork[]).find(
    (network) => CLUSTER_GENESIS_HASHES[network] === genesisHash,
  );
}

export function requireKnownSnapshotNetwork(
  network: string | undefined,
): KnownSnapshotNetwork {
  if (!isKnownSnapshotNetwork(network)) {
    throw new Error(SNAPSHOT_UNAVAILABLE_MESSAGE);
  }
  return network;
}
