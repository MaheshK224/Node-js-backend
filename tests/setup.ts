// Runs before every test file. Guarantees tests never touch the dev/qa/prod database.
process.env.NODE_ENV = 'test';
