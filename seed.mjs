import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '../drizzle/schema.ts';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection, { schema, mode: 'default' });

console.log('🌱 Starting database seeding...');

// Clear existing data
console.log('🧹 Clearing existing data...');
await db.delete(schema.vehicleEntries);
await db.delete(schema.violations);
await db.delete(schema.vehicles);
console.log('✅ Existing data cleared');

// Sample vehicles data
const vehicles = [
  {
    plateNumber: 'أ ب ج 1234',
    plateRegion: 'الرياض',
    ownerName: 'أحمد محمد العلي',
    ownerType: 'student',
    ownerIdNumber: '1234567890',
    ownerPhone: '0501234567',
    ownerEmail: 'ahmed@imamu.edu.sa',
    vehicleMake: 'تويوتا',
    vehicleModel: 'كامري',
    vehicleYear: 2022,
    vehicleColor: 'أبيض',
    permitType: 'student',
    permitNumber: 'STU-2024-001',
    permitExpiry: new Date('2024-12-31'),
    status: 'active',
    notes: 'مركبة طالب - كلية الهندسة',
  },
  {
    plateNumber: 'س ص ع 5678',
    plateRegion: 'الرياض',
    ownerName: 'د. فاطمة خالد السعيد',
    ownerType: 'faculty',
    ownerIdNumber: '9876543210',
    ownerPhone: '0509876543',
    ownerEmail: 'fatima@imamu.edu.sa',
    vehicleMake: 'هوندا',
    vehicleModel: 'أكورد',
    vehicleYear: 2023,
    vehicleColor: 'أسود',
    permitType: 'faculty',
    permitNumber: 'FAC-2024-001',
    permitExpiry: new Date('2024-12-31'),
    status: 'active',
    notes: 'عضو هيئة تدريس - كلية الشريعة',
  },
  {
    plateNumber: 'د ذ ر 9012',
    plateRegion: 'الرياض',
    ownerName: 'محمد عبدالله الغامدي',
    ownerType: 'staff',
    ownerIdNumber: '5555555555',
    ownerPhone: '0505555555',
    ownerEmail: 'mohammed@imamu.edu.sa',
    vehicleMake: 'نيسان',
    vehicleModel: 'التيما',
    vehicleYear: 2021,
    vehicleColor: 'فضي',
    permitType: 'staff',
    permitNumber: 'STF-2024-001',
    permitExpiry: new Date('2024-12-31'),
    status: 'active',
    notes: 'موظف إداري - عمادة القبول',
  },
  {
    plateNumber: 'ك ل م 3456',
    plateRegion: 'الرياض',
    ownerName: 'خالد سعد المطيري',
    ownerType: 'student',
    ownerIdNumber: '7777777777',
    ownerPhone: '0507777777',
    ownerEmail: 'khalid@imamu.edu.sa',
    vehicleMake: 'هيونداي',
    vehicleModel: 'سوناتا',
    vehicleYear: 2020,
    vehicleColor: 'أزرق',
    permitType: 'student',
    permitNumber: 'STU-2024-002',
    permitExpiry: new Date('2024-06-30'),
    status: 'suspended',
    notes: 'مركبة معلقة - تجاوز عدد المخالفات',
  },
  {
    plateNumber: 'هـ و ي 7890',
    plateRegion: 'الرياض',
    ownerName: 'سارة علي الشهري',
    ownerType: 'student',
    ownerIdNumber: '8888888888',
    ownerPhone: '0508888888',
    ownerEmail: 'sarah@imamu.edu.sa',
    vehicleMake: 'كيا',
    vehicleModel: 'أوبتيما',
    vehicleYear: 2023,
    vehicleColor: 'أحمر',
    permitType: 'student',
    permitNumber: 'STU-2024-003',
    permitExpiry: new Date('2024-12-31'),
    status: 'active',
    notes: 'مركبة طالبة - كلية الطب',
  },
];

console.log('📝 Inserting vehicles...');
for (const vehicle of vehicles) {
  await db.insert(schema.vehicles).values(vehicle);
}
console.log(`✅ Inserted ${vehicles.length} vehicles`);

// Get inserted vehicle IDs
const insertedVehicles = await db.select().from(schema.vehicles);
const vehicleMap = {};
for (const v of insertedVehicles) {
  vehicleMap[v.plateNumber] = v.id;
}

