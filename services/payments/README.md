# Payments Service

The Payments Service owns payment-domain data and workflows for FinFlow.

## Structure

```text
services/payments/
├── src/
│   ├── controllers/   # HTTP request handlers
│   ├── db/            # Drizzle connection and schema
│   ├── middleware/    # Service-level middleware
│   ├── routes/        # Payment HTTP routes
│   ├── schemas/       # Request/response validation schemas
│   ├── services/      # Payment domain/business logic
│   ├── utils/         # Payment-service utilities
│   └── index.ts       # Express application entrypoint
├── .env.example
├── drizzle.config.ts
├── package.json
└── tsconfig.json
```

The service uses its own PostgreSQL database and follows the same Express + Drizzle + TypeScript structure as the existing Auth and Merchants services.
