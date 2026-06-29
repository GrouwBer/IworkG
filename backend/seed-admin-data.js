const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, 'data', 'iworkg.db');
const db = new Database(DB_PATH);

console.log('Seeding admin data (Reports and Bans)...');

const clients = db.prepare("SELECT id FROM users WHERE role = 'client' LIMIT 5").all();
const providers = db.prepare("SELECT id FROM users WHERE role = 'provider' LIMIT 5").all();
const admins = db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").all();

let adminId = admins.length > 0 ? admins[0].id : null;

if (!adminId) {
  adminId = uuidv4();
  db.prepare('INSERT INTO users (id, name, email, role) VALUES (?, ?, ?, ?)').run(adminId, 'Admin Teste', 'admin@teste.com', 'admin');
}

if (clients.length >= 2 && providers.length >= 2) {
  const insertReport = db.prepare(`
    INSERT INTO reports (id, reporter_id, target_type, target_id, reason, description, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'pending', datetime('now', ?))
  `);

  // Report 1: User reporting a provider
  insertReport.run(
    uuidv4(), clients[0].id, 'user', providers[0].id, 
    'Comportamento inadequado', 'O prestador foi muito grosseiro no chat e cobrou valor abusivo.',
    '-2 hours'
  );

  // Report 2: User reporting a review (assume there are some reviews, but we can just use the provider ID as a fallback if no reviews exist... wait, let's just do another user)
  insertReport.run(
    uuidv4(), clients[1].id, 'user', providers[1].id, 
    'Perfil Falso', 'Usa foto de banco de imagens e não sabe responder sobre os serviços.',
    '-1 days'
  );

  // Ban a provider
  const bannedProviderId = providers[2].id;
  db.prepare("UPDATE users SET banned = 1 WHERE id = ?").run(bannedProviderId);
  db.prepare(`
    INSERT INTO bans (id, user_id, admin_id, reason, created_at)
    VALUES (?, ?, ?, ?, datetime('now', '-3 days'))
  `).run(uuidv4(), bannedProviderId, adminId, 'Reincidência em mau atendimento e faltas.');

  console.log('✅ 2 Reports criados (pending)!');
  console.log('✅ 1 Banimento ativo criado!');
} else {
  console.log('⚠️ Rode os outros seeds primeiro para ter clientes e prestadores.');
}

db.close();
