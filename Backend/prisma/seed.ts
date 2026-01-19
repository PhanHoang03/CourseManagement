import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import path from 'path';

const prisma = new PrismaClient();

const defaultPassword = 'password123'; // Default password for all seeded users

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Step 1: Find and preserve admin user
  console.log('📋 Step 1: Finding admin user...');
  const adminUser = await prisma.user.findFirst({
    where: { role: 'admin' },
  });

  if (!adminUser) {
    throw new Error('No admin user found! Please create an admin user first.');
  }

  const adminId = adminUser.id;
  let adminOrgId = adminUser.organizationId;
  const adminDeptId = adminUser.departmentId;

  // If admin has no organization, create one
  if (!adminOrgId) {
    console.log('⚠️  Admin has no organization, creating default organization...');
    const defaultOrg = await prisma.organization.create({
      data: {
        name: 'Default Organization',
        slug: 'default-org',
        isActive: true,
      },
    });
    adminOrgId = defaultOrg.id;
    
    // Update admin user with organization
    await prisma.user.update({
      where: { id: adminId },
      data: { organizationId: adminOrgId },
    });
    console.log(`✅ Created default organization: ${defaultOrg.name} (ID: ${adminOrgId})`);
  }

  console.log(`✅ Admin user found: ${adminUser.email} (ID: ${adminId}, Org: ${adminOrgId})\n`);

  // Step 2: Clear all data except admin
  console.log('🗑️  Step 2: Clearing database (preserving admin)...');

  // Delete in order to respect foreign key constraints
  await prisma.assessmentAttempt.deleteMany({});
  await prisma.assignmentSubmission.deleteMany({});
  await prisma.progress.deleteMany({});
  await prisma.enrollment.deleteMany({});
  await prisma.assessment.deleteMany({});
  await prisma.assignment.deleteMany({});
  await prisma.content.deleteMany({});
  await prisma.module.deleteMany({});
  await prisma.coursePrerequisite.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.sessionAttendance.deleteMany({});
  await prisma.trainingSession.deleteMany({});
  await prisma.certificate.deleteMany({});
  await prisma.certificateTemplate.deleteMany({});
  await prisma.announcement.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.auditLog.deleteMany({});
  
  // Delete all users except admin
  await prisma.user.deleteMany({
    where: {
      id: { not: adminId },
    },
  });

  // Delete all departments (they will be recreated)
  await prisma.department.deleteMany({});
  
  // Delete all organizations except admin's organization
  if (adminOrgId) {
    await prisma.organization.deleteMany({
      where: {
        id: { not: adminOrgId },
      },
    });
  } else {
    await prisma.organization.deleteMany({});
  }

  console.log('✅ Database cleared (admin preserved)\n');

  // Step 2.5: Create organizations and departments
  console.log('🏢 Step 2.5: Creating organizations and departments...');
  
  const organizationsData = [
    {
      name: 'TechCorp Solutions',
      slug: 'techcorp-solutions',
      domain: 'techcorp.com',
      departments: [
        { name: 'Engineering', code: 'ENG', description: 'Software Engineering Department' },
        { name: 'DevOps', code: 'OPS', description: 'DevOps and Infrastructure' },
        { name: 'Quality Assurance', code: 'QA', description: 'QA and Testing' },
      ],
    },
    {
      name: 'EduTech Academy',
      slug: 'edutech-academy',
      domain: 'edutech.edu',
      departments: [
        { name: 'Frontend Development', code: 'FE', description: 'Frontend Development Training' },
        { name: 'Backend Development', code: 'BE', description: 'Backend Development Training' },
        { name: 'Mobile Development', code: 'MOB', description: 'Mobile App Development' },
      ],
    },
    {
      name: 'Cloud Services Inc',
      slug: 'cloud-services-inc',
      domain: 'cloudservices.io',
      departments: [
        { name: 'Cloud Infrastructure', code: 'CLOUD', description: 'Cloud Infrastructure Team' },
        { name: 'Security', code: 'SEC', description: 'Security and Compliance' },
      ],
    },
  ];

  // Create all organizations (or use existing ones)
  const organizations: any[] = [];
  
  for (const orgData of organizationsData) {
    // Check if organization already exists
    let org = await prisma.organization.findUnique({
      where: { slug: orgData.slug },
    });
    
    if (!org) {
      org = await prisma.organization.create({
        data: {
          name: orgData.name,
          slug: orgData.slug,
          domain: orgData.domain,
          isActive: true,
        },
      });
      console.log(`  ✅ Created organization: ${org.name}`);
    } else {
      console.log(`  ✅ Using existing organization: ${org.name}`);
    }
    
    organizations.push(org);
  }

  // Assign admin to first organization
  adminOrgId = organizations[0].id;
  await prisma.user.update({
    where: { id: adminId },
    data: { organizationId: adminOrgId },
  });
  console.log(`  ✅ Assigned admin to organization: ${organizations[0].name}`);

  // Create departments for each organization
  const allDepartments: any[] = [];
  for (let i = 0; i < organizations.length; i++) {
    const org = organizations[i];
    const orgData = organizationsData[i];
    
    for (const deptData of orgData.departments) {
      // Check if department already exists
      let dept = await prisma.department.findFirst({
        where: {
          organizationId: org.id,
          code: deptData.code,
        },
      });
      
      if (!dept) {
        dept = await prisma.department.create({
          data: {
            name: deptData.name,
            code: deptData.code,
            description: deptData.description,
            organizationId: org.id,
            isActive: true,
          },
        });
        console.log(`  ✅ Created department: ${dept.name} (${org.name})`);
      } else {
        console.log(`  ✅ Using existing department: ${dept.name} (${org.name})`);
      }
      
      allDepartments.push(dept);
    }
  }

  console.log(`\n✅ Created ${organizations.length} organizations and ${allDepartments.length} departments\n`);

  // Step 3: Create instructors
  console.log('👨‍🏫 Step 3: Creating 5 instructors...');
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  // Distribute instructors across organizations and departments
  const instructorsData = [
    {
      employeeId: 'INST001',
      username: 'instructor1',
      email: 'instructor1@example.com',
      firstName: 'John',
      lastName: 'Smith',
      phone: '+1234567890',
      position: 'Senior Instructor',
      bio: 'Experienced instructor with 10+ years in software development',
      expertise: ['JavaScript', 'React', 'Node.js'],
      orgIndex: 0, // TechCorp Solutions
      deptIndex: 0, // Engineering
    },
    {
      employeeId: 'INST002',
      username: 'instructor2',
      email: 'instructor2@example.com',
      firstName: 'Sarah',
      lastName: 'Johnson',
      phone: '+1234567891',
      position: 'Lead Instructor',
      bio: 'Specialized in backend development and database design',
      expertise: ['Python', 'PostgreSQL', 'Docker'],
      orgIndex: 0, // TechCorp Solutions
      deptIndex: 1, // DevOps
    },
    {
      employeeId: 'INST003',
      username: 'instructor3',
      email: 'instructor3@example.com',
      firstName: 'Michael',
      lastName: 'Brown',
      phone: '+1234567892',
      position: 'Full Stack Instructor',
      bio: 'Expert in modern web development frameworks',
      expertise: ['Vue.js', 'TypeScript', 'MongoDB'],
      orgIndex: 1, // EduTech Academy
      deptIndex: 0, // Frontend Development
    },
    {
      employeeId: 'INST004',
      username: 'instructor4',
      email: 'instructor4@example.com',
      firstName: 'Emily',
      lastName: 'Davis',
      phone: '+1234567893',
      position: 'DevOps Instructor',
      bio: 'Specialized in cloud infrastructure and CI/CD',
      expertise: ['AWS', 'Kubernetes', 'Terraform'],
      orgIndex: 2, // Cloud Services Inc
      deptIndex: 0, // Cloud Infrastructure
    },
    {
      employeeId: 'INST005',
      username: 'instructor5',
      email: 'instructor5@example.com',
      firstName: 'David',
      lastName: 'Wilson',
      phone: '+1234567894',
      position: 'Mobile Development Instructor',
      bio: 'Expert in mobile app development for iOS and Android',
      expertise: ['React Native', 'Flutter', 'Swift'],
      orgIndex: 1, // EduTech Academy
      deptIndex: 2, // Mobile Development
    },
  ];

  const createdInstructors = await Promise.all(
    instructorsData.map((instructorData) => {
      const org = organizations[instructorData.orgIndex];
      const orgDepts = allDepartments.filter(d => d.organizationId === org.id);
      const dept = orgDepts[instructorData.deptIndex];
      
      return prisma.user.create({
        data: {
          employeeId: instructorData.employeeId,
          username: instructorData.username,
          email: instructorData.email,
          passwordHash,
          firstName: instructorData.firstName,
          lastName: instructorData.lastName,
          phone: instructorData.phone,
          role: 'instructor',
          position: instructorData.position,
          bio: instructorData.bio,
          expertise: instructorData.expertise,
          organizationId: org.id,
          departmentId: dept.id,
        },
      });
    })
  );

  console.log(`✅ Created ${createdInstructors.length} instructors\n`);

  // Step 4: Create trainees
  console.log('👥 Step 4: Creating 10 trainees...');

  // Distribute trainees across organizations and departments
  const traineesData = [
    { firstName: 'Alice', lastName: 'Anderson', orgIndex: 0, deptIndex: 0 },
    { firstName: 'Bob', lastName: 'Baker', orgIndex: 0, deptIndex: 1 },
    { firstName: 'Charlie', lastName: 'Clark', orgIndex: 0, deptIndex: 2 },
    { firstName: 'Diana', lastName: 'Diaz', orgIndex: 1, deptIndex: 0 },
    { firstName: 'Edward', lastName: 'Evans', orgIndex: 1, deptIndex: 1 },
    { firstName: 'Fiona', lastName: 'Foster', orgIndex: 1, deptIndex: 2 },
    { firstName: 'George', lastName: 'Garcia', orgIndex: 2, deptIndex: 0 },
    { firstName: 'Hannah', lastName: 'Harris', orgIndex: 2, deptIndex: 1 },
    { firstName: 'Ian', lastName: 'Irwin', orgIndex: 0, deptIndex: 0 },
    { firstName: 'Julia', lastName: 'Jones', orgIndex: 1, deptIndex: 1 },
  ];

  const createdTrainees = await Promise.all(
    traineesData.map((traineeData, index) => {
      const org = organizations[traineeData.orgIndex];
      const orgDepts = allDepartments.filter(d => d.organizationId === org.id);
      const dept = orgDepts[traineeData.deptIndex];
      
      return prisma.user.create({
        data: {
          employeeId: `TRN${String(index + 1).padStart(3, '0')}`,
          username: `trainee${index + 1}`,
          email: `trainee${index + 1}@example.com`,
          passwordHash,
          firstName: traineeData.firstName,
          lastName: traineeData.lastName,
          phone: `+12345679${String(index).padStart(2, '0')}`,
          role: 'trainee',
          position: 'Junior Developer',
          organizationId: org.id,
          departmentId: dept.id,
        },
      });
    })
  );

  console.log(`✅ Created ${createdTrainees.length} trainees\n`);

  // Step 5: Create courses with modules
  console.log('📚 Step 5: Creating 10 courses with modules...');

  const courseData = [
    {
      courseCode: 'REACT101',
      title: 'React.js Fundamentals',
      description: 'Learn the fundamentals of React.js including components, hooks, and state management',
      instructorId: createdInstructors[0].id,
      difficultyLevel: 'beginner',
      estimatedDuration: 40,
      status: 'published',
      tags: ['React', 'JavaScript', 'Frontend'],
      modules: [
        {
          title: 'Introduction to React',
          description: 'Get started with React basics',
          order: 1,
          estimatedDuration: 10,
          contents: [
            {
              contentType: 'video',
              title: 'React.js Tutorial - Introduction',
              description: 'Introduction to React.js',
              order: 1,
              fileUrl: '/uploads/videos/ReactJs-Tutorial.mp4',
              duration: 1800, // 30 minutes in seconds
            },
            {
              contentType: 'text',
              title: 'What is React?',
              description: 'Understanding React and its core concepts',
              order: 2,
              contentData: {
                text: 'React is a JavaScript library for building user interfaces. It allows you to create reusable UI components.',
              },
            },
          ],
        },
        {
          title: 'Components and Props',
          description: 'Learn about React components',
          order: 2,
          estimatedDuration: 15,
          contents: [
            {
              contentType: 'text',
              title: 'Component Basics',
              description: 'Understanding components',
              order: 1,
              contentData: {
                text: 'Components are the building blocks of React applications. They let you split the UI into independent, reusable pieces.',
              },
            },
          ],
        },
        {
          title: 'State and Hooks',
          description: 'Managing state in React',
          order: 3,
          estimatedDuration: 15,
          contents: [
            {
              contentType: 'text',
              title: 'useState Hook',
              description: 'Introduction to useState',
              order: 1,
              contentData: {
                text: 'The useState hook allows you to add state to functional components.',
              },
            },
          ],
        },
      ],
    },
    {
      courseCode: 'NODE101',
      title: 'Node.js Backend Development',
      description: 'Master Node.js for building scalable backend applications',
      instructorId: createdInstructors[1].id,
      difficultyLevel: 'intermediate',
      estimatedDuration: 50,
      status: 'published',
      tags: ['Node.js', 'Backend', 'JavaScript'],
      modules: [
        {
          title: 'Node.js Basics',
          description: 'Introduction to Node.js',
          order: 1,
          estimatedDuration: 15,
          contents: [
            {
              contentType: 'video',
              title: 'Node.js Tutorial - Getting Started',
              description: 'Introduction to Node.js',
              order: 1,
              fileUrl: '/uploads/videos/NodeJs-Tutorial.mp4',
              duration: 2400, // 40 minutes
            },
            {
              contentType: 'text',
              title: 'Node.js Overview',
              description: 'Understanding Node.js',
              order: 2,
              contentData: {
                text: 'Node.js is a JavaScript runtime built on Chrome\'s V8 JavaScript engine. It allows you to run JavaScript on the server.',
              },
            },
          ],
        },
        {
          title: 'Express.js Framework',
          description: 'Building REST APIs with Express',
          order: 2,
          estimatedDuration: 20,
          contents: [
            {
              contentType: 'text',
              title: 'Express.js Introduction',
              description: 'Getting started with Express',
              order: 1,
              contentData: {
                text: 'Express is a minimal and flexible Node.js web application framework that provides a robust set of features for web and mobile applications.',
              },
            },
          ],
        },
      ],
    },
    {
      courseCode: 'DOCKER101',
      title: 'Docker Containerization',
      description: 'Learn Docker for containerizing applications',
      instructorId: createdInstructors[2].id,
      difficultyLevel: 'intermediate',
      estimatedDuration: 35,
      status: 'published',
      tags: ['Docker', 'DevOps', 'Containers'],
      modules: [
        {
          title: 'Docker Fundamentals',
          description: 'Understanding Docker basics',
          order: 1,
          estimatedDuration: 20,
          contents: [
            {
              contentType: 'video',
              title: 'Docker Tutorial - Introduction',
              description: 'Introduction to Docker',
              order: 1,
              fileUrl: '/uploads/videos/Docker-Tutorial.mp4',
              duration: 3000, // 50 minutes
            },
            {
              contentType: 'text',
              title: 'What is Docker?',
              description: 'Understanding Docker',
              order: 2,
              contentData: {
                text: 'Docker is a platform for developing, shipping, and running applications in containers.',
              },
            },
          ],
        },
        {
          title: 'Docker Compose',
          description: 'Orchestrating multi-container applications',
          order: 2,
          estimatedDuration: 15,
          contents: [
            {
              contentType: 'text',
              title: 'Docker Compose Basics',
              description: 'Introduction to Docker Compose',
              order: 1,
              contentData: {
                text: 'Docker Compose is a tool for defining and running multi-container Docker applications.',
              },
            },
          ],
        },
      ],
    },
    {
      courseCode: 'PYTHON101',
      title: 'Python Programming',
      description: 'Learn Python from scratch',
      instructorId: createdInstructors[1].id,
      difficultyLevel: 'beginner',
      estimatedDuration: 45,
      status: 'published',
      tags: ['Python', 'Programming', 'Backend'],
      modules: [
        {
          title: 'Python Basics',
          description: 'Introduction to Python',
          order: 1,
          estimatedDuration: 20,
          contents: [
            {
              contentType: 'text',
              title: 'Python Introduction',
              description: 'Getting started with Python',
              order: 1,
              contentData: {
                text: 'Python is a high-level, interpreted programming language known for its simplicity and readability.',
              },
            },
          ],
        },
        {
          title: 'Data Structures',
          description: 'Python data structures',
          order: 2,
          estimatedDuration: 15,
          contents: [
            {
              contentType: 'text',
              title: 'Lists and Dictionaries',
              description: 'Working with data structures',
              order: 1,
              contentData: {
                text: 'Python provides several built-in data structures including lists, dictionaries, tuples, and sets.',
              },
            },
          ],
        },
        {
          title: 'Functions and Modules',
          description: 'Organizing code with functions',
          order: 3,
          estimatedDuration: 10,
          contents: [
            {
              contentType: 'text',
              title: 'Defining Functions',
              description: 'Creating reusable code',
              order: 1,
              contentData: {
                text: 'Functions allow you to organize code into reusable blocks.',
              },
            },
          ],
        },
      ],
    },
    {
      courseCode: 'VUE101',
      title: 'Vue.js Framework',
      description: 'Build modern web applications with Vue.js',
      instructorId: createdInstructors[2].id,
      difficultyLevel: 'beginner',
      estimatedDuration: 40,
      status: 'published',
      tags: ['Vue.js', 'Frontend', 'JavaScript'],
      modules: [
        {
          title: 'Vue.js Introduction',
          description: 'Getting started with Vue',
          order: 1,
          estimatedDuration: 15,
          contents: [
            {
              contentType: 'text',
              title: 'What is Vue.js?',
              description: 'Introduction to Vue',
              order: 1,
              contentData: {
                text: 'Vue.js is a progressive JavaScript framework for building user interfaces.',
              },
            },
          ],
        },
        {
          title: 'Components and Templates',
          description: 'Vue components',
          order: 2,
          estimatedDuration: 15,
          contents: [
            {
              contentType: 'text',
              title: 'Component Basics',
              description: 'Understanding Vue components',
              order: 1,
              contentData: {
                text: 'Vue components are reusable Vue instances with a name.',
              },
            },
          ],
        },
      ],
    },
    {
      courseCode: 'AWS101',
      title: 'AWS Cloud Fundamentals',
      description: 'Introduction to Amazon Web Services',
      instructorId: createdInstructors[3].id,
      difficultyLevel: 'intermediate',
      estimatedDuration: 60,
      status: 'published',
      tags: ['AWS', 'Cloud', 'DevOps'],
      modules: [
        {
          title: 'AWS Overview',
          description: 'Understanding AWS services',
          order: 1,
          estimatedDuration: 20,
          contents: [
            {
              contentType: 'text',
              title: 'Introduction to AWS',
              description: 'AWS basics',
              order: 1,
              contentData: {
                text: 'Amazon Web Services (AWS) is a comprehensive cloud computing platform.',
              },
            },
          ],
        },
        {
          title: 'EC2 and S3',
          description: 'Core AWS services',
          order: 2,
          estimatedDuration: 20,
          contents: [
            {
              contentType: 'text',
              title: 'EC2 Instances',
              description: 'Virtual servers in the cloud',
              order: 1,
              contentData: {
                text: 'Amazon EC2 provides scalable computing capacity in the cloud.',
              },
            },
          ],
        },
        {
          title: 'Cloud Security',
          description: 'AWS security best practices',
          order: 3,
          estimatedDuration: 20,
          contents: [
            {
              contentType: 'text',
              title: 'Security Best Practices',
              description: 'Securing your AWS resources',
              order: 1,
              contentData: {
                text: 'Security is a shared responsibility between AWS and the customer.',
              },
            },
          ],
        },
      ],
    },
    {
      courseCode: 'MOBILE101',
      title: 'React Native Mobile Development',
      description: 'Build cross-platform mobile apps',
      instructorId: createdInstructors[4].id,
      difficultyLevel: 'intermediate',
      estimatedDuration: 50,
      status: 'published',
      tags: ['React Native', 'Mobile', 'JavaScript'],
      modules: [
        {
          title: 'React Native Basics',
          description: 'Getting started with React Native',
          order: 1,
          estimatedDuration: 20,
          contents: [
            {
              contentType: 'text',
              title: 'Introduction to React Native',
              description: 'Mobile app development',
              order: 1,
              contentData: {
                text: 'React Native lets you build mobile apps using only JavaScript.',
              },
            },
          ],
        },
        {
          title: 'Navigation and State',
          description: 'Managing navigation in mobile apps',
          order: 2,
          estimatedDuration: 15,
          contents: [
            {
              contentType: 'text',
              title: 'React Navigation',
              description: 'Navigation patterns',
              order: 1,
              contentData: {
                text: 'React Navigation provides routing and navigation for React Native apps.',
              },
            },
          ],
        },
      ],
    },
    {
      courseCode: 'TYPESCRIPT101',
      title: 'TypeScript for JavaScript Developers',
      description: 'Add type safety to your JavaScript code',
      instructorId: createdInstructors[0].id,
      difficultyLevel: 'intermediate',
      estimatedDuration: 35,
      status: 'published',
      tags: ['TypeScript', 'JavaScript', 'Programming'],
      modules: [
        {
          title: 'TypeScript Basics',
          description: 'Introduction to TypeScript',
          order: 1,
          estimatedDuration: 15,
          contents: [
            {
              contentType: 'text',
              title: 'What is TypeScript?',
              description: 'TypeScript overview',
              order: 1,
              contentData: {
                text: 'TypeScript is a typed superset of JavaScript that compiles to plain JavaScript.',
              },
            },
          ],
        },
        {
          title: 'Advanced Types',
          description: 'Complex TypeScript types',
          order: 2,
          estimatedDuration: 20,
          contents: [
            {
              contentType: 'text',
              title: 'Generics and Interfaces',
              description: 'Advanced type features',
              order: 1,
              contentData: {
                text: 'TypeScript provides powerful type system features including generics and interfaces.',
              },
            },
          ],
        },
      ],
    },
    {
      courseCode: 'MONGODB101',
      title: 'MongoDB Database',
      description: 'Learn NoSQL database with MongoDB',
      instructorId: createdInstructors[2].id,
      difficultyLevel: 'beginner',
      estimatedDuration: 40,
      status: 'published',
      tags: ['MongoDB', 'Database', 'NoSQL'],
      modules: [
        {
          title: 'MongoDB Introduction',
          description: 'Understanding MongoDB',
          order: 1,
          estimatedDuration: 15,
          contents: [
            {
              contentType: 'text',
              title: 'What is MongoDB?',
              description: 'NoSQL database',
              order: 1,
              contentData: {
                text: 'MongoDB is a NoSQL document database that provides high performance and scalability.',
              },
            },
          ],
        },
        {
          title: 'CRUD Operations',
          description: 'Working with MongoDB',
          order: 2,
          estimatedDuration: 15,
          contents: [
            {
              contentType: 'text',
              title: 'Creating and Querying',
              description: 'Database operations',
              order: 1,
              contentData: {
                text: 'MongoDB provides flexible querying capabilities for working with documents.',
              },
            },
          ],
        },
        {
          title: 'Indexing and Performance',
          description: 'Optimizing MongoDB',
          order: 3,
          estimatedDuration: 10,
          contents: [
            {
              contentType: 'text',
              title: 'Database Indexing',
              description: 'Performance optimization',
              order: 1,
              contentData: {
                text: 'Indexes improve query performance by allowing MongoDB to find documents more efficiently.',
              },
            },
          ],
        },
      ],
    },
    {
      courseCode: 'KUBERNETES101',
      title: 'Kubernetes Orchestration',
      description: 'Container orchestration with Kubernetes',
      instructorId: createdInstructors[3].id,
      difficultyLevel: 'advanced',
      estimatedDuration: 70,
      status: 'published',
      tags: ['Kubernetes', 'DevOps', 'Containers'],
      modules: [
        {
          title: 'Kubernetes Basics',
          description: 'Introduction to Kubernetes',
          order: 1,
          estimatedDuration: 25,
          contents: [
            {
              contentType: 'text',
              title: 'What is Kubernetes?',
              description: 'Container orchestration',
              order: 1,
              contentData: {
                text: 'Kubernetes is an open-source container orchestration platform for automating deployment, scaling, and management.',
              },
            },
          ],
        },
        {
          title: 'Pods and Services',
          description: 'Core Kubernetes concepts',
          order: 2,
          estimatedDuration: 25,
          contents: [
            {
              contentType: 'text',
              title: 'Understanding Pods',
              description: 'Kubernetes pods',
              order: 1,
              contentData: {
                text: 'Pods are the smallest deployable units in Kubernetes.',
              },
            },
          ],
        },
        {
          title: 'Deployments and Scaling',
          description: 'Managing applications',
          order: 3,
          estimatedDuration: 20,
          contents: [
            {
              contentType: 'text',
              title: 'Deployment Strategies',
              description: 'Scaling applications',
              order: 1,
              contentData: {
                text: 'Kubernetes Deployments manage the creation and updating of Pods.',
              },
            },
          ],
        },
      ],
    },
  ];

  const createdCourses = [];

  for (let i = 0; i < courseData.length; i++) {
    const courseInfo = courseData[i];
    const { modules, ...courseFields } = courseInfo;
    
    // Assign course to instructor's organization and department
    const instructor = createdInstructors.find(inst => inst.id === courseInfo.instructorId);
    if (!instructor) {
      console.log(`  ⚠️  Skipping course ${courseInfo.title} - instructor not found`);
      continue;
    }
    
    const instructorOrg = organizations.find(org => org.id === instructor.organizationId);
    const instructorDept = allDepartments.find(dept => dept.id === instructor.departmentId);
    
    const course = await prisma.course.create({
      data: {
        ...courseFields,
        organizationId: instructorOrg!.id,
        departmentId: instructorDept?.id || undefined,
        isPublic: true, // Make courses visible to trainees
      },
    });

    // Create modules for this course
    for (const moduleInfo of modules) {
      const { contents, ...moduleFields } = moduleInfo;
      
      const module = await prisma.module.create({
        data: {
          ...moduleFields,
          courseId: course.id,
        },
      });

      // Create content for this module
      for (const contentInfo of contents) {
        await prisma.content.create({
          data: {
            ...contentInfo,
            moduleId: module.id,
          },
        });
      }
    }

    createdCourses.push(course);
    console.log(`  ✅ Created course: ${course.title} with ${modules.length} modules`);
  }

  console.log(`\n✅ Created ${createdCourses.length} courses with modules and content\n`);

  // Summary
  console.log('📊 Seed Summary:');
  console.log(`  - Organizations: ${organizations.length}`);
  console.log(`  - Departments: ${allDepartments.length}`);
  console.log(`  - Admin users: 1 (preserved)`);
  console.log(`  - Instructors: ${createdInstructors.length}`);
  console.log(`  - Trainees: ${createdTrainees.length}`);
  console.log(`  - Courses: ${createdCourses.length}`);
  console.log(`\n🔑 Default password for all users: ${defaultPassword}`);
  console.log('\n✅ Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
