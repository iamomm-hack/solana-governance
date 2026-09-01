import { NetworkMetaResponse } from "@/chain";
import { useEndpoint } from "@/contexts/EndpointContext";
import { useNcnApi } from "@/contexts/NcnApiContext";
import { fetchNcnJson } from "@/lib/ncnApi";
import { useQuery } from "@tanstack/react-query";

export const useSnapshotMeta = () => {
  const { network } = useEndpoint();
  const { ncnApiUrl } = useNcnApi();

  return useQuery({
    staleTime: 1000 * 120, // 2 minutes
    queryKey: ["snapshot_meta", network, ncnApiUrl],
    queryFn: ({ signal }): Promise<NetworkMetaResponse> => {
      const url = `${ncnApiUrl}/meta?network=${network}`;

      return fetchNcnJson<NetworkMetaResponse>(url, {
        signal,
        label: "snapshot meta info",
        resource: "snapshot-meta",
      });
    },
  });
};
