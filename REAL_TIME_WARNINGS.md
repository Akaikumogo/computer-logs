# Real-Time Warning System

## 🔄 Real-Time Features

### 1. WebSocket Events

- `warning.added` - Yangi warning qo'shilganda
- `warning.removed` - Warning o'chirilganda
- `warnings.updated` - Warning'lar yangilanganda
- `schedule.daily.changed` - Kunlik schedule o'zgarganda

### 2. SSE Endpoint

```
GET /schedule/warnings/stream
```

- Har 5 soniyada yangilanadi
- Real-time warning ma'lumotlarini yuboradi

### 3. Frontend Integration

#### WebSocket Connection

```javascript
import io from 'socket.io-client';

const socket = io('ws://localhost:3000/realtime');

// Warning events
socket.on('warning.added', (data) => {
  console.log('New warning:', data);
  // UI'da yangi warning ko'rsatish
});

socket.on('warning.removed', (data) => {
  console.log('Warning removed:', data);
  // UI'dan warning o'chirish
});

socket.on('warnings.updated', (data) => {
  console.log('Warnings updated:', data);
  // Barcha warning'larni yangilash
});
```

#### SSE Stream

```javascript
const eventSource = new EventSource('/schedule/warnings/stream');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Real-time warnings:', data);
  // UI'ni yangilash
};
```

### 4. API Endpoints

#### Get All Warnings

```
GET /schedule/warnings/all
```

#### Get Warnings by Date Range

```
GET /schedule/warnings/date-range?startDate=2024-01-01&endDate=2024-01-31
```

#### Remove Warning

```
DELETE /schedule/warnings/employee/{employeeId}
DELETE /schedule/warnings/all
```

### 5. Real-Time Updates

#### Automatic Updates

- **12:00 PM** - Active employees get warnings
- **18:00 PM** - Overtime warnings
- **23:59 PM** - Auto checkout
- **00:01 AM** - Past day warnings

#### Manual Updates

- Manual warning addition
- Manual warning removal
- Real-time UI updates

### 6. Frontend Component Example

```jsx
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const RealTimeWarnings = () => {
  const [warnings, setWarnings] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // WebSocket connection
    const newSocket = io('ws://localhost:3000/realtime');
    setSocket(newSocket);

    // Event listeners
    newSocket.on('warning.added', (data) => {
      setWarnings((prev) => [...prev, data]);
    });

    newSocket.on('warning.removed', (data) => {
      setWarnings((prev) =>
        prev.filter((w) => w.employeeId !== data.employeeId),
      );
    });

    newSocket.on('warnings.updated', (data) => {
      setWarnings(data.warnings);
    });

    return () => newSocket.close();
  }, []);

  return (
    <div>
      <h2>Real-Time Warnings ({warnings.length})</h2>
      {warnings.map((warning) => (
        <div key={warning._id} className="warning-item">
          <h3>{warning.employee.fullName}</h3>
          <p>{warning.warningReason}</p>
          <small>{new Date(warning.warningTimestamp).toLocaleString()}</small>
        </div>
      ))}
    </div>
  );
};
```

### 7. Testing

#### WebSocket Test

```javascript
const socket = io('ws://localhost:3000/realtime');

socket.on('connect', () => {
  console.log('Connected to WebSocket');
});

socket.on('warning.added', (data) => {
  console.log('Warning added:', data);
});
```

#### SSE Test

```javascript
const eventSource = new EventSource('/schedule/warnings/stream');

eventSource.onmessage = (event) => {
  console.log('SSE data:', JSON.parse(event.data));
};
```

## 🚀 Benefits

1. **Real-Time Updates** - Instant warning notifications
2. **Live Dashboard** - Always up-to-date information
3. **Automatic Sync** - No manual refresh needed
4. **Multiple Channels** - WebSocket + SSE for reliability
5. **Event-Driven** - Efficient updates only when needed

## 📱 Usage

1. Connect to WebSocket: `ws://localhost:3000/realtime`
2. Listen for events: `warning.added`, `warning.removed`, `warnings.updated`
3. Use SSE stream: `GET /schedule/warnings/stream`
4. Update UI in real-time based on events

Bu sistem orqali home page'da barcha warning'lar real-time da ko'rsatiladi!








