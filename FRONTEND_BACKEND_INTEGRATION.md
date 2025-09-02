# 🎨 Frontend-Backend Integration Guide

## 📋 Umumiy Ma'lumot

Bu hujjat frontend va backend o'rtasidagi to'liq integration haqida ma'lumot beradi. Frontend allaqachon tayyor - kutubxonalar, layoutlar, login, API'lar va hook'lar mavjud.

## 🔗 Backend API Integration

### Base API Configuration

```typescript
// api/config.ts
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - JWT token qo'shish
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor - Error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired - logout qilish
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);
```

### API Endpoints Mapping

```typescript
// api/endpoints.ts
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  PROFILE: '/auth/profile',
  REFRESH: '/auth/refresh',

  // HR Management
  EMPLOYEES: '/hr',
  EMPLOYEE_BY_ID: (id: string) => `/hr/${id}`,
  BULK_UPDATE: '/hr/bulk-update',
  FINGERPRINTS: '/hr/fingerprints',

  // Computers
  COMPUTERS: '/computers',
  COMPUTER_LOGS: (device: string) => `/computers/${device}/logs`,
  ASSIGN_EMPLOYEE: (device: string) => `/computers/${device}/employee`,

  // Attendance
  CHECK_IN_OUT: '/attendance/check-in-out',
  TODAY_ATTENDANCE: (employeeId: string) => `/attendance/today/${employeeId}`,
  ATTENDANCE_STATS: (employeeId: string) =>
    `/attendance/statistics/${employeeId}`,

  // Upload
  UPLOAD_FILE: '/upload',
  GET_FILES: '/upload',
  DELETE_FILE: (id: string) => `/upload/${id}`,

  // Workplaces
  WORKPLACES: '/workplaces',
  WORKPLACE_BY_ID: (id: string) => `/workplaces/${id}`,
};
```

## 🔐 Authentication Flow

## 🔐 Backend Authentication Integration

### JWT Token Management

```typescript
// Backend JWT Response Format
interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: 'SUPER_ADMIN' | 'ADMIN' | 'HR' | 'EMPLOYEE';
  };
}

// Frontend Token Storage
localStorage.setItem('access_token', response.access_token);
localStorage.setItem('user', JSON.stringify(response.user));
```

### Role-based Access Control

```typescript
// Backend Role Guards
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN, UserRole.HR)
@Post()
createEmployee() { ... }

// Frontend Role Checking
const { user } = useAuth();
const canCreateEmployee = user?.role === 'ADMIN' || user?.role === 'HR';
```

## 📊 Backend Data Models Integration

### Employee Data Structure

```typescript
// Backend Employee Schema
interface Employee {
  _id: ObjectId;
  fullName: string;
  position: string;
  department: string;
  hireDate?: Date;
  birthDate?: Date;
  passportId?: string;
  phones: string[];
  email: string;
  address?: string;
  salary?: number;
  status: 'active' | 'inactive';
  userId?: ObjectId;
  username?: string;
  tempPassword?: string;
}

// Frontend Employee Interface
interface Employee {
  _id: string;
  fullName: string;
  position: string;
  department: string;
  hireDate?: string;
  birthDate?: string;
  passportId?: string;
  phones: string[];
  email: string;
  address?: string;
  salary?: number;
  status: 'active' | 'inactive';
  userId?: string;
  username?: string;
  tempPassword?: string;
}
```

### Computer Data Structure

```typescript
// Backend Computer Schema
interface Computer {
  _id: ObjectId;
  name: string;
  assignedEmployeeId?: ObjectId;
  deviceRealName?: string;
  type?: 'desktop' | 'laptop' | 'server' | 'workstation';
  status: 'active' | 'inactive' | 'maintenance' | 'retired';
}

// Frontend Computer Interface
interface Computer {
  _id: string;
  name: string;
  assignedEmployeeId?: string;
  deviceRealName?: string;
  type?: 'desktop' | 'laptop' | 'server' | 'workstation';
  status: 'active' | 'inactive' | 'maintenance' | 'retired';
}
```

### Attendance Data Structure

