import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/modules/users/users.service';
import { AuthService } from '../src/modules/auth/auth.service';

async function createAdminUser() {
  console.log('🚀 Starting admin user creation...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const usersService = app.get(UsersService);
    const authService = app.get(AuthService);

    const adminEmail = 'admin@entrix.com';
    const adminPassword = 'AdminPassword123!';

    console.log(`📧 Creating admin user with email: ${adminEmail}`);

    // Check if admin user already exists
    const existingUser = await usersService.findByEmail(adminEmail);
    
    if (existingUser) {
      console.log('⚠️  Admin user already exists!');
      console.log(`User ID: ${existingUser.id}`);
      console.log(`Email: ${existingUser.email}`);
      
      // Try to login to verify credentials
      try {
        const loginResult = await authService.login(adminEmail, adminPassword);
        console.log('✅ Admin user login successful!');
        console.log(`Access Token: ${loginResult.access_token.substring(0, 50)}...`);
        console.log(`Refresh Token: ${loginResult.refresh_token.substring(0, 50)}...`);
      } catch (loginError) {
        console.log('❌ Admin user exists but login failed. Password might be different.');
        console.log('You may need to reset the password or create a new admin user.');
      }
    } else {
      // Create new admin user
      const adminUser = await usersService.create({
        email: adminEmail,
        password: adminPassword,
        firstName: 'Admin',
        lastName: 'User',
      });

      console.log('✅ Admin user created successfully!');
      console.log(`User ID: ${adminUser.id}`);
      console.log(`Email: ${adminUser.email}`);

      // Test login
      const loginResult = await authService.login(adminEmail, adminPassword);
      console.log('✅ Admin user login successful!');
      console.log(`Access Token: ${loginResult.access_token.substring(0, 50)}...`);
      console.log(`Refresh Token: ${loginResult.refresh_token.substring(0, 50)}...`);
    }

    console.log('\n📋 Admin User Credentials:');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log('\n💡 You can now use these credentials for testing!');

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await app.close();
  }
}

// Run the script
createAdminUser()
  .then(() => {
    console.log('✅ Admin user setup completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Admin user setup failed:', error);
    process.exit(1);
  }); 