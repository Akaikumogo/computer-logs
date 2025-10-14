## Caching Strategy (computer-logs)

This document summarizes how HTTP caching is configured and controlled in the `computer-logs` (NestJS) backend, and how realtime endpoints avoid stale data.

### 1) Global Cache (Disabled)

Previously the app used NestJS CacheModule + CacheInterceptor globally. Now it is fully disabled to guarantee realtime behavior across the board.

```1:30:computer-logs/src/app.module.ts
// Cache disabled per request: removed CacheModule and CacheInterceptor
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    MongooseModule.forRootAsync({ /* ... */ }),
    ComputersModule,
    HrModule,
    UploadModule,
    WorkplacesModule,
    AuthModule,
    ScheduleModule,
    DashboardModule,
    LocationModule,
  ],
  providers: [],
})
export class AppModule {}
```

Key points:

- No server-side in-memory caching for controller responses.
- All routes always compute fresh data on each request.

### 2) Global No-Cache Headers (defensive)

The server also sets global no-cache headers to reduce browser/proxy-level caching when needed.

```20:31:computer-logs/src/main.ts
  app.use((req, res, next) => {
    // Disable etag generation
    // @ts-ignore
    res.app.set('etag', false);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });
```

Notes:

- These headers discourage downstream caches (browsers, proxies) from serving stale content.
- They do not disable the in-memory Nest cache; that is controlled by CacheModule/CacheInterceptor.

### 3) Realtime/Mutable Endpoints: No-Store Headers

Although global cache is disabled, we also set explicit response headers for schedule/attendance views to prevent browser/proxy caching entirely.

```177:216:computer-logs/src/schedule/schedule.controller.ts
  @Get('daily/:date')
  @CacheTTL(0)
  async getDailySchedule(
    @Param('date') date: string,
    @Res({ passthrough: true }) res: Response,
    @Query('locationName') locationName?: string,
  ) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    return this.scheduleService.getDailySchedule(date, locationName);
  }
```

We apply the same pattern for other schedule endpoints (monthly/yearly) and attendance views:

- `GET /schedule/attendance/today/:employeeId` → `@CacheTTL(0)` + no-store headers
- `GET /schedule/attendance/employee/:employeeId` → `@CacheTTL(0)` + no-store headers
- `GET /schedule/daily/:date` → `@CacheTTL(0)` + no-store headers
- `GET /schedule/monthly/:year/:month` → `@CacheTTL(0)` + no-store headers
- `GET /schedule/yearly/:year` → `@CacheTTL(0)` + no-store headers

This guarantees fresh data on every request from intermediaries as well.

### 4) Realtime Events (WebSocket) and Client Refetch

On every attendance mutation, the backend emits websocket events so the frontend can refresh immediately without relying on cache TTLs.

```1:29:computer-logs/src/schedule/schedule.gateway.ts
@WebSocketGateway({ namespace: '/realtime', cors: { origin: '*', credentials: true } })
export class ScheduleGateway implements OnGatewayInit {
  @WebSocketServer() server!: Server;
  emitAttendanceChanged(payload: { employeeId: string; dateISO: string; event: 'checkin'|'checkout'|'update'|'delete'; }) {
    this.server.emit('attendance.changed', payload);
  }
  emitScheduleChanged(payload: { dateISO: string; scope?: 'daily'|'monthly'|'yearly' }) {
    this.server.emit('schedule.changed', payload);
  }
}
```

The service emits these events after successful mutations:

```115:140:computer-logs/src/schedule/schedule.service.ts
// after check-in save
const dateISO = now.toISOString().split('T')[0];
this.gateway.emitAttendanceChanged({ employeeId: (employee._id as any).toString(), dateISO, event: 'checkin' });
this.gateway.emitScheduleChanged({ dateISO, scope: 'daily' });
```

Similarly for checkout, update, and delete.

### 5) When to Use/Change Caching

- For static/rarely-changing endpoints, you can rely on global cache (5 min TTL) or add `@CacheTTL(seconds)` on the handler.
- For frequently-changing or realtime-sensitive data (attendance, schedule dashboards), set `@CacheTTL(0)` and add explicit response headers as above.
- Prefer emitting websocket/SSE signals after write operations so clients immediately invalidate and refetch.

### 6) Troubleshooting Stale Data

If clients still see stale responses:

- Verify the route has `@CacheTTL(0)` and no-store headers.
- Ensure the frontend invalidates the correct React Query keys upon websocket events.
- Double-check that clients point to the intended `BASE_URL` and are not mixing environments.

---

Short version: Global cache is disabled. Schedule/attendance GETs add no-store headers, and websocket events prompt the frontend to refetch instantly.
