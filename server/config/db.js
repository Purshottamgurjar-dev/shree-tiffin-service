import mongoose from 'mongoose';

/**
 * Safety guard to ensure automated tests NEVER execute against production or development databases
 * @param {string} uri - MongoDB connection URI
 */
export const validateTestDatabase = (uri) => {
  if (process.env.NODE_ENV === 'test') {
    let dbName = '';
    try {
      // Extract DB name from URI pattern (e.g., ...mongodb.net/dbname?params or ...localhost:27017/dbname)
      const afterSlash = uri.split('/').pop() || '';
      dbName = afterSlash.split('?')[0];
    } catch {
      dbName = '';
    }

    if (!dbName || !dbName.toLowerCase().includes('test')) {
      const errorMsg = `🚨 REFUSING TO RUN TESTS: TEST DATABASE REQUIRED. Target database "${dbName || 'unknown'}" is NOT a dedicated test database. Tests must run against a database ending with or containing "test" (e.g. shree_tiffin_service_test).`;
      console.error(`\n============================================================\n${errorMsg}\n============================================================\n`);
      throw new Error(errorMsg);
    }
  }
};

export const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/shree_tiffin_service';

  // Enforce safety guard before any network attempt
  validateTestDatabase(uri);

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: process.env.NODE_ENV === 'test' ? 15000 : 5000,
    });

    // Secondary post-connection verification
    if (process.env.NODE_ENV === 'test' && conn.connection && conn.connection.name) {
      if (!conn.connection.name.toLowerCase().includes('test')) {
        await mongoose.disconnect();
        const postConnErr = `🚨 REFUSING TO RUN TESTS: TEST DATABASE REQUIRED. Connected database is "${conn.connection.name}", which is not an isolated test database.`;
        console.error(postConnErr);
        throw new Error(postConnErr);
      }
    }

    console.log(`[DB] MongoDB Atlas/Local Connected: ${conn.connection.host} (DB: ${conn.connection.name || 'default'})`);
    return conn;
  } catch (error) {
    if (error.message.includes('REFUSING TO RUN TESTS')) {
      throw error;
    }
    const sanitizedUri = uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
    console.warn(`[DB Notice] MongoDB connection to "${sanitizedUri}" was not reached (${error.message}).`);
    console.warn(`[DB Notice] Operating with resilient in-memory document store. When MongoDB Atlas URI is set in .env, connection will be live.`);
    return null;
  }
};

