// MongoDB script to fix email index
// Run this in MongoDB shell or using mongosh:
// mongosh <database_name> fix-email-index.js

// Option 1: Drop the existing email index if it's causing issues
db.users.dropIndex("email_1");

// Option 2: Create a sparse index instead (only indexes non-null values)
// This allows multiple null values without duplicate key errors
db.users.createIndex({ email: 1 }, { unique: true, sparse: true });

print("Email index fixed!");
