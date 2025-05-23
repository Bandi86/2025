# Legacy API Layer

This folder previously contained API logic for posts, comments, likes, users, etc.

As of 2025-05-23, all domain logic has been migrated to the new service-based structure in `lib/{domain}/{domain}Service.ts`.

- Use the new service files for all new code.
- This folder is retained temporarily for reference and migration.
- Remove or refactor any remaining usages of these files.
