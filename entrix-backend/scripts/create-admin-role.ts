import { DataSource } from 'typeorm';
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

async function createAdminRole() {
  try {
    await dataSource.initialize();
    console.log('✅ Database connected successfully');

    // Get role repository
    const roleRepo = dataSource.getRepository('Role');

    // Check if ADMIN role already exists
    const existingAdminRole = await roleRepo.findOne({ where: { code: 'ADMIN' } });
    if (existingAdminRole) {
      console.log('✅ ADMIN role already exists');
      return;
    }

    // Create ADMIN role
    const adminRole = roleRepo.create({
      code: 'ADMIN',
      name: 'Administrator',
      description: 'Gestion avancée de la plateforme et des utilisateurs',
      level: 50,
      isActive: true,
    });

    await roleRepo.save(adminRole);
    console.log('✅ Successfully created ADMIN role');

  } catch (error) {
    console.error('❌ Error creating admin role:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

createAdminRole(); 