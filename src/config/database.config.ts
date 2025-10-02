import { ConfigService } from '@nestjs/config';

export const databaseConfig = (configService: ConfigService) => ({
  uri: configService.get<string>('MONGODB_URI'),

  // Connection options
  connectionOptions: {
    maxPoolSize: 10, // Maintain up to 10 socket connections
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    bufferMaxEntries: 0, // Disable mongoose buffering
    bufferCommands: false, // Disable mongoose buffering

    // Read preferences
    readPreference: 'secondaryPreferred',

    // Write concerns
    writeConcern: {
      w: 'majority',
      j: true,
      wtimeout: 10000,
    },
  },

  // Index optimization
  indexes: {
    // Employee indexes
    employees: [
      { employeeId: 1 },
      { email: 1 },
      { phone: 1 },
      { department: 1, position: 1 },
      { isActive: 1, department: 1 },
      { createdAt: -1 },
    ],

    // Computer logs indexes
    computerLogs: [
      { computerId: 1, timestamp: -1 },
      { userId: 1, timestamp: -1 },
      { timestamp: -1 },
      { type: 1, timestamp: -1 },
    ],

    // Attendance indexes
    attendance: [
      { employeeId: 1, date: -1 },
      { date: -1, checkIn: 1 },
      { location: 1, date: -1 },
    ],
  },

  // Caching configuration
  cache: {
    enabled: true,
    ttl: 300, // 5 minutes
    max: 1000, // Maximum number of items in cache
  },
});
