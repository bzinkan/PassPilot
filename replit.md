# PassPilot - School Pass Management System

## Overview

PassPilot is a comprehensive school pass management system designed for teachers and administrators to efficiently track student passes, maintain safety, and reduce classroom disruptions. It enables teachers to manage student rosters, issue digital passes for various purposes (e.g., bathroom, nurse, office), and monitor active passes in real-time. The system supports multi-school environments and provides real-time statistics on student availability and pass usage. The vision is to offer a robust, scalable solution for modern school administration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite.
- **UI Components**: Shadcn/ui built on Radix UI primitives.
- **Styling**: Tailwind CSS with custom CSS variables.
- **State Management**: TanStack Query (React Query) for server state.
- **Routing**: Wouter for client-side routing.
- **Forms**: React Hook Form with Zod validation.
- **UI Patterns**: Employs defensive React UI patterns, including guarded rendering, default parameters, async query gates, defensive form handling, and comprehensive loading/error states.

### Backend Architecture
- **Runtime**: Node.js with Express.js.
- **Language**: TypeScript with ESM modules.
- **API Pattern**: RESTful API with consistent `{ok: true, data: T}` or `{ok: false, error: string}` responses.
- **Middleware**: Custom logging, JSON parsing, authentication, and Zod-based request validation.
- **Session Management**: Express-session with PostgreSQL session store, using signed, HttpOnly, SameSite cookies.
- **Error Handling**: Global Express error handler, process-level exception handling, and detailed logging.
- **Environment Validation**: Zod schema validation for all environment variables at startup.
- **Utility Systems**: `invariant`, `unwrap`, `safeNumber`, `safeString` for robust data handling and error prevention.

### Database Design
- **Database**: PostgreSQL via Neon serverless with connection pooling.
- **ORM**: Drizzle ORM with TypeScript schema definitions.
- **Schema**: Supports multi-school environments with tenant isolation. Key tables include `schools`, `users`, `grades`, `students`, `teacher_grade_map`, `passes`, and `kiosk_devices`.
- **Pass Model**: Flexible pass model supporting both legacy (studentName) and structured (studentId) approaches with various pass types (general, discipline, nurse, custom) and comprehensive pass data.
- **Integrity**: Foreign key integrity with cascade delete protection.

### Authentication & Authorization
- **Provider**: Replit OIDC (OpenID Connect) integration using Passport.js.
- **Session Storage**: PostgreSQL-backed sessions with configurable TTL.
- **Security**: HTTP-only cookies, secure flags in production, CSRF protection, and bcrypt password hashing.
- **Authorization**: Role-based access control (e.g., school scope restricted to admin/superadmin roles).

### File Upload & Storage
- **Primary Storage**: Google Cloud Storage.
- **Upload Interface**: Uppy.js for progressive uploads.
- **File Types**: CSV for student roster bulk imports.
- **Processing**: Server-side CSV parsing and validation.

### Development & Deployment
- **Build System**: Vite for frontend, esbuild for backend.
- **TypeScript**: Strict mode enabled.
- **Deployment**: Designed for Replit deployment, single process serving API and static assets in production.
- **Database Migrations**: Drizzle Kit for schema migrations.

## External Dependencies

### Core Infrastructure
- **Database**: Neon PostgreSQL serverless database with `@neondatabase/serverless` driver.
- **Cloud Storage**: Google Cloud Storage for file uploads.
- **Authentication**: Replit OIDC service.

### Key Libraries & Services
- **UI Framework**: Radix UI primitives, Shadcn/ui.
- **Styling**: Tailwind CSS.
- **Data Fetching**: TanStack Query.
- **File Upload**: Uppy ecosystem (`@uppy/core`, `@uppy/dashboard`, `@uppy/aws-s3`).
- **Session Storage**: `connect-pg-simple`.
- **Validation**: Zod.
- **ORM**: Drizzle ORM.
- **Backend Framework**: Express.js.