const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const checkDatabaseConnection = async () => {
  let client;
  try {
    client = await pool.connect();
    console.log("Successfully connected to PostgreSQL database!");

    const result = await client.query("SELECT NOW()");
    console.log("Database time:", result.rows[0].now);

    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'user_profiles'
      );
    `);

    if (!tableExists.rows[0].exists) {
      console.log("Creating user_profiles table...");
      await client.query(`
        CREATE TABLE IF NOT EXISTS user_profiles (
          auth0_id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255),
          email VARCHAR(255),
          picture VARCHAR(255)
        );
      `);
      console.log("Database table initialized successfully");
    } else {
      console.log("user_profiles table already exists");
      const userCount = await client.query(
        "SELECT COUNT(*) FROM user_profiles"
      );
      console.log(`Current number of users: ${userCount.rows[0].count}`);
    }
  } catch (err) {
    console.error("Database connection error:", err);
    console.error("Check your .env file and make sure PostgreSQL is running!");
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
  }
};

module.exports = { pool, checkDatabaseConnection };
