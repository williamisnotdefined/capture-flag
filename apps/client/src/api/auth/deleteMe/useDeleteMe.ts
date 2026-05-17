import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteMe } from "./deleteMe";

type UseDeleteMeOptions = {
  onSuccess?: () => void;
};

export function useDeleteMe({ onSuccess }: UseDeleteMeOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteMe,
    onSuccess: () => {
      queryClient.clear();
      onSuccess?.();
    },
  });
}