```typescript
// Backend Attendance Schema
interface Attendance {
  _id: ObjectId;
  employeeId: ObjectId;
  timestamp: Date;
  type: 'in' | 'out';
  status: 'normal' | 'late' | 'early' | 'overtime' | 'warning';
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    accuracy?: number;
  };
  device?: string;
  notes?: string;
  hasWarning: boolean;
  warningReason?: string;
}

// Frontend Attendance Interface
interface Attendance {
  _id: string;
  employeeId: string;
  timestamp: string;
  type: 'in' | 'out';
  status: 'normal' | 'late' | 'early' | 'overtime' | 'warning';
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    accuracy?: number;
  };
  device?: string;
  notes?: string;
  hasWarning: boolean;
  warningReason?: string;
}
```

## 🔄 Backend API Endpoints Integration

### HR Management APIs

```typescript
// Backend HR Controller Endpoints
POST   /hr                    // Create employee
GET    /hr                    // Get employees list
GET    /hr/:id                // Get employee by ID
PATCH  /hr/:id                // Update employee
DELETE /hr/:id                // Delete employee
PATCH  /hr/bulk-update        // Bulk update employees
DELETE /hr/bulk-delete        // Bulk delete employees
GET    /hr/fingerprints       // Get fingerprints
PATCH  /hr/fingerprints/:id   // Update fingerprint

// Frontend API Functions
export const createEmployee = (data: CreateEmployeeDto) =>
  apiClient.post('/hr', data);

export const getEmployees = (params?: GetEmployeesQueryDto) =>
  apiClient.get('/hr', { params });

export const getEmployee = (id: string) =>
  apiClient.get(`/hr/${id}`);

export const updateEmployee = (id: string, data: UpdateEmployeeDto) =>
  apiClient.patch(`/hr/${id}`, data);

export const deleteEmployee = (id: string) =>
  apiClient.delete(`/hr/${id}`);
```

### Computer Management APIs

```typescript
// Backend Computer Controller Endpoints
GET    /computers                    // Get computers list
PATCH  /computers/:device/employee  // Assign employee to computer
GET    /computers/:device/logs      // Get computer logs
GET    /applications                // Get applications list
GET    /applications/:name          // Get application by name

// Frontend API Functions
export const getComputers = () =>
  apiClient.get('/computers');

export const assignEmployee = (device: string, data: AssignEmployeeDto) =>
  apiClient.patch(`/computers/${device}/employee`, data);

export const getComputerLogs = (device: string, params?: GetLogsQueryDto) =>
  apiClient.get(`/computers/${device}/logs`, { params });

export const getApplications = (params?: { page?: number; limit?: number }) =>
  apiClient.get('/applications', { params });
```

### Attendance Management APIs

```typescript
// Backend Attendance Controller Endpoints
POST   /attendance/check-in-out           // Check in/out
GET    /attendance/today/:employeeId      // Get today's attendance
GET    /attendance                        // Get attendance list
GET    /attendance/statistics/:employeeId // Get attendance statistics
GET    /attendance/reports/daily          // Get daily report
GET    /attendance/reports/weekly         // Get weekly report
GET    /attendance/reports/monthly        // Get monthly report

// Frontend API Functions
export const checkInOut = (data: CheckInOutDto) =>
  apiClient.post('/attendance/check-in-out', data);

export const getTodayAttendance = (employeeId: string) =>
  apiClient.get(`/attendance/today/${employeeId}`);

export const getAttendances = (params?: AttendanceQueryDto) =>
  apiClient.get('/attendance', { params });

export const getAttendanceStatistics = (employeeId: string, params?: { fromDate?: string; toDate?: string }) =>
  apiClient.get(`/attendance/statistics/${employeeId}`, { params });
```

### File Upload APIs

```typescript
// Backend Upload Controller Endpoints
POST   /upload        // Upload file
GET    /upload        // Get files list
GET    /upload/:id    // Get file by ID
DELETE /upload/:id    // Delete file

// Frontend API Functions
export const uploadFile = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const getFiles = (params?: { page?: number; limit?: number; search?: string }) =>
  apiClient.get('/upload', { params });

export const getFile = (id: string) =>
  apiClient.get(`/upload/${id}`);

export const deleteFile = (id: string) =>
  apiClient.delete(`/upload/${id}`);
```

