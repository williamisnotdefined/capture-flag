import { useMutation, useQueryClient } from "@tanstack/react-query";
import { auditLogQueryKeys } from "../../auditLogs/queryKeys";
import { sdkKeyQueryKeys } from "../queryKeys";
import { revokeSdkKey } from "./revokeSdkKey";

type UseRevokeSdkKeyOptions = {
  projectId: string;
};

export function useRevokeSdkKey({ projectId }: UseRevokeSdkKeyOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: revokeSdkKey,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: sdkKeyQueryKeys.list(projectId) });
      void queryClient.invalidateQueries({ queryKey: auditLogQueryKeys.all });
    },
  });
}
