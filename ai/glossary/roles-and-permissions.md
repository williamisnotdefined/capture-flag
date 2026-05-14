# Roles And Permissions

Role terminology used by organization and project access checks.

## Organization Roles

- `owner`: highest organization role; can satisfy project access.
- `admin`: organization administrator; can satisfy project access.
- `member`: organization member without admin shortcut.
- `viewer`: read-oriented organization member.

## Project Roles

- `project_admin`: project-level administrator.
- `developer`: can perform project write operations where allowed.
- `viewer`: read-oriented project member.

## Access Concepts

- Organization membership is required before organization-scoped reads or writes.
- Project access can come from organization `owner`/`admin` or explicit project membership.
- Project writes must use `requireProjectRole` with narrow allowed project roles.
- Organization writes must use `requireOrganizationRole` with narrow allowed organization roles.
