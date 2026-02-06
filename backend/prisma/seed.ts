import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

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
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });