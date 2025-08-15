# PassPilot - School Pass Management System

## Overview

PassPilot is a comprehensive school pass management system designed for teachers and administrators to efficiently track student passes while maintaining safety and reducing classroom disruptions. The application enables teachers to manage student rosters, issue digital passes for various purposes (bathroom, nurse, office, etc.), and monitor active passes in real-time.

The system features a mobile-first design with a React frontend, Express.js backend, and PostgreSQL database. It includes authentication via Replit's OIDC system, file upload capabilities for roster management, and a kiosk mode for student self-service.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (August 15, 2025)

### Database Schema Migration Completed
- Successfully migrated from complex grade/student model to simplified multi-school architecture
- Implemented 4 core tables: schools, users, kiosk_devices, passes
- Clean migration completed with "run once and forget" approach
- Database connection tested and verified with `SELECT 1;`

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