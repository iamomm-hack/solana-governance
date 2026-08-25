import { useEndpoint } from "@/contexts/EndpointContext";
import { Connection, type VoteAccountInfo } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
import { GET_VOTE_ACCOUNTS } from "@/helpers";

export interface RawVoteAccountsData {
  current: VoteAccountInfo[];
  delinquent: VoteAccountInfo[];
}

/**
 * Hook to fetch raw Solana vote accounts (current and delinquent)
 * Caches the data for reuse across components
 * @returns The raw vote accounts data, or undefined if loading/error
 */
export function useRawVoteAccounts() {
  const { endpointUrl } = useEndpoint();

  return useQuery<RawVoteAccountsData>({
    queryKey: [GET_VOTE_ACCOUNTS, endpointUrl],
    queryFn: async ({ signal }) => {
      const connection = new Connection(endpointUrl, {
        commitment: "confirmed",
        // web3.js does not expose an AbortSignal on getVoteAccounts, but its custom fetch
        // hook lets React Query cancel the transport on unmount or endpoint changes.
        fetch: (input, init) => fetch(input, { ...init, signal }),
      });
      const voteAccounts = await connection.getVoteAccounts();

      return {
        current: voteAccounts.current,
        delinquent: voteAccounts.delinquent,
      };
    },
    staleTime: 1000 * 120, // 2 minutes
    refetchOnWindowFocus: false,
  });
}
