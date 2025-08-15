import { z } from "zod";

const EnvSchema = z.object({
  // Database
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),
  
  // Authentication & Session
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters"),
  REPL_ID: z.string().min(1, "REPL_ID is required for authentication"),
  REPLIT_DOMAINS: z.string().min(1, "REPLIT_DOMAINS is required for authentication"),
  
  // Object Storage (optional - only required if using file uploads)
  DEFAULT_OBJECT_STORAGE_BUCKET_ID: z.string().optional(),
  PRIVATE_OBJECT_DIR: z.string().optional(),
  PUBLIC_OBJECT_SEARCH_PATHS: z.string().optional(),
  
  // Stripe (optional - only required if using payments)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  
  // Database connection details (auto-provided by Replit)
  PGDATABASE: z.string().min(1, "PGDATABASE is required"),
  PGHOST: z.string().min(1, "PGHOST is required"),
  PGPASSWORD: z.string().min(1, "PGPASSWORD is required"),
  PGPORT: z.string().min(1, "PGPORT is required"),
  PGUSER: z.string().min(1, "PGUSER is required"),
  
  // Optional environment variables
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  ISSUER_URL: z.string().url().optional(),
});

// Parse and validate environment variables at startup
export const ENV = EnvSchema.parse(process.env);

// Export type for use in other files
export type Env = z.infer<typeof EnvSchema>;

// Helper function to check if object storage is configured
export function isObjectStorageConfigured(): boolean {
  return !!(ENV.DEFAULT_OBJECT_STORAGE_BUCKET_ID && 
           ENV.PRIVATE_OBJECT_DIR && 
           ENV.PUBLIC_OBJECT_SEARCH_PATHS);
}

// Helper function to get required environment for auth
export function getAuthEnvironment() {
  return {
    sessionSecret: ENV.SESSION_SECRET,
    replId: ENV.REPL_ID,
    replitDomains: ENV.REPLIT_DOMAINS,
    issuerUrl: ENV.ISSUER_URL || "https://replit.com/oidc",
  };
}

// Helper function to get database environment
export function getDatabaseEnvironment() {
  return {
    url: ENV.DATABASE_URL,
    host: ENV.PGHOST,
    port: parseInt(ENV.PGPORT),
    database: ENV.PGDATABASE,
    user: ENV.PGUSER,
    password: ENV.PGPASSWORD,
  };
}