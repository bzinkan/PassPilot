import 'dotenv/config';
import { db } from '../server/db/client';
import { createSchool } from '../server/services/schools';
import { createUser } from '../server/services/users';

async function main() {
  console.log('Seeding PassPilot database...');
  
  const school = await createSchool('Demo School', 50);
  console.log('Created school:', school.name);
  
  const admin = await createUser({ 
    email: 'admin@demo.edu', 
    password: 'admin123', 
    role: 'admin', 
    schoolId: school.id 
  });
  
  const teacher = await createUser({ 
    email: 'teacher@demo.edu', 
    password: 'teacher123', 
    role: 'teacher', 
    schoolId: school.id 
  });
  
  const superadmin = await createUser({ 
    email: 'sa@passpilot.io', 
    password: 'super123', 
    role: 'superadmin', 
    schoolId: school.id 
  });
  
  console.log('Created users:');
  console.log('- Admin:', admin.email, '(ID:', admin.id + ')');
  console.log('- Teacher:', teacher.email, '(ID:', teacher.id + ')');
  console.log('- Super Admin:', superadmin.email, '(ID:', superadmin.id + ')');
  console.log('School ID:', school.id);
  console.log('\nTest login with:');
  console.log('POST /login { "email": "admin@demo.edu", "password": "admin123", "schoolId": ' + school.id + ' }');
}

main().then(() => {
  console.log('Seeding complete!');
  process.exit(0);
}).catch((e) => { 
  console.error('Seeding failed:', e); 
  process.exit(1); 
});