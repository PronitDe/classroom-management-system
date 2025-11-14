import { PrismaClient, Role, RoomType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create users
  const teacherPassword = await bcrypt.hash('teacher123', 10);
  const spocPassword = await bcrypt.hash('spoc123', 10);
  const adminPassword = await bcrypt.hash('admin123', 10);
  const studentPassword = await bcrypt.hash('student123', 10);

  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@example.com' },
    update: {},
    create: {
      name: 'Dr. Rajesh Kumar',
      email: 'teacher@example.com',
      passwordHash: teacherPassword,
      role: Role.TEACHER,
    },
  });

  const spoc = await prisma.user.upsert({
    where: { email: 'spoc@example.com' },
    update: {},
    create: {
      name: 'Prof. Anita Sharma',
      email: 'spoc@example.com',
      passwordHash: spocPassword,
      role: Role.SPOC,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@example.com',
      passwordHash: adminPassword,
      role: Role.ADMIN,
    },
  });

  const student = await prisma.user.upsert({
    where: { email: 'student@example.com' },
    update: {},
    create: {
      name: 'Student Demo',
      email: 'student@example.com',
      passwordHash: studentPassword,
      role: Role.STUDENT,
    },
  });

  console.log('Users created:', { teacher, spoc, admin, student });

  // Create rooms - AU4 Building
  const au4Rooms = [
    { building: 'AU4', roomNo: '101', capacity: 60, type: RoomType.LECTURE_HALL },
    { building: 'AU4', roomNo: '102', capacity: 60, type: RoomType.LECTURE_HALL },
    { building: 'AU4', roomNo: '103', capacity: 50, type: RoomType.LECTURE_HALL },
    { building: 'AU4', roomNo: '201', capacity: 40, type: RoomType.LAB },
    { building: 'AU4', roomNo: '202', capacity: 40, type: RoomType.LAB },
    { building: 'AU4', roomNo: '301', capacity: 30, type: RoomType.SEMINAR_ROOM },
  ];

  // AU5 Building
  const au5Rooms = [
    { building: 'AU5', roomNo: '101', capacity: 80, type: RoomType.LECTURE_HALL },
    { building: 'AU5', roomNo: '102', capacity: 70, type: RoomType.LECTURE_HALL },
    { building: 'AU5', roomNo: '103', capacity: 60, type: RoomType.LECTURE_HALL },
    { building: 'AU5', roomNo: '201', capacity: 50, type: RoomType.LAB },
    { building: 'AU5', roomNo: '202', capacity: 50, type: RoomType.LAB },
    { building: 'AU5', roomNo: '301', capacity: 35, type: RoomType.SEMINAR_ROOM },
  ];

  // AU6 Building
  const au6Rooms = [
    { building: 'AU6', roomNo: '101', capacity: 100, type: RoomType.LECTURE_HALL },
    { building: 'AU6', roomNo: '102', capacity: 80, type: RoomType.LECTURE_HALL },
    { building: 'AU6', roomNo: '103', capacity: 60, type: RoomType.LECTURE_HALL },
    { building: 'AU6', roomNo: '201', capacity: 45, type: RoomType.LAB },
    { building: 'AU6', roomNo: '202', capacity: 45, type: RoomType.LAB },
    { building: 'AU6', roomNo: '301', capacity: 40, type: RoomType.SEMINAR_ROOM },
    { building: 'AU6', roomNo: '302', capacity: 30, type: RoomType.SEMINAR_ROOM },
  ];

  // AU7 Building
  const au7Rooms = [
    { building: 'AU7', roomNo: '101', capacity: 120, type: RoomType.LECTURE_HALL },
    { building: 'AU7', roomNo: '102', capacity: 90, type: RoomType.LECTURE_HALL },
    { building: 'AU7', roomNo: '103', capacity: 70, type: RoomType.LECTURE_HALL },
    { building: 'AU7', roomNo: '201', capacity: 60, type: RoomType.LAB },
    { building: 'AU7', roomNo: '202', capacity: 50, type: RoomType.LAB },
    { building: 'AU7', roomNo: '301', capacity: 25, type: RoomType.FACULTY_ROOM },
  ];

  const allRooms = [...au4Rooms, ...au5Rooms, ...au6Rooms, ...au7Rooms];

  for (const roomData of allRooms) {
    await prisma.room.upsert({
      where: {
        building_roomNo: {
          building: roomData.building,
          roomNo: roomData.roomNo,
        },
      },
      update: {},
      create: {
        ...roomData,
        isActive: true,
      },
    });
  }

  console.log(`Created ${allRooms.length} rooms across AU4-AU7 buildings`);
  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
