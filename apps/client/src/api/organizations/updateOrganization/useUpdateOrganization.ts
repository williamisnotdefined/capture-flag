import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Organization } from "../../../types";
import { authQueryKeys } from "../../auth/queryKeys";
import { type UpdateOrganizationInput, updateOrganization } from "./updateOrganization";

type UseUpdateOrganizationOptions = {
  onSuccess?: (organization: Organization) => void;
};

export function useUpdateOrganization({ onSuccess }: UseUpdateOrganizationOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateOrganization,
    onSuccess: (organization) => {
      void queryClient.invalidateQueries({ queryKey: authQueryKeys.me() });
      onSuccess?.(organization);
    },
  });
}

export type { UpdateOrganizationInput };
