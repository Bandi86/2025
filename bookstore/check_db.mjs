import db from './lib/db.ts'; // Import the db instance

console.log('Attempting to import db module...');

// The import itself triggers the connection and table creation.
// We just need to keep the process alive briefly to allow async operations to complete.
setTimeout(() => {
  console.log('DB module imported. Check console logs above for connection and table creation status.');
  // Close the database connection gracefully
  db.close((err) => {
    if (err) {
      console.error('Error closing database during check:', err.message);
      process.exit(1); // Exit with error code
    } else {
      console.log('Database connection closed successfully after check.');
      process.exit(0); // Exit successfully
    }
  });
}, 2000); // Wait 2 seconds for operations to complete
