# Architecture Boundaries

- Browser code must not contain database clients or privileged Google API clients.
- API entry points validate transport-level input and delegate to server-side services.
- Services enforce business rules.
- Repositories encapsulate database operations.
- Configuration must be validated and secrets must remain server-side.
- MongoDB is authoritative; Sheets is a read/reporting mirror.
- No conventional always-on backend server is in scope.
