import { useMutation, useQueryClient } from "@tanstack/react-query";
import { auditLogQueryKeys } from "../../auditLogs/queryKeys";
import { authQueryKeys } from "../../auth/queryKeys";
import { projectQueryKeys } from "../../projects/queryKeys";
import { organizationQueryKeys } from "../queryKeys";
import {
  type RemoveOrganizationMemberInput,
  removeOrganizationMember,
} from "./removeOrganizationMember";

export function useRemoveOrganizationMember(organizationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: Omit<RemoveOrganizationMemberInput, "organizationId">) =>
      removeOrganizationMember({ ...values, organizationId }),
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
