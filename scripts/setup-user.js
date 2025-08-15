// Quick setup script for demo user
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from "ws";
import * as schema from "../shared/schema.js";
import bcrypt from 'bcryptjs';

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema });

async function setupUser() {
  try {
    // Create demo school
    const [school] = await db.insert(schema.schools).values({
      name: 'Demo School',
      seatsAllowed: 500,
      active: true
    }).returning();

    // Create your user account
    const passwordHash = await bcrypt.hash('demo123', 10);
    const [user] = await db.insert(schema.users).values({
      email: 'passpilotapp@gmail.com',
      passwordHash,
      role: 'superadmin',
      schoolId: school.id,
      active: true
    }).returning();

    console.log('✅ Setup complete!');
    console.log('School:', school.name, '(ID:', school.id, ')');
    console.log('User:', user.email, '(Role:', user.role, ')');
    console.log('');
    console.log('You can now login with:');
    console.log('Email: passpilotapp@gmail.com');
    console.log('School ID:', school.id);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setupUser();