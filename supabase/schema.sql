-- MiraClass Database Schema for Supabase
-- Educational Social Network Platform
-- Created: 2025-01-25

-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================================
-- 1. Schools Table
-- ============================================================================
create table if not exists schools (
  id uuid primary key default uuid_generate_v4(),
  name varchar(255) not null,
  code varchar(50) unique not null,
  type varchar(50) default 'elementary' check (type in ('elementary', 'middle', 'high')),
  address text,
  city varchar(100),
  state varchar(100),
  postal_code varchar(20),
  country varchar(2) default 'KR',
  phone varchar(20),
  email varchar(255),
  description text,
  established_year integer,
  principal_name varchar(255),
  subscription_plan varchar(50) default 'basic' check (subscription_plan in ('basic', 'premium', 'enterprise')),
  features jsonb default '{}',
  student_count integer default 0,
  teacher_count integer default 0,
  class_count integer default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

-- ============================================================================
-- 2. Users Table (Students, Teachers, Admins)
-- ============================================================================
create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  email varchar(255) unique not null,
  password_hash varchar(255) not null,
  name varchar(255) not null,
  role varchar(20) not null check (role in ('admin', 'teacher', 'student')),
  school_id uuid references schools(id) on delete cascade,
  
  -- Student specific fields
  grade varchar(20),
  class_number varchar(10),
  student_number varchar(20),
  
  -- Contact information
  phone varchar(20),
  profile_image varchar(500),
  
  -- Status fields
  is_active boolean default true,
  last_login_at timestamptz,
  email_verified boolean default false,
  email_verification_token varchar(255),
  password_reset_token varchar(255),
  password_reset_expires timestamptz,
  
  -- Preferences and metadata
  preferences jsonb default '{
    "notifications": {
      "email": true,
      "push": true,
      "sms": false
    },
    "privacy": {
      "showProfile": true,
      "allowMessages": true
    }
  }',
  metadata jsonb default '{}',
  
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

-- ============================================================================
-- 3. Classes Table
-- ============================================================================
create table if not exists classes (
  id uuid primary key default uuid_generate_v4(),
  name varchar(255) not null,
  code varchar(50) not null,
  school_id uuid references schools(id) on delete cascade,
  teacher_id uuid references users(id) on delete set null,
  subject varchar(100),
  grade varchar(20),
  class_number varchar(10),
  description text,
  room varchar(50),
  capacity integer default 30,
  enrollment_code varchar(10) unique,
  start_date date,
  end_date date,
  allow_self_enrollment boolean default true,
  schedule jsonb default '{}',
  student_count integer default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  
  unique(school_id, code)
);

-- ============================================================================
-- 4. Class Enrollments Table
-- ============================================================================
create table if not exists class_enrollments (
  id uuid primary key default uuid_generate_v4(),
  class_id uuid references classes(id) on delete cascade,
  student_id uuid references users(id) on delete cascade,
  enrolled_by uuid references users(id) on delete set null,
  enrolled_at timestamptz default now(),
  dropped_by uuid references users(id) on delete set null,
  dropped_at timestamptz,
  enrollment_method varchar(20) default 'manual' check (enrollment_method in ('manual', 'self', 'bulk')),
  status varchar(20) default 'active' check (status in ('active', 'dropped', 'completed')),
  final_grade varchar(10),
  attendance_rate decimal(5,2) default 100.00,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  unique(class_id, student_id, status)
);

-- ============================================================================
-- 5. Student Relationships Table (Social Network Data)
-- ============================================================================
create table if not exists student_relationships (
  id uuid primary key default uuid_generate_v4(),
  student_a_id uuid references users(id) on delete cascade,
  student_b_id uuid references users(id) on delete cascade,
  
  -- Relationship metrics (converted from Neo4j)
  relationship_score decimal(3,2) default 0.00 check (relationship_score >= -1.00 and relationship_score <= 1.00),
  relationship_type varchar(20) default 'neutral' check (relationship_type in ('friendship', 'conflict', 'neutral', 'romantic')),
  interaction_frequency integer default 0,
  trust_level decimal(3,2) default 0.50 check (trust_level >= 0.00 and trust_level <= 1.00),
  communication_style varchar(20) default 'neutral' check (communication_style in ('direct', 'indirect', 'passive', 'neutral')),
  
  -- JSON arrays for flexible data
  shared_interests jsonb default '[]',
  conflict_topics jsonb default '[]',
  
  last_interaction timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  unique(student_a_id, student_b_id)
);

