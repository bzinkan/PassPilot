# PassPilot - School Pass Management System

## Overview

PassPilot is a comprehensive school pass management system designed for teachers and administrators to efficiently track student passes while maintaining safety and reducing classroom disruptions. The application enables teachers to manage student rosters, issue digital passes for various purposes (bathroom, nurse, office, etc.), and monitor active passes in real-time.

The system features a mobile-first design with a React frontend, Express.js backend, and PostgreSQL database. It includes authentication via Replit's OIDC system, file upload capabilities for roster management, and a kiosk mode for student self-service.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (August 15, 2025)

### New Slim Architecture Implementation Completed
- **Complete Restart**: Implemented fresh PassPilot architecture with clean cookie-based authentication system
- **Simplified Database Schema**: Successfully migrated to 4-table structure with serial integer IDs (schools, users, kiosk_devices, passes)
- **Cookie Authentication**: Replaced complex OIDC with secure signed cookie sessions using bcrypt password hashing
- **Modular Service Layer**: Created dedicated services for users, schools, and passes with proper separation of concerns
- **Route Structure**: Organized into public, auth, admin, passes, and kiosk route modules with appropriate middleware
- **Rate Limiting**: Built-in protection for authentication endpoints and kiosk functionality
- **Error Handling**: Comprehensive async error handlers with monitoring integration hooks
- **Database Seeding**: Working seed script creates demo school with admin, teacher, and superadmin accounts
- **Full API Testing**: All endpoints verified working - authentication, pass creation/management, admin functions

### Architectural Decisions Made
- **Session Management**: Signed cookies with HttpOnly, SameSite, and environment-appropriate secure flags
- **Authentication Flow**: POST /login with email/password/schoolId → secure session cookie → middleware validation
- **Database IDs**: Serial integers for performance and simplicity vs previous UUID approach  
- **Multi-school Support**: All operations scoped by schoolId with tenant isolation at database level
- **Kiosk Mode**: Separate authentication flow for student self-service terminals
- **API Consistency**: All endpoints return `{ok: true}` or `{error: "message"}` format for consistent client handling

## Recent Changes (August 15, 2025) - ARCHIVED

### Database Schema Migration Completed
- Successfully migrated from complex grade/student model to simplified multi-school architecture
- Implemented 4 core tables: schools, users, kiosk_devices, passes
- Clean migration completed with "run once and forget" approach
- Database connection tested and verified with `SELECT 1;`

### Database Schema Hardening Completed
- **NOT NULL Constraints**: Added NOT NULL constraints to all essential fields (created_at, updated_at, active, core required fields)
- **Cascade Deletes**: Implemented proper CASCADE DELETE relationships for referential integrity
- **Sane Defaults**: Applied sensible defaults for boolean fields (active=true) and timestamps (defaultNow())
- **Unique Constraints**: Added unique constraint on kiosk device tokens for security
- **Multi-school Isolation**: Required schoolId for all user operations ensuring data separation
- **Authentication Fixed**: Added getDefaultSchool() method and proper school assignment in auth flow
- **TypeScript Compliance**: Resolved all server-side TypeScript errors with strict null checking

### Simplified Architecture
- Removed complex grade/student management in favor of simple student name field in passes
- Pass creation now only requires student name and reason (Bathroom, Nurse, Office, Water, Other)
- Multi-school support enabled with schoolId foreign keys
- Kiosk mode support with device token authentication

### Strict TypeScript Configuration Implemented
- Implemented ruthless null checking with strict compiler options
- Added noUncheckedIndexedAccess, exactOptionalPropertyTypes, noImplicitReturns
- Updated all server and client code to handle strict null checking
- Added "npm run check" script for TypeScript compilation checking
- Fixed all storage methods to properly handle undefined returns
- Added explicit Promise<void> return types for Express route handlers

### Environment Validation System
- Created server/env.ts with Zod schema validation for all environment variables
- Validates required variables: DATABASE_URL, SESSION_SECRET, REPL_ID, REPLIT_DOMAINS
- Checks SESSION_SECRET minimum length (32 characters) for security
- Validates DATABASE_URL format and PostgreSQL connection details
- Fails fast at startup with clear error messages if any variables are missing
- Includes helper functions for auth and database environment configuration
- Prevents deployment issues by catching configuration problems early

### Runtime Request Validation System (August 15, 2025)
- **Zod Schema Definitions**: Created server/schemas.ts with comprehensive validation schemas for all API endpoints
- **Type-Safe Validation Middleware**: Implemented server/validate.ts middleware that validates request body, query params, and URL params
- **Guaranteed Non-Null Data**: All routes now use req.valid object containing validated, non-null data after middleware processing
- **Comprehensive Error Handling**: Invalid requests return structured 400 responses with detailed field-level error information
- **TypeScript Integration**: Extended Express Request interface with type definitions for validated data access
- **Complete API Protection**: All routes protected with appropriate validation schemas preventing invalid data from reaching handlers
- **Health Check Endpoint**: Added /api/health for system monitoring and deployment verification

### Edge Protection Utility System (August 15, 2025)
- **Invariant Function**: Guards assumptions with immediate throws when conditions fail
- **Unwrap Function**: Safely extracts non-null values with descriptive error messages  
- **Safe Parsing**: Added safeNumber and safeString utilities for robust type conversion
- **Null Coalescence**: Implemented ?? operator pattern for 0 and "" value preservation vs ||
- **Route Hardening**: Updated storage methods and route handlers to use edge protection utilities
- **Explicit Error Messages**: All utility functions provide clear, actionable error messages for debugging

