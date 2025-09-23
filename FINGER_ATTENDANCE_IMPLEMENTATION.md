# Finger-based Attendance System Implementation

## Overview

This document describes the implementation of a finger-based attendance system that allows employees to check in/out using their finger number instead of employee ID.

## Key Changes Made

### 1. Employee Schema Updates

- Added `fingerNumber` field to Employee schema as optional and unique
- Field type: `string`
- Validation: Optional, unique when provided

### 2. New API Endpoint

**POST** `/schedule/attendance/checkinout`

#### Request Body:

```json
{
  "fingerNumber": "12345",
  "location": "Bosh Ofis",
  "device": "Fingerprint Scanner",
  "notes": "Barmoq orqali kirish"
}
```

#### Response:

```json
{
  "id": "attendance_id",
  "employeeId": "employee_id",
  "employeeName": "Sarvarbek Xazratov",
  "timestamp": "2025-01-10T15:30:00.000Z",
  "type": "in", // or "out"
  "status": "normal", // or "late", "early", "overtime"
  "location": {
    "latitude": 41.3111,
    "longitude": 69.2797,
    "address": "Toshkent sh., Yunusobod tumani",
    "accuracy": 100
  },
  "device": "Fingerprint Scanner",
  "notes": "Barmoq orqali kirish",
  "hasWarning": false,
  "fingerNumber": "12345"
}
```

### 3. Automatic IN/OUT Logic

The system automatically determines whether it's a check-in or check-out based on the last attendance record:

- **First record of the day** → **IN** (check-in)
- **Last record was IN** → **OUT** (check-out)
- **Last record was OUT** → **IN** (check-in)

### 4. Employee Management Updates

#### Create Employee (POST /hr)

```json
{
  "fullName": "Sarvarbek Xazratov",
  "position": "Developer",
  "department": "IT",
  "tabRaqami": "EMP001",
  "fingerNumber": "12345" // Optional field
}
```

#### Update Employee (PATCH /hr/:id)

```json
{
  "fingerNumber": "12345" // Optional field
}
```

#### Employee Response

```json
{
  "_id": "employee_id",
  "fullName": "Sarvarbek Xazratov",
  "position": "Developer",
  "department": "IT",
  "tabRaqami": "EMP001",
  "fingerNumber": "12345" // New field
  // ... other fields
}
```

## Frontend Integration Guide

### 1. Employee Creation Form

Add a new optional field for finger number:

```jsx
<FormField
  name="fingerNumber"
  label="Barmoq raqami"
  placeholder="12345"
  type="text"
  optional
/>
```

### 2. Employee Update Form

Include finger number in the update form:

```jsx
<FormField
  name="fingerNumber"
  label="Barmoq raqami"
  placeholder="12345"
  type="text"
  optional
/>
```

### 3. Attendance Check-in/out Interface

Create a new interface for finger-based attendance:

```jsx
const FingerAttendanceForm = () => {
  const [formData, setFormData] = useState({
    fingerNumber: '',
    location: '',
    device: '',
    notes: '',
  });

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/schedule/attendance/checkinout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.type === 'in') {
        showSuccess(`Xodim ${result.employeeName} kirdi`);
      } else {
        showSuccess(`Xodim ${result.employeeName} chiqdi`);
      }
    } catch (error) {
      showError('Xatolik yuz berdi');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Barmoq raqami"
        value={formData.fingerNumber}
        onChange={(e) =>
          setFormData({ ...formData, fingerNumber: e.target.value })
        }
        required
      />
      <select
        value={formData.location}
        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
        required
      >
        <option value="">Location tanlang</option>
        <option value="Bosh Ofis">Bosh Ofis</option>
        <option value="Filial 1">Filial 1</option>
      </select>
      <input
        type="text"
        placeholder="Qurilma"
        value={formData.device}
        onChange={(e) => setFormData({ ...formData, device: e.target.value })}
      />
      <textarea
        placeholder="Izohlar"
        value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
      />
      <button type="submit">Kirish/Chiqish</button>
    </form>
  );
};
```

### 4. Employee List Updates

Display finger number in employee lists:

```jsx
const EmployeeCard = ({ employee }) => (
  <div className="employee-card">
    <h3>{employee.fullName}</h3>
    <p>Lavozim: {employee.position}</p>
    <p>Bo'lim: {employee.department}</p>
    <p>Tab raqami: {employee.tabRaqami}</p>
    {employee.fingerNumber && <p>Barmoq raqami: {employee.fingerNumber}</p>}
  </div>
);
```

### 5. Attendance History

Show finger-based attendance in history:

## Error Handling

### Common Error Responses

1. **Finger number not found (404)**

```json
{
  "statusCode": 404,
  "message": "Barmoq raqami topilmadi",
  "error": "Not Found"
}
```

2. **Location not found (400)**

```json
{
  "statusCode": 400,
  "message": "Location topilmadi",
  "error": "Bad Request"
}
```

## Status Types

- `normal` - Normal check-in/out time
- `late` - Checked in after 9:00 AM
- `early` - Checked out before 6:00 PM
- `overtime` - Checked out after 6:00 PM

## Location Requirements

The system requires valid location names that exist in the database. Common locations:

- "Bosh Ofis"
- "Filial 1"
- "Filial 2"
- etc.

## Security Considerations

1. **Authentication**: All endpoints require valid JWT token
2. **Validation**: Finger numbers are validated on both frontend and backend
3. **Unique constraint**: Finger numbers must be unique across all employees
4. **Location validation**: Only valid locations are accepted

## Testing

### Test Scenarios

1. **Create employee with finger number**
2. **Update employee finger number**
3. **Check-in with valid finger number**
4. **Check-out with valid finger number**
5. **Check-in with invalid finger number (should return 404)**
6. **Check-in with invalid location (should return 400)**

### Sample Test Data

```json
{
  "employees": [
    {
      "fullName": "Sarvarbek Xazratov",
      "position": "Developer",
      "department": "IT",
      "tabRaqami": "EMP001",
      "fingerNumber": "12345"
    },
    {
      "fullName": "Aziza Karimova",
      "position": "Designer",
      "department": "IT",
      "tabRaqami": "EMP002",
      "fingerNumber": "12346"
    }
  ],
  "locations": ["Bosh Ofis", "Filial 1", "Filial 2"]
}
```

## Migration Notes

- Existing employees without finger numbers can still use the old check-in/out system
- Finger number is optional - employees can be created without it
- The system supports both old (employee ID) and new (finger number) attendance methods
- No data migration is required - the system is backward compatible

## API Endpoints Summary

| Method | Endpoint                          | Description                                  |
| ------ | --------------------------------- | -------------------------------------------- |
| POST   | `/schedule/attendance/checkinout` | Finger-based check-in/out                    |
| POST   | `/hr`                             | Create employee (with optional fingerNumber) |
| PATCH  | `/hr/:id`                         | Update employee (with optional fingerNumber) |
| GET    | `/hr/:id`                         | Get employee (includes fingerNumber)         |
| GET    | `/hr`                             | List employees (includes fingerNumber)       |

## Conclusion

The finger-based attendance system provides a more convenient and secure way for employees to check in and out. The system automatically determines whether it's a check-in or check-out based on the employee's last attendance record, making it user-friendly and reducing errors.

The implementation is backward compatible and doesn't affect existing functionality, allowing for a smooth transition to the new system.
