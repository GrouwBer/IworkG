const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, 'data', 'iworkg.db');
const db = new Database(DB_PATH);

// Create 5 new client users so requests come from different people
const newClients = [
  { name: 'Roberto Alves', phone: '5535999887766', email: 'roberto@email.com' },
  { name: 'Fernanda Gomes', phone: '5519988776655', email: 'fernanda@email.com' },
  { name: 'Cláudio Mendes', phone: '5511977665544', email: 'claudio@email.com' },
  { name: 'Patrícia Santos', phone: '5521999887744', email: 'patricia@email.com' },
  { name: 'Luiz Fernando', phone: '5531998776622', email: 'luiz@email.com' },
];

const categories = db.prepare("SELECT id, name FROM categories LIMIT 12").all();
const baseLat = -21.7884;
const baseLng = -46.5616;

const insertUser = db.prepare('INSERT INTO users (id, name, phone, email, role) VALUES (?, ?, ?, ?, ?)');
const insertRequest = db.prepare(`INSERT INTO service_requests (id, client_id, title, description, category_id, urgency, latitude, longitude, city, state, address, budget, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?))`);

const requests = [
  'Preciso de eletricista para instalar lustre', 'Lustre de 8 lâmpadas, pé direito alto. Preciso de profissional com escada.',
  'Vazamento no banheiro', 'Água infiltrando no rejunte do box. Preciso de avaliação e reparo.',
  'Pintura de fachada', 'Fachada de casa de 2 andares, aproximadamente 80m². Tinta já comprada.',
  'Jardim abandonado', 'Jardim de 50m² tomado por mato. Preciso de limpeza e replantio.',
  'Montagem de cozinha planejada', 'Cozinha Itatiaia 12 módulos. Preciso de montador com experiência.',
];

const tx = db.transaction(() => {
  for (let i = 0; i < newClients.length; i++) {
    const c = newClients[i];
    const userId = uuidv4();
    insertUser.run(userId, c.name, c.phone, c.email, 'client');
    
    const cat = categories[Math.floor(Math.random() * categories.length)];
    const urgency = ['Alta', 'Média', 'Baixa'][Math.floor(Math.random() * 3)];
    const lat = baseLat + (Math.random() - 0.5) * 0.03;
    const lng = baseLng + (Math.random() - 0.5) * 0.03;
    const budget = Math.random() > 0.5 ? Math.round(Math.random() * 500 + 50) : null;
    
    const title = requests[i * 2];
    const desc = requests[i * 2 + 1];
    const offset = `-${Math.floor(Math.random() * 48)} hours`;
    
    insertRequest.run(
      uuidv4(), userId, title, desc, cat.id, urgency,
      lat, lng, 'Poços de Caldas', 'MG',
      `Rua de Teste, ${Math.floor(Math.random() * 500)}`,
      budget, offset
    );
  }
});

tx();
console.log('✅ 5 novos clientes + 5 pedidos de outras pessoas criados!');
db.close();
