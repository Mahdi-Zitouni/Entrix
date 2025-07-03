import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { config as dotenvConfig } from 'dotenv';
import * as path from 'path';

dotenvConfig({ path: path.resolve(__dirname, '../.env') });

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  entities: ['src/modules/**/*.entity.{ts,js}'],
  synchronize: false,
});

async function resetAdminPassword() {
  const email = 'admin@entrix.com';
  const newPassword = 'Admin123!';
  try {
    await dataSource.initialize();
    const userRepo = dataSource.getRepository('User');
    const user = await userRepo.findOne({ where: { email } });
    if (!user) {
      console.error(`Admin user with email ${email} not found.`);
      process.exit(1);
    }
    const hashed = await bcrypt.hash(newPassword, 12);
    user.password = hashed;
    await userRepo.save(user);
    console.log(`Password for ${email} has been reset to: ${newPassword}`);
    process.exit(0);
  } catch (err) {
    console.error('Error resetting admin password:', err);
    process.exit(1);
  }
}

resetAdminPassword(); 