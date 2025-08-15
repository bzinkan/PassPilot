# PassPilot - Slim Architecture

A streamlined school pass management system with cookie-based authentication and modular architecture.

## Quick Start

1. **Database Setup**
   ```bash
   npm run db:push  # Apply database schema
   tsx src/scripts/seed.ts  # Create demo data
   ```

2. **Start Server**
   ```bash
   npm run dev
   ```

3. **Test Authentication**
   ```bash
   # Login as admin
   curl -X POST http://localhost:5000/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@demo.edu","password":"admin123","schoolId":1}' \
     -c cookies.txt

   # Check session
   curl -X GET http://localhost:5000/me -b cookies.txt
   ```

## API Endpoints

### Authentication
- `POST /login` - Login with email/password/schoolId
- `POST /logout` - Clear session  
- `GET /me` - Get current user session

### Pass Management
- `GET /passes` - List active passes (requires auth)
- `POST /passes` - Create new pass (requires auth)
- `PATCH /passes/:id/return` - Return a pass (requires auth)

### Admin Functions
- `POST /admin/schools` - Create new school (admin only)
- `POST /admin/users` - Create new user (admin only)

### Kiosk Mode
- `POST /kiosk/login` - Kiosk authentication
- `POST /kiosk/passes` - Create pass from kiosk
- `GET /kiosk/passes/active` - List active passes from kiosk

## Database Schema

- **schools**: id, name, seatsAllowed, active, createdAt
- **users**: id, email, passwordHash, role, schoolId, active, createdAt  
- **kiosk_devices**: id, schoolId, room, pinHash, token, active, createdAt
- **passes**: id, studentName, reason, issuedByUserId, schoolId, status, startsAt, endsAt

## Demo Accounts

- **Admin**: admin@demo.edu / admin123
- **Teacher**: teacher@demo.edu / teacher123  
- **Super Admin**: sa@passpilot.io / super123
- **School ID**: 1

## Architecture

- **Authentication**: Signed cookie sessions with bcrypt
- **Database**: PostgreSQL with Drizzle ORM
- **Services**: Modular user, school, and pass services
- **Middleware**: Rate limiting, async error handling, role-based access
- **Multi-tenant**: All operations scoped by schoolId