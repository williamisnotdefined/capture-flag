export function organizationSelect() {
  return {
    id: true,
    name: true,
    slug: true,
    createdAt: true,
    updatedAt: true,
  } as const;
}

export function userOrganizationMembershipSelect() {
  return {
    role: true,
    organization: {
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
      },
    },
  } as const;
}
