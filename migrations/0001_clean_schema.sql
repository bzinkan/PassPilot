-- Clean schema migration for PassPilot deployment
-- This ensures the production database matches the development schema exactly

-- Create audits table
CREATE TABLE IF NOT EXISTS "audits" (
  "id" serial PRIMARY KEY,
  "actor_user_id" integer,
  "school_id" integer,
  "action" varchar(80) NOT NULL,
  "target_type" varchar(40) NOT NULL,
  "target_id" integer,
  "data" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Create user_settings table  
CREATE TABLE IF NOT EXISTS "user_settings" (
  "user_id" integer PRIMARY KEY,
  "last_active_grade_id" integer,
  "theme" varchar(20) DEFAULT 'light',
  "notifications_enabled" boolean DEFAULT true,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Create registration_tokens table
CREATE TABLE IF NOT EXISTS "registration_tokens" (
  "id" serial PRIMARY KEY,
  "token" varchar(255) NOT NULL UNIQUE,
  "school_id" integer NOT NULL,
  "role" varchar(20) DEFAULT 'teacher' NOT NULL,
  "created_by_user_id" integer NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "used_at" timestamp with time zone,
  "used_by_user_id" integer,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Add foreign key constraints
ALTER TABLE "audits" ADD FOREIGN KEY ("actor_user_id") REFERENCES "users" ("id");
ALTER TABLE "user_settings" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");
ALTER TABLE "user_settings" ADD FOREIGN KEY ("last_active_grade_id") REFERENCES "grades" ("id");
ALTER TABLE "registration_tokens" ADD FOREIGN KEY ("school_id") REFERENCES "schools" ("id");
ALTER TABLE "registration_tokens" ADD FOREIGN KEY ("created_by_user_id") REFERENCES "users" ("id");
ALTER TABLE "registration_tokens" ADD FOREIGN KEY ("used_by_user_id") REFERENCES "users" ("id");