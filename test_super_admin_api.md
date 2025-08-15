# Super Admin API Testing Guide

## Overview
The Super Admin API provides cross-tenant administrative capabilities for PassPilot, allowing super administrators to manage schools, users, and audit logs across all tenants.

## Setup Requirements

### Environment Variables
```bash
SA_BOOTSTRAP_SECRET=your_secret_key_here
```

## API Endpoints

### 1. Bootstrap Super Admin (One-time setup)
```bash
# Create the first superadmin user
curl -X POST http://localhost:5000/sa/bootstrap \
  -H "Content-Type: application/json" \
  -H "x-bootstrap-secret: your_secret_key_here" \
  -d '{
    "email": "admin@example.com",
    "password": "securePassword123"
  }'
```

**Notes:**
- Only works when no superadmin exists
- Requires SA_BOOTSTRAP_SECRET header
- Creates a placeholder school for the superadmin
- Automatically signs in the new superadmin

### 2. School Management

#### List All Schools
```bash
curl -X GET http://localhost:5000/sa/schools \
  -H "Cookie: pp_sess=<session_token>"
```

#### Create New School
```bash
curl -X POST http://localhost:5000/sa/schools \
  -H "Content-Type: application/json" \
  -H "Cookie: pp_sess=<session_token>" \
  -d '{
    "name": "Lincoln Elementary",
    "seatsAllowed": 100
  }'
```

#### Update School Settings
```bash
curl -X PATCH http://localhost:5000/sa/schools/123 \
  -H "Content-Type: application/json" \
  -H "Cookie: pp_sess=<session_token>" \
  -d '{
    "seatsAllowed": 150,
    "active": true
  }'
```

### 3. User Management

#### List Users by School
```bash
curl -X GET http://localhost:5000/sa/users?schoolId=123 \
  -H "Cookie: pp_sess=<session_token>"
```

#### Create User with Password
```bash
curl -X POST http://localhost:5000/sa/users \
  -H "Content-Type: application/json" \
  -H "Cookie: pp_sess=<session_token>" \
  -d '{
    "email": "teacher@school.edu",
    "role": "teacher",
    "schoolId": 123,
    "password": "tempPassword123"
  }'
```

#### Create User with Invite (Preferred)
```bash
curl -X POST http://localhost:5000/sa/users \
  -H "Content-Type: application/json" \
  -H "Cookie: pp_sess=<session_token>" \
  -d '{
    "email": "admin@school.edu",
    "role": "admin",
    "schoolId": 123
  }'
```

#### Promote User
```bash
curl -X POST http://localhost:5000/sa/users/456/promote \
  -H "Content-Type: application/json" \
  -H "Cookie: pp_sess=<session_token>" \
  -d '{
    "role": "admin"
  }'
```

#### Demote User
```bash
curl -X POST http://localhost:5000/sa/users/456/demote \
  -H "Content-Type: application/json" \
  -H "Cookie: pp_sess=<session_token>" \
  -d '{
    "role": "teacher"
  }'
```

#### Toggle User Active Status
```bash
curl -X PATCH http://localhost:5000/sa/users/456/active \
  -H "Content-Type: application/json" \
  -H "Cookie: pp_sess=<session_token>" \
  -d '{
    "active": false
  }'
```

### 4. Audit Logs

#### Get Recent Audits for School
```bash
curl -X GET "http://localhost:5000/sa/audits?schoolId=123&limit=50" \
  -H "Cookie: pp_sess=<session_token>"
```

## Security Features

- **Role Protection**: All `/sa/*` endpoints require superadmin role
- **Bootstrap Security**: Bootstrap endpoint requires secret header and only works once
- **Session-based Authentication**: Uses signed cookie sessions
- **Cross-tenant Access**: Superadmins can manage users across all schools

## Response Formats

### Success Response
```json
{
  "ok": true,
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "error": "Error message"
}
```

## Testing Workflow

1. **Initial Setup**: Set SA_BOOTSTRAP_SECRET environment variable
2. **Bootstrap**: Create first superadmin via `/sa/bootstrap`
3. **Session**: Use returned session for subsequent requests
4. **Management**: Create schools, manage users, view audits
5. **Monitoring**: Check audit logs for administrative actions