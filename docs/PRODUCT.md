# Product - Capture Flag

## Objective

Build a feature flags and remote config platform inspired by services like ConfigCat, but with its own domain, SDK, Configs, and configuration format.

The product must allow teams to create organizations, projects, configs, environments, feature flags, targeting rules, percentage rollouts, and SDKs capable of consuming configurations locally with cache.

## Product Principles

| Principle | Description |
|---|---|
| Local evaluation | SDK evaluates flags locally; user data is not sent to the API |
| Versioned Config | The public JSON must have a schema version from the start |
| Secure multi-tenant | All important entities must be isolated by organization/project |
| Simple local infra | The project must run locally with Docker Compose for development and tests |
| SDK first | The client creates configurations; the SDK must be reliable for production use |
| Smallest useful MVP | Prioritize a working vertical slice before enterprise features |

## Domain Terms

| Term | Description |
|---|---|
| User | Authenticated platform user |
| OAuth Account | External account linked to a user, such as GitHub or Google |
| Session | Opaque session used by the client through an HTTP-only cookie |
| Organization | Account, company, or team that owns projects |
| Organization Member | User with access to an organization |
| Project | Product/application that groups configs, environments, and members |
| Project Member | User with a specific role in a project |
| Config | Set of flags/settings consumed as Config JSON by the SDK |
| Environment | Environment such as development, staging, and production |
| Feature Flag | Boolean setting used to turn behavior on/off |
| Remote Config | Non-boolean setting: string, integer, double, or JSON |
| SDK Key | Public read-only key used by SDKs, scoped by config and environment |
| Config JSON | Public versioned file downloaded by SDKs |
| Role | Set of permissions applied to an organization or project |
| Evaluation Context | Data passed to the SDK to evaluate rules locally |
| Targeting Rule | Rule for serving a different value by user/context |
| Prerequisite Flag | Local dependency between flags within the same Config JSON |
| Percentage Rollout | Deterministic percentage distribution of values |
| Segment | Reusable group of user conditions used by targeting rules |
| Audit Log | Immutable record of important changes for investigation and compliance |

## Flag Removal Policy

In the current phase, removing a feature flag archives the record with `deletedAt` instead of physically deleting it. Archived flags do not appear in active listings or in the public Config JSON delivered to SDKs. There is no restore flow in this phase; recreating a flag with the same key is allowed because active uniqueness is enforced by a partial index only for records without `deletedAt`.

## Multi-Tenant SaaS Model

Decision: multi-tenant SaaS from the start. The local infrastructure exists for development, tests, and simple operation without compromising the SaaS design.

Main domain triad: organizations have users and projects; projects have configs and environments; users receive roles in the organization and, when necessary, project-specific roles.

| Requirement | Implication |
|---|---|
| Tenant isolation | Database is always scoped by organization/project |
| Organization membership | An organization can have N users; users are global and access organizations through membership |
| Project membership | Users can have different roles in different projects in the same organization |
| Private routes | Every route validates tenant and permission before accessing a resource |
| Permission scopes | Permissions are granted at organization or project scope |
| SDK keys | Keys are read-only and scoped by config/environment |
| Future SaaS | Billing, quotas, and plans come later without remodeling the domain |
