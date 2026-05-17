export function featureFlagInclude() {
  return {
    owner: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },
    environmentValues: {
      include: {
        environment: {
          select: {
            id: true,
            key: true,
            name: true,
            sortOrder: true,
          },
        },
      },
      orderBy: { createdAt: "asc" as const },
    },
  };
}
