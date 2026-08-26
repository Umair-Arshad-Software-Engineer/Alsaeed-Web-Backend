// seeders/branchSeeder.js
const { Branch } = require('../models');

const defaultBranches = [
  {
    name: 'Gaib Choke Branch',
    address: '552Q+62W Gaib Choke, Islampura, Gujranwala',
    phone: '+92 55 1234567',
    hours: '6:30 AM – 12:15 AM (Daily)',
    features: ['Free Parking', 'Family Section', 'Takeaway'],
    icon: '🏪',
    tagline: 'Our original flagship location',
    order: 0,
    isActive: true,
  },
  {
    name: 'Satellite Town Branch',
    address: '5683+WJM, Sardar Town Block A Satellite Town, Gujranwala',
    phone: '+92 55 2345678',
    hours: '6:30 AM – 12:15 AM (Daily)',
    features: ['Dine In', 'Delivery', 'Party Hall'],
    icon: '🏛️',
    tagline: 'Spacious hall for celebrations',
    order: 1,
    isActive: true,
  },
  {
    name: 'Wapda Town Branch',
    address: 'B-3 Block Phase B Wapda Town, Gujranwala',
    phone: '+92 55 3456789',
    hours: '6:30 AM – 12:15 AM (Daily)',
    features: ['Drive Thru', 'Online Order', 'Kids Area'],
    icon: '🏭',
    tagline: 'Convenient drive-thru service',
    order: 2,
    isActive: true,
  },
];

const seedBranches = async () => {
  try {
    const count = await Branch.count();
    if (count === 0) {
      console.log('🌱 Seeding branches...');
      await Branch.bulkCreate(defaultBranches);
      console.log('✅ Branches seeded successfully');
    } else {
      console.log('ℹ️ Branches already exist, skipping seed');
    }
  } catch (error) {
    console.error('❌ Error seeding branches:', error);
  }
};

module.exports = seedBranches;