import { projectQueryKeys } from "@api/projects/queryKeys";
import type { Project } from "@src/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
