import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create roles
  const roles = ['admin', 'recruiter', 'jobseeker'];
  for (const roleName of roles) {
    await prisma.role.upsert({
      where: { roleName },
      update: {},
      create: { roleName },
    });
  }
  console.log('Roles created/verified');

  // Create admin user
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('admin123', salt);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@jobboard.com' },
    update: {},
    create: {
      email: 'admin@jobboard.com',
      passwordHash,
      userType: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  // Assign admin role
  const adminRole = await prisma.role.findUnique({ where: { roleName: 'admin' } });
  if (adminRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: adminUser.id,
          roleId: adminRole.id,
        },
      },
      update: {},
      create: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    });
  }
  console.log('Admin user created/verified');

  // Create company user
  const companyPasswordHash = await bcrypt.hash('company123', salt);
  const companyUser = await prisma.user.upsert({
    where: { email: 'company@example.com' },
    update: {},
    create: {
      email: 'company@example.com',
      passwordHash: companyPasswordHash,
      userType: 'COMPANY',
      status: 'ACTIVE',
      companyProfile: {
        create: {
          companyName: 'Acme Corporation',
          businessRegistrationNumber: '123-45-67890',
          companyAddress: '123 Main St, Seoul, Korea',
          managerName: 'John Doe',
          managerContact: '010-1234-5678',
        },
      },
      wallet: {
        create: {
          pointsBalance: 0,
          resumeReadCoupons: 0,
        },
      },
    },
  });

  // Assign recruiter role
  const recruiterRole = await prisma.role.findUnique({
    where: { roleName: 'recruiter' },
  });
  if (recruiterRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: companyUser.id,
          roleId: recruiterRole.id,
        },
      },
      update: {},
      create: {
        userId: companyUser.id,
        roleId: recruiterRole.id,
      },
    });
  }
  console.log('Company user created/verified');

  // Create sample jobs
  const jobs = [
    {
      title: 'Senior Backend Developer',
      description:
        'We are looking for an experienced backend developer proficient in Node.js, TypeScript, and NestJS. You will be responsible for designing and implementing scalable APIs and microservices.',
      employmentType: 'FULL_TIME',
      salaryType: 'YEARLY',
      salaryMin: 60000000,
      salaryMax: 90000000,
      status: 'ACTIVE',
      expiresAt: new Date('2025-12-31'),
    },
    {
      title: 'Frontend Developer (React)',
      description:
        'Join our frontend team to build modern web applications using React, TypeScript, and TailwindCSS. Experience with Next.js is a plus.',
      employmentType: 'FULL_TIME',
      salaryType: 'YEARLY',
      salaryMin: 50000000,
      salaryMax: 75000000,
      status: 'ACTIVE',
      expiresAt: new Date('2025-11-30'),
    },
    {
      title: 'DevOps Engineer',
      description:
        'We need a DevOps engineer with experience in Kubernetes, Docker, AWS, and CI/CD pipelines. You will help us scale our infrastructure.',
      employmentType: 'FULL_TIME',
      salaryType: 'YEARLY',
      salaryMin: 70000000,
      salaryMax: 100000000,
      status: 'ACTIVE',
      expiresAt: new Date('2025-12-15'),
    },
    {
      title: 'Junior Full Stack Developer',
      description:
        'Entry-level position for fresh graduates or developers with 1-2 years of experience. We will provide mentorship and training.',
      employmentType: 'FULL_TIME',
      salaryType: 'YEARLY',
      salaryMin: 35000000,
      salaryMax: 45000000,
      status: 'ACTIVE',
      expiresAt: new Date('2026-01-31'),
    },
    {
      title: 'Part-time UI/UX Designer',
      description:
        'Looking for a creative UI/UX designer to work on various projects. Flexible hours, remote work possible.',
      employmentType: 'PART_TIME',
      salaryType: 'HOURLY',
      salaryMin: 30000,
      salaryMax: 50000,
      status: 'ACTIVE',
      expiresAt: new Date('2025-10-31'),
    },
  ];

  for (const jobData of jobs) {
    await prisma.job.create({
      data: {
        ...jobData,
        companyUserId: companyUser.id,
      },
    });
  }
  console.log('Sample jobs created');

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
