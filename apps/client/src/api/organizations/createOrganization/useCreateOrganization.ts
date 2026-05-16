import { authQueryKeys } from "@api/auth/queryKeys";
import type { Organization } from "@src/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createOrganization } from "./createOrganization";

type UseCreateOrganizationOptions = {
  onSuccess?: (organization: Organization) => void;
};

export function useCreateOrganization({ onSuccess }: UseCreateOrganizationOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createOrganization,
    onSuccess: (organization) => {
      void queryClient.invalidateQueries({ queryKey: authQueryKeys.me() });
      onSuccess?.(organization);
    },
  });
}
