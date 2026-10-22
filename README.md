# WorkivLab Backend Architecture & Developer Guide

## 1. Overview & Architecture Principles

The WorkivLab backend is built on **NestJS 11** with:

- **Modular Monolith** structure.
- **Global Identity Router + Regional Operational Multi-Tenancy**.
- **Tenant Context Extraction**: Automated resolution of `companyId` and `region` from verified JWT claims.
- **Strict Single-Line Comments**: Zero block comments or JSDoc blocks.
- **Resilience**: Redis caching, BullMQ asynchronous job queues, and connection-pooled MongoDB instances.

## 2. Directory Structure

```text
server/src/
├── main.ts                     // Server bootstrap, Helmet, CORS, ValidationPipe, Swagger
├── app.module.ts               // Master module with multi-region database configuration
├── common/                     // Shared cross-cutting concerns
│   ├── constants/              // Permissions catalog, default roles, cache keys
│   ├── decorators/             // @CurrentUser, @CurrentTenant, @RequirePermissions
│   ├── filters/                // GlobalExceptionFilter (sanitized errors)
│   ├── guards/                 // JwtAuthGuard, PermissionsGuard, WorkingHoursGuard
│   ├── interceptors/           // AuditLogInterceptor, TransformInterceptor
│   └── pipes/                  // StrictValidationPipe
├── config/                     // Environment configuration with schema validation
├── database/                   // Multi-Region Database Infrastructure
│   ├── regional-database.manager.ts
│   ├── master.schema.ts        // Global identity records
│   └── tenant-base.schema.ts   // Base tenant schema with companyId indexes
├── providers/                  // External provider abstractions
│   ├── email/                  // EmailProvider (SMTP, MailHog, SES)
│   ├── ai/                     // AIProvider (Gemini, OpenAI)
│   ├── storage/                // StorageProvider (Cloudinary, Local)
│   └── payment/                // PaymentProvider (Stripe, Webhooks)
└── modules/                    // Business domain modules
    ├── auth/                   // Dual registration, login, token refresh rotation
    ├── users/                  // Master user management
    ├── companies/              // Multi-step onboarding, settings, working hours
    ├── roles/                  // Dynamic RBAC, permission registry & seeder
    ├── employees/              // Profiles, invitations, activations
    ├── departments/            // Department organization
    ├── attendance/             // Clocking, overnight shifts, geo/IP logging
    ├── leave/                  // Allocations, applications, approval workflow
    ├── tasks/                  // Task boards, sprint tracking
    ├── chat/                   // Real-time channels & direct messaging
    ├── meetings/               // Video scheduling, WebRTC signaling
    ├── email-campaigns/        // Marketing campaigns & BullMQ queue
    ├── reports/                // Aggregated stats, CSV exports, AI summaries
    ├── subscriptions/          // Stripe webhook handler, tier enforcement
    ├── audit-logs/             // Security and mutation audit trail
    └── health/                 // Health checks for DB, Redis, Memory
```

## 3. Multi-Region Routing & Tenant Isolation

### 3.1 Regional Database Manager

```ts
// Resolves regional MongoDB connection pool safely
const connection = await this.regionalDbManager.getConnection(region);
```

- Supported initial regions: `PK`, `IND`.
- Prepared for future regions: `USA`, `EU`, `UAE`.
- Fallback mechanism to default regional cluster in development.

### 3.2 Security Rules on Tenant Data

1. **Never trust `companyId` from client body or query params**. The `companyId` MUST be extracted from the authenticated user context (`@CurrentTenant()`).
2. **Never trust `X-Region` header for authorization**. `X-Region` is only a routing hint for the edge/load balancer. The backend validates the authenticated user's assigned region before executing any query.

## 4. RBAC & Granular Permissions

- Every endpoint requiring authorization uses `@RequirePermissions('permission.name')`.
- Initial owner receives the full permission set upon registration.
- Custom tenant roles can be assigned any subset of permissions.

## 5. Adding New Modules

1. Generate module structure: `src/modules/<name>/`
2. Define DTOs in `dto/` with `class-validator` annotations.
3. Define Mongoose schema in `schemas/` extending the tenant base schema with `companyId` compound indexes.
4. Implement business logic in `<name>.service.ts` injecting regional database connection.
5. Expose versioned controller endpoints in `<name>.controller.ts` with Swagger decorators.
6. Register module in `app.module.ts`.