// Sample violations data
const violations = [
  {
    violationNumber: 'VIO-2024-001',
    vehicleId: vehicleMap['أ ب ج 1234'],
    plateNumber: 'أ ب ج 1234',
    violationType: 'وقوف خاطئ',
    location: 'موقف كلية الهندسة',
    fine: 100,
    status: 'pending',
  },
  {
    violationNumber: 'VIO-2024-002',
    vehicleId: vehicleMap['س ص ع 5678'],
    plateNumber: 'س ص ع 5678',
    violationType: 'تجاوز سرعة',
    location: 'شارع الجامعة الرئيسي',
    fine: 150,
    status: 'paid',
    paidAt: new Date('2024-01-18'),
  },
  {
    violationNumber: 'VIO-2024-003',
    vehicleId: vehicleMap['د ذ ر 9012'],
    plateNumber: 'د ذ ر 9012',
    violationType: 'دخول ممنوع',
    location: 'بوابة 3 - منطقة محظورة',
    fine: 200,
    status: 'pending',
  },
  {
    violationNumber: 'VIO-2024-004',
    vehicleId: vehicleMap['ك ل م 3456'],
    plateNumber: 'ك ل م 3456',
    violationType: 'عدم وجود ملصق',
    location: 'موقف المكتبة المركزية',
    fine: 50,
    status: 'appealed',
    appealedAt: new Date('2024-01-20'),
    appealReason: 'الملصق موجود ولكنه غير واضح',
  },
  {
    violationNumber: 'VIO-2024-005',
    vehicleId: vehicleMap['هـ و ي 7890'],
    plateNumber: 'هـ و ي 7890',
    violationType: 'وقوف خاطئ',
    location: 'موقف المسجد الجامعي',
    fine: 100,
    status: 'paid',
    paidAt: new Date('2024-01-21'),
  },
  {
    violationNumber: 'VIO-2024-006',
    vehicleId: vehicleMap['أ ب ج 1234'],
    plateNumber: 'أ ب ج 1234',
    violationType: 'تجاوز سرعة',
    location: 'شارع كلية العلوم',
    fine: 150,
    status: 'pending',
  },
];

console.log('📝 Inserting violations...');
for (const violation of violations) {
  await db.insert(schema.violations).values(violation);
}
console.log(`✅ Inserted ${violations.length} violations`);

// Sample vehicle entries data
const entries = [
  {
    vehicleId: vehicleMap['أ ب ج 1234'],
    plateNumber: 'أ ب ج 1234',
    entryType: 'entry',
    gateLocation: 'البوابة الرئيسية',
    timestamp: new Date('2024-01-22 08:00:00'),
  },
  {
    vehicleId: vehicleMap['س ص ع 5678'],
    plateNumber: 'س ص ع 5678',
    entryType: 'entry',
    gateLocation: 'البوابة الشرقية',
    timestamp: new Date('2024-01-22 08:15:00'),
  },
  {
    vehicleId: vehicleMap['د ذ ر 9012'],
    plateNumber: 'د ذ ر 9012',
    entryType: 'entry',
    gateLocation: 'البوابة الغربية',
    timestamp: new Date('2024-01-22 08:30:00'),
  },
  {
    vehicleId: vehicleMap['هـ و ي 7890'],
    plateNumber: 'هـ و ي 7890',
    entryType: 'entry',
    gateLocation: 'البوابة الرئيسية',
    timestamp: new Date('2024-01-22 09:00:00'),
  },
  {
    vehicleId: vehicleMap['أ ب ج 1234'],
    plateNumber: 'أ ب ج 1234',
    entryType: 'exit',
    gateLocation: 'البوابة الرئيسية',
    timestamp: new Date('2024-01-22 14:00:00'),
  },
  {
    vehicleId: vehicleMap['س ص ع 5678'],
    plateNumber: 'س ص ع 5678',
    entryType: 'exit',
    gateLocation: 'البوابة الشرقية',
    timestamp: new Date('2024-01-22 15:30:00'),
  },
];

console.log('📝 Inserting vehicle entries...');
for (const entry of entries) {
  await db.insert(schema.vehicleEntries).values(entry);
}
console.log(`✅ Inserted ${entries.length} vehicle entries`);

console.log('✨ Database seeding completed successfully!');
await connection.end();
