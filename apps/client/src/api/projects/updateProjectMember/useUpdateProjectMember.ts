import { useMutation, useQueryClient } from "@tanstack/react-query";
import { projectQueryKeys } from "../queryKeys";
import { type UpdateProjectMemberInput, updateProjectMember } from "./updateProjectMember";

export function useUpdateProjectMember(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: Omit<UpdateProjectMemberInput, "projectId">) =>
      updateProjectMember({ ...values, projectId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.members(projectId) });
    },
  });
}
