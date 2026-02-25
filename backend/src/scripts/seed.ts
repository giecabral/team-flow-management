import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const now = () => new Date().toISOString();

function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

// ---------------------------------------------------------------------------
// Wipe existing data (order matters — children before parents)
// ---------------------------------------------------------------------------

console.log('Clearing existing data...');
db.exec(`
  DELETE FROM task_labels;
  DELETE FROM task_comments;
  DELETE FROM tasks;
  DELETE FROM labels;
  DELETE FROM team_members;
  DELETE FROM refresh_tokens;
  DELETE FROM teams;
  DELETE FROM users;
`);

// ---------------------------------------------------------------------------
// Users — all share password "password123"
// ---------------------------------------------------------------------------

console.log('Seeding users...');
const HASH = bcrypt.hashSync('password123', 10);

const users = [
  { id: uuidv4(), email: 'alice@example.com',  first_name: 'Alice', last_name: 'Johnson' },
  { id: uuidv4(), email: 'bob@example.com',    first_name: 'Bob',   last_name: 'Martinez' },
  { id: uuidv4(), email: 'carol@example.com',  first_name: 'Carol', last_name: 'Kim' },
  { id: uuidv4(), email: 'dave@example.com',   first_name: 'Dave',  last_name: 'Okafor' },
  { id: uuidv4(), email: 'eve@example.com',    first_name: 'Eve',   last_name: 'Chen' },
];

const insertUser = db.prepare(`
  INSERT INTO users (id, email, password_hash, first_name, last_name, created_at, updated_at)
  VALUES (@id, @email, @password_hash, @first_name, @last_name, @created_at, @updated_at)
`);

for (const u of users) {
  insertUser.run({ ...u, password_hash: HASH, created_at: now(), updated_at: now() });
}

const [alice, bob, carol, dave, eve] = users;

// ---------------------------------------------------------------------------
// Teams
// ---------------------------------------------------------------------------

console.log('Seeding teams...');
const teams = [
  { id: uuidv4(), name: 'Team Alpha', description: 'Product development team', created_by: alice.id },
  { id: uuidv4(), name: 'Team Beta',  description: 'Infrastructure & DevOps',  created_by: bob.id },
];

const insertTeam = db.prepare(`
  INSERT INTO teams (id, name, description, created_by, created_at, updated_at)
  VALUES (@id, @name, @description, @created_by, @created_at, @updated_at)
`);

for (const t of teams) {
  insertTeam.run({ ...t, created_at: now(), updated_at: now() });
}

const [alpha, beta] = teams;

// ---------------------------------------------------------------------------
// Team Members
// ---------------------------------------------------------------------------

console.log('Seeding team members...');
const insertMember = db.prepare(`
  INSERT INTO team_members (id, team_id, user_id, role, joined_at)
  VALUES (@id, @team_id, @user_id, @role, @joined_at)
`);

const members = [
  // Team Alpha
  { team_id: alpha.id, user_id: alice.id, role: 'admin' },
  { team_id: alpha.id, user_id: bob.id,   role: 'manager' },
  { team_id: alpha.id, user_id: carol.id, role: 'dev' },
  { team_id: alpha.id, user_id: dave.id,  role: 'dev' },
  { team_id: alpha.id, user_id: eve.id,   role: 'guest' },
  // Team Beta
  { team_id: beta.id,  user_id: bob.id,   role: 'admin' },
  { team_id: beta.id,  user_id: dave.id,  role: 'dev' },
];

for (const m of members) {
  insertMember.run({ id: uuidv4(), ...m, joined_at: now() });
}

// ---------------------------------------------------------------------------
// Tasks — Team Alpha
// ---------------------------------------------------------------------------

console.log('Seeding tasks...');
const insertTask = db.prepare(`
  INSERT INTO tasks (id, team_id, title, description, status, priority, due_date, assigned_to, created_by, created_at, updated_at)
  VALUES (@id, @team_id, @title, @description, @status, @priority, @due_date, @assigned_to, @created_by, @created_at, @updated_at)
`);

