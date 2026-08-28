jest.mock("@sentry/nextjs", () => ({ setTag: jest.fn() }));

import React from "react";
import { act, renderHook } from "@testing-library/react";
import { EndpointProvider, useEndpoint } from "../EndpointContext";

const STORAGE_KEY = "solana-rpc-cluster";
const LEGACY_STORAGE_KEY = "solana-rpc-endpoint";

function wrapper({ children }: { children: React.ReactNode }) {
  return <EndpointProvider>{children}</EndpointProvider>;
}

describe("EndpointProvider", () => {
  beforeEach(() => localStorage.clear());

  it("uses the same-origin mainnet proxy by default", () => {
    const { result } = renderHook(() => useEndpoint(), { wrapper });

    expect(result.current.endpointType).toBe("mainnet");
    expect(result.current.network).toBe("mainnet");
    expect(result.current.endpointUrl).toBe(
      "http://localhost/api/rpc?cluster=mainnet",
    );
    expect(result.current.isResolvingNetwork).toBe(false);
  });

  it("switches clusters without accepting or storing an upstream URL", () => {
    const { result } = renderHook(() => useEndpoint(), { wrapper });

    act(() => result.current.setEndpoint("devnet"));

    expect(result.current.endpointType).toBe("devnet");
    expect(result.current.endpointUrl).toBe(
      "http://localhost/api/rpc?cluster=devnet",
    );
    expect(localStorage.getItem(STORAGE_KEY)).toBe("devnet");
  });

  it("migrates the cluster from legacy storage and discards its URL", () => {
    localStorage.setItem(
      LEGACY_STORAGE_KEY,
      JSON.stringify({ type: "testnet", url: "https://secret-rpc.example/key" }),
    );

    const { result } = renderHook(() => useEndpoint(), { wrapper });

    expect(result.current.endpointType).toBe("testnet");
    expect(result.current.endpointUrl).toBe(
      "http://localhost/api/rpc?cluster=testnet",
    );
    expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull();
  });

  it("does not restore a legacy custom RPC", () => {
    localStorage.setItem(
      LEGACY_STORAGE_KEY,
      JSON.stringify({ type: "custom", url: "https://secret-rpc.example/key" }),
    );

    const { result } = renderHook(() => useEndpoint(), { wrapper });

    expect(result.current.endpointType).toBe("mainnet");
    expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull();
  });
});
