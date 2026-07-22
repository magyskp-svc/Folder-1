const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const Database = require('better-sqlite3');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3000);
const dbPath = process.env.DB_PATH || 'students.db';
const db = new Database(dbPath);

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
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

db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL
  )
`).run();

const seedUsers = [
  ['admin', 'Admin@123', 'admin'],
  ['teacher', 'Teacher@123', 'teacher'],
  ['student', 'Student@123', 'student'],
  ['parent', 'Parent@123', 'parent']
];

const existingUsers = db.prepare('SELECT username FROM users').all();
const existingUsernames = new Set(existingUsers.map((user) => user.username));
for (const user of seedUsers) {
  if (!existingUsernames.has(user[0])) {
    db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run(user[0], user[1], user[2]);
  }
}

function authenticateUser(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const encoded = authHeader.split(' ')[1];
  const decoded = Buffer.from(encoded, 'base64').toString('utf8');
  const [username, password] = decoded.split(':');

  const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  req.user = user;
  next();
}

function authorizeRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied.' });
    }
    next();
  };
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', environment: process.env.NODE_ENV || 'development' });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  res.json({ message: 'Login successful', user: { username: user.username, role: user.role } });
});

app.get('/api/students', authenticateUser, authorizeRole(['admin', 'teacher']), (req, res) => {
  const students = db.prepare('SELECT * FROM students ORDER BY id ASC').all();
  res.json(students);
});

app.post('/api/students', authenticateUser, authorizeRole(['admin', 'teacher']), (req, res) => {
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

app.put('/api/students/:id', authenticateUser, authorizeRole(['admin', 'teacher']), (req, res) => {
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

app.delete('/api/students/:id', authenticateUser, authorizeRole(['admin']), (req, res) => {
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

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const server = app.listen(port, () => {
  console.log(`Student manager running at http://localhost:${port}`);
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});
