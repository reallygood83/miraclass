-- 우리반 커넥트: 관계 분석 시스템을 위한 추가 스키마
-- 기존 schema.sql에 추가로 실행해야 하는 테이블들
-- Created: 2025-09-04

-- ============================================================================
-- 12. Survey Questions Table (설문 질문 세부 사항)
-- ============================================================================
create table if not exists survey_questions (
  id uuid primary key default uuid_generate_v4(),
  survey_id uuid references surveys(id) on delete cascade,
  question_number integer not null,
  question_type varchar(50) not null check (question_type in ('friend_selection', 'collaboration', 'trust', 'conflict')),
  title varchar(500) not null,
  description text,
  max_selections integer default 3,
  is_required boolean default true,
  display_order integer not null,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  unique(survey_id, question_number),
  unique(survey_id, display_order)
);

-- ============================================================================
-- 13. Detailed Survey Responses Table (상세 응답 데이터)
-- ============================================================================
create table if not exists detailed_survey_responses (
  id uuid primary key default uuid_generate_v4(),
  survey_id uuid references surveys(id) on delete cascade,
  question_id uuid references survey_questions(id) on delete cascade,
  respondent_id uuid references users(id) on delete cascade,
  selected_student_ids uuid[] not null default '{}', -- 선택된 학생들의 ID 배열
  response_strength integer default 1 check (response_strength between 1 and 5),
  response_metadata jsonb default '{}', -- 추가 응답 정보
  
  submitted_at timestamptz default now(),
  created_at timestamptz default now(),
  
  unique(survey_id, question_id, respondent_id)
);

-- ============================================================================
-- 14. Network Analysis Results Table (네트워크 분석 결과 저장)
-- ============================================================================
create table if not exists network_analysis_results (
  id uuid primary key default uuid_generate_v4(),
  survey_id uuid references surveys(id) on delete cascade,
  student_id uuid references users(id) on delete cascade,
  
  -- 중심성 지표들
  degree_centrality decimal(10,8) default 0.0,
  betweenness_centrality decimal(10,8) default 0.0,
  closeness_centrality decimal(10,8) default 0.0,
  eigenvector_centrality decimal(10,8) default 0.0,
  
  -- 관계 특성
  total_connections integer default 0,
  incoming_connections integer default 0,
  outgoing_connections integer default 0,
  reciprocal_connections integer default 0,
  
  -- 위험 지표
  isolation_risk varchar(10) default 'low' check (isolation_risk in ('low', 'medium', 'high')),
  popularity_score decimal(5,4) default 0.0 check (popularity_score between 0.0 and 1.0),
  sociability_score decimal(5,4) default 0.0 check (sociability_score between 0.0 and 1.0),
  
  -- 분석 메타데이터
  analysis_version varchar(20) default '1.0',
  analyzed_at timestamptz default now(),
  
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  unique(survey_id, student_id)
);

-- ============================================================================
-- 15. Class Network Summary Table (클래스 전체 네트워크 요약)
-- ============================================================================
create table if not exists class_network_summaries (
  id uuid primary key default uuid_generate_v4(),
  survey_id uuid references surveys(id) on delete cascade,
  class_id uuid references classes(id) on delete cascade,
  
  -- 전체 네트워크 지표
  total_students integer not null,
  total_relationships integer not null,
  network_density decimal(8,6) default 0.0 check (network_density between 0.0 and 1.0),
  avg_path_length decimal(8,4) default 0.0,
  clustering_coefficient decimal(8,6) default 0.0,
  
  -- 특별한 역할의 학생들 (JSON 배열로 저장)
  isolated_students jsonb default '[]',
  popular_students jsonb default '[]',
  bridge_students jsonb default '[]',
  
  -- AI 인사이트
  ai_insights text,
  emotional_stability_score decimal(5,4) default 0.5,
  
  -- 분석 버전 정보
  analysis_version varchar(20) default '1.0',
  analyzed_at timestamptz default now(),
  
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  unique(survey_id, class_id)
);

-- ============================================================================
-- 16. Student Groups Table (식별된 학생 그룹들)
-- ============================================================================
create table if not exists student_groups (
  id uuid primary key default uuid_generate_v4(),
  survey_id uuid references surveys(id) on delete cascade,
  class_id uuid references classes(id) on delete cascade,
  
  group_name varchar(255) not null,
  group_type varchar(50) default 'friend_group' check (group_type in ('friend_group', 'study_group', 'isolated_pair', 'clique')),
  student_ids uuid[] not null default '{}', -- 그룹 구성원들의 ID 배열
  
  -- 그룹 특성
  cohesion_score decimal(5,4) default 0.0 check (cohesion_score between 0.0 and 1.0),
  avg_relationship_strength decimal(5,2) default 0.0,
  
  -- 메타데이터
  formation_date timestamptz default now(),
  is_active boolean default true,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================================
-- 17. Analysis Insights Table (AI 분석 인사이트)
-- ============================================================================
create table if not exists analysis_insights (
  id uuid primary key default uuid_generate_v4(),
  survey_id uuid references surveys(id) on delete cascade,
  insight_type varchar(50) not null check (insight_type in ('social_structure', 'isolation_risk', 'group_dynamics', 'relationship_patterns')),
  
  title varchar(500) not null,
  description text not null,
  severity varchar(20) default 'info' check (severity in ('info', 'warning', 'critical')),
  
  affected_student_ids uuid[] default '{}', -- 영향받는 학생들
  recommendation text,
  
  -- 분석 메타데이터
  confidence_score decimal(5,4) default 0.8,
  analysis_method varchar(100),
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================================
-- 18. AI Recommendations Table (AI 권장사항)
-- ============================================================================
create table if not exists ai_recommendations (
  id uuid primary key default uuid_generate_v4(),
  survey_id uuid references surveys(id) on delete cascade,
  insight_id uuid references analysis_insights(id) on delete cascade,
  
  recommendation_type varchar(50) default 'intervention' check (recommendation_type in ('intervention', 'grouping', 'monitoring', 'support')),
  title varchar(500) not null,
  description text not null,
  priority varchar(20) default 'medium' check (priority in ('low', 'medium', 'high')),
  
  target_student_ids uuid[] default '{}', -- 대상 학생들
  action_steps jsonb default '[]', -- 실행 단계들 (JSON 배열)
  
  -- 실행 상태 추적
  implementation_status varchar(20) default 'pending' check (implementation_status in ('pending', 'in_progress', 'completed', 'cancelled')),
  implemented_by uuid references users(id) on delete set null,
  implemented_at timestamptz,
  effectiveness_score decimal(5,4), -- 효과 평가 (0.0-1.0)
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================================
-- 19. Processed Student Relationships (분석된 관계 데이터)
-- ============================================================================
create table if not exists processed_student_relationships (
  id uuid primary key default uuid_generate_v4(),
  survey_id uuid references surveys(id) on delete cascade,
  from_student_id uuid references users(id) on delete cascade,
  to_student_id uuid references users(id) on delete cascade,
  
  relationship_type varchar(50) not null check (relationship_type in ('friend', 'collaboration', 'trust', 'conflict')),
  relationship_strength integer default 1 check (relationship_strength between 1 and 10),
  is_reciprocal boolean default false,
  
  -- 관계 메타데이터
  confidence_score decimal(5,4) default 0.8,
  source_questions uuid[] default '{}', -- 이 관계를 도출한 질문들
  
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  unique(survey_id, from_student_id, to_student_id, relationship_type)
);

-- ============================================================================
-- 20. Additional Indexes for Performance
-- ============================================================================

-- Survey questions indexes
create index if not exists idx_survey_questions_survey_id on survey_questions(survey_id);
create index if not exists idx_survey_questions_type on survey_questions(question_type);

-- Detailed survey responses indexes
create index if not exists idx_detailed_responses_survey_id on detailed_survey_responses(survey_id);
create index if not exists idx_detailed_responses_question_id on detailed_survey_responses(question_id);
create index if not exists idx_detailed_responses_respondent_id on detailed_survey_responses(respondent_id);

-- Network analysis results indexes
create index if not exists idx_network_analysis_survey_id on network_analysis_results(survey_id);
create index if not exists idx_network_analysis_student_id on network_analysis_results(student_id);
create index if not exists idx_network_analysis_isolation_risk on network_analysis_results(isolation_risk);

-- Class network summaries indexes
create index if not exists idx_class_summaries_survey_id on class_network_summaries(survey_id);
create index if not exists idx_class_summaries_class_id on class_network_summaries(class_id);

-- Student groups indexes
create index if not exists idx_student_groups_survey_id on student_groups(survey_id);
create index if not exists idx_student_groups_class_id on student_groups(class_id);
create index if not exists idx_student_groups_type on student_groups(group_type);

-- Analysis insights indexes
create index if not exists idx_insights_survey_id on analysis_insights(survey_id);
create index if not exists idx_insights_type on analysis_insights(insight_type);
create index if not exists idx_insights_severity on analysis_insights(severity);

-- AI recommendations indexes
create index if not exists idx_recommendations_survey_id on ai_recommendations(survey_id);
create index if not exists idx_recommendations_insight_id on ai_recommendations(insight_id);
create index if not exists idx_recommendations_priority on ai_recommendations(priority);
create index if not exists idx_recommendations_status on ai_recommendations(implementation_status);

-- Processed relationships indexes
create index if not exists idx_processed_rel_survey_id on processed_student_relationships(survey_id);
create index if not exists idx_processed_rel_from_student on processed_student_relationships(from_student_id);
create index if not exists idx_processed_rel_to_student on processed_student_relationships(to_student_id);
create index if not exists idx_processed_rel_type on processed_student_relationships(relationship_type);

-- ============================================================================
-- 21. Additional Triggers for New Tables
-- ============================================================================

-- Update triggers for new tables
create trigger update_survey_questions_updated_at before update on survey_questions for each row execute function update_updated_at_column();
create trigger update_detailed_responses_updated_at before update on detailed_survey_responses for each row execute function update_updated_at_column();
create trigger update_network_analysis_updated_at before update on network_analysis_results for each row execute function update_updated_at_column();
create trigger update_class_summaries_updated_at before update on class_network_summaries for each row execute function update_updated_at_column();
create trigger update_student_groups_updated_at before update on student_groups for each row execute function update_updated_at_column();
create trigger update_insights_updated_at before update on analysis_insights for each row execute function update_updated_at_column();
create trigger update_recommendations_updated_at before update on ai_recommendations for each row execute function update_updated_at_column();
create trigger update_processed_rel_updated_at before update on processed_student_relationships for each row execute function update_updated_at_column();

-- ============================================================================
-- 22. Row Level Security for New Tables
-- ============================================================================

-- Enable RLS for new tables
alter table survey_questions enable row level security;
alter table detailed_survey_responses enable row level security;
alter table network_analysis_results enable row level security;
alter table class_network_summaries enable row level security;
alter table student_groups enable row level security;
alter table analysis_insights enable row level security;
alter table ai_recommendations enable row level security;
alter table processed_student_relationships enable row level security;

-- Survey questions policies
create policy "Teachers can manage questions in their surveys" on survey_questions for all using (
  survey_id in (select id from surveys where created_by = auth.uid())
);
create policy "Students can view questions for their surveys" on survey_questions for select using (
  survey_id in (
    select s.id from surveys s
    join classes c on s.target_class_id = c.id
    join class_enrollments ce on c.id = ce.class_id
    where ce.student_id = auth.uid() and s.is_active = true
  )
);

-- Detailed survey responses policies  
create policy "Students can manage their detailed responses" on detailed_survey_responses for all using (
  respondent_id = auth.uid()
);
create policy "Teachers can view responses to their surveys" on detailed_survey_responses for select using (
  survey_id in (select id from surveys where created_by = auth.uid())
);

-- Network analysis results policies
create policy "Students can view their network analysis" on network_analysis_results for select using (
  student_id = auth.uid()
);
create policy "Teachers can view analysis for their class surveys" on network_analysis_results for select using (
  survey_id in (select id from surveys where created_by = auth.uid())
);

-- Class network summaries policies
create policy "Teachers can view summaries for their surveys" on class_network_summaries for select using (
  survey_id in (select id from surveys where created_by = auth.uid())
);

-- Student groups policies
create policy "Class members can view their groups" on student_groups for select using (
  auth.uid() = any(student_ids) or 
  survey_id in (select id from surveys where created_by = auth.uid())
);

-- Analysis insights policies
create policy "Teachers can view insights for their surveys" on analysis_insights for select using (
  survey_id in (select id from surveys where created_by = auth.uid())
);

-- AI recommendations policies  
create policy "Teachers can manage recommendations for their surveys" on ai_recommendations for all using (
  survey_id in (select id from surveys where created_by = auth.uid())
);

-- Processed relationships policies
create policy "Teachers can view processed relationships for their surveys" on processed_student_relationships for select using (
  survey_id in (select id from surveys where created_by = auth.uid())
);
create policy "Students can view relationships involving them" on processed_student_relationships for select using (
  from_student_id = auth.uid() or to_student_id = auth.uid()
);

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

comment on table survey_questions is '설문의 개별 질문들을 저장하는 테이블';
comment on table detailed_survey_responses is '설문 응답의 상세 정보를 저장하는 테이블';
comment on table network_analysis_results is '각 학생의 네트워크 분석 결과를 저장하는 테이블';
comment on table class_network_summaries is '클래스 전체의 네트워크 요약 정보를 저장하는 테이블';
comment on table student_groups is 'AI가 식별한 학생 그룹들을 저장하는 테이블';
comment on table analysis_insights is 'AI가 생성한 분석 인사이트를 저장하는 테이블';
comment on table ai_recommendations is 'AI가 제안한 권장사항들을 저장하는 테이블';
comment on table processed_student_relationships is '분석된 학생 간 관계 데이터를 저장하는 테이블';