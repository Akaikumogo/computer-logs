# 📍 Location Module - Complete Documentation

## 📋 Overview

Location moduli xodimlarning attendance qiladigan joylarni (ofis, filial, remote work joylari) boshqarish uchun yaratilgan. Bu modul orqali attendance'da location validation va schedule'da location filter qilish imkoniyati mavjud.

## 🏗️ Module Structure

```
src/location/
├── location.module.ts         # Module configuration
├── location.controller.ts     # API endpoints
├── location.service.ts        # Business logic
└── schemas/location.schema.ts # Database schema
```

## 📊 Database Schema

### Location Collection

```typescript
{
  _id: ObjectId,
  name: string,              // Location nomi (unique)
  address: string,           // To'liq manzil
  latitude: number,          // GPS latitude
  longitude: number,         // GPS longitude
  radius: number,            // Radius (metr, default: 100)
  isActive: boolean,         // Faol (default: true)
  isDeleted: boolean,        // Soft delete (default: false)
  description?: string,      // Tavsif
  deletedAt?: Date,          // O'chirilgan vaqt
  createdAt: Date,           // Yaratilgan vaqt
  updatedAt: Date            // Yangilangan vaqt
}
```

### Indexes

- `name` - Unique index
- `isActive + isDeleted` - Compound index
- `latitude + longitude` - Geospatial index

## 🚀 API Endpoints

### Base URL

```
Development: http://localhost:1849/api/locations
Production: https://your-domain.com/api/locations
```

### Authentication

Barcha endpointlar JWT token talab qiladi:

```http
Authorization: Bearer <your-jwt-token>
```

## 📝 CRUD Operations

### 1. Create Location

#### POST /api/locations

Yangi location yaratish (ADMIN va HR uchun)

**Request Body:**

```json
{
  "name": "Bosh Ofis",
  "address": "Toshkent sh., Yunusobod tumani, Navoiy ko'chasi 1",
  "latitude": 41.311081,
  "longitude": 69.240562,
  "radius": 100,
  "description": "Asosiy ofis binosi",
  "isActive": true
}
```

**Response:**

```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "Bosh Ofis",
  "address": "Toshkent sh., Yunusobod tumani, Navoiy ko'chasi 1",
  "latitude": 41.311081,
  "longitude": 69.240562,
  "radius": 100,
  "isActive": true,
  "description": "Asosiy ofis binosi",
  "createdAt": "2025-01-15T08:00:00.000Z",
  "updatedAt": "2025-01-15T08:00:00.000Z"
}
```

**Error Responses:**

- `400` - Noto'g'ri ma'lumotlar
- `409` - Bu nomdagi location allaqachon mavjud
- `403` - Ruxsat yo'q (faqat ADMIN va HR)

### 2. Get All Locations

#### GET /api/locations

Barcha locationlarni olish (filter va pagination bilan)

**Query Parameters:**

- `isActive` (optional): Faol locationlar (boolean)
- `page` (optional): Sahifa raqami (default: 1)
- `limit` (optional): Sahifa hajmi (default: 20)
- `search` (optional): Qidiruv matni

**Example:**

```http
GET /api/locations?isActive=true&page=1&limit=10&search=ofis
```

**Response:**

```json
{
  "locations": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "Bosh Ofis",
      "address": "Toshkent sh., Yunusobod tumani",
      "latitude": 41.311081,
      "longitude": 69.240562,
      "radius": 100,
      "isActive": true,
      "description": "Asosiy ofis binosi",
      "createdAt": "2025-01-15T08:00:00.000Z",
      "updatedAt": "2025-01-15T08:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

### 3. Get Active Locations

#### GET /api/locations/active

Faqat faol locationlarni olish

**Response:**

```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "name": "Bosh Ofis",
    "address": "Toshkent sh., Yunusobod tumani",
    "latitude": 41.311081,
    "longitude": 69.240562,
    "radius": 100,
    "isActive": true,
    "description": "Asosiy ofis binosi",
    "createdAt": "2025-01-15T08:00:00.000Z",
    "updatedAt": "2025-01-15T08:00:00.000Z"
  }
]
```

### 4. Get Single Location

#### GET /api/locations/:id

Belgilangan locationning to'liq ma'lumotini olish

**Path Parameter:**

- `id`: Location ID

**Response:**

```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "Bosh Ofis",
  "address": "Toshkent sh., Yunusobod tumani",
  "latitude": 41.311081,
  "longitude": 69.240562,
  "radius": 100,
  "isActive": true,
  "description": "Asosiy ofis binosi",
  "createdAt": "2025-01-15T08:00:00.000Z",
  "updatedAt": "2025-01-15T08:00:00.000Z"
}
```

**Error Responses:**

- `404` - Location topilmadi
- `400` - Noto'g'ri location ID

### 5. Update Location

#### PATCH /api/locations/:id

Mavjud locationni yangilash (ADMIN va HR uchun)

**Path Parameter:**

- `id`: Location ID

**Request Body:**

```json
{
  "name": "Bosh Ofis Yangilangan",
  "address": "Toshkent sh., Chilonzor tumani, Yangi manzil",
  "latitude": 41.2995,
  "longitude": 69.2401,
  "radius": 150,
  "description": "Yangilangan ofis binosi",
  "isActive": true
}
```

**Response:**

```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "Bosh Ofis Yangilangan",
  "address": "Toshkent sh., Chilonzor tumani, Yangi manzil",
  "latitude": 41.2995,
  "longitude": 69.2401,
  "radius": 150,
  "isActive": true,
  "description": "Yangilangan ofis binosi",
  "createdAt": "2025-01-15T08:00:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z"
}
```

**Error Responses:**

- `404` - Location topilmadi
- `409` - Bu nomdagi location allaqachon mavjud
- `403` - Ruxsat yo'q (faqat ADMIN va HR)

### 6. Delete Location

#### DELETE /api/locations/:id

Locationni soft delete qilish (ADMIN va HR uchun)

**Path Parameter:**

- `id`: Location ID

**Response:**

```json
{
  "message": "Location muvaffaqiyatli o'chirildi"
}
```

**Error Responses:**

- `404` - Location topilmadi
- `403` - Ruxsat yo'q (faqat ADMIN va HR)

### 7. Validate Location Name

#### GET /api/locations/validate/:name

Location nomi mavjud va faol ekanligini tekshirish

**Path Parameter:**

- `name`: Location nomi

**Response:**

```json
{
  "valid": true,
  "location": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Bosh Ofis",
    "address": "Toshkent sh., Yunusobod tumani",
    "latitude": 41.311081,
    "longitude": 69.240562,
    "radius": 100,
    "isActive": true,
    "description": "Asosiy ofis binosi",
    "createdAt": "2025-01-15T08:00:00.000Z",
    "updatedAt": "2025-01-15T08:00:00.000Z"
  },
  "message": "Location mavjud va faol"
}
```

**Error Responses:**

- `404` - Location topilmadi yoki faol emas

## 🔗 Integration with Attendance

### Check-in/Check-out with Location Validation

Location moduli attendance bilan integratsiya qilingan. Endi check-in/check-out'da location nomini yuborish kerak:

#### POST /api/schedule/attendance/checkin

```json
{
  "employeeId": "507f1f77bcf86cd799439011",
  "type": "checkin",
  "locationName": "Bosh Ofis",
  "device": "iPhone 15",
  "notes": "Ishga keldim"
}
```

#### POST /api/schedule/attendance/checkout

```json
{
  "employeeId": "507f1f77bcf86cd799439011",
  "type": "checkout",
  "locationName": "Bosh Ofis",
  "device": "iPhone 15",
  "notes": "Ishdan chiqdim"
}
```

**Validation Logic:**

1. Location nomi mavjud va faol ekanligini tekshiradi
2. Location ma'lumotlarini o'qib oladi
3. Attendance record'da location ma'lumotlarini saqlaydi

## 📅 Integration with Schedule

### Location-based Filtering

Schedule endpoint'larida location bo'yicha filter qilish imkoniyati:

#### Daily Schedule with Location Filter

```http
GET /api/schedule/daily/2025-01-15?locationName=Bosh Ofis
```

#### Monthly Schedule with Location Filter

```http
GET /api/schedule/monthly/2025/1?locationName=Bosh Ofis
```

#### Yearly Schedule with Location Filter

```http
GET /api/schedule/yearly/2025?locationName=Bosh Ofis
```

**Filter Logic:**

- Faqat belgilangan location'da attendance qilgan xodimlarni ko'rsatadi
- Location address bo'yicha filter qiladi

## 🎯 Frontend Integration

### TypeScript Interfaces

```typescript
interface Location {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radius: number;
  isActive: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateLocationDto {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radius?: number;
  description?: string;
  isActive?: boolean;
}

interface UpdateLocationDto {
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  description?: string;
  isActive?: boolean;
}

interface LocationQueryDto {
  isActive?: boolean;
  page?: number;
  limit?: number;
  search?: string;
}
```

### React Hook Example

```typescript
import { useState, useEffect } from 'react';

export const useLocations = (query?: LocationQueryDto) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const params = new URLSearchParams();
        if (query?.isActive !== undefined)
          params.append('isActive', query.isActive.toString());
        if (query?.page) params.append('page', query.page.toString());
        if (query?.limit) params.append('limit', query.limit.toString());
        if (query?.search) params.append('search', query.search);

        const response = await fetch(`/api/locations?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setLocations(data.locations);
        setPagination(data.pagination);
      } catch (error) {
        console.error('Error fetching locations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, [query]);

  return { locations, pagination, loading };
};
```

### React Component Example

```typescript
import React, { useState } from 'react';

const LocationManagement = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  const createLocation = async (locationData: CreateLocationDto) => {
    try {
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(locationData),
      });

      if (response.ok) {
        const newLocation = await response.json();
        setLocations([...locations, newLocation]);
        return newLocation;
      } else {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error creating location:', error);
      throw error;
    }
  };

  const updateLocation = async (id: string, updateData: UpdateLocationDto) => {
    try {
      const response = await fetch(`/api/locations/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const updatedLocation = await response.json();
        setLocations(locations.map(loc =>
          loc.id === id ? updatedLocation : loc
        ));
        return updatedLocation;
      } else {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error updating location:', error);
      throw error;
    }
  };

  const deleteLocation = async (id: string) => {
    try {
      const response = await fetch(`/api/locations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setLocations(locations.filter(loc => loc.id !== id));
        return true;
      } else {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error deleting location:', error);
      throw error;
    }
  };

  return (
    <div className="location-management">
      <h2>Location Management</h2>

      {/* Location List */}
      <div className="location-list">
        {locations.map(location => (
          <div key={location.id} className="location-card">
            <h3>{location.name}</h3>
            <p>{location.address}</p>
            <p>GPS: {location.latitude}, {location.longitude}</p>
            <p>Radius: {location.radius}m</p>
            <p>Status: {location.isActive ? 'Active' : 'Inactive'}</p>

            <div className="actions">
              <button onClick={() => updateLocation(location.id, { isActive: !location.isActive })}>
                {location.isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button onClick={() => deleteLocation(location.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Location Selector Component

```typescript
import React, { useState, useEffect } from 'react';

interface LocationSelectorProps {
  onLocationSelect: (locationName: string) => void;
  selectedLocation?: string;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  onLocationSelect,
  selectedLocation
}) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveLocations = async () => {
      try {
        const response = await fetch('/api/locations/active', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        setLocations(data);
      } catch (error) {
        console.error('Error fetching locations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveLocations();
  }, []);

  if (loading) return <div>Loading locations...</div>;

  return (
    <div className="location-selector">
      <label htmlFor="location-select">Select Location:</label>
      <select
        id="location-select"
        value={selectedLocation || ''}
        onChange={(e) => onLocationSelect(e.target.value)}
      >
        <option value="">Choose location...</option>
        {locations.map(location => (
          <option key={location.id} value={location.name}>
            {location.name} - {location.address}
          </option>
        ))}
      </select>
    </div>
  );
};
```

## 🔐 Security & Authorization

### Role-based Access Control

- **ADMIN**: Barcha CRUD operatsiyalar
- **HR**: Barcha CRUD operatsiyalar
- **Employee**: Faqat o'qish (GET endpoints)

### Authentication

Barcha endpointlar JWT token talab qiladi:

```http
Authorization: Bearer <jwt-token>
```

### Input Validation

- Barcha input ma'lumotlari class-validator bilan validatsiya qilinadi
- GPS koordinatalari to'g'ri formatda bo'lishi kerak
- Location nomi unique bo'lishi kerak

## 📊 Business Logic

### Location Validation Rules

1. **Name**: Unique, required, string
2. **Address**: Required, string
3. **Latitude**: Required, number, -90 to 90
4. **Longitude**: Required, number, -180 to 180
5. **Radius**: Optional, number, 10 to 1000 meters
6. **isActive**: Optional, boolean, default true

### Soft Delete

Location'lar hard delete qilinmaydi, faqat `isDeleted: true` qilinadi va `deletedAt` timestamp qo'shiladi.

### Geospatial Features

- GPS koordinatalari bilan ishlash
- Radius-based validation
- Geospatial indexing

## 🚀 Performance Considerations

### Database Indexing

- `name` - Unique index
- `isActive + isDeleted` - Compound index
- `latitude + longitude` - Geospatial index

### Caching Strategy

- Active locations cache qilinishi mumkin
- Location validation natijalari cache qilinishi mumkin

### Pagination

- Katta ma'lumotlar uchun pagination
- Default limit: 20, max limit: 100

## 🧪 Testing

### Unit Tests

```bash
npm run test src/location/
```

### Integration Tests

```bash
npm run test:e2e
```

### Test Coverage

```bash
npm run test:cov
```

## 📚 Error Handling

### HTTP Status Codes

- `200 OK` - Muvaffaqiyatli so'rov
- `201 Created` - Yangi location yaratildi
- `400 Bad Request` - Noto'g'ri ma'lumotlar
- `401 Unauthorized` - Authentication talab qilinadi
- `403 Forbidden` - Ruxsat yo'q
- `404 Not Found` - Location topilmadi
- `409 Conflict` - Location nomi allaqachon mavjud
- `500 Internal Server Error` - Server xatosi

### Error Response Format

```json
{
  "statusCode": 400,
  "message": "Noto'g'ri ma'lumotlar",
  "error": "Bad Request"
}
```

## 🔮 Future Enhancements

### Planned Features

1. **Geofencing** - GPS-based automatic location detection
2. **Location Analytics** - Usage statistics
3. **Multi-language Support** - Location names in different languages
4. **Location Hierarchy** - Parent-child location relationships
5. **Location Templates** - Predefined location types

### Integration Opportunities

1. **Maps Integration** - Google Maps, OpenStreetMap
2. **Weather API** - Location-based weather information
3. **Time Zone Support** - Automatic time zone detection
4. **Location-based Notifications** - Proximity alerts

---

**Last Updated**: 2025-01-15  
**Version**: 1.0.0  
**Author**: MES KPI Development Team
