import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authQueryKeys } from "../../auth/queryKeys";
import { projectQueryKeys } from "../../projects/queryKeys";
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
