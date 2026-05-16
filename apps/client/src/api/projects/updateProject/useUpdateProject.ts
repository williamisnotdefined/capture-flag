import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Project } from "../../../types";
import { projectQueryKeys } from "../queryKeys";
import { type UpdateProjectInput, updateProject } from "./updateProject";

type UseUpdateProjectOptions = {
  organizationId: string;
  onSuccess?: (project: Project) => void;
};

export function useUpdateProject({ organizationId, onSuccess }: UseUpdateProjectOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProject,
    onSuccess: (project) => {
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.list(organizationId) });
      onSuccess?.(project);
    },
  });
}

export type { UpdateProjectInput };