### Consistent API Response System (August 15, 2025)
- **Uniform Response Shape**: All API endpoints return consistent `{ ok: true, data: T }` or `{ ok: false, error: string }` format
- **Type-Safe Response Utilities**: Created ok() and err() helper functions for consistent response creation
- **Validation Error Integration**: Validation errors maintain consistent shape with detailed field-level error information
- **Shared Type Definitions**: Added shared/api.ts with TypeScript types and helper functions for frontend consumption
- **Response Type Guards**: Implemented isApiSuccess() and isApiError() functions for safe response handling
- **Error Handling Helper**: Added handleApiResponse() utility for streamlined error processing in frontend code

### Comprehensive Error Monitoring System (August 15, 2025)
- **Global Express Error Handler**: Catches all unhandled errors with enhanced logging and consistent JSON responses
- **Process-Level Exception Handling**: Monitors uncaught exceptions and unhandled promise rejections for null reference errors
- **Production Monitoring Integration**: Ready-to-use Sentry, Discord, and Slack webhook integrations for immediate error alerts
- **Enhanced Error Logging**: Detailed context logging including request data, user ID, stack traces, and timestamps
- **Monitoring Utilities**: Created server/monitoring.ts with comprehensive error reporting functions
- **Early Null Detection**: System designed to catch and report null reference errors before they cause application crashes
- **Development vs Production**: Different error detail exposure levels for security while maintaining debugging capabilities

### Defensive React UI Patterns (August 15, 2025)
- **Never Render Until Data Exists**: All components guard against undefined/null data with proper fallbacks and empty states
- **Default Parameters Pattern**: Every component provides safe defaults for arrays, objects, and primitive props
- **Async Query Gates**: Loading states, error handling, and null checks before rendering any data-dependent content
- **Defensive Form Handling**: Form components with Zod validation, safe defaults, and proper submission state management
- **Layered Data Dependencies**: Page components structured with authentication → school data → content rendering layers
- **Comprehensive Loading States**: Skeleton components for every data type (lists, cards, stats) with consistent styling
- **Error Boundaries**: ErrorView and EmptyState components for graceful failure and empty data scenarios
- **Type-Safe Data Fetching**: Query client updated to handle consistent API responses with proper TypeScript integration

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation through @hookform/resolvers

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful API with conventional HTTP methods
- **Middleware**: Custom logging, JSON parsing, and authentication middleware
- **Session Management**: Express-session with PostgreSQL session store
- **File Processing**: CSV parsing for bulk student roster uploads

### Database Design
- **Database**: PostgreSQL via Neon serverless with connection pooling
- **ORM**: Drizzle ORM with TypeScript schema definitions
- **Schema Structure** (Updated August 15, 2025):
  - Schools table with multi-school support (id, name, seatsAllowed, active)
  - Users table for teacher/admin authentication with school association (id, email, passwordHash, role, schoolId, active)
  - Kiosk devices table for student self-service stations (id, schoolId, room, pinHash, token, active)
  - Passes table for simplified pass tracking (id, studentName, reason, issuedByUserId, schoolId, status, startsAt, endsAt)
  - Sessions table for authentication session persistence

### Authentication & Authorization
- **Provider**: Replit OIDC (OpenID Connect) integration
- **Strategy**: Passport.js with openid-client for OIDC handling
- **Session Storage**: PostgreSQL-backed sessions with configurable TTL
- **Security**: HTTP-only cookies, secure flags in production, CSRF protection

### File Upload & Storage
- **Primary Storage**: Google Cloud Storage integration via @google-cloud/storage
- **Upload Interface**: Uppy.js for progressive file uploads with drag-and-drop
- **File Types**: CSV support for student roster bulk imports
- **Processing**: Server-side CSV parsing and validation before database insertion

### Development & Build Tools
- **Build System**: Vite for frontend with esbuild for backend bundling
- **Development**: Hot module replacement (HMR) with Vite dev server
- **TypeScript**: Strict mode enabled with path mapping for clean imports
- **Code Quality**: ESLint integration (implied by standard React/TS setup)

### Deployment Architecture
- **Environment**: Designed for Replit deployment with environment-based configuration
- **Static Assets**: Vite builds to dist/public for production serving
- **Process Management**: Single process serving both API and static assets in production
- **Database Migrations**: Drizzle Kit for schema migrations and database pushes

## External Dependencies

### Core Infrastructure
- **Database**: Neon PostgreSQL serverless database with @neondatabase/serverless driver
- **Cloud Storage**: Google Cloud Storage for file uploads and asset management
- **Authentication**: Replit OIDC service for user authentication and session management

### Key Libraries & Services
- **UI Framework**: Radix UI primitives for accessible component foundations
- **Styling**: Tailwind CSS for utility-first styling approach
- **Data Fetching**: TanStack Query for server state synchronization and caching
- **File Upload**: Uppy ecosystem (@uppy/core, @uppy/dashboard, @uppy/aws-s3) for robust file handling
- **Session Storage**: connect-pg-simple for PostgreSQL session persistence
- **Validation**: Zod schema validation library for type-safe data validation
- **Development**: Replit-specific plugins for enhanced development experience

### API Integrations
- **Authentication Flow**: Replit OIDC discovery and token validation
- **File Storage**: Google Cloud Storage APIs for file upload and retrieval
- **Database Operations**: Direct PostgreSQL connection with connection pooling for performance