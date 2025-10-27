import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive seed...');

  // ============================================================
  // 1. Create Roles
  // ============================================================
  console.log('📝 Creating roles...');
  const roles = ['admin', 'recruiter', 'jobseeker'];
  for (const roleName of roles) {
    await prisma.role.upsert({
      where: { roleName },
      update: {},
      create: { roleName },
    });
  }
  console.log('✅ Roles created');

  // ============================================================
  // 2. Create Admin User
  // ============================================================
  console.log('👤 Creating admin user...');
  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash('admin123', salt);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@jobboard.com' },
    update: {},
    create: {
      email: 'admin@jobboard.com',
      passwordHash: adminPasswordHash,
      userType: 'ADMIN',
      status: 'ACTIVE',
    },
  });

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
  console.log('✅ Admin user created (admin@jobboard.com / admin123)');

  // ============================================================
  // 3. Create Company Users
  // ============================================================
  console.log('🏢 Creating company users...');
  const companyPasswordHash = await bcrypt.hash('company123', salt);

  const companies = [
    {
      email: 'tech@acme.com',
      companyName: 'Acme Corporation',
      businessRegistrationNumber: '123-45-67890',
      companyAddress: '123 Gangnam-daero, Gangnam-gu, Seoul',
      managerName: 'Kim Min-soo',
      managerContact: '010-1234-5678',
      logoUrl: 'https://via.placeholder.com/150/0000FF/FFFFFF?text=ACME',
      pointsBalance: 50000,
    },
    {
      email: 'hr@startuptech.com',
      companyName: 'StartupTech Korea',
      businessRegistrationNumber: '234-56-78901',
      companyAddress: '456 Teheran-ro, Gangnam-gu, Seoul',
      managerName: 'Park Ji-young',
      managerContact: '010-2345-6789',
      logoUrl: 'https://via.placeholder.com/150/FF0000/FFFFFF?text=StartupTech',
      pointsBalance: 100000,
    },
    {
      email: 'jobs@bigcorp.com',
      companyName: 'BigCorp Industries',
      businessRegistrationNumber: '345-67-89012',
      companyAddress: '789 Sejong-daero, Jung-gu, Seoul',
      managerName: 'Lee Sung-min',
      managerContact: '010-3456-7890',
      logoUrl: 'https://via.placeholder.com/150/00FF00/000000?text=BigCorp',
      pointsBalance: 200000,
    },
    {
      email: 'careers@designstudio.com',
      companyName: 'Creative Design Studio',
      businessRegistrationNumber: '456-78-90123',
      companyAddress: '321 Hongik-ro, Mapo-gu, Seoul',
      managerName: 'Choi Ye-jin',
      managerContact: '010-4567-8901',
      logoUrl: 'https://via.placeholder.com/150/FFA500/FFFFFF?text=Design',
      pointsBalance: 30000,
    },
  ];

  const companyUsers = [];
  for (const company of companies) {
    const companyUser = await prisma.user.upsert({
      where: { email: company.email },
      update: {},
      create: {
        email: company.email,
        passwordHash: companyPasswordHash,
        userType: 'COMPANY',
        status: 'ACTIVE',
        companyProfile: {
          create: {
            companyName: company.companyName,
            businessRegistrationNumber: company.businessRegistrationNumber,
            companyAddress: company.companyAddress,
            managerName: company.managerName,
            managerContact: company.managerContact,
            logoUrl: company.logoUrl,
          },
        },
        wallet: {
          create: {
            pointsBalance: company.pointsBalance,
            resumeReadCoupons: 10,
          },
        },
      },
    });

    const recruiterRole = await prisma.role.findUnique({ where: { roleName: 'recruiter' } });
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

    companyUsers.push(companyUser);
  }
  console.log(`✅ ${companies.length} company users created (password: company123)`);

  // ============================================================
  // 4. Create Personal Users (Job Seekers)
  // ============================================================
  console.log('👥 Creating personal users...');
  const personalPasswordHash = await bcrypt.hash('user123', salt);

  const personalUsers = [];
  const personalUserData = [
    { email: 'john.doe@gmail.com', username: 'John Doe', contact: '010-1111-2222' },
    { email: 'jane.smith@gmail.com', username: 'Jane Smith', contact: '010-2222-3333' },
    { email: 'mike.wilson@gmail.com', username: 'Mike Wilson', contact: '010-3333-4444' },
    { email: 'sarah.jones@gmail.com', username: 'Sarah Jones', contact: '010-4444-5555' },
    { email: 'david.brown@gmail.com', username: 'David Brown', contact: '010-5555-6666' },
  ];

  for (const userData of personalUserData) {
    const personalUser = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        passwordHash: personalPasswordHash,
        userType: 'PERSONAL',
        status: 'ACTIVE',
        personalProfile: {
          create: {
            username: userData.username,
            contactNumber: userData.contact,
            birthdate: new Date('1990-01-01'),
          },
        },
      },
    });

    const jobseekerRole = await prisma.role.findUnique({ where: { roleName: 'jobseeker' } });
    if (jobseekerRole) {
      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: personalUser.id,
            roleId: jobseekerRole.id,
          },
        },
        update: {},
        create: {
          userId: personalUser.id,
          roleId: jobseekerRole.id,
        },
      });
    }

    personalUsers.push(personalUser);
  }
  console.log(`✅ ${personalUserData.length} personal users created (password: user123)`);

  // ============================================================
  // 5. Create Resumes
  // ============================================================
  console.log('📄 Creating resumes...');
  const resumes = [];
  const resumeTemplates = [
    {
      title: 'Senior Backend Developer',
      introduction: '5+ years of experience in backend development with Node.js and NestJS',
      skills: ['Node.js', 'TypeScript', 'NestJS', 'PostgreSQL', 'Docker', 'AWS'],
      workExperience: [
        {
          company: 'Tech Company A',
          position: 'Backend Developer',
          startDate: '2019-01',
          endDate: '2024-01',
          description: 'Developed scalable microservices',
        },
      ],
    },
    {
      title: 'Frontend Developer - React Specialist',
      introduction: '3 years of experience building modern web applications',
      skills: ['React', 'TypeScript', 'Next.js', 'TailwindCSS', 'Redux'],
      workExperience: [
        {
          company: 'Startup B',
          position: 'Frontend Developer',
          startDate: '2021-03',
          endDate: '2024-02',
          description: 'Built responsive web applications',
        },
      ],
    },
    {
      title: 'Full Stack Developer',
      introduction: 'Versatile developer with experience in both frontend and backend',
      skills: ['React', 'Node.js', 'Python', 'Django', 'MongoDB'],
      workExperience: [
        {
          company: 'Company C',
          position: 'Full Stack Developer',
          startDate: '2020-06',
          endDate: 'present',
          description: 'Full stack development and DevOps',
        },
      ],
    },
    {
      title: 'Junior Developer Portfolio',
      introduction: 'Fresh graduate eager to learn and contribute',
      skills: ['JavaScript', 'React', 'Node.js', 'Git'],
      workExperience: [],
    },
    {
      title: 'UI/UX Designer Resume',
      introduction: 'Creative designer with strong technical skills',
      skills: ['Figma', 'Adobe XD', 'HTML', 'CSS', 'JavaScript'],
      workExperience: [
        {
          company: 'Design Agency',
          position: 'UI/UX Designer',
          startDate: '2022-01',
          endDate: 'present',
          description: 'Designed user interfaces for web applications',
        },
      ],
    },
  ];

  for (let i = 0; i < personalUsers.length; i++) {
    const resume = await prisma.resume.create({
      data: {
        jobseekerUserId: personalUsers[i].id,
        title: resumeTemplates[i].title,
        introduction: resumeTemplates[i].introduction,
        skills: resumeTemplates[i].skills,
        workExperience: resumeTemplates[i].workExperience,
        educationHistory: [
          {
            school: 'Korea University',
            degree: 'Bachelor of Computer Science',
            startDate: '2014-03',
            endDate: '2018-02',
          },
        ],
        isDefault: true,
      },
    });
    resumes.push(resume);
  }
  console.log(`✅ ${resumes.length} resumes created`);

  // ============================================================
  // 6. Create Jobs
  // ============================================================
  console.log('💼 Creating jobs...');
  const jobs = [
    // Acme Corporation jobs
    {
      companyUserId: companyUsers[0].id,
      title: 'Senior Backend Developer',
      description: `We are looking for an experienced backend developer proficient in Node.js, TypeScript, and NestJS.

**Responsibilities:**
- Design and implement scalable APIs and microservices
- Work with PostgreSQL and Redis
- Collaborate with frontend team
- Code review and mentoring

**Requirements:**
- 5+ years of backend development experience
- Strong knowledge of Node.js and TypeScript
- Experience with NestJS or similar frameworks
- Database design and optimization skills`,
      employmentType: 'FULL_TIME',
      salaryType: 'YEARLY',
      salaryMin: 60000000,
      salaryMax: 90000000,
      location: 'Seoul, Gangnam-gu',
      remote: false,
      skills: ['Node.js', 'TypeScript', 'NestJS', 'PostgreSQL', 'Redis'],
      status: 'ACTIVE',
      expiresAt: new Date('2025-12-31'),
    },
    {
      companyUserId: companyUsers[0].id,
      title: 'DevOps Engineer',
      description: `Join our DevOps team to build and maintain cloud infrastructure.

**Responsibilities:**
- Kubernetes cluster management
- CI/CD pipeline development
- AWS infrastructure automation
- Monitoring and logging

**Requirements:**
- 3+ years of DevOps experience
- Strong AWS knowledge
- Kubernetes and Docker expertise`,
      employmentType: 'FULL_TIME',
      salaryType: 'YEARLY',
      salaryMin: 70000000,
      salaryMax: 100000000,
      location: 'Seoul, Gangnam-gu',
      remote: true,
      skills: ['Kubernetes', 'Docker', 'AWS', 'Terraform', 'Jenkins'],
      status: 'ACTIVE',
      expiresAt: new Date('2025-12-15'),
    },
    // StartupTech jobs
    {
      companyUserId: companyUsers[1].id,
      title: 'Frontend Developer (React)',
      description: `Looking for a passionate React developer to join our fast-growing startup.

**What you'll do:**
- Build modern web applications with React and TypeScript
- Work with Next.js and TailwindCSS
- Collaborate with designers and backend team
- Implement responsive and accessible UI

**Requirements:**
- 3+ years of React experience
- Strong TypeScript skills
- Experience with Next.js is a plus`,
      employmentType: 'FULL_TIME',
      salaryType: 'YEARLY',
      salaryMin: 50000000,
      salaryMax: 75000000,
      location: 'Seoul, Gangnam-gu',
      remote: true,
      skills: ['React', 'TypeScript', 'Next.js', 'TailwindCSS'],
      status: 'ACTIVE',
      expiresAt: new Date('2025-11-30'),
    },
    {
      companyUserId: companyUsers[1].id,
      title: 'Full Stack Developer (Remote)',
      description: `Remote-first position for experienced full stack developers.

**Tech Stack:**
- Frontend: React, TypeScript, Next.js
- Backend: Node.js, NestJS
- Database: PostgreSQL
- Cloud: AWS

**Benefits:**
- Fully remote work
- Flexible hours
- Modern tech stack
- Great team culture`,
      employmentType: 'FULL_TIME',
      salaryType: 'YEARLY',
      salaryMin: 55000000,
      salaryMax: 80000000,
      location: 'Remote',
      remote: true,
      skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS'],
      status: 'ACTIVE',
      expiresAt: new Date('2025-12-20'),
    },
    // BigCorp jobs
    {
      companyUserId: companyUsers[2].id,
      title: 'Junior Full Stack Developer',
      description: `Entry-level position for fresh graduates or developers with 1-2 years of experience.

**What we offer:**
- Comprehensive training program
- Mentorship from senior developers
- Career growth opportunities
- Modern office in Seoul

**Requirements:**
- Basic understanding of web development
- Familiarity with JavaScript/TypeScript
- Eagerness to learn
- Good communication skills`,
      employmentType: 'FULL_TIME',
      salaryType: 'YEARLY',
      salaryMin: 35000000,
      salaryMax: 45000000,
      location: 'Seoul, Jung-gu',
      remote: false,
      skills: ['JavaScript', 'React', 'Node.js', 'Git'],
      status: 'ACTIVE',
      expiresAt: new Date('2026-01-31'),
    },
    {
      companyUserId: companyUsers[2].id,
      title: 'Senior Software Architect',
      description: `Looking for an experienced software architect to lead our technical initiatives.

**Responsibilities:**
- System architecture design
- Technical leadership
- Technology selection and evaluation
- Code quality and best practices

**Requirements:**
- 10+ years of software development experience
- Strong architectural skills
- Leadership experience
- Excellent communication`,
      employmentType: 'FULL_TIME',
      salaryType: 'YEARLY',
      salaryMin: 100000000,
      salaryMax: 150000000,
      location: 'Seoul, Jung-gu',
      remote: false,
      skills: ['Architecture', 'Leadership', 'Java', 'Spring', 'Microservices'],
      status: 'ACTIVE',
      expiresAt: new Date('2025-11-15'),
    },
    // Design Studio jobs
    {
      companyUserId: companyUsers[3].id,
      title: 'UI/UX Designer',
      description: `Creative designer needed for various client projects.

**What you'll do:**
- Design user interfaces for web and mobile
- Create wireframes and prototypes
- Collaborate with developers
- User research and testing

**Requirements:**
- 2+ years of UI/UX design experience
- Strong Figma skills
- Portfolio required
- Understanding of HTML/CSS is a plus`,
      employmentType: 'FULL_TIME',
      salaryType: 'YEARLY',
      salaryMin: 40000000,
      salaryMax: 60000000,
      location: 'Seoul, Mapo-gu',
      remote: false,
      skills: ['Figma', 'Adobe XD', 'UI Design', 'UX Research'],
      status: 'ACTIVE',
      expiresAt: new Date('2025-11-25'),
    },
    {
      companyUserId: companyUsers[3].id,
      title: 'Part-time Graphic Designer',
      description: `Flexible part-time position for graphic designer.

**Details:**
- 20 hours per week
- Flexible schedule
- Remote work possible
- Various creative projects

**Requirements:**
- Experience with Adobe Creative Suite
- Strong portfolio
- Ability to work independently`,
      employmentType: 'PART_TIME',
      salaryType: 'HOURLY',
      salaryMin: 30000,
      salaryMax: 50000,
      location: 'Seoul, Mapo-gu',
      remote: true,
      skills: ['Photoshop', 'Illustrator', 'InDesign', 'Graphic Design'],
      status: 'ACTIVE',
      expiresAt: new Date('2025-10-31'),
    },
    // Additional diverse jobs
    {
      companyUserId: companyUsers[0].id,
      title: 'Data Engineer',
      description: `Build and maintain data pipelines and infrastructure.`,
      employmentType: 'FULL_TIME',
      salaryType: 'YEARLY',
      salaryMin: 65000000,
      salaryMax: 95000000,
      location: 'Seoul, Gangnam-gu',
      remote: true,
      skills: ['Python', 'Apache Spark', 'Airflow', 'AWS', 'SQL'],
      status: 'ACTIVE',
      expiresAt: new Date('2025-12-10'),
    },
    {
      companyUserId: companyUsers[1].id,
      title: 'Product Manager',
      description: `Lead product development from conception to launch.`,
      employmentType: 'FULL_TIME',
      salaryType: 'YEARLY',
      salaryMin: 70000000,
      salaryMax: 100000000,
      location: 'Seoul, Gangnam-gu',
      remote: false,
      skills: ['Product Management', 'Agile', 'User Research', 'Analytics'],
      status: 'ACTIVE',
      expiresAt: new Date('2025-11-20'),
    },
  ];

  const createdJobs = [];
  for (const jobData of jobs) {
    const { companyUserId, skills, ...rest } = jobData;
    const job = await prisma.job.create({
      data: {
        ...rest,
        skills: skills ? JSON.stringify(skills) : null,
        company: {
          connect: { id: companyUserId },
        },
      },
    });
    createdJobs.push(job);
  }
  console.log(`✅ ${createdJobs.length} jobs created`);

  // ============================================================
  // 7. Create Application Stages
  // ============================================================
  console.log('📊 Creating application stages...');
  const stages = [];
  for (const company of companyUsers) {
    const companyStages = [
      { stageName: 'Applied', stageOrder: 1, isDefaultStage: true },
      { stageName: 'Resume Screening', stageOrder: 2, isDefaultStage: true },
      { stageName: 'Technical Interview', stageOrder: 3, isDefaultStage: false },
      { stageName: 'Final Interview', stageOrder: 4, isDefaultStage: false },
      { stageName: 'Offer', stageOrder: 5, isDefaultStage: false },
    ];

    for (const stageData of companyStages) {
      const stage = await prisma.jobApplicationStage.create({
        data: {
          companyUserId: company.id,
          ...stageData,
        },
      });
      stages.push(stage);
    }
  }
  console.log(`✅ ${stages.length} application stages created`);

  // ============================================================
  // 8. Create Job Applications
  // ============================================================
  console.log('📝 Creating job applications...');
  const applications = [];

  // User 0 applies to jobs 0, 2, 4
  for (const jobIndex of [0, 2, 4]) {
    const job = createdJobs[jobIndex];
    const companyStages = stages.filter(s => s.companyUserId === job.companyUserId);

    const application = await prisma.jobApplication.create({
      data: {
        jobId: job.id,
        jobseekerUserId: personalUsers[0].id,
        resumeId: resumes[0].id,
        currentStageId: companyStages[0].id, // Applied stage
        status: 'ACTIVE',
      },
    });
    applications.push(application);
  }

  // User 1 applies to jobs 1, 3
  for (const jobIndex of [1, 3]) {
    const job = createdJobs[jobIndex];
    const companyStages = stages.filter(s => s.companyUserId === job.companyUserId);

    const application = await prisma.jobApplication.create({
      data: {
        jobId: job.id,
        jobseekerUserId: personalUsers[1].id,
        resumeId: resumes[1].id,
        currentStageId: companyStages[1].id, // Resume Screening stage
        status: 'ACTIVE',
      },
    });
    applications.push(application);
  }

  // User 2 applies to jobs 5, 6
  for (const jobIndex of [5, 6]) {
    const job = createdJobs[jobIndex];
    const companyStages = stages.filter(s => s.companyUserId === job.companyUserId);

    const application = await prisma.jobApplication.create({
      data: {
        jobId: job.id,
        jobseekerUserId: personalUsers[2].id,
        resumeId: resumes[2].id,
        currentStageId: companyStages[0].id,
        status: 'ACTIVE',
      },
    });
    applications.push(application);
  }

  console.log(`✅ ${applications.length} job applications created`);

  // ============================================================
  // 9. Create Bookmarks (P0 Feature)
  // ============================================================
  console.log('⭐ Creating bookmarks...');
  const bookmarks = [];

  // User 0 bookmarks jobs 1, 3, 5, 7
  for (const jobIndex of [1, 3, 5, 7]) {
    const bookmark = await prisma.bookmark.create({
      data: {
        userId: personalUsers[0].id,
        jobId: createdJobs[jobIndex].id,
      },
    });
    bookmarks.push(bookmark);
  }

  // User 1 bookmarks jobs 0, 2, 6
  for (const jobIndex of [0, 2, 6]) {
    const bookmark = await prisma.bookmark.create({
      data: {
        userId: personalUsers[1].id,
        jobId: createdJobs[jobIndex].id,
      },
    });
    bookmarks.push(bookmark);
  }

  // User 2 bookmarks jobs 4, 8
  for (const jobIndex of [4, 8]) {
    const bookmark = await prisma.bookmark.create({
      data: {
        userId: personalUsers[2].id,
        jobId: createdJobs[jobIndex].id,
      },
    });
    bookmarks.push(bookmark);
  }

  console.log(`✅ ${bookmarks.length} bookmarks created`);

  // ============================================================
  // Summary
  // ============================================================
  console.log('\n🎉 Seed completed successfully!\n');
  console.log('📊 Summary:');
  console.log(`   - Roles: ${roles.length}`);
  console.log(`   - Admin users: 1`);
  console.log(`   - Company users: ${companyUsers.length}`);
  console.log(`   - Personal users: ${personalUsers.length}`);
  console.log(`   - Resumes: ${resumes.length}`);
  console.log(`   - Jobs: ${createdJobs.length}`);
  console.log(`   - Application stages: ${stages.length}`);
  console.log(`   - Applications: ${applications.length}`);
  console.log(`   - Bookmarks: ${bookmarks.length}`);
  console.log('\n📝 Test Accounts:');
  console.log('   Admin: admin@jobboard.com / admin123');
  console.log('   Companies: tech@acme.com, hr@startuptech.com, etc. / company123');
  console.log('   Personal: john.doe@gmail.com, jane.smith@gmail.com, etc. / user123');
  console.log('\n✨ Ready for testing!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