### Workplace Management APIs

```typescript
// Backend Workplace Controller Endpoints
POST   /workplaces        // Create workplace
GET    /workplaces        // Get workplaces list
GET    /workplaces/:id    // Get workplace by ID
PATCH  /workplaces/:id    // Update workplace

// Frontend API Functions
export const createWorkplace = (data: CreateWorkplaceDto) =>
  apiClient.post('/workplaces', data);

export const getWorkplaces = (params?: { page?: number; limit?: number; search?: string; status?: string; type?: string }) =>
  apiClient.get('/workplaces', { params });

export const getWorkplace = (id: string) =>
  apiClient.get(`/workplaces/${id}`);

export const updateWorkplace = (id: string, data: UpdateWorkplaceDto) =>
  apiClient.patch(`/workplaces/${id}`, data);
```

## 🔄 Real-time Backend Integration

### WebSocket Events

```typescript
// Backend WebSocket Events
interface WebSocketEvents {
  'attendance.check-in': {
    employeeId: string;
    employeeName: string;
    type: 'in' | 'out';
    timestamp: string;
  };
  'log.created': {
    device: string;
    application: string;
    action: string;
    timestamp: string;
  };
  'employee.created': {
    employeeId: string;
    employeeName: string;
    department: string;
  };
}

// Frontend WebSocket Integration
const { socket } = useWebSocket('ws://localhost:3000');

useEffect(() => {
  if (socket) {
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'attendance.check-in':
          toast.info(`${data.employeeName} checked ${data.type}`);
          queryClient.invalidateQueries({ queryKey: ['attendance'] });
          break;
        case 'log.created':
          queryClient.invalidateQueries({ queryKey: ['logs'] });
          break;
        case 'employee.created':
          toast.success(`New employee: ${data.employeeName}`);
          queryClient.invalidateQueries({ queryKey: ['employees'] });
          break;
      }
    };
  }
}, [socket, queryClient]);
```

## 📊 Backend Data Validation Integration

### DTO Validation

```typescript
// Backend DTOs
export class CreateEmployeeDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  position: string;

  @IsString()
  @IsNotEmpty()
  department: string;

  @IsEmail()
  email: string;

  @IsArray()
  @IsString({ each: true })
  phones: string[];

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsNumber()
  salary?: number;
}

// Frontend Form Validation
const schema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  position: z.string().min(1, 'Position is required'),
  department: z.string().min(1, 'Department is required'),
  email: z.string().email('Invalid email format'),
  phones: z.array(z.string().min(1, 'Phone number is required')),
  address: z.string().optional(),
  salary: z.number().min(0, 'Salary must be positive').optional(),
});
```

## 🎯 Backend Error Handling Integration

### Backend Error Responses

```typescript
// Backend Error Response Format
interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}

// Frontend Error Handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      // Forbidden - show access denied message
      toast.error('Access denied');
    } else if (error.response?.status === 404) {
      // Not found
      toast.error('Resource not found');
    } else if (error.response?.status >= 500) {
      // Server error
      toast.error('Server error occurred');
    } else {
      // Other errors
      const message = error.response?.data?.message || 'An error occurred';
      toast.error(Array.isArray(message) ? message.join(', ') : message);
    }
    return Promise.reject(error);
  },
);
```

## 🎉 Backend Integration Xulosa

Backend va frontend o'rtasida to'liq integration mavjud:

✅ **Authentication** - JWT token, role-based access  
✅ **Data Models** - TypeScript interfaces, validation  
✅ **API Endpoints** - RESTful APIs, error handling  
✅ **Real-time** - WebSocket events, live updates  
✅ **File Upload** - Multipart form data, progress tracking  
✅ **Data Validation** - DTOs, form validation  
✅ **Error Handling** - Comprehensive error responses  
✅ **Pagination** - Query parameters, response format  
✅ **Search & Filter** - Advanced querying capabilities  
✅ **Bulk Operations** - Mass data operations

Backend production-ready va frontend bilan perfect integration qilingan!
