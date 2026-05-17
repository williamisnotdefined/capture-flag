import { authQueryKeys } from "@api/auth/queryKeys";
import { projectQueryKeys } from "@api/projects/queryKeys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bulkDeleteOrganizations } from "./bulkDeleteOrganizations";

type UseBulkDeleteOrganizationsOptions = {
  onSuccess?: (organizationIds: string[]) => void;
};

export function useBulkDeleteOrganizations({ onSuccess }: UseBulkDeleteOrganizationsOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bulkDeleteOrganizations,
    onSuccess: (_result, organizationIds) => {
      void queryClient.invalidateQueries({ queryKey: authQueryKeys.me() });
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
      onSuccess?.(organizationIds);
    },
  });
}
