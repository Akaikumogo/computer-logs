# Excel Upload Guide

## Overview

The system now supports uploading Excel files to automatically populate the employees, departments, and positions tables. This feature allows bulk import of employee data from Excel files.

## API Endpoint

```
POST /hr/upload-excel
```

## Authentication

- Requires JWT authentication
- Requires ADMIN or HR role

## File Requirements

- File format: `.xlsx` or `.xls`
- Content-Type: `multipart/form-data`
- Field name: `file`

## Excel File Structure

### Supported Column Headers

The system supports multiple languages for column headers:

#### English

- `Full Name` - Employee's full name
- `Position` - Job position
- `Department` - Department name
- `Employee ID` - Tab raqami (employee ID)
- `Phone` - Phone number
- `Email` - Email address
- `Address` - Home address
- `Salary` - Monthly salary
- `Hire Date` - Date of employment
- `Birth Date` - Date of birth
- `Passport ID` - Passport number

#### Uzbek

- `F.I.O` - Xodimning to'liq ismi
- `Lavozim` - Ish lavozimi
- `Bo'lim` - Bo'lim nomi
- `Tab raqami` - Xodim raqami
- `Telefon` - Telefon raqami
- `Email` - Email manzili
- `Manzil` - Uy manzili
- `Maosh` - Oylik maosh
- `Ishga qabul qilingan sana` - Ishga qabul qilingan sana
- `Tug'ilgan sana` - Tug'ilgan sana
- `Passport` - Passport raqami

#### Russian

- `Ф.И.О` - Полное имя сотрудника
- `Должность` - Должность
- `Отдел` - Название отдела
- `Табельный номер` - Номер сотрудника
- `Телефон` - Номер телефона
- `Почта` - Email адрес
- `Адрес` - Домашний адрес
- `Зарплата` - Месячная зарплата
- `Дата приема` - Дата приема на работу
- `Дата рождения` - Дата рождения
- `Паспорт` - Номер паспорта

### Required Fields

- Full Name (F.I.O, Ф.И.О)
- Position (Lavozim, Должность)
- Department (Bo'lim, Отдел)
- Employee ID (Tab raqami, Табельный номер)
- Email
- Phone (Telefon, Телефон)

### Optional Fields

- Address
- Salary
- Hire Date
- Birth Date
- Passport ID

## Example Excel Structure

| F.I.O              | Lavozim            | Bo'lim        | Tab raqami | Telefon       | Email                 | Manzil   | Maosh |
| ------------------ | ------------------ | ------------- | ---------- | ------------- | --------------------- | -------- | ----- |
| Sarvarbek Xazratov | Frontend Developer | IT Department | EMP001     | +998901234567 | sarvarbek@example.com | Toshkent | 1500  |
| Alisher Karimov    | Backend Developer  | IT Department | EMP002     | +998901234568 | alisher@example.com   | Toshkent | 1600  |

## Response Format

```json
{
  "status": "success",
  "departmentsCreated": 2,
  "positionsCreated": 5,
  "employeesCreated": 45,
  "employeesSkipped": 3,
  "errors": ["Row 5: Invalid email format", "Row 12: Missing required field"],
  "message": "Successfully imported 45 employees, 2 departments, and 5 positions. 3 employees were skipped due to duplicates."
}
```

## Features

### Automatic Table Population

1. **Departments**: Automatically creates departments from unique department names in the Excel file
2. **Positions**: Automatically creates positions from unique position names in the Excel file
3. **Employees**: Creates employee records with automatic user account generation

### Data Validation

- Validates required fields
- Checks for duplicate emails, tab raqami, and passport IDs
- Validates email format
- Validates date formats
- Validates numeric fields (salary)

### Error Handling

- Detailed error messages for each problematic row
- Continues processing even if some rows have errors
- Reports total counts of created and skipped records

### User Account Creation

- Automatically generates username from full name
- Generates random temporary password
- Creates user account linked to employee record
- Employee must change password on first login

## Usage Example

### Using curl

```bash
curl -X POST \
  http://localhost:3000/hr/upload-excel \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -F 'file=@employees.xlsx'
```

### Using Postman

1. Set method to POST
2. Set URL to `http://localhost:3000/hr/upload-excel`
3. Add Authorization header with Bearer token
4. Go to Body tab, select form-data
5. Add key `file` with type `File`
6. Select your Excel file
7. Send request

## Notes

- The system processes the first worksheet in the Excel file
- Empty rows are automatically skipped
- Duplicate departments and positions are handled gracefully (existing ones are not recreated)
- Employee duplicates are skipped and reported in the response
- All created employees get user accounts with temporary passwords
