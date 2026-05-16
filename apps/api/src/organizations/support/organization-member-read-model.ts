export function organizationMemberUserSelect() {
  return {
    avatarUrl: true,
    email: true,
    id: true,
    name: true,
  } as const;
}

export function organizationMemberInclude() {
  return {
    user: {
      select: organizationMemberUserSelect(),
    },
  } as const;
}
