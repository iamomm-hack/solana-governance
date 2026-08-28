"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { setTag } from "@sentry/nextjs";
import type { RPCEndpoint } from "@/types";
import { getRpcProxyUrl } from "@/lib/getRpcProxyUrl";

interface EndpointContextType {
  endpointType: RPCEndpoint;
  endpointUrl: string;
  network: RPCEndpoint;
  isResolvingNetwork: false;
  setEndpoint: (type: RPCEndpoint) => void;
  resetToDefault: () => void;
}

const EndpointContext = createContext<EndpointContextType | undefined>(
  undefined,
);

const DEFAULT_TYPE: RPCEndpoint = "mainnet";
const STORAGE_KEY = "solana-rpc-cluster";
const LEGACY_STORAGE_KEY = "solana-rpc-endpoint";
const ENDPOINTS = new Set<RPCEndpoint>(["mainnet", "testnet", "devnet"]);

function isRpcEndpoint(value: unknown): value is RPCEndpoint {
  return typeof value === "string" && ENDPOINTS.has(value as RPCEndpoint);
}

function getStoredEndpoint(): RPCEndpoint {
  if (typeof window === "undefined") return DEFAULT_TYPE;

  const saved = localStorage.getItem(STORAGE_KEY);
  if (isRpcEndpoint(saved)) return saved;

  // Migrate the previous { type, url } value without retaining its RPC URL.
  const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (legacy) {
    try {
      const { type } = JSON.parse(legacy) as { type?: unknown };
      if (isRpcEndpoint(type)) return type;
    } catch {
      // Ignore malformed legacy settings and fall back to mainnet.
    } finally {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
  }

  return DEFAULT_TYPE;
}

export function EndpointProvider({ children }: { children: ReactNode }) {
  const [endpointType, setEndpointType] =
    useState<RPCEndpoint>(getStoredEndpoint);
  const endpointUrl = useMemo(
    () => getRpcProxyUrl(endpointType),
    [endpointType],
  );

  useEffect(() => {
    setTag("solana_network", endpointType);
  }, [endpointType]);

  const setEndpoint = (type: RPCEndpoint) => {
    setEndpointType(type);
    localStorage.setItem(STORAGE_KEY, type);
  };

  const resetToDefault = () => {
    setEndpointType(DEFAULT_TYPE);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  };

  return (
    <EndpointContext.Provider
      value={{
        endpointType,
        endpointUrl,
        network: endpointType,
        isResolvingNetwork: false,
        setEndpoint,
        resetToDefault,
      }}
    >
      {children}
    </EndpointContext.Provider>
  );
}

export function useEndpoint() {
  const context = useContext(EndpointContext);
  if (context === undefined) {
    throw new Error("useEndpoint must be used within an EndpointProvider");
  }
  return context;
}
