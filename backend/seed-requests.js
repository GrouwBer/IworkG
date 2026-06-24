const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, 'data', 'iworkg.db');
const db = new Database(DB_PATH);

// Get some client users to be request authors
const clients = db.prepare("SELECT id FROM users WHERE role = 'client' LIMIT 3").all();

// If no clients, create one
let clientId;
if (clients.length === 0) {
  clientId = uuidv4();
  db.prepare('INSERT INTO users (id, name, phone, role) VALUES (?, ?, ?, ?)').run(clientId, 'Cliente Teste', '5511999999991', 'client');
} else {
  clientId = clients[0].id;
}

const categories = db.prepare("SELECT id, name FROM categories LIMIT 12").all();

const insert = db.prepare(`
  INSERT INTO service_requests (id, client_id, title, description, urgency, category_id, latitude, longitude, address, city, state, status, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', datetime('now', ?))
`);

const requests = [
  { title: 'Troca de chuveiro elétrico', desc: 'Chuveiro queimou, preciso de troca urgente. Já comprei o novo, só instalar.', urgency: 'Alta', offset: '-1 hours' },
  { title: 'Pintura de quarto 15m²', desc: 'Quarto precisa de pintura nova, cor branca. Preferência para tinta lavável.', urgency: 'Média', offset: '-3 hours' },
  { title: 'Instalação de ar condicionado split', desc: 'Preciso instalar um split 12000 BTUs no quarto. Já tenho o aparelho.', urgency: 'Média', offset: '-5 hours' },
  { title: 'Reparo em vazamento de pia', desc: 'Pia da cozinha vazando, precisa de reparo no sifão.', urgency: 'Alta', offset: '-2 hours' },
  { title: 'Montagem de guarda-roupa 6 portas', desc: 'Comprei um guarda-roupa novo e preciso montar. Já está desembalado.', urgency: 'Baixa', offset: '-1 day' },
  { title: 'Limpeza pós-obra 80m²', desc: 'Terminei reforma do apartamento, precisa de limpeza geral.', urgency: 'Média', offset: '-6 hours' },
  { title: 'Troca de fechadura porta principal', desc: 'Fechadura emperrando, preciso trocar por uma nova tetra.', urgency: 'Alta', offset: '-30 minutes' },
  { title: 'Poda de árvore frutífera', desc: 'Mangueira no quintal precisa de poda, está muito alta.', urgency: 'Baixa', offset: '-12 hours' },
  { title: 'Conserto de portão elétrico', desc: 'Portão não abre mais, motor faz barulho mas não movimenta.', urgency: 'Alta', offset: '-1 hours' },
  { title: 'Instalação de tomadas e interruptores', desc: 'Reforma do escritório, preciso instalar 8 tomadas e 3 interruptores novos.', urgency: 'Média', offset: '-4 hours' },
];

// Poços de Caldas area coordinates
const baseLat = -21.7884;
const baseLng = -46.5616;

const tx = db.transaction(() => {
  for (const r of requests) {
    const cat = categories[Math.floor(Math.random() * categories.length)];
    const lat = baseLat + (Math.random() - 0.5) * 0.02;
    const lng = baseLng + (Math.random() - 0.5) * 0.02;
    insert.run(
      uuidv4(), clientId, r.title, r.desc, r.urgency,
      cat.id, lat, lng,
      'Rua de Teste, ' + Math.floor(Math.random() * 500),
      'Poços de Caldas', 'MG',
      r.offset
    );
  }
});

tx();
console.log('✅ ' + requests.length + ' pedidos de serviço criados!');
db.close();
