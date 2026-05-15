# Roles And Permissions

Role terminology used by organization and project access checks.

## Organization Roles

- `owner`: highest organization role; manages organizations, projects, members, roles, and can satisfy project access.
- `admin`: organization administrator; manages organization members/projects except owner role changes, and can satisfy project access.
- `member`: organization member without admin shortcut.
- `viewer`: read-oriented organization member.

## Project Roles

- `project_admin`: project-level administrator; manages project members, configs, environments, SDK keys, segments, and flags.
- `developer`: can create, update, and delete feature flags in projects where the role was granted.
- `viewer`: read-oriented project member.

## Access Concepts

- Organization membership is required before organization-scoped reads or writes.
- Project access can come from organization `owner`/`admin` or explicit project membership.
- Project writes must use `requireProjectRole` with narrow allowed project roles.
- Organization writes must use `requireOrganizationRole` with narrow allowed organization roles.

## Permission Matrix

- Organization `owner`/`admin`: create projects, manage organization members, manage organization roles, and satisfy project-level administrative actions through the organization shortcut. Only owners can create, change, or remove owners.
- Project `project_admin`: manage project members, configs, environments, SDK keys, segments, and feature flags only for projects where this role was granted.
- Project `developer`: create, update, and delete feature flags only for projects where this role was granted.
- Project `viewer`: read project resources only.
- Organization `member`/`viewer` without a project role cannot access project resources.
