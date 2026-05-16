export function projectMemberUserSelect() {
  return {
    avatarUrl: true,
    email: true,
    id: true,
    name: true,
  } as const;
}

export function projectMemberSelect() {
  return {
    createdAt: true,
    id: true,
    projectId: true,
    role: true,
    updatedAt: true,
    userId: true,
    user: {
      select: projectMemberUserSelect(),
    },
  } as const;
}
