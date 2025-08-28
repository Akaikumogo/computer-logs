# Authentication System

This module provides a complete JWT-based authentication system for the NestJS application with role-based authorization.

## Features

- ✅ JWT-based authentication
- ✅ User registration and login
- ✅ Password hashing with bcrypt
- ✅ Role-based authorization (ADMIN, HR, USER)
- ✅ Protected routes with guards
- ✅ Swagger API documentation
- ✅ MongoDB integration with Mongoose

## Installation

The required dependencies are already installed:

```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt passport-local bcryptjs @nestjs/config
npm install -D @types/bcryptjs @types/passport-jwt @types/passport-local
```

## Configuration

Create a `.env` file in your project root:

```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
MONGODB_URI=your-mongodb-connection-string
PORT=3000
NODE_ENV=development
```

## API Endpoints

### Authentication

| Method | Endpoint         | Description         | Auth Required |
| ------ | ---------------- | ------------------- | ------------- |
| POST   | `/auth/register` | Register a new user | No            |
| POST   | `/auth/login`    | Login user          | No            |
| GET    | `/auth/profile`  | Get user profile    | Yes (JWT)     |

### Request/Response Examples

#### Register User

```bash
POST /auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

#### Login User

```bash
POST /auth/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "password123"
}
```

#### Get Profile (Protected Route)

```bash
GET /auth/profile
Authorization: Bearer <jwt-token>
```

## Usage in Controllers

### Basic Authentication

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('example')
export class ExampleController {
  @Get('protected')
  @UseGuards(JwtAuthGuard)
  async protectedRoute(@CurrentUser() user: any) {
    return { message: 'This is protected', user };
  }
}
```

### Role-based Authorization

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  @Get('dashboard')
  @Roles(UserRole.ADMIN)
  async adminDashboard() {
    return { message: 'Admin dashboard' };
  }

  @Get('hr-data')
  @Roles(UserRole.HR, UserRole.ADMIN)
  async hrData() {
    return { message: 'HR data accessible to HR and Admin' };
  }
}
```

## Guards

### JwtAuthGuard

Protects routes requiring JWT authentication.

### LocalAuthGuard

Used for username/password authentication (login endpoint).

### RolesGuard

Enforces role-based access control. Must be used with `@Roles()` decorator.

## Decorators

### @Roles(...roles: UserRole[])

Specifies which roles can access a route.

### @CurrentUser()

Extracts the authenticated user from the request.

## User Roles

- `ADMIN`: Full access to all features
- `HR`: Access to HR-related features
- `USER`: Basic user access

## Security Features

- Passwords are hashed using bcrypt with salt rounds of 10
- JWT tokens expire after 24 hours
- User accounts can be deactivated
- Unique constraints on username and email
- Input validation using class-validator

## Testing the API

1. Start your application
2. Use Swagger UI at `/api` to test endpoints
3. Register a new user
4. Login to get a JWT token
5. Use the token in the Authorization header for protected routes

## Example Protected Route

```typescript
@Get('computers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
async getComputers(@CurrentUser() user: any) {
  // user object contains: id, username, email, role
  return this.computerService.findAll();
}
```

## Error Handling

The system provides proper error responses:

- `401 Unauthorized`: Invalid credentials or missing token
- `403 Forbidden`: Insufficient role permissions
- `409 Conflict`: Username or email already exists
- `400 Bad Request`: Validation errors

## Environment Variables

| Variable         | Description                | Default                                               |
| ---------------- | -------------------------- | ----------------------------------------------------- |
| `JWT_SECRET`     | Secret key for JWT signing | `your-super-secret-jwt-key-change-this-in-production` |
| `JWT_EXPIRES_IN` | JWT token expiration time  | `24h`                                                 |
| `MONGODB_URI`    | MongoDB connection string  | Your current MongoDB URI                              |
| `PORT`           | Application port           | `3000`                                                |
| `NODE_ENV`       | Environment                | `development`                                         |
