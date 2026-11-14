# API Handler Checklist

1. Is the HTTP method supported?
2. Is the body bounded and schema-validated?
3. Is authentication/access verified?
4. Are group and event relationships checked server-side?
5. Is the operation idempotent where retries are possible?
6. Are secrets and personal data absent from logs?
7. Is the response shape safe and consistent?
8. Are expected failure states mapped to appropriate status codes?
9. Is the handler short enough for the selected Vercel runtime?
