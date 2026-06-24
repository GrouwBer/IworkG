const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, 'data', 'iworkg.db');
const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

const providers = [
  { name: 'Ricardo Nunes', category: 'cat-eletricista', description: 'Eletricista especializado em automação residencial. Instalo tomadas inteligentes, sensores e sistemas de iluminação automatizada.', experience: 14, city: 'Poços de Caldas', state: 'MG', lat: -21.792, lng: -46.550, address: 'Rua Paraná, 70' },
  { name: 'Camila Torres', category: 'cat-eletricista', description: 'Eletricista predial. Manutenção preventiva, quadros de distribuição, padrão de entrada e aterramento.', experience: 6, city: 'Andradas', state: 'MG', lat: -22.068, lng: -46.568, address: 'Av. Ricarti Teixeira, 300' },
  { name: 'Thiago Moura', category: 'cat-encanador', description: 'Encanador especialista em sistemas de aquecimento solar. Instalação e manutenção de boilers e placas solares.', experience: 9, city: 'Poços de Caldas', state: 'MG', lat: -21.782, lng: -46.555, address: 'Rua Santa Catarina, 45' },
  { name: 'Patrícia Diniz', category: 'cat-pedreiro', description: 'Pedreira com foco em acabamentos de luxo. Porcelanato, mármore, granito e revestimentos importados.', experience: 18, city: 'Poços de Caldas', state: 'MG', lat: -21.793, lng: -46.562, address: 'Av. Santo Antônio, 1500' },
  { name: 'Gustavo Teixeira', category: 'cat-pedreiro', description: 'Pedreiro de obras rápidas. Pequenas reformas, reparos em muros, calçadas e contrapisos. Dias e sábados.', experience: 7, city: 'Caldas', state: 'MG', lat: -21.924, lng: -46.386, address: 'Rua do Comércio, 88' },
  { name: 'Sandra Vieira', category: 'cat-pintor', description: 'Pintora decorativa. Técnicas de marmorização, textura espanhola e pintura artística em paredes e tetos.', experience: 12, city: 'Poços de Caldas', state: 'MG', lat: -21.788, lng: -46.558, address: 'Rua Goiás, 200' },
  { name: 'Felipe Barros', category: 'cat-marceneiro', description: 'Marceneiro criativo. Móveis rústicos, pallets reaproveitados, estantes personalizadas e brinquedos de madeira.', experience: 5, city: 'Botelhos', state: 'MG', lat: -21.638, lng: -46.393, address: 'Rua Principal, 120' },
  { name: 'Amanda Lopes', category: 'cat-jardineiro', description: 'Paisagista especializada em jardins tropicais. Palmeiras, bromélias, orquídeas e lagos ornamentais com peixes.', experience: 10, city: 'Poços de Caldas', state: 'MG', lat: -21.785, lng: -46.564, address: 'Alameda das Flores, 55' },
  { name: 'Renato Campos', category: 'cat-faxineiro', description: 'Faxineiro especializado em limpeza pós-obra. Remoção de entulho fino, limpeza de vidros e rejunte.', experience: 3, city: 'Poços de Caldas', state: 'MG', lat: -21.790, lng: -46.553, address: 'Rua Piauí, 90' },
  { name: 'Daniela Pires', category: 'cat-mecanico', description: 'Mecânica de motos. Revisão geral, troca de relação, carburador e injeção eletrônica. Busco e entrego.', experience: 8, city: 'Poços de Caldas', state: 'MG', lat: -21.786, lng: -46.566, address: 'Av. João Pinheiro, 780' },
  { name: 'Eduardo Faria', category: 'cat-tecnico-refrigeracao', description: 'Técnico HVAC. Instalação de sistemas de climatização central, splits, multisplits e dutos de ventilação.', experience: 13, city: 'Poços de Caldas', state: 'MG', lat: -21.789, lng: -46.551, address: 'Rua Ceará, 32' },
  { name: 'Vanessa Castro', category: 'cat-chaveiro', description: 'Chaveira automotiva. Codificação de chaves com chip, conserto de fechaduras de carros e abertura de porta.', experience: 6, city: 'Poços de Caldas', state: 'MG', lat: -21.787, lng: -46.557, address: 'Rua Pernambuco, 14' },
  { name: 'Bruno Azevedo', category: 'cat-diarista', description: 'Diarista com referências. Limpeza geral, lavanderia, organização de closets e armários. Material incluso.', experience: 9, city: 'Poços de Caldas', state: 'MG', lat: -21.791, lng: -46.559, address: 'Rua Alagoas, 180' },
  { name: 'Letícia Dantas', category: 'cat-diarista', description: 'Diarista de confiança há 7 anos na mesma família. Cozinho, limpo e cuido de pets durante a faxina.', experience: 7, city: 'Poços de Caldas', state: 'MG', lat: -21.783, lng: -46.563, address: 'Rua Maranhão, 65' },
  { name: 'André Matos', category: 'cat-montador', description: 'Montador de móveis profissionais. Montagem de cozinhas planejadas, racks, painéis de TV e home theater.', experience: 11, city: 'Poços de Caldas', state: 'MG', lat: -21.784, lng: -46.556, address: 'Av. Francisco Salles, 2100' },
  { name: 'Carla Souza', category: 'cat-montador', description: 'Montadora de estruturas metálicas. Telhados, galpões, mezaninos e estruturas para energia solar.', experience: 4, city: 'Andradas', state: 'MG', lat: -22.070, lng: -46.565, address: 'Rua do Rosário, 55' },
  { name: 'Henrique Moraes', category: 'cat-eletricista', description: 'Eletricista de emergência 24h. Curto-circuito, queda de energia parcial, disjuntor desarmando. Chego em 30min.', experience: 16, city: 'Poços de Caldas', state: 'MG', lat: -21.790, lng: -46.560, address: 'Rua Sergipe, 22' },
  { name: 'Tatiana Reis', category: 'cat-pintor', description: 'Pintora de fachadas e áreas externas. Trabalho com tinta elastomérica, hidrorepelente e grafite artístico.', experience: 8, city: 'Poços de Caldas', state: 'MG', lat: -21.788, lng: -46.565, address: 'Rua Tocantins, 40' },
  { name: 'Marcelo Brito', category: 'cat-encanador', description: 'Encanador de emergência. Vazamentos, entupimentos, troca de registros e instalação de bombas dagua.', experience: 20, city: 'Poços de Caldas', state: 'MG', lat: -21.785, lng: -46.552, address: 'Rua Amapá, 15' },
  { name: 'Gabriela Xavier', category: 'cat-mecanico', description: 'Mecânica de carros importados. Especialidade em BMW, Audi e Mercedes. Scanner automotivo e reprogramação.', experience: 10, city: 'Poços de Caldas', state: 'MG', lat: -21.792, lng: -46.564, address: 'Av. Mansur Frayha, 3200' },
];

function generatePhone() {
  const ddds = ['35', '19', '11', '21', '31'];
  const ddd = ddds[Math.floor(Math.random() * ddds.length)];
  const num = String(Math.floor(Math.random() * 900000000 + 100000000));
  return `55${ddd}${num}`;
}

const insertUser = db.prepare('INSERT INTO users (id, name, phone, role) VALUES (?, ?, ?, ?)');
const insertProfile = db.prepare('INSERT INTO provider_profiles (id, user_id, category_id, description, rating, review_count, experience_years, service_radius_km, address, latitude, longitude, city, state, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)');

const tx = db.transaction(() => {
  for (const p of providers) {
    const userId = uuidv4();
    const phone = generatePhone();
    const profileId = uuidv4();
    insertUser.run(userId, p.name, phone, 'provider');
    insertProfile.run(
      profileId, userId, p.category, p.description,
      Math.round((3 + Math.random() * 2) * 10) / 10,
      Math.floor(Math.random() * 30),
      p.experience,
      Math.floor(Math.random() * 30) + 5,
      p.address,
      p.lat + (Math.random() - 0.5) * 0.01,
      p.lng + (Math.random() - 0.5) * 0.01,
      p.city,
      p.state
    );
  }
});

tx();
console.log('✅ +' + providers.length + ' prestadores adicionados!');
db.close();
