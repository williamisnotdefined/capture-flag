export function organizationSelect() {
  return {
    id: true,
    name: true,
    slug: true,
    deletedAt: true,
    createdAt: true,
    updatedAt: true,
    _count: {
      select: {
        members: true,
        projects: {
          where: {
            deletedAt: null,
          },
        },
      },
    },
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
        _count: {
          select: {
            members: true,
            projects: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
      },
    },
  } as const;
}
