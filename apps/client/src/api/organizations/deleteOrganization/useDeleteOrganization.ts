import { authQueryKeys } from "@api/auth/queryKeys";
import { projectQueryKeys } from "@api/projects/queryKeys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteOrganization } from "./deleteOrganization";

type UseDeleteOrganizationOptions = {
  onSuccess?: () => void;
};

export function useDeleteOrganization({ onSuccess }: UseDeleteOrganizationOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteOrganization,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authQueryKeys.me() });
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
      onSuccess?.();
    },
  });
}
