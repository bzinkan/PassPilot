# PassPilot - School Pass Management System

## Overview

PassPilot is a comprehensive school pass management system designed for teachers and administrators to efficiently track student passes while maintaining safety and reducing classroom disruptions. The application enables teachers to manage student rosters, issue digital passes for various purposes (bathroom, nurse, office, etc.), and monitor active passes in real-time.

The system features a mobile-first design with a React frontend, Express.js backend, and PostgreSQL database. It includes authentication via Replit's OIDC system, file upload capabilities for roster management, and a kiosk mode for student self-service.

## User Preferences

Preferred communication style: Simple, everyday language.

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
- **Schema Structure**:
  - Users table for teacher authentication and profiles
  - Grades table for class/grade level organization
  - Students table with optional student ID and grade association
  - Pass types table for customizable pass categories (bathroom, nurse, office, etc.)
  - Passes table tracking issued passes with timestamps and return status
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