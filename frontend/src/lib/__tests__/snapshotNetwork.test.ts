import {
  CLUSTER_GENESIS_HASHES,
  SNAPSHOT_UNAVAILABLE_MESSAGE,
  isKnownSnapshotNetwork,
  networkFromGenesisHash,
  requireKnownSnapshotNetwork,
} from "../snapshotNetwork";

describe("networkFromGenesisHash", () => {
  it("maps each known cluster genesis hash", () => {
    expect(networkFromGenesisHash(CLUSTER_GENESIS_HASHES.mainnet)).toBe("mainnet");
    expect(networkFromGenesisHash(CLUSTER_GENESIS_HASHES.devnet)).toBe("devnet");
    expect(networkFromGenesisHash(CLUSTER_GENESIS_HASHES.testnet)).toBe("testnet");
  });

  it("returns undefined for an unrecognized hash", () => {
    expect(networkFromGenesisHash("unknown-genesis")).toBeUndefined();
  });
});

describe("snapshot network validation", () => {
  it("accepts only the supported clusters", () => {
    expect(isKnownSnapshotNetwork("mainnet")).toBe(true);
    expect(isKnownSnapshotNetwork("testnet")).toBe(true);
    expect(isKnownSnapshotNetwork("devnet")).toBe(true);
    expect(isKnownSnapshotNetwork("custom")).toBe(false);
    expect(isKnownSnapshotNetwork(undefined)).toBe(false);
  });

  it("throws when the cluster is unavailable", () => {
    expect(requireKnownSnapshotNetwork("testnet")).toBe("testnet");
    expect(() => requireKnownSnapshotNetwork(undefined)).toThrow(
      SNAPSHOT_UNAVAILABLE_MESSAGE,
    );
  });
});
