import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Project } from "../../../types";
import { projectQueryKeys } from "../queryKeys";
import { createProject } from "./createProject";

type UseCreateProjectOptions = {
  organizationId: string;
  onSuccess?: (project: Project) => void;
};

export function useCreateProject({ organizationId, onSuccess }: UseCreateProjectOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => createProject({ name, organizationId }),
    onSuccess: (project) => {
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.list(organizationId) });
      onSuccess?.(project);
    },
  });
}
