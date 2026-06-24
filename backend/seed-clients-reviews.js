const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, 'data', 'iworkg.db');
const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

// ── 10 novos clientes (só clientes, não prestadores) ──
const clients = [
  { name: 'Marina Telles', phone: '5535988771122' },
  { name: 'Augusto Cesar', phone: '5511988663344' },
  { name: 'Helena Dutra', phone: '5521988556677' },
  { name: 'Nelson Freitas', phone: '5531988445566' },
  { name: 'Cintia Lacerda', phone: '5535988334455' },
  { name: 'Otávio Rangel', phone: '5519988223344' },
  { name: 'Renata Borges', phone: '5521988112233' },
  { name: 'Fabrício Neves', phone: '5531988001122' },
  { name: 'Tatiane Moura', phone: '5535988990011' },
  { name: 'Valdir Coelho', phone: '5511988779900' },
];

const categories = db.prepare("SELECT id, name FROM categories LIMIT 12").all();
const providers = db.prepare("SELECT u.id, u.name, pp.id as profile_id FROM users u JOIN provider_profiles pp ON pp.user_id = u.id ORDER BY RANDOM()").all();

const baseLat = -21.7884;
const baseLng = -46.5616;

const requestTitles = [
  ['Troca de resistência de chuveiro', 'Chuveiro Lorenzetti parou de esquentar. Preciso trocar a resistência.'],
  ['Instalação de ventilador de teto', 'Comprei 2 ventiladores e preciso instalar na sala e no quarto.'],
  ['Reparo de tomada queimada', 'Uma tomada da cozinha soltou faísca e parou de funcionar.'],
  ['Entupimento de pia', 'Pia da cozinha entupida, água não desce. Preciso urgente.'],
  ['Reboco de parede', 'Parede do quintal descascando, aproximadamente 6m².'],
  ['Pintura de portão', 'Portão de ferro enferrujando, preciso lixar e pintar.'],
  ['Montagem de estante', 'Estante de 8 prateleiras nova na caixa. Preciso montar.'],
  ['Gramado para plantar', 'Preparar terreno de 30m² para plantar grama esmeralda.'],
  ['Limpeza de caixa dágua', 'Caixa dágua de 1000L precisa de limpeza.'],
  ['Chave quebrada na fechadura', 'A chave quebrou dentro da fechadura do portão. Preciso extrair e trocar.'],
];

const reviewTexts = [
  'Excelente profissional! Chegou no horário, service rápido e bem feito. Super recomendo.',
  'Muito bom! Resolveu o problema que outros não conseguiram. Preço justo.',
  'Profissional muito competente e educado. Deixou tudo limpo depois do service. Nota 10!',
  'Fez um ótimo trabalho, mas atrasou 30 minutos. No geral, recomendo.',
  'Atendimento excelente, resolveu rapidinho. Voltarei a chamar quando precisar.',
  'Profissional de confiança, explicou tudo que ia fazer. Muito satisfeita com o resultado.',
  'Preço um pouco acima da média, mas o service foi impecável. Valeu cada centavo.',
  'Muito atencioso e caprichoso. O service ficou melhor do que eu esperava.',
  'Pontual e eficiente. Resolveu em 1h o que eu achava que levaria o dia todo.',
  'Trabalho bem feito, material de qualidade. Já indiquei pra vizinhança.',
];

const insertUser = db.prepare('INSERT INTO users (id, name, phone, role) VALUES (?, ?, ?, ?)');
const insertRequest = db.prepare(`INSERT INTO service_requests (id, client_id, title, description, category_id, urgency, latitude, longitude, city, state, address, budget, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?))`);
const insertReview = db.prepare('INSERT INTO reviews (id, provider_id, client_id, rating, comment) VALUES (?, ?, ?, ?, ?)');

const tx = db.transaction(() => {
  for (let i = 0; i < 10; i++) {
    const c = clients[i];
    const userId = uuidv4();
    insertUser.run(userId, c.name, c.phone, 'client');

    // Create a service request
    const cat = categories[Math.floor(Math.random() * categories.length)];
    const urgency = ['Alta', 'Média', 'Baixa'][Math.floor(Math.random() * 3)];
    const lat = baseLat + (Math.random() - 0.5) * 0.03;
    const lng = baseLng + (Math.random() - 0.5) * 0.03;
    const budget = Math.random() > 0.4 ? Math.round(Math.random() * 500 + 50) : null;
    const [title, desc] = requestTitles[i];
    const offset = `-${Math.floor(Math.random() * 72)} hours`;

    const requestId = uuidv4();
    insertRequest.run(requestId, userId, title, desc, cat.id, urgency, lat, lng, 'Poços de Caldas', 'MG', `Rua Exemplo, ${100 + i * 10}`, budget, offset);

    // Leave a review for a random provider
    const provider = providers[Math.floor(Math.random() * providers.length)];
    const rating = Math.floor(Math.random() * 2) + 4; // 4 or 5
    insertReview.run(uuidv4(), provider.profile_id, userId, rating, reviewTexts[i]);
  }
});

tx();
console.log('✅ +10 clientes, +10 pedidos, +10 avaliações criados!');
db.close();
