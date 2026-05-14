# Domain Terms

Core Capture Flag domain language.

## User

Authenticated platform identity. Users are global and can belong to multiple organizations.

## OAuth Account

External provider account linked to a user, such as GitHub.

## Session

Opaque client session stored in an HTTP-only cookie. The database stores only the token hash.

## Organization

Primary tenant. Organizations own projects and organization memberships.

## Organization Member

User membership and role inside an organization.

## Project

Product, application, or system inside an organization. Projects group configs, environments, SDK keys, members, and flags.

## Project Member

User membership and role scoped to one project.

## Config

Named set of flags/settings consumed by SDKs as public Config JSON.

## Environment

Runtime environment such as development, staging, or production.

## Audit Log

Minimal immutable record of important domain changes.
