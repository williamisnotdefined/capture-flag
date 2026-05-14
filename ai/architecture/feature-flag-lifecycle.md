# Feature Flag Lifecycle Architecture

Feature flags are edited through private API services and consumed through public config JSON.

## Creation Flow

1. Resolve config by `configId`.
2. Require project write role for the config project.
3. Normalize key, name, type, default value, tags, hint, and owner.
4. Create the feature flag.
5. Create one environment value for every existing project environment.
6. Bump each affected config environment state.
7. Write an audit log entry.

## Metadata Update Flow

1. Find the active flag by ID.
2. Require project write role.
3. Normalize received fields.
4. If no fields are received, reject the request.
5. If normalized values do not change data, return the existing flag.
6. If SDK-visible metadata changes, bump affected config environment states.
7. Write an audit log entry.

## Environment Value Update Flow

1. Find the active flag by ID.
2. Require project write role.
3. Verify the target environment belongs to the flag project.
4. Normalize public value fields for the flag type.
5. Reject updates with no public value fields.
6. If the update is a no-op, return the existing value without bumping revision or audit.
7. Upsert the environment value.
8. Bump the matching config environment state.
9. Write an audit log entry.

## Deletion Flow

Feature flag deletion is soft delete through `deletedAt`. Deletion bumps affected config environment states and public config excludes the flag.

## Segment Flow

Segments are created, updated, and soft-deleted through private API routes scoped by config. Creating or deleting a segment changes the public Config JSON for every environment of that config. Updating `key` or `conditionsJson` also bumps every config environment state for the config; updating only UI metadata such as `name` or `description` does not bump public revisions.
