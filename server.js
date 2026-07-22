const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
const db = new Database('students.db');

app.use(express.json());
app.use(express.static(path.join(__dirname)));

 db.prepare(`
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    class_name TEXT NOT NULL,
    roll_number TEXT NOT NULL,
    age INTEGER NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    address TEXT NOT NULL
  )
`).run();

app.get('/api/students', (req, res) => {
  const students = db.prepare('SELECT * FROM students ORDER BY id ASC').all();
  res.json(students);
});

app.post('/api/students', (req, res) => {
  const { name, className, rollNumber, age, phone, email, address } = req.body;

  if (!name || !className || !rollNumber || !age || !phone || !email || !address) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const stmt = db.prepare(`
    INSERT INTO students (name, class_name, roll_number, age, phone, email, address)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(name, className, rollNumber, age, phone, email, address);
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(result.lastInsertRowid);

  res.status(201).json(student);
});

app.put('/api/students/:id', (req, res) => {
  const { id } = req.params;
  const { name, className, rollNumber, age, phone, email, address } = req.body;

  if (!name || !className || !rollNumber || !age || !phone || !email || !address) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const stmt = db.prepare(`
    UPDATE students
    SET name = ?, class_name = ?, roll_number = ?, age = ?, phone = ?, email = ?, address = ?
    WHERE id = ?
  `);

  const result = stmt.run(name, className, rollNumber, age, phone, email, address, id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Student not found.' });
  }

  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
  res.json(student);
});

app.delete('/api/students/:id', (req, res) => {
  const { id } = req.params;
  const stmt = db.prepare('DELETE FROM students WHERE id = ?');
  const result = stmt.run(id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Student not found.' });
  }

  res.json({ success: true });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Student manager running at http://localhost:${port}`);
});