const alphaTasks = [
  {
    title: 'Design onboarding flow',
    description: 'Create wireframes and user flow for the new member onboarding experience.',
    status: 'done',
    priority: 'high',
    due_date: daysFromNow(-5),
    assigned_to: carol.id,
    created_by: alice.id,
  },
  {
    title: 'Implement refresh token rotation',
    description: 'Replace single-use tokens with rotating refresh tokens and update the auth middleware.',
    status: 'done',
    priority: 'high',
    due_date: daysFromNow(-2),
    assigned_to: dave.id,
    created_by: bob.id,
  },
  {
    title: 'Add pagination to tasks list',
    description: 'The tasks endpoint returns all rows. Add cursor-based pagination with a default limit of 25.',
    status: 'in_progress',
    priority: 'medium',
    due_date: daysFromNow(3),
    assigned_to: carol.id,
    created_by: alice.id,
  },
  {
    title: 'Set up CI pipeline',
    description: 'Configure GitHub Actions to run lint and type-check on every PR.',
    status: 'in_progress',
    priority: 'medium',
    due_date: daysFromNow(5),
    assigned_to: dave.id,
    created_by: bob.id,
  },
  {
    title: 'Write API documentation',
    description: 'Document all REST endpoints in a Postman collection or OpenAPI spec.',
    status: 'todo',
    priority: 'low',
    due_date: daysFromNow(10),
    assigned_to: carol.id,
    created_by: alice.id,
  },
  {
    title: 'Add labels feature to tasks',
    description: 'The labels schema is already in place. Wire up the UI and API endpoints to create and assign labels.',
    status: 'todo',
    priority: 'medium',
    due_date: daysFromNow(14),
    assigned_to: null,
    created_by: alice.id,
  },
  {
    title: 'Fix due date timezone bug',
    description: 'Due dates saved in UTC display incorrectly for users in UTC-5 and earlier.',
    status: 'todo',
    priority: 'high',
    due_date: daysFromNow(1),
    assigned_to: dave.id,
    created_by: bob.id,
  },
];

const alphaTaskIds: string[] = [];
for (const t of alphaTasks) {
  const id = uuidv4();
  alphaTaskIds.push(id);
  insertTask.run({ id, team_id: alpha.id, ...t, created_at: now(), updated_at: now() });
}

// Team Beta tasks
const betaTasks = [
  {
    title: 'Provision staging environment',
    description: 'Set up a staging server mirroring production. Use Docker Compose.',
    status: 'in_progress',
    priority: 'high',
    due_date: daysFromNow(4),
    assigned_to: dave.id,
    created_by: bob.id,
  },
  {
    title: 'Configure log aggregation',
    description: 'Ship backend logs to a central store. Evaluate Loki vs CloudWatch.',
    status: 'todo',
    priority: 'medium',
    due_date: daysFromNow(12),
    assigned_to: null,
    created_by: bob.id,
  },
];

for (const t of betaTasks) {
  insertTask.run({ id: uuidv4(), team_id: beta.id, ...t, created_at: now(), updated_at: now() });
}

// Personal tasks (no team_id)
const personalTasks = [
  {
    title: 'Review PRs before standup',
    description: null,
    status: 'todo',
    priority: 'medium',
    due_date: daysFromNow(1),
    assigned_to: null,
    created_by: alice.id,
  },
  {
    title: 'Update resume with TeamFlow project',
    description: 'Add bullet points for auth system, RBAC, and dual-context task design.',
    status: 'in_progress',
    priority: 'high',
    due_date: daysFromNow(2),
    assigned_to: alice.id,
    created_by: alice.id,
  },
];

for (const t of personalTasks) {
  insertTask.run({ id: uuidv4(), team_id: null, ...t, created_at: now(), updated_at: now() });
}

// ---------------------------------------------------------------------------
// Comments — on first two Alpha tasks
// ---------------------------------------------------------------------------

console.log('Seeding comments...');
const insertComment = db.prepare(`
  INSERT INTO task_comments (id, task_id, user_id, content, created_at, updated_at)
  VALUES (@id, @task_id, @user_id, @content, @created_at, @updated_at)
`);

const comments = [
  { task_id: alphaTaskIds[0], user_id: alice.id, content: 'Wireframes look great. Approved for implementation.' },
  { task_id: alphaTaskIds[0], user_id: carol.id, content: 'Thanks! Moving this to done.' },
  { task_id: alphaTaskIds[2], user_id: bob.id,   content: 'Let\'s go cursor-based instead of offset — better for live data.' },
  { task_id: alphaTaskIds[2], user_id: carol.id, content: 'Agreed, will use the created_at + id pair as the cursor.' },
  { task_id: alphaTaskIds[6], user_id: dave.id,  content: 'Confirmed bug. Dates should be stored with timezone offset or converted on read.' },
];

for (const c of comments) {
  insertComment.run({ id: uuidv4(), ...c, created_at: now(), updated_at: now() });
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`
Done! Database seeded with:
  ${users.length} users          (password: "password123")
  ${teams.length} teams          (Team Alpha, Team Beta)
  ${members.length} team members
  ${alphaTasks.length + betaTasks.length + personalTasks.length} tasks          (${alphaTasks.length} Alpha, ${betaTasks.length} Beta, ${personalTasks.length} personal)
  ${comments.length} comments

Login credentials:
  alice@example.com  — admin of Team Alpha
  bob@example.com    — manager of Team Alpha, admin of Team Beta
  carol@example.com  — dev in Team Alpha
  dave@example.com   — dev in Team Alpha & Beta
  eve@example.com    — guest in Team Alpha
`);
