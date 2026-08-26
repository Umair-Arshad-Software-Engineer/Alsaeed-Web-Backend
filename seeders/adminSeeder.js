// seeders/adminSeeder.js
const { User } = require('../models');
const seedBranches = require('./branchSeeder');

const seedAdmin = async () => {
  try {
    const adminEmail = 'swittix@gmail.com';
    const adminPassword = '1129@AliHaider';

    const existingAdmin = await User.findOne({ where: { email: adminEmail } });

    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists, skipping seed.');
      return;
    }

    await User.create({
      email: adminEmail,
      password: adminPassword, // hashed automatically by the beforeCreate hook
      role: 'admin',
      isActive: true,
    });

    console.log('✅ Admin user created successfully.');

        await seedBranches();

  } catch (error) {
    console.error('❌ Failed to seed admin user:', error.message);
  }
};

module.exports = seedAdmin;