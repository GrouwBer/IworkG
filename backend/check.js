const db = require('better-sqlite3')('data/iworkg.db');
const user = db.prepare("SELECT * FROM users WHERE email='joaovictorborgescarvalho04@gmail.com'").get();
console.log('USER:', user);
if (user) {
  const profile = db.prepare('SELECT * FROM provider_profiles WHERE user_id=?').get(user.id);
  console.log('PROFILE:', profile);
}
