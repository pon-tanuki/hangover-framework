import express from 'express';

const app = express();

app.get('/api/v1/users', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM users WHERE active = $1', [true]);
    res.json({ data: result.rows, meta: { total: result.rowCount } });
  } catch (err) {
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch users', details: {} });
  }
});

app.post('/api/v1/users', async (req, res) => {
  try {
    const { name, email } = req.body;
    const result = await db.query('INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *', [name, email]);
    res.json({ data: result.rows[0], meta: {} });
  } catch (err) {
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to create user', details: {} });
  }
});
