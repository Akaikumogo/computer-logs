// MongoDB script to remove email index from employees collection
// Run this script in MongoDB shell or MongoDB Compass

// Connect to your database
use computer_logs;

// Drop the email index
db.employees.dropIndex("email_1");

// Verify the index is removed
db.employees.getIndexes();

print("Email index removed successfully!");
