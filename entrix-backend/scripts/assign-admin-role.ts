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

async function assignAdminRole() {
  const adminEmail = 'admin@entrix.com';
  
  try {
    await dataSource.initialize();
    console.log('✅ Database connected successfully');

    // Get repositories
    const userRepo = dataSource.getRepository('User');
    const roleRepo = dataSource.getRepository('Role');
    const userRoleRepo = dataSource.getRepository('UserRole');

    // Find admin user
    const adminUser = await userRepo.findOne({ where: { email: adminEmail } });
    if (!adminUser) {
      console.error(`❌ Admin user with email ${adminEmail} not found.`);
      process.exit(1);
    }
    console.log(`✅ Found admin user: ${adminUser.email}`);

    // Find ADMIN role
    const adminRole = await roleRepo.findOne({ where: { code: 'ADMIN' } });
    if (!adminRole) {
      console.error('❌ ADMIN role not found in database.');
      process.exit(1);
    }
    console.log(`✅ Found ADMIN role: ${adminRole.name}`);

    // Check if admin user already has ADMIN role
    const existingUserRole = await userRoleRepo.findOne({
      where: {
        user: { id: adminUser.id },
        role: { id: adminRole.id }
      }
    });

    if (existingUserRole) {
      console.log('✅ Admin user already has ADMIN role assigned');
      return;
    }

    // Assign ADMIN role to admin user
    const userRole = userRoleRepo.create({
      user: adminUser,
      role: adminRole,
      status: 'ACTIVE',
      assignedAt: new Date(),
    });

    await userRoleRepo.save(userRole);
    console.log('✅ Successfully assigned ADMIN role to admin user');

  } catch (error) {
    console.error('❌ Error assigning admin role:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

assignAdminRole(); 