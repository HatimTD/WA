const { Client } = require('pg');

async function setupDatabase() {
  // Connect to postgres database to create our database
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'root',
    database: 'postgres', // Connect to default postgres database first
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL');

    // Check if database exists
    const checkDb = await client.query(
      "SELECT 1 FROM pg_database WHERE datname='case_study_builder'"
    );

    if (checkDb.rows.length === 0) {
      // Create database using template0 to avoid locks
      await client.query('CREATE DATABASE case_study_builder WITH TEMPLATE template0 ENCODING \'UTF8\'');
      console.log('✅ Database "case_study_builder" created successfully!');
    } else {
      console.log('ℹ️  Database "case_study_builder" already exists');
    }

    await client.end();
    console.log('✅ Setup complete! You can now run: npm run db:push');
  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    process.exit(1);
  }
}

setupDatabase();
