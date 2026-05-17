import { auditLogQueryKeys } from "@api/auditLogs/queryKeys";
import { authQueryKeys } from "@api/auth/queryKeys";
import { organizationQueryKeys } from "@api/organizations/queryKeys";
import { projectQueryKeys } from "@api/projects/queryKeys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  type BulkRemoveOrganizationMembersInput,
  bulkRemoveOrganizationMembers,
} from "./bulkRemoveOrganizationMembers";

type UseBulkRemoveOrganizationMembersOptions = {
  onSuccess?: (memberIds: string[]) => void;
  organizationId: string;
};

export function useBulkRemoveOrganizationMembers({
  onSuccess,
  organizationId,
}: UseBulkRemoveOrganizationMembersOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: Omit<BulkRemoveOrganizationMembersInput, "organizationId">) =>
      bulkRemoveOrganizationMembers({ ...values, organizationId }),
    onSuccess: (_result, { memberIds }) => {
      void queryClient.invalidateQueries({
        queryKey: organizationQueryKeys.members(organizationId),
      });
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.list(organizationId) });
      void queryClient.invalidateQueries({ queryKey: authQueryKeys.me() });
      void queryClient.invalidateQueries({ queryKey: auditLogQueryKeys.all });
      onSuccess?.(memberIds);
    },
  });
}
