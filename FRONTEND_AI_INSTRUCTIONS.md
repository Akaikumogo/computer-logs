# Frontend AI Instructions - Finger Attendance System

## Quick Summary

We've implemented a finger-based attendance system. Here are the key changes for frontend development:

## 1. New API Endpoint

**POST** `/schedule/attendance/checkinout` (NO AUTHENTICATION REQUIRED)

### Request:

```json
{
  "fingerNumber": "12345",
  "location": "Bosh Ofis",
  "device": "Fingerprint Scanner",
  "notes": "Barmoq orqali kirish"
}
```

**Note**: This endpoint does NOT require authentication token!

### Response:

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
    "address": "Toshkent sh."
  },
  "device": "Fingerprint Scanner",
  "notes": "Barmoq orqali kirish",
  "hasWarning": false,
  "fingerNumber": "12345"
}
```

## 2. Employee Schema Changes

- Added `fingerNumber` field (optional, string)
- Available in all employee DTOs (create, update, response)

### Employee Create/Update:

```json
{
  "fullName": "Sarvarbek Xazratov",
  "position": "Developer",
  "department": "IT",
  "tabRaqami": "EMP001",
  "fingerNumber": "12345" // NEW: Optional field
}
```

## 3. Frontend Implementation Tasks

### A. Employee Forms

1. **Create Employee Form**: Add optional `fingerNumber` field
2. **Update Employee Form**: Add optional `fingerNumber` field
3. **Employee List**: Display `fingerNumber` if available
4. **Employee Details**: Show `fingerNumber` in employee profile

### B. Attendance Interface

1. **New Finger Attendance Form**:
   - Input: `fingerNumber` (required)
   - Select: `location` (required)
   - Input: `device` (optional)
   - Textarea: `notes` (optional)
   - Button: "Kirish/Chiqish"

2. **Attendance History**: Show `fingerNumber` in attendance records

### C. UI Components Needed

```jsx
// Finger Attendance Form
<FingerAttendanceForm />

// Employee Form with Finger Number
<EmployeeForm includeFingerNumber={true} />

// Attendance Record with Finger Number
<AttendanceRecord showFingerNumber={true} />
```

## 4. Key Features

- **Auto IN/OUT**: System automatically determines if it's check-in or check-out
- **Location Validation**: Must use valid location names from database
- **Error Handling**: 404 if finger number not found, 400 if location invalid
- **Backward Compatible**: Old employee ID system still works

## 5. Error Messages

- "Barmoq raqami topilmadi" (404)
- "Location topilmadi" (400)
- "Barmoq raqami allaqachon mavjud" (409 - if duplicate)

## 6. Status Types

- `normal` - Normal time
- `late` - Checked in after 9:00 AM
- `early` - Checked out before 6:00 PM
- `overtime` - Checked out after 6:00 PM

## 7. Sample Locations

- "Bosh Ofis"
- "Filial 1"
- "Filial 2"
- (Get from `/locations` API)

## 8. Implementation Priority

1. Add `fingerNumber` to employee forms
2. Create finger attendance interface
3. Update employee lists to show finger numbers
4. Add finger number to attendance history
5. Test with sample data

## 9. Testing Data

```json
{
  "fingerNumber": "12345",
  "location": "Bosh Ofis",
  "device": "Fingerprint Scanner"
}
```

## 10. Notes

- Finger number is optional - employees can exist without it
- System supports both old (employee ID) and new (finger number) methods
- No breaking changes to existing functionality
- **IMPORTANT**: `/schedule/attendance/checkinout` endpoint does NOT require authentication
- Other endpoints still require authentication

---

**Ready to implement!** 🚀
