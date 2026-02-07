import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

// Use the same database config as the app
import prisma from '../src/config/database';

async function main() {
  console.log('🌱 Starting database seeding...');

  // Hash the password
  const hashedPassword = await bcrypt.hash('Admin@123', 10);

  // Upsert admin user (create or skip if exists)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@mausam.com' },
    update: {},
    create: {
      email: 'admin@mausam.com',
      password: hashedPassword,
      role: UserRole.ADMIN,
      isEmailVerified: true,
      isActive: true,
      isLocked: false,
      otpAttempts: 0,
      loginAttempts: 0,
      profile: {
        create: {
          name: 'System Administrator',
          phone: '+977-9800000000',
          address: 'Kathmandu, Nepal',
          latitude: 27.7172,
          longitude: 85.324,
        },
      },
    },
    include: {
      profile: true,
    },
  });

  console.log('✅ Admin user ready:');
  console.log({
    id: admin.id,
    email: admin.email,
    role: admin.role,
    name: admin.profile?.name,
  });
  console.log('\n📧 Email: admin@example.com');
  console.log('🔑 Password: Admin@123');
  console.log('\n⚠️  Please change the password after first login!');

  // ── Seed Categories ────────────────────────────────────
  console.log('\n🌱 Seeding categories...');

  const categoryData = [
    { name: 'Plumbing', description: 'Pipe repair, leak fixing, tap installation, and all plumbing solutions' },
    { name: 'Electrical', description: 'Wiring, switch repair, fan installation, and electrical troubleshooting' },
    { name: 'Cleaning', description: 'Home deep cleaning, kitchen cleaning, bathroom cleaning, and sanitization' },
    { name: 'Painting', description: 'Wall painting, texture painting, waterproofing, and color consultation' },
    { name: 'Carpentry', description: 'Furniture repair, door fitting, cabinet making, and woodwork' },
    { name: 'Appliance Repair', description: 'AC servicing, washing machine repair, refrigerator repair, and more' },
    { name: 'Gardening', description: 'Lawn care, plant trimming, garden setup, and landscaping services' },
    { name: 'Pest Control', description: 'Termite treatment, cockroach control, mosquito control, and fumigation' },
    { name: 'Home Shifting', description: 'Packing, loading, transport, unloading, and home relocation services' },
    { name: 'CCTV & Security', description: 'CCTV installation, security alarm setup, intercom fitting, and maintenance' },
  ];

  for (const cat of categoryData) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }

  console.log(`✅ ${categoryData.length} categories seeded`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });