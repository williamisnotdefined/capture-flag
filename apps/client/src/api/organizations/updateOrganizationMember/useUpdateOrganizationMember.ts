import { auditLogQueryKeys } from "@api/auditLogs/queryKeys";
import { authQueryKeys } from "@api/auth/queryKeys";
import { organizationQueryKeys } from "@api/organizations/queryKeys";
import { projectQueryKeys } from "@api/projects/queryKeys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  type UpdateOrganizationMemberInput,
  updateOrganizationMember,
} from "./updateOrganizationMember";

export function useUpdateOrganizationMember(organizationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: Omit<UpdateOrganizationMemberInput, "organizationId">) =>
      updateOrganizationMember({ ...values, organizationId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: organizationQueryKeys.members(organizationId),
      });
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.list(organizationId) });
      void queryClient.invalidateQueries({ queryKey: authQueryKeys.me() });
      void queryClient.invalidateQueries({ queryKey: auditLogQueryKeys.all });
    },
  });
}
