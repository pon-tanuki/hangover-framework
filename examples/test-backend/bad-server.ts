import express from 'express';

const app = express();
const API_KEY = "sk-secret-hardcoded-key-12345678";

// Bad: camelCase route, no error handling
app.get('/api/v1/getUserList', async (req, res) => {
  const userId = req.query.id;
  const result = await db.query(`SELECT * FROM users WHERE id = ${userId}`);
  res.json({ users: result.rows, total: result.rowCount });
});

// Bad: snake_case route, no try-catch
app.post('/api/v1/create_user', async (req, res) => {
  const { name, email } = req.body;
  await db.query(`INSERT INTO users (name, email) VALUES ('${name}', '${email}')`);
  res.json({ success: true });
});
