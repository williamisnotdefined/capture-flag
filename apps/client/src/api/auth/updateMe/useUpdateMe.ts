import { authQueryKeys } from "@api/auth/queryKeys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type UpdateMeInput, updateMe } from "./updateMe";

type UseUpdateMeOptions = {
  onSuccess?: () => void;
};

export function useUpdateMe({ onSuccess }: UseUpdateMeOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateMeInput) => updateMe(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authQueryKeys.me() });
      onSuccess?.();
    },
  });
}