-- ============================================================================
-- 6. Surveys Table
-- ============================================================================
create table if not exists surveys (
  id uuid primary key default uuid_generate_v4(),
  title varchar(255) not null,
  description text,
  survey_type varchar(50) default 'relationship_survey',
  questions jsonb not null,
  created_by uuid references users(id) on delete set null,
  target_class_id uuid references classes(id) on delete cascade,
  is_active boolean default true,
  due_date timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================================
-- 7. Survey Responses Table  
-- ============================================================================
create table if not exists survey_responses (
  id uuid primary key default uuid_generate_v4(),
  survey_id uuid references surveys(id) on delete cascade,
  student_id uuid references users(id) on delete cascade,
  responses jsonb not null,
  completion_status varchar(20) default 'partial' check (completion_status in ('partial', 'completed')),
  submitted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  unique(survey_id, student_id)
);

-- ============================================================================
-- 8. Indexes for Performance
-- ============================================================================

-- Users indexes
create index if not exists idx_users_email on users(email);
create index if not exists idx_users_school_id on users(school_id);
create index if not exists idx_users_role on users(role);
create index if not exists idx_users_school_role on users(school_id, role);
create index if not exists idx_users_class on users(school_id, grade, class_number);
create index if not exists idx_users_active on users(is_active);

-- Classes indexes
create index if not exists idx_classes_school_id on classes(school_id);
create index if not exists idx_classes_teacher_id on classes(teacher_id);
create index if not exists idx_classes_enrollment_code on classes(enrollment_code);
create index if not exists idx_classes_grade_class on classes(school_id, grade, class_number);

-- Class enrollments indexes
create index if not exists idx_enrollments_class_id on class_enrollments(class_id);
create index if not exists idx_enrollments_student_id on class_enrollments(student_id);
create index if not exists idx_enrollments_status on class_enrollments(status);
create index if not exists idx_enrollments_class_status on class_enrollments(class_id, status);

-- Student relationships indexes
create index if not exists idx_relationships_student_a on student_relationships(student_a_id);
create index if not exists idx_relationships_student_b on student_relationships(student_b_id);
create index if not exists idx_relationships_score on student_relationships(relationship_score);
create index if not exists idx_relationships_type on student_relationships(relationship_type);

-- Surveys indexes
create index if not exists idx_surveys_created_by on surveys(created_by);
create index if not exists idx_surveys_target_class on surveys(target_class_id);
create index if not exists idx_surveys_active on surveys(is_active);

-- Survey responses indexes
create index if not exists idx_survey_responses_survey_id on survey_responses(survey_id);
create index if not exists idx_survey_responses_student_id on survey_responses(student_id);

-- ============================================================================
-- 9. Functions and Triggers
-- ============================================================================

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger update_schools_updated_at before update on schools for each row execute function update_updated_at_column();
create trigger update_users_updated_at before update on users for each row execute function update_updated_at_column();
create trigger update_classes_updated_at before update on classes for each row execute function update_updated_at_column();
create trigger update_class_enrollments_updated_at before update on class_enrollments for each row execute function update_updated_at_column();
create trigger update_student_relationships_updated_at before update on student_relationships for each row execute function update_updated_at_column();
create trigger update_surveys_updated_at before update on surveys for each row execute function update_updated_at_column();
create trigger update_survey_responses_updated_at before update on survey_responses for each row execute function update_updated_at_column();

-- Function to generate enrollment codes
create or replace function generate_enrollment_code()
returns text as $$
declare
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text := '';
  i integer := 0;
begin
  for i in 1..6 loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  end loop;
  return result;
end;
$$ language plpgsql;

-- Function to update school counts
create or replace function update_school_counts()
returns trigger as $$
begin
  if TG_TABLE_NAME = 'users' then
    update schools set
      student_count = (select count(*) from users where school_id = coalesce(NEW.school_id, OLD.school_id) and role = 'student' and is_active = true),
      teacher_count = (select count(*) from users where school_id = coalesce(NEW.school_id, OLD.school_id) and role = 'teacher' and is_active = true)
    where id = coalesce(NEW.school_id, OLD.school_id);
  elsif TG_TABLE_NAME = 'classes' then
    update schools set
      class_count = (select count(*) from classes where school_id = coalesce(NEW.school_id, OLD.school_id) and is_active = true)
    where id = coalesce(NEW.school_id, OLD.school_id);
  end if;
  return coalesce(NEW, OLD);
end;
$$ language plpgsql;

-- Triggers for school counts
create trigger update_school_user_counts after insert or update or delete on users for each row execute function update_school_counts();
create trigger update_school_class_counts after insert or update or delete on classes for each row execute function update_school_counts();

-- Function to update class student counts
create or replace function update_class_student_count()
returns trigger as $$
begin
  update classes set
    student_count = (
      select count(*) 
      from class_enrollments 
      where class_id = coalesce(NEW.class_id, OLD.class_id) 
        and status = 'active'
    )
  where id = coalesce(NEW.class_id, OLD.class_id);
  return coalesce(NEW, OLD);
end;
$$ language plpgsql;

-- Trigger for class student counts
create trigger update_class_student_count_trigger 
  after insert or update or delete on class_enrollments 
  for each row execute function update_class_student_count();

-- ============================================================================
-- 10. Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS
alter table schools enable row level security;
alter table users enable row level security;
alter table classes enable row level security;
alter table class_enrollments enable row level security;
alter table student_relationships enable row level security;
alter table surveys enable row level security;
alter table survey_responses enable row level security;

-- School policies
create policy "Schools are viewable by authenticated users" on schools for select using (auth.role() = 'authenticated');
create policy "Schools are editable by admins" on schools for all using (exists (
  select 1 from users where id = auth.uid() and role = 'admin' and school_id = schools.id
));

-- User policies  
create policy "Users can view their own data" on users for select using (auth.uid() = id);
create policy "Users in same school can view each other" on users for select using (
  school_id in (select school_id from users where id = auth.uid())
);
create policy "Admins can manage users in their school" on users for all using (
  school_id in (
    select school_id from users 
    where id = auth.uid() and role in ('admin', 'teacher')
  )
);

-- Classes policies
create policy "Classes are viewable by school members" on classes for select using (
  school_id in (select school_id from users where id = auth.uid())
);
create policy "Teachers can manage their classes" on classes for all using (
  teacher_id = auth.uid() or exists (
    select 1 from users where id = auth.uid() and role = 'admin' 
    and school_id = classes.school_id
  )
);

-- Class enrollments policies
create policy "Students can view their enrollments" on class_enrollments for select using (
  student_id = auth.uid()
);
create policy "Teachers can view enrollments in their classes" on class_enrollments for select using (
  class_id in (select id from classes where teacher_id = auth.uid()) or
  exists (
    select 1 from users where id = auth.uid() and role = 'admin'
    and school_id in (select school_id from classes where id = class_enrollments.class_id)
  )
);

-- Student relationships policies
create policy "Students can view their relationships" on student_relationships for select using (
  student_a_id = auth.uid() or student_b_id = auth.uid()
);
create policy "Teachers can view relationships in their classes" on student_relationships for select using (
  exists (
    select 1 from classes c
    join class_enrollments ce on c.id = ce.class_id
    where c.teacher_id = auth.uid() 
    and (ce.student_id = student_a_id or ce.student_id = student_b_id)
  )
);

-- Survey policies
create policy "Surveys are viewable by target class members" on surveys for select using (
  target_class_id in (
    select class_id from class_enrollments where student_id = auth.uid()
  ) or created_by = auth.uid()
);

-- Survey responses policies
create policy "Students can manage their own responses" on survey_responses for all using (
  student_id = auth.uid()
);
create policy "Survey creators can view responses" on survey_responses for select using (
  survey_id in (select id from surveys where created_by = auth.uid())
);

-- ============================================================================
-- 11. Sample Data for Development
-- ============================================================================

-- Insert sample school
insert into schools (name, code, type, address, city, country, subscription_plan, features) 
values (
  'Miracle Elementary School',
  'MES001', 
  'elementary',
  '123 Education Street, Seoul, South Korea',
  'Seoul',
  'KR',
  'premium',
  '{
    "aiTutor": true,
    "analytics": true, 
    "parentPortal": true,
    "mobileApp": true,
    "customBranding": true,
    "apiAccess": true
  }'
) on conflict (code) do nothing;

-- Get the school ID for sample data
-- Note: In production, this would be handled differently