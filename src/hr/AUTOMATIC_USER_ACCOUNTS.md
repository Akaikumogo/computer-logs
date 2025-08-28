# 🔐 Automatic User Account Creation for HR Employees

## Overview

When creating a new employee through the HR module, the system now automatically:

1. **Creates an employee record** in the database
2. **Generates a user account** with username and password
3. **Links the employee** to their user account
4. **Returns credentials** for immediate use

## 🚀 New Features

### 1. Automatic User Account Creation

- **Username generation**: Converts full name to username format (e.g., "Sarvarbek Xazratov" → "sarvarbek.xazratov.123")
- **Password generation**: Creates random 8-character secure passwords
- **User role**: Automatically assigns `USER` role to new employees
- **Account linking**: Links employee record with user account via `userId`

### 2. New API Endpoints

#### Create Employee with User Account

```http
POST /hr
Content-Type: application/json

{
  "fullName": "Sarvarbek Xazratov",
  "position": "Frontend Developer",
  "department": "IT Department",
  "email": "sarvarbek@example.com",
  "phones": ["+998901234567"]
}
```

**Response includes:**

```json
{
  "_id": "employee_id",
  "fullName": "Sarvarbek Xazratov",
  "position": "Frontend Developer",
  "department": "IT Department",
  "email": "sarvarbek@example.com",
  "phones": ["+998901234567"],
  "userId": "user_account_id",
  "username": "sarvarbek.xazratov.123",
  "tempPassword": "Ax7Kp9mN",
  "userAccount": {
    "username": "sarvarbek.xazratov.123",
    "password": "Ax7Kp9mN",
    "message": "Employee account created successfully. Please change password on first login."
  }
}
```

#### Get Employee Credentials

```http
GET /hr/{employeeId}/credentials
```

**Response:**

```json
{
  "employeeId": "employee_id",
  "fullName": "Sarvarbek Xazratov",
  "username": "sarvarbek.xazratov.123",
  "email": "sarvarbek@example.com",
  "hasTempPassword": true,
  "note": "Employee has temporary password that should be changed on login"
}
```

#### Reset Employee Password

```http
PATCH /hr/{employeeId}/reset-password
```

**Response:**

```json
{
  "message": "Password reset successfully",
  "username": "sarvarbek.xazratov.123",
  "newPassword": "Kj8mN2pQ",
  "note": "Please change password on next login"
}
```

## 🔧 Technical Implementation

### Database Schema Updates

The `Employee` schema now includes:

```typescript
// User account linking
userId?: MongooseSchema.Types.ObjectId | null;  // Reference to User
username?: string;                               // Generated username
tempPassword?: string;                           // Temporary password
```

### Service Methods

- `generateUsername(fullName: string)`: Creates unique usernames
- `generatePassword()`: Generates secure random passwords
- `createEmployee(dto)`: Creates employee + user account
- `getEmployeeCredentials(id)`: Retrieves credential info
- `resetEmployeePassword(id)`: Resets employee password

### Error Handling

- **Rollback**: If user creation fails, employee is deleted
- **Validation**: Checks for existing emails/passport IDs
- **User linking**: Ensures employee has user account before operations

## 📋 Usage Workflow

### 1. Create New Employee

```typescript
// HR creates employee
const employee = await hrService.createEmployee({
  fullName: 'John Doe',
  position: 'Developer',
  department: 'IT',
  email: 'john@company.com',
  phones: ['+998901234567'],
});

// System automatically:
// - Creates employee record
// - Generates username (john.doe.456)
// - Generates password (Ax7Kp9mN)
// - Creates user account
// - Links employee to user
// - Returns credentials
```

### 2. Employee Login

```typescript
// Employee can immediately login with:
const login = await authService.login({
  username: 'john.doe.456',
  password: 'Ax7Kp9mN',
});
```

### 3. Password Management

```typescript
// HR can reset password if needed
const reset = await hrService.resetEmployeePassword(employeeId);
// Returns new temporary password
```

## 🔒 Security Features

- **Unique usernames**: Random suffixes prevent conflicts
- **Secure passwords**: 8-character random alphanumeric
- **Temporary passwords**: Employees must change on first login
- **Account linking**: Secure reference between employee and user
- **Rollback protection**: Failed user creation doesn't leave orphaned employees

## 🎯 Benefits

1. **Streamlined onboarding**: No manual user account creation needed
2. **Immediate access**: Employees can login right after creation
3. **Centralized management**: All employee accounts managed through HR
4. **Audit trail**: Clear link between employee and user records
5. **Password security**: Temporary passwords with change requirement

## 🚨 Important Notes

- **First login**: Employees must change temporary password
- **Username format**: `firstname.lastname.randomnumber`
- **Password complexity**: 8 characters, alphanumeric
- **Account linking**: Employee deletion should consider user account cleanup
- **Role assignment**: All employees get `USER` role by default

## 🔄 Future Enhancements

- **Custom roles**: Allow HR to assign specific user roles
- **Bulk creation**: Create multiple employees with accounts
- **Email notifications**: Send credentials via email
- **Password policies**: Configurable password requirements
- **Account expiration**: Set expiration dates for temporary accounts
