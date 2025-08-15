import 'dotenv/config';
import { db } from '../src/server/db/client';
import { schools, users, kioskDevices } from '../shared/schema';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function seedKioskData() {
  try {
    console.log('🌱 Seeding kiosk data...');
    
    // Create test school if it doesn't exist
    const [school] = await db.select().from(schools).limit(1);
    let schoolId: number;
    
    if (!school) {
      const [newSchool] = await db.insert(schools).values({
        name: 'Demo Elementary School',
        code: 'DEMO',
        address: '123 Demo Street, Demo City, DC 12345'
      }).returning();
      schoolId = newSchool.id;
      console.log(`✅ Created school: ${newSchool.name} (ID: ${schoolId})`);
    } else {
      schoolId = school.id;
      console.log(`📍 Using existing school: ${school.name} (ID: ${schoolId})`);
    }

    // Create test kiosk user if doesn't exist
    const existingKioskUser = await db.select().from(users)
      .where(eq(users.username, 'kiosk'))
      .limit(1);
    
    let kioskUserId: number;
    if (existingKioskUser.length === 0) {
      const [kioskUser] = await db.insert(users).values({
        username: 'kiosk',
        email: 'kiosk@demo.school',
        role: 'teacher',
        schoolId: schoolId,
        name: 'Kiosk System'
      }).returning();
      kioskUserId = kioskUser.id;
      console.log(`✅ Created kiosk user: ${kioskUser.username} (ID: ${kioskUserId})`);
    } else {
      kioskUserId = existingKioskUser[0].id;
      console.log(`📍 Using existing kiosk user: ${existingKioskUser[0].username} (ID: ${kioskUserId})`);
    }

    // Create test kiosk device
    const pinHash = await bcrypt.hash('1234', 10);
    
    const existingKiosk = await db.select().from(kioskDevices)
      .where(and(
        eq(kioskDevices.schoolId, schoolId),
        eq(kioskDevices.room, 'Room 101')
      ))
      .limit(1);
    
    if (existingKiosk.length === 0) {
      const [kiosk] = await db.insert(kioskDevices).values({
        schoolId: schoolId,
        room: 'Room 101',
        pinHash: pinHash,
        name: 'Main Office Kiosk',
        active: true
      }).returning();
      console.log(`✅ Created kiosk device: ${kiosk.name} (Room: ${kiosk.room})`);
    } else {
      console.log(`📍 Kiosk device already exists for Room 101`);
    }

    console.log('\n🎉 Kiosk seeding complete!');
    console.log('\n📝 Test Credentials:');
    console.log('   School ID: ' + schoolId);
    console.log('   Room: Room 101');
    console.log('   PIN: 1234');
    console.log('\n🔗 Access at: http://localhost:5000/kiosk/login');
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedKioskData().then(() => process.exit(0));
}

export { seedKioskData };