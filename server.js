const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database Setup (SQLite)
const db = new sqlite3.Database('./todos.db', (err) => {
  if (err) console.error('Database error:', err.message);
  else console.log('Connected to SQLite database.');
});

db.run(`CREATE TABLE IF NOT EXISTS todos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task TEXT NOT NULL,
  completed INTEGER DEFAULT 0
)`);

// REST API Endpoints
// 1. READ all todos
app.get('/api/todos', (req, res) => {
  db.all('SELECT * FROM todos ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 2. CREATE a new todo
app.post('/api/todos', (req, res) => {
  const { task } = req.body;
  if (!task) return res.status(400).json({ error: 'Task is required' });
  db.run('INSERT INTO todos (task) VALUES (?)', [task], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, task, completed: 0 });
  });
});

// 3. UPDATE a todo (toggle completion or edit text)
app.put('/api/todos/:id', (req, res) => {
  const { task, completed } = req.body;
  const { id } = req.params;
  db.run(
    'UPDATE todos SET task = COALESCE(?, task), completed = COALESCE(?, completed) WHERE id = ?',
    [task, completed, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ updated: this.changes });
    }
  );
});

// 4. DELETE a todo
app.delete('/api/todos/:id', (req, res) => {
  db.run('DELETE FROM todos WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
