--
-- PostgreSQL database dump
--

\restrict 0emPvfqC2UThdItWMSCmqCbEJH71bFsiCyJJkaUGETDZAV8qDGkSVRhVsQJHhKT

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_organization_id_fkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_department_id_fkey;
ALTER TABLE IF EXISTS ONLY public.training_sessions DROP CONSTRAINT IF EXISTS training_sessions_organization_id_fkey;
ALTER TABLE IF EXISTS ONLY public.training_sessions DROP CONSTRAINT IF EXISTS training_sessions_instructor_id_fkey;
ALTER TABLE IF EXISTS ONLY public.training_sessions DROP CONSTRAINT IF EXISTS training_sessions_department_id_fkey;
ALTER TABLE IF EXISTS ONLY public.training_sessions DROP CONSTRAINT IF EXISTS training_sessions_course_id_fkey;
ALTER TABLE IF EXISTS ONLY public.session_attendances DROP CONSTRAINT IF EXISTS session_attendances_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.session_attendances DROP CONSTRAINT IF EXISTS session_attendances_session_id_fkey;
ALTER TABLE IF EXISTS ONLY public.progress DROP CONSTRAINT IF EXISTS progress_trainee_id_fkey;
ALTER TABLE IF EXISTS ONLY public.progress DROP CONSTRAINT IF EXISTS progress_module_id_fkey;
ALTER TABLE IF EXISTS ONLY public.progress DROP CONSTRAINT IF EXISTS progress_enrollment_id_fkey;
ALTER TABLE IF EXISTS ONLY public.progress DROP CONSTRAINT IF EXISTS progress_content_id_fkey;
ALTER TABLE IF EXISTS ONLY public.modules DROP CONSTRAINT IF EXISTS modules_course_id_fkey;
ALTER TABLE IF EXISTS ONLY public.messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE IF EXISTS ONLY public.messages DROP CONSTRAINT IF EXISTS messages_recipient_id_fkey;
ALTER TABLE IF EXISTS ONLY public.messages DROP CONSTRAINT IF EXISTS messages_parent_message_id_fkey;
ALTER TABLE IF EXISTS ONLY public.messages DROP CONSTRAINT IF EXISTS messages_organization_id_fkey;
ALTER TABLE IF EXISTS ONLY public.messages DROP CONSTRAINT IF EXISTS messages_course_id_fkey;
ALTER TABLE IF EXISTS ONLY public.enrollments DROP CONSTRAINT IF EXISTS enrollments_trainee_id_fkey;
ALTER TABLE IF EXISTS ONLY public.enrollments DROP CONSTRAINT IF EXISTS enrollments_course_id_fkey;
ALTER TABLE IF EXISTS ONLY public.departments DROP CONSTRAINT IF EXISTS departments_organization_id_fkey;
ALTER TABLE IF EXISTS ONLY public.departments DROP CONSTRAINT IF EXISTS departments_manager_id_fkey;
ALTER TABLE IF EXISTS ONLY public.courses DROP CONSTRAINT IF EXISTS courses_organization_id_fkey;
ALTER TABLE IF EXISTS ONLY public.courses DROP CONSTRAINT IF EXISTS courses_instructor_id_fkey;
ALTER TABLE IF EXISTS ONLY public.courses DROP CONSTRAINT IF EXISTS courses_department_id_fkey;
ALTER TABLE IF EXISTS ONLY public.courses DROP CONSTRAINT IF EXISTS courses_certificate_template_id_fkey;
ALTER TABLE IF EXISTS ONLY public.course_prerequisites DROP CONSTRAINT IF EXISTS course_prerequisites_prerequisite_course_id_fkey;
ALTER TABLE IF EXISTS ONLY public.course_prerequisites DROP CONSTRAINT IF EXISTS course_prerequisites_course_id_fkey;
ALTER TABLE IF EXISTS ONLY public.content DROP CONSTRAINT IF EXISTS content_module_id_fkey;
ALTER TABLE IF EXISTS ONLY public.certificates DROP CONSTRAINT IF EXISTS certificates_template_id_fkey;
ALTER TABLE IF EXISTS ONLY public.certificates DROP CONSTRAINT IF EXISTS certificates_enrollment_id_fkey;
ALTER TABLE IF EXISTS ONLY public.certificate_templates DROP CONSTRAINT IF EXISTS certificate_templates_organization_id_fkey;
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_organization_id_fkey;
ALTER TABLE IF EXISTS ONLY public.assignments DROP CONSTRAINT IF EXISTS assignments_course_id_fkey;
ALTER TABLE IF EXISTS ONLY public.assignment_submissions DROP CONSTRAINT IF EXISTS assignment_submissions_trainee_id_fkey;
ALTER TABLE IF EXISTS ONLY public.assignment_submissions DROP CONSTRAINT IF EXISTS assignment_submissions_graded_by_fkey;
ALTER TABLE IF EXISTS ONLY public.assignment_submissions DROP CONSTRAINT IF EXISTS assignment_submissions_enrollment_id_fkey;
ALTER TABLE IF EXISTS ONLY public.assignment_submissions DROP CONSTRAINT IF EXISTS assignment_submissions_assignment_id_fkey;
ALTER TABLE IF EXISTS ONLY public.assessments DROP CONSTRAINT IF EXISTS assessments_module_id_fkey;
ALTER TABLE IF EXISTS ONLY public.assessments DROP CONSTRAINT IF EXISTS assessments_course_id_fkey;
ALTER TABLE IF EXISTS ONLY public.assessment_attempts DROP CONSTRAINT IF EXISTS assessment_attempts_trainee_id_fkey;
ALTER TABLE IF EXISTS ONLY public.assessment_attempts DROP CONSTRAINT IF EXISTS assessment_attempts_graded_by_fkey;
ALTER TABLE IF EXISTS ONLY public.assessment_attempts DROP CONSTRAINT IF EXISTS assessment_attempts_enrollment_id_fkey;
ALTER TABLE IF EXISTS ONLY public.assessment_attempts DROP CONSTRAINT IF EXISTS assessment_attempts_assessment_id_fkey;
ALTER TABLE IF EXISTS ONLY public.announcements DROP CONSTRAINT IF EXISTS announcements_organization_id_fkey;
ALTER TABLE IF EXISTS ONLY public.announcements DROP CONSTRAINT IF EXISTS announcements_department_id_fkey;
ALTER TABLE IF EXISTS ONLY public.announcements DROP CONSTRAINT IF EXISTS announcements_created_by_fkey;
ALTER TABLE IF EXISTS ONLY public.announcements DROP CONSTRAINT IF EXISTS announcements_course_id_fkey;
DROP INDEX IF EXISTS public.users_username_key;
DROP INDEX IF EXISTS public.users_username_idx;
DROP INDEX IF EXISTS public.users_role_idx;
DROP INDEX IF EXISTS public.users_organization_id_idx;
DROP INDEX IF EXISTS public."users_organization_id_employeeId_key";
DROP INDEX IF EXISTS public.users_email_key;
DROP INDEX IF EXISTS public.users_email_idx;
DROP INDEX IF EXISTS public.users_department_id_idx;
DROP INDEX IF EXISTS public.training_sessions_status_idx;
DROP INDEX IF EXISTS public.training_sessions_start_time_end_time_idx;
DROP INDEX IF EXISTS public.training_sessions_organization_id_idx;
DROP INDEX IF EXISTS public.training_sessions_instructor_id_idx;
DROP INDEX IF EXISTS public.training_sessions_course_id_idx;
DROP INDEX IF EXISTS public.session_attendances_user_id_idx;
DROP INDEX IF EXISTS public.session_attendances_status_idx;
DROP INDEX IF EXISTS public.session_attendances_session_id_user_id_key;
DROP INDEX IF EXISTS public.session_attendances_session_id_idx;
DROP INDEX IF EXISTS public.progress_trainee_id_idx;
DROP INDEX IF EXISTS public.progress_module_id_idx;
DROP INDEX IF EXISTS public.progress_enrollment_id_module_id_content_id_key;
DROP INDEX IF EXISTS public.progress_enrollment_id_idx;
DROP INDEX IF EXISTS public.progress_content_id_idx;
DROP INDEX IF EXISTS public.organizations_slug_key;
DROP INDEX IF EXISTS public.organizations_name_key;
DROP INDEX IF EXISTS public.organizations_domain_key;
DROP INDEX IF EXISTS public.modules_course_id_order_key;
DROP INDEX IF EXISTS public.modules_course_id_idx;
DROP INDEX IF EXISTS public.messages_sender_id_idx;
DROP INDEX IF EXISTS public.messages_recipient_id_idx;
DROP INDEX IF EXISTS public.messages_organization_id_idx;
DROP INDEX IF EXISTS public.messages_is_read_idx;
DROP INDEX IF EXISTS public.messages_created_at_idx;
DROP INDEX IF EXISTS public.messages_course_id_idx;
DROP INDEX IF EXISTS public.enrollments_trainee_id_idx;
DROP INDEX IF EXISTS public.enrollments_trainee_id_course_id_key;
DROP INDEX IF EXISTS public.enrollments_status_idx;
DROP INDEX IF EXISTS public.enrollments_course_id_idx;
DROP INDEX IF EXISTS public.departments_organization_id_idx;
DROP INDEX IF EXISTS public.departments_organization_id_code_key;
DROP INDEX IF EXISTS public.departments_manager_id_key;
DROP INDEX IF EXISTS public.departments_code_idx;
DROP INDEX IF EXISTS public.courses_status_idx;
DROP INDEX IF EXISTS public.courses_organization_id_idx;
DROP INDEX IF EXISTS public.courses_organization_id_course_code_key;
DROP INDEX IF EXISTS public.courses_instructor_id_idx;
DROP INDEX IF EXISTS public.courses_department_id_idx;
DROP INDEX IF EXISTS public.course_prerequisites_course_id_prerequisite_course_id_key;
DROP INDEX IF EXISTS public.course_prerequisites_course_id_idx;
DROP INDEX IF EXISTS public.content_module_id_idx;
DROP INDEX IF EXISTS public.content_content_type_idx;
DROP INDEX IF EXISTS public.certificates_is_valid_idx;
DROP INDEX IF EXISTS public.certificates_enrollment_id_key;
DROP INDEX IF EXISTS public.certificates_enrollment_id_idx;
DROP INDEX IF EXISTS public.certificates_certificate_number_key;
DROP INDEX IF EXISTS public.certificates_certificate_number_idx;
DROP INDEX IF EXISTS public.certificate_templates_organization_id_idx;
DROP INDEX IF EXISTS public.audit_logs_user_id_idx;
DROP INDEX IF EXISTS public.audit_logs_organization_id_idx;
DROP INDEX IF EXISTS public.audit_logs_entity_type_entity_id_idx;
DROP INDEX IF EXISTS public.audit_logs_created_at_idx;
DROP INDEX IF EXISTS public.audit_logs_action_idx;
DROP INDEX IF EXISTS public.assignments_module_id_idx;
DROP INDEX IF EXISTS public.assignments_due_date_idx;
DROP INDEX IF EXISTS public.assignments_course_id_idx;
DROP INDEX IF EXISTS public.assignment_submissions_trainee_id_idx;
DROP INDEX IF EXISTS public.assignment_submissions_status_idx;
DROP INDEX IF EXISTS public.assignment_submissions_enrollment_id_idx;
DROP INDEX IF EXISTS public.assignment_submissions_assignment_id_idx;
DROP INDEX IF EXISTS public.assignment_submissions_assignment_id_enrollment_id_key;
DROP INDEX IF EXISTS public.assessments_type_idx;
DROP INDEX IF EXISTS public.assessments_module_id_idx;
DROP INDEX IF EXISTS public.assessments_course_id_idx;
DROP INDEX IF EXISTS public.assessment_attempts_trainee_id_idx;
DROP INDEX IF EXISTS public.assessment_attempts_enrollment_id_idx;
DROP INDEX IF EXISTS public.assessment_attempts_enrollment_id_assessment_id_attempt_num_key;
DROP INDEX IF EXISTS public.assessment_attempts_assessment_id_idx;
DROP INDEX IF EXISTS public.announcements_published_at_idx;
DROP INDEX IF EXISTS public.announcements_organization_id_idx;
DROP INDEX IF EXISTS public.announcements_is_pinned_idx;
DROP INDEX IF EXISTS public.announcements_department_id_idx;
DROP INDEX IF EXISTS public.announcements_course_id_idx;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.training_sessions DROP CONSTRAINT IF EXISTS training_sessions_pkey;
ALTER TABLE IF EXISTS ONLY public.session_attendances DROP CONSTRAINT IF EXISTS session_attendances_pkey;
ALTER TABLE IF EXISTS ONLY public.progress DROP CONSTRAINT IF EXISTS progress_pkey;
ALTER TABLE IF EXISTS ONLY public.organizations DROP CONSTRAINT IF EXISTS organizations_pkey;
ALTER TABLE IF EXISTS ONLY public.modules DROP CONSTRAINT IF EXISTS modules_pkey;
ALTER TABLE IF EXISTS ONLY public.messages DROP CONSTRAINT IF EXISTS messages_pkey;
ALTER TABLE IF EXISTS ONLY public.enrollments DROP CONSTRAINT IF EXISTS enrollments_pkey;
ALTER TABLE IF EXISTS ONLY public.departments DROP CONSTRAINT IF EXISTS departments_pkey;
ALTER TABLE IF EXISTS ONLY public.courses DROP CONSTRAINT IF EXISTS courses_pkey;
ALTER TABLE IF EXISTS ONLY public.course_prerequisites DROP CONSTRAINT IF EXISTS course_prerequisites_pkey;
ALTER TABLE IF EXISTS ONLY public.content DROP CONSTRAINT IF EXISTS content_pkey;
ALTER TABLE IF EXISTS ONLY public.certificates DROP CONSTRAINT IF EXISTS certificates_pkey;
ALTER TABLE IF EXISTS ONLY public.certificate_templates DROP CONSTRAINT IF EXISTS certificate_templates_pkey;
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.assignments DROP CONSTRAINT IF EXISTS assignments_pkey;
ALTER TABLE IF EXISTS ONLY public.assignment_submissions DROP CONSTRAINT IF EXISTS assignment_submissions_pkey;
ALTER TABLE IF EXISTS ONLY public.assessments DROP CONSTRAINT IF EXISTS assessments_pkey;
ALTER TABLE IF EXISTS ONLY public.assessment_attempts DROP CONSTRAINT IF EXISTS assessment_attempts_pkey;
ALTER TABLE IF EXISTS ONLY public.announcements DROP CONSTRAINT IF EXISTS announcements_pkey;
ALTER TABLE IF EXISTS ONLY public._prisma_migrations DROP CONSTRAINT IF EXISTS _prisma_migrations_pkey;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.training_sessions;
DROP TABLE IF EXISTS public.session_attendances;
DROP TABLE IF EXISTS public.progress;
DROP TABLE IF EXISTS public.organizations;
DROP TABLE IF EXISTS public.modules;
DROP TABLE IF EXISTS public.messages;
DROP TABLE IF EXISTS public.enrollments;
DROP TABLE IF EXISTS public.departments;
DROP TABLE IF EXISTS public.courses;
DROP TABLE IF EXISTS public.course_prerequisites;
DROP TABLE IF EXISTS public.content;
DROP TABLE IF EXISTS public.certificates;
DROP TABLE IF EXISTS public.certificate_templates;
DROP TABLE IF EXISTS public.audit_logs;
DROP TABLE IF EXISTS public.assignments;
DROP TABLE IF EXISTS public.assignment_submissions;
DROP TABLE IF EXISTS public.assessments;
DROP TABLE IF EXISTS public.assessment_attempts;
DROP TABLE IF EXISTS public.announcements;
DROP TABLE IF EXISTS public._prisma_migrations;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: announcements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.announcements (
    id text NOT NULL,
    organization_id text NOT NULL,
    course_id text,
    department_id text,
    title text NOT NULL,
    content text NOT NULL,
    priority text DEFAULT 'normal'::text NOT NULL,
    is_pinned boolean DEFAULT false NOT NULL,
    published_at timestamp(3) without time zone,
    expires_at timestamp(3) without time zone,
    created_by text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: assessment_attempts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assessment_attempts (
    id text NOT NULL,
    enrollment_id text NOT NULL,
    assessment_id text NOT NULL,
    trainee_id text NOT NULL,
    attempt_number integer NOT NULL,
    answers jsonb NOT NULL,
    score numeric(5,2),
    is_passed boolean,
    time_taken integer,
    started_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    submitted_at timestamp(3) without time zone,
    graded_at timestamp(3) without time zone,
    graded_by text,
    feedback text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: assessments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assessments (
    id text NOT NULL,
    module_id text,
    course_id text NOT NULL,
    title text NOT NULL,
    description text,
    type text DEFAULT 'quiz'::text NOT NULL,
    passing_score integer DEFAULT 70 NOT NULL,
    max_attempts integer,
    time_limit integer,
    is_required boolean DEFAULT true NOT NULL,
    questions jsonb NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: assignment_submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assignment_submissions (
    id text NOT NULL,
    assignment_id text NOT NULL,
    enrollment_id text NOT NULL,
    trainee_id text NOT NULL,
    submission_text text,
    submission_files text[] DEFAULT ARRAY[]::text[],
    score numeric(5,2),
    feedback text,
    status text DEFAULT 'submitted'::text NOT NULL,
    submitted_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    graded_at timestamp(3) without time zone,
    graded_by text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assignments (
    id text NOT NULL,
    course_id text NOT NULL,
    module_id text,
    title text NOT NULL,
    description text,
    instructions text,
    due_date timestamp(3) without time zone,
    max_score integer DEFAULT 100 NOT NULL,
    is_required boolean DEFAULT true NOT NULL,
    created_by text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id text NOT NULL,
    organization_id text,
    user_id text,
    action text NOT NULL,
    entity_type text,
    entity_id text,
    changes jsonb,
    ip_address text,
    user_agent text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: certificate_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.certificate_templates (
    id text NOT NULL,
    organization_id text NOT NULL,
    name text NOT NULL,
    template_html text NOT NULL,
    template_css text,
    fields jsonb NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: certificates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.certificates (
    id text NOT NULL,
    enrollment_id text NOT NULL,
    template_id text NOT NULL,
    certificate_number text NOT NULL,
    pdf_url text,
    issued_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expires_at timestamp(3) without time zone,
    is_valid boolean DEFAULT true NOT NULL,
    revoked_at timestamp(3) without time zone,
    revoked_reason text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: content; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content (
    id text NOT NULL,
    module_id text NOT NULL,
    content_type text NOT NULL,
    title text NOT NULL,
    description text,
    "order" integer NOT NULL,
    file_url text,
    file_size bigint,
    duration integer,
    content_data jsonb,
    is_required boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: course_prerequisites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.course_prerequisites (
    id text NOT NULL,
    course_id text NOT NULL,
    prerequisite_course_id text NOT NULL,
    is_mandatory boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: courses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.courses (
    id text NOT NULL,
    organization_id text NOT NULL,
    course_code text NOT NULL,
    title text NOT NULL,
    description text,
    instructor_id text NOT NULL,
    department_id text,
    thumbnail_url text,
    difficulty_level text DEFAULT 'beginner'::text NOT NULL,
    estimated_duration integer,
    max_enrollments integer,
    is_certified boolean DEFAULT false NOT NULL,
    certificate_template_id text,
    status text DEFAULT 'draft'::text NOT NULL,
    is_public boolean DEFAULT false NOT NULL,
    tags text[] DEFAULT ARRAY[]::text[],
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    published_at timestamp(3) without time zone
);


--
-- Name: departments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.departments (
    id text NOT NULL,
    organization_id text NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    description text,
    manager_id text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: enrollments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.enrollments (
    id text NOT NULL,
    trainee_id text NOT NULL,
    course_id text NOT NULL,
    enrolled_by text,
    enrollment_type text DEFAULT 'self'::text NOT NULL,
    status text DEFAULT 'enrolled'::text NOT NULL,
    progress_percentage numeric(5,2) DEFAULT 0 NOT NULL,
    started_at timestamp(3) without time zone,
    completed_at timestamp(3) without time zone,
    due_date timestamp(3) without time zone,
    certificate_issued boolean DEFAULT false NOT NULL,
    certificate_issued_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id text NOT NULL,
    organization_id text NOT NULL,
    sender_id text NOT NULL,
    recipient_id text,
    course_id text,
    subject text,
    content text NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    read_at timestamp(3) without time zone,
    is_archived boolean DEFAULT false NOT NULL,
    parent_message_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: modules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.modules (
    id text NOT NULL,
    course_id text NOT NULL,
    title text NOT NULL,
    description text,
    "order" integer NOT NULL,
    estimated_duration integer,
    is_required boolean DEFAULT true NOT NULL,
    unlock_condition jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: organizations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organizations (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    domain text,
    logo_url text,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    subscription_tier text DEFAULT 'free'::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.progress (
    id text NOT NULL,
    enrollment_id text NOT NULL,
    module_id text NOT NULL,
    content_id text,
    trainee_id text NOT NULL,
    status text DEFAULT 'not_started'::text NOT NULL,
    progress_percentage numeric(5,2) DEFAULT 0 NOT NULL,
    time_spent integer DEFAULT 0 NOT NULL,
    last_accessed_at timestamp(3) without time zone,
    started_at timestamp(3) without time zone,
    completed_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    content_data jsonb
);


--
-- Name: COLUMN progress.content_data; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.progress.content_data IS 'For quiz submissions and other content-specific data';


--
-- Name: session_attendances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session_attendances (
    id text NOT NULL,
    session_id text NOT NULL,
    user_id text NOT NULL,
    status text DEFAULT 'registered'::text NOT NULL,
    check_in_time timestamp(3) without time zone,
    check_out_time timestamp(3) without time zone,
    notes text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: training_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.training_sessions (
    id text NOT NULL,
    organization_id text NOT NULL,
    course_id text,
    title text NOT NULL,
    description text,
    instructor_id text NOT NULL,
    department_id text,
    session_type text DEFAULT 'live'::text NOT NULL,
    start_time timestamp(3) without time zone NOT NULL,
    end_time timestamp(3) without time zone NOT NULL,
    location text,
    meeting_url text,
    max_participants integer,
    status text DEFAULT 'scheduled'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id text NOT NULL,
    organization_id text,
    department_id text,
    "employeeId" text NOT NULL,
    username text NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    phone text,
    address text,
    photo_url text,
    role text NOT NULL,
    "position" text,
    bio text,
    expertise text[] DEFAULT ARRAY[]::text[],
    is_active boolean DEFAULT true NOT NULL,
    last_login timestamp(3) without time zone,
    email_verified boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
11a44574-0e5d-44ac-a3f0-bba9856b7524	3203e131519bb538b8f1e26b1d7921898ac2ce1087ae6fd03f7f156f40ac1060	2026-01-15 18:52:42.667782+07	20260115115242_init	\N	\N	2026-01-15 18:52:42.494876+07	1
\.


--
-- Data for Name: announcements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.announcements (id, organization_id, course_id, department_id, title, content, priority, is_pinned, published_at, expires_at, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: assessment_attempts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.assessment_attempts (id, enrollment_id, assessment_id, trainee_id, attempt_number, answers, score, is_passed, time_taken, started_at, submitted_at, graded_at, graded_by, feedback, created_at) FROM stdin;
\.


--
-- Data for Name: assessments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.assessments (id, module_id, course_id, title, description, type, passing_score, max_attempts, time_limit, is_required, questions, settings, created_at, updated_at) FROM stdin;
1da8dadc-4889-4eba-80f2-d7831c14359e	b02f0e16-2957-4bf5-b31f-b6c0d9ce6007	e6aef328-23a4-4d9c-b81c-bf13693b0593	Kubernetes test	\N	quiz	70	1	1800	f	[{"id": "q-1768823468080", "type": "true-false", "points": 1, "options": ["True", "False"], "question": "Kubernetes is good?", "correctAnswers": 0}]	{"timeLimit": 1800, "allowRetake": false, "passingScore": 70, "randomizeQuestions": false, "showResultsImmediately": true}	2026-01-19 11:51:20.157	2026-01-19 11:51:20.157
\.


--
-- Data for Name: assignment_submissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.assignment_submissions (id, assignment_id, enrollment_id, trainee_id, submission_text, submission_files, score, feedback, status, submitted_at, graded_at, graded_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: assignments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.assignments (id, course_id, module_id, title, description, instructions, due_date, max_score, is_required, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, organization_id, user_id, action, entity_type, entity_id, changes, ip_address, user_agent, created_at) FROM stdin;
\.


--
-- Data for Name: certificate_templates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.certificate_templates (id, organization_id, name, template_html, template_css, fields, is_default, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: certificates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.certificates (id, enrollment_id, template_id, certificate_number, pdf_url, issued_at, expires_at, is_valid, revoked_at, revoked_reason, created_at) FROM stdin;
\.


--
-- Data for Name: content; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.content (id, module_id, content_type, title, description, "order", file_url, file_size, duration, content_data, is_required, created_at, updated_at) FROM stdin;
6823f57c-c65c-4b73-9f83-89197c196080	0674d7f6-a083-4405-bd12-691a0700e678	video	React.js Tutorial - Introduction	Introduction to React.js	1	/uploads/videos/ReactJs-Tutorial.mp4	\N	1800	\N	t	2026-01-19 10:56:48.397	2026-01-19 10:56:48.397
b76c6c21-444c-445b-bdf1-70a6044cf479	0674d7f6-a083-4405-bd12-691a0700e678	text	What is React?	Understanding React and its core concepts	2	\N	\N	\N	{"text": "React is a JavaScript library for building user interfaces. It allows you to create reusable UI components."}	t	2026-01-19 10:56:48.399	2026-01-19 10:56:48.399
db2a98c9-4067-43fe-b466-ade4674add6c	e10f26a4-b961-4832-bb69-3fe955337219	text	Component Basics	Understanding components	1	\N	\N	\N	{"text": "Components are the building blocks of React applications. They let you split the UI into independent, reusable pieces."}	t	2026-01-19 10:56:48.402	2026-01-19 10:56:48.402
37bf6beb-7373-4504-923a-7ccc881749ad	15e9eac9-bb33-4364-ac70-4fa92bde4639	text	useState Hook	Introduction to useState	1	\N	\N	\N	{"text": "The useState hook allows you to add state to functional components."}	t	2026-01-19 10:56:48.403	2026-01-19 10:56:48.403
9da5288a-e038-49ed-bdfc-1275a11fd8f0	f98ab084-8ee1-479e-8559-d3feeedf6788	video	Node.js Tutorial - Getting Started	Introduction to Node.js	1	/uploads/videos/NodeJs-Tutorial.mp4	\N	2400	\N	t	2026-01-19 10:56:48.406	2026-01-19 10:56:48.406
4ce83454-f0f6-47d2-a541-82662d9cc3d7	f98ab084-8ee1-479e-8559-d3feeedf6788	text	Node.js Overview	Understanding Node.js	2	\N	\N	\N	{"text": "Node.js is a JavaScript runtime built on Chrome's V8 JavaScript engine. It allows you to run JavaScript on the server."}	t	2026-01-19 10:56:48.407	2026-01-19 10:56:48.407
c5758c38-a481-4072-81b7-bedf03fe71fc	fe8e9628-a28c-431d-b16e-dc92f6a6be7f	text	Express.js Introduction	Getting started with Express	1	\N	\N	\N	{"text": "Express is a minimal and flexible Node.js web application framework that provides a robust set of features for web and mobile applications."}	t	2026-01-19 10:56:48.411	2026-01-19 10:56:48.411
624d999d-c887-4e30-9b51-339739853a8e	88d90ee9-92d6-42ca-8a9b-d913a8d99ce9	video	Docker Tutorial - Introduction	Introduction to Docker	1	/uploads/videos/Docker-Tutorial.mp4	\N	3000	\N	t	2026-01-19 10:56:48.415	2026-01-19 10:56:48.415
bdf244c6-41c9-4293-a82c-49a6481d22fe	88d90ee9-92d6-42ca-8a9b-d913a8d99ce9	text	What is Docker?	Understanding Docker	2	\N	\N	\N	{"text": "Docker is a platform for developing, shipping, and running applications in containers."}	t	2026-01-19 10:56:48.417	2026-01-19 10:56:48.417
ef0812f8-e3df-480f-aed0-9d78de461ad5	e1594025-bf38-449a-8038-ef5c31eda20e	text	Docker Compose Basics	Introduction to Docker Compose	1	\N	\N	\N	{"text": "Docker Compose is a tool for defining and running multi-container Docker applications."}	t	2026-01-19 10:56:48.419	2026-01-19 10:56:48.419
0256756c-791e-4ad2-9c35-978400e88606	a27f3cfa-f8f5-4d09-98ce-1434e87763cb	text	Python Introduction	Getting started with Python	1	\N	\N	\N	{"text": "Python is a high-level, interpreted programming language known for its simplicity and readability."}	t	2026-01-19 10:56:48.422	2026-01-19 10:56:48.422
6ec03e8a-54fe-4fdb-bf53-910bea6c403b	3e4b040b-adef-4fb8-8596-b70b7ad3b4bb	text	Lists and Dictionaries	Working with data structures	1	\N	\N	\N	{"text": "Python provides several built-in data structures including lists, dictionaries, tuples, and sets."}	t	2026-01-19 10:56:48.423	2026-01-19 10:56:48.423
949300ad-9cd8-4d1c-87f4-9debacfda58a	77d39731-f24f-44ec-968a-e2d82d424944	text	Defining Functions	Creating reusable code	1	\N	\N	\N	{"text": "Functions allow you to organize code into reusable blocks."}	t	2026-01-19 10:56:48.426	2026-01-19 10:56:48.426
60a10ac9-f8fb-4779-9143-ef4c7ec9d87a	8c1cf8aa-fc14-4542-b18c-2f71c046ab9d	text	What is Vue.js?	Introduction to Vue	1	\N	\N	\N	{"text": "Vue.js is a progressive JavaScript framework for building user interfaces."}	t	2026-01-19 10:56:48.429	2026-01-19 10:56:48.429
445ef352-17a2-42c8-99eb-1eee2c9e511d	296817b2-8444-4fc4-a0de-d9efcefcafbb	text	Component Basics	Understanding Vue components	1	\N	\N	\N	{"text": "Vue components are reusable Vue instances with a name."}	t	2026-01-19 10:56:48.431	2026-01-19 10:56:48.431
83288d6c-4f5a-441b-aecd-3c3c2e1ced26	328d501e-43a5-40d2-9e12-b3828d21b055	text	Introduction to AWS	AWS basics	1	\N	\N	\N	{"text": "Amazon Web Services (AWS) is a comprehensive cloud computing platform."}	t	2026-01-19 10:56:48.437	2026-01-19 10:56:48.437
59608b29-61d7-4ce4-b1f9-b2010d4957d5	3e4926a5-a0d2-454a-a18f-7211991ef799	text	EC2 Instances	Virtual servers in the cloud	1	\N	\N	\N	{"text": "Amazon EC2 provides scalable computing capacity in the cloud."}	t	2026-01-19 10:56:48.442	2026-01-19 10:56:48.442
c1fc58e6-0c2d-4bbe-9ae9-00af1d77f63c	ba89a814-f54d-4199-ab50-862de07093ca	text	Security Best Practices	Securing your AWS resources	1	\N	\N	\N	{"text": "Security is a shared responsibility between AWS and the customer."}	t	2026-01-19 10:56:48.445	2026-01-19 10:56:48.445
c2ba2551-5a97-4afb-b92b-167b61a103a2	19d1b3ed-5d3a-4c71-9cb4-bd09df9630d1	text	Introduction to React Native	Mobile app development	1	\N	\N	\N	{"text": "React Native lets you build mobile apps using only JavaScript."}	t	2026-01-19 10:56:48.448	2026-01-19 10:56:48.448
c7aa8da9-ae64-47d0-bedc-79bac016597e	c5470474-9fca-4a32-96f8-c009d8c4ac83	text	React Navigation	Navigation patterns	1	\N	\N	\N	{"text": "React Navigation provides routing and navigation for React Native apps."}	t	2026-01-19 10:56:48.449	2026-01-19 10:56:48.449
ca604de8-ce64-4f1f-b6a3-e4d3173bae9c	df7e5827-9184-480c-851c-13879fa19aad	text	What is TypeScript?	TypeScript overview	1	\N	\N	\N	{"text": "TypeScript is a typed superset of JavaScript that compiles to plain JavaScript."}	t	2026-01-19 10:56:48.453	2026-01-19 10:56:48.453
a85d5d0d-5585-4db9-9cdb-01115a34c126	bd6d6aca-c718-4b7e-9dae-c246252affa8	text	Generics and Interfaces	Advanced type features	1	\N	\N	\N	{"text": "TypeScript provides powerful type system features including generics and interfaces."}	t	2026-01-19 10:56:48.454	2026-01-19 10:56:48.454
10ebf3ab-51a1-4f38-af4d-d8efc2925fe0	e201724e-25ca-4da1-bc86-34dcca3d94d0	text	What is MongoDB?	NoSQL database	1	\N	\N	\N	{"text": "MongoDB is a NoSQL document database that provides high performance and scalability."}	t	2026-01-19 10:56:48.457	2026-01-19 10:56:48.457
5c65691e-fcac-4c3c-98b7-c69c307d0d3d	0b8f3b37-345e-46e0-b0e2-72c4772ef3a0	text	Creating and Querying	Database operations	1	\N	\N	\N	{"text": "MongoDB provides flexible querying capabilities for working with documents."}	t	2026-01-19 10:56:48.46	2026-01-19 10:56:48.46
ea6cf954-dc32-4e09-a709-f923bcec2944	392d148a-6ab2-47e0-bb07-1667cbf00c9a	text	Database Indexing	Performance optimization	1	\N	\N	\N	{"text": "Indexes improve query performance by allowing MongoDB to find documents more efficiently."}	t	2026-01-19 10:56:48.461	2026-01-19 10:56:48.461
481ad018-d33f-4833-b0b5-b31cb981772e	7f467f86-98b7-4058-9f0d-9ab3a2d8c9ee	text	What is Kubernetes?	Container orchestration	1	\N	\N	\N	{"text": "Kubernetes is an open-source container orchestration platform for automating deployment, scaling, and management."}	t	2026-01-19 10:56:48.464	2026-01-19 10:56:48.464
5459d31a-060d-4277-ad91-e8ea1985eb3a	b02f0e16-2957-4bf5-b31f-b6c0d9ce6007	text	Understanding Pods	Kubernetes pods	1	\N	\N	\N	{"text": "Pods are the smallest deployable units in Kubernetes."}	t	2026-01-19 10:56:48.465	2026-01-19 10:56:48.465
8f3fd229-55fc-4a16-ad72-2c2512ecf589	19491dc8-893c-4dca-8adb-efb22bce9e63	text	Deployment Strategies	Scaling applications	1	\N	\N	\N	{"text": "Kubernetes Deployments manage the creation and updating of Pods."}	t	2026-01-19 10:56:48.468	2026-01-19 10:56:48.468
\.


--
-- Data for Name: course_prerequisites; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.course_prerequisites (id, course_id, prerequisite_course_id, is_mandatory, created_at) FROM stdin;
\.


--
-- Data for Name: courses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.courses (id, organization_id, course_code, title, description, instructor_id, department_id, thumbnail_url, difficulty_level, estimated_duration, max_enrollments, is_certified, certificate_template_id, status, is_public, tags, metadata, created_at, updated_at, published_at) FROM stdin;
15baa412-8dbb-416b-a538-31119fd32caa	c033fa2c-914f-40dc-ac28-75a29cb68828	REACT101	React.js Fundamentals	Learn the fundamentals of React.js including components, hooks, and state management	4bc0e52c-aee0-4121-a277-01932fcb05ba	7a270975-2494-4099-a1e4-fe69e0a2e722	\N	beginner	40	\N	f	\N	published	t	{React,JavaScript,Frontend}	{}	2026-01-19 10:56:48.376	2026-01-19 10:56:48.376	\N
c578bcc6-c600-4034-b51e-74429f11bcce	c033fa2c-914f-40dc-ac28-75a29cb68828	NODE101	Node.js Backend Development	Master Node.js for building scalable backend applications	7466cb32-8f15-4622-8af9-817fd3beeb25	e05b96ae-04e8-4f3f-ba5c-b008dd78accd	\N	intermediate	50	\N	f	\N	published	t	{Node.js,Backend,JavaScript}	{}	2026-01-19 10:56:48.404	2026-01-19 10:56:48.404	\N
6291bcbd-5f0b-4a91-a419-8fcdc02357ba	59c5a8b7-c99a-4ee0-9e23-fe3a96d48ebd	DOCKER101	Docker Containerization	Learn Docker for containerizing applications	cf74c8ff-5afa-4a25-9ee9-776415445845	51195058-10d4-4a04-ab23-4199a6a885cf	\N	intermediate	35	\N	f	\N	published	t	{Docker,DevOps,Containers}	{}	2026-01-19 10:56:48.412	2026-01-19 10:56:48.412	\N
fab9eaa7-29af-4521-bdfe-2f17444eb97b	c033fa2c-914f-40dc-ac28-75a29cb68828	PYTHON101	Python Programming	Learn Python from scratch	7466cb32-8f15-4622-8af9-817fd3beeb25	e05b96ae-04e8-4f3f-ba5c-b008dd78accd	\N	beginner	45	\N	f	\N	published	t	{Python,Programming,Backend}	{}	2026-01-19 10:56:48.42	2026-01-19 10:56:48.42	\N
464762a0-c45f-45e6-a96a-179d28d8e575	59c5a8b7-c99a-4ee0-9e23-fe3a96d48ebd	VUE101	Vue.js Framework	Build modern web applications with Vue.js	cf74c8ff-5afa-4a25-9ee9-776415445845	51195058-10d4-4a04-ab23-4199a6a885cf	\N	beginner	40	\N	f	\N	published	t	{Vue.js,Frontend,JavaScript}	{}	2026-01-19 10:56:48.427	2026-01-19 10:56:48.427	\N
a3a014c9-7374-4131-96f3-825b0315f7cf	3576e5f6-0335-4427-b281-337003438c99	AWS101	AWS Cloud Fundamentals	Introduction to Amazon Web Services	8ca18eaa-45d1-4706-b043-1fb42a03a899	9c130b6a-b7b8-4972-8098-a2466602e7bf	\N	intermediate	60	\N	f	\N	published	t	{AWS,Cloud,DevOps}	{}	2026-01-19 10:56:48.431	2026-01-19 10:56:48.431	\N
339ff4e1-47ac-428b-a947-f0a6c99c71b7	59c5a8b7-c99a-4ee0-9e23-fe3a96d48ebd	MOBILE101	React Native Mobile Development	Build cross-platform mobile apps	40eb8d7a-c3bb-43a8-9a41-9ea928456d86	fd98bec9-19c6-4343-a687-fd27b9a2697e	\N	intermediate	50	\N	f	\N	published	t	{"React Native",Mobile,JavaScript}	{}	2026-01-19 10:56:48.446	2026-01-19 10:56:48.446	\N
c15bed7c-4276-4419-814a-01224e89d2e5	c033fa2c-914f-40dc-ac28-75a29cb68828	TYPESCRIPT101	TypeScript for JavaScript Developers	Add type safety to your JavaScript code	4bc0e52c-aee0-4121-a277-01932fcb05ba	7a270975-2494-4099-a1e4-fe69e0a2e722	\N	intermediate	35	\N	f	\N	published	t	{TypeScript,JavaScript,Programming}	{}	2026-01-19 10:56:48.451	2026-01-19 10:56:48.451	\N
9e69a2b3-7ccd-4286-af82-5dab6e390dc4	59c5a8b7-c99a-4ee0-9e23-fe3a96d48ebd	MONGODB101	MongoDB Database	Learn NoSQL database with MongoDB	cf74c8ff-5afa-4a25-9ee9-776415445845	51195058-10d4-4a04-ab23-4199a6a885cf	\N	beginner	40	\N	f	\N	published	t	{MongoDB,Database,NoSQL}	{}	2026-01-19 10:56:48.455	2026-01-19 10:56:48.455	\N
e6aef328-23a4-4d9c-b81c-bf13693b0593	3576e5f6-0335-4427-b281-337003438c99	KUBERNETES101	Kubernetes Orchestration	Container orchestration with Kubernetes	8ca18eaa-45d1-4706-b043-1fb42a03a899	9c130b6a-b7b8-4972-8098-a2466602e7bf	\N	advanced	70	\N	f	\N	published	t	{Kubernetes,DevOps,Containers}	{}	2026-01-19 10:56:48.462	2026-01-19 10:56:48.462	\N
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.departments (id, organization_id, name, code, description, manager_id, is_active, created_at, updated_at) FROM stdin;
7a270975-2494-4099-a1e4-fe69e0a2e722	c033fa2c-914f-40dc-ac28-75a29cb68828	Engineering	ENG	Software Engineering Department	\N	t	2026-01-19 10:56:48.022	2026-01-19 10:56:48.022
e05b96ae-04e8-4f3f-ba5c-b008dd78accd	c033fa2c-914f-40dc-ac28-75a29cb68828	DevOps	OPS	DevOps and Infrastructure	\N	t	2026-01-19 10:56:48.026	2026-01-19 10:56:48.026
91f1f4dc-10ea-420c-8e98-8402174c1447	c033fa2c-914f-40dc-ac28-75a29cb68828	Quality Assurance	QA	QA and Testing	\N	t	2026-01-19 10:56:48.027	2026-01-19 10:56:48.027
51195058-10d4-4a04-ab23-4199a6a885cf	59c5a8b7-c99a-4ee0-9e23-fe3a96d48ebd	Frontend Development	FE	Frontend Development Training	\N	t	2026-01-19 10:56:48.029	2026-01-19 10:56:48.029
b1ea932f-573e-4e4f-b95e-da975113c83e	59c5a8b7-c99a-4ee0-9e23-fe3a96d48ebd	Backend Development	BE	Backend Development Training	\N	t	2026-01-19 10:56:48.03	2026-01-19 10:56:48.03
fd98bec9-19c6-4343-a687-fd27b9a2697e	59c5a8b7-c99a-4ee0-9e23-fe3a96d48ebd	Mobile Development	MOB	Mobile App Development	\N	t	2026-01-19 10:56:48.031	2026-01-19 10:56:48.031
9c130b6a-b7b8-4972-8098-a2466602e7bf	3576e5f6-0335-4427-b281-337003438c99	Cloud Infrastructure	CLOUD	Cloud Infrastructure Team	\N	t	2026-01-19 10:56:48.033	2026-01-19 10:56:48.033
0c36c3ed-1c48-42b9-b78a-1e0457587589	3576e5f6-0335-4427-b281-337003438c99	Security	SEC	Security and Compliance	\N	t	2026-01-19 10:56:48.034	2026-01-19 10:56:48.034
\.


--
-- Data for Name: enrollments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.enrollments (id, trainee_id, course_id, enrolled_by, enrollment_type, status, progress_percentage, started_at, completed_at, due_date, certificate_issued, certificate_issued_at, created_at, updated_at) FROM stdin;
a485bd74-d0f8-407a-baf1-223c32125db1	e09b49d3-e50d-4eae-af62-82f34f2be4e8	e6aef328-23a4-4d9c-b81c-bf13693b0593	\N	self	enrolled	0.00	2026-01-19 11:01:19.19	\N	\N	f	\N	2026-01-19 11:01:19.194	2026-01-19 11:01:19.194
86eb5e60-f46f-4dbc-8104-62ea4ee163f0	e09b49d3-e50d-4eae-af62-82f34f2be4e8	9e69a2b3-7ccd-4286-af82-5dab6e390dc4	\N	self	enrolled	0.00	2026-01-19 11:01:30.266	\N	\N	f	\N	2026-01-19 11:01:30.269	2026-01-19 11:01:30.269
f9188917-a6c7-4175-9ef4-bed7da4fd8e8	e09b49d3-e50d-4eae-af62-82f34f2be4e8	c15bed7c-4276-4419-814a-01224e89d2e5	\N	self	completed	100.00	2026-01-19 11:28:42.677	2026-01-19 11:42:23.41	\N	f	\N	2026-01-19 11:28:42.679	2026-01-19 11:42:23.411
b3bb0fdf-eb79-4aae-b3bd-5bfb4032754e	e09b49d3-e50d-4eae-af62-82f34f2be4e8	fab9eaa7-29af-4521-bdfe-2f17444eb97b	\N	self	in_progress	66.67	2026-01-20 07:14:25.006	\N	\N	f	\N	2026-01-20 07:14:25.026	2026-01-20 07:14:41.363
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.messages (id, organization_id, sender_id, recipient_id, course_id, subject, content, is_read, read_at, is_archived, parent_message_id, created_at) FROM stdin;
\.


--
-- Data for Name: modules; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.modules (id, course_id, title, description, "order", estimated_duration, is_required, unlock_condition, created_at, updated_at) FROM stdin;
0674d7f6-a083-4405-bd12-691a0700e678	15baa412-8dbb-416b-a538-31119fd32caa	Introduction to React	Get started with React basics	1	10	t	\N	2026-01-19 10:56:48.393	2026-01-19 10:56:48.393
e10f26a4-b961-4832-bb69-3fe955337219	15baa412-8dbb-416b-a538-31119fd32caa	Components and Props	Learn about React components	2	15	t	\N	2026-01-19 10:56:48.401	2026-01-19 10:56:48.401
15e9eac9-bb33-4364-ac70-4fa92bde4639	15baa412-8dbb-416b-a538-31119fd32caa	State and Hooks	Managing state in React	3	15	t	\N	2026-01-19 10:56:48.403	2026-01-19 10:56:48.403
f98ab084-8ee1-479e-8559-d3feeedf6788	c578bcc6-c600-4034-b51e-74429f11bcce	Node.js Basics	Introduction to Node.js	1	15	t	\N	2026-01-19 10:56:48.405	2026-01-19 10:56:48.405
fe8e9628-a28c-431d-b16e-dc92f6a6be7f	c578bcc6-c600-4034-b51e-74429f11bcce	Express.js Framework	Building REST APIs with Express	2	20	t	\N	2026-01-19 10:56:48.409	2026-01-19 10:56:48.409
88d90ee9-92d6-42ca-8a9b-d913a8d99ce9	6291bcbd-5f0b-4a91-a419-8fcdc02357ba	Docker Fundamentals	Understanding Docker basics	1	20	t	\N	2026-01-19 10:56:48.414	2026-01-19 10:56:48.414
e1594025-bf38-449a-8038-ef5c31eda20e	6291bcbd-5f0b-4a91-a419-8fcdc02357ba	Docker Compose	Orchestrating multi-container applications	2	15	t	\N	2026-01-19 10:56:48.418	2026-01-19 10:56:48.418
a27f3cfa-f8f5-4d09-98ce-1434e87763cb	fab9eaa7-29af-4521-bdfe-2f17444eb97b	Python Basics	Introduction to Python	1	20	t	\N	2026-01-19 10:56:48.421	2026-01-19 10:56:48.421
3e4b040b-adef-4fb8-8596-b70b7ad3b4bb	fab9eaa7-29af-4521-bdfe-2f17444eb97b	Data Structures	Python data structures	2	15	t	\N	2026-01-19 10:56:48.423	2026-01-19 10:56:48.423
77d39731-f24f-44ec-968a-e2d82d424944	fab9eaa7-29af-4521-bdfe-2f17444eb97b	Functions and Modules	Organizing code with functions	3	10	t	\N	2026-01-19 10:56:48.425	2026-01-19 10:56:48.425
8c1cf8aa-fc14-4542-b18c-2f71c046ab9d	464762a0-c45f-45e6-a96a-179d28d8e575	Vue.js Introduction	Getting started with Vue	1	15	t	\N	2026-01-19 10:56:48.429	2026-01-19 10:56:48.429
296817b2-8444-4fc4-a0de-d9efcefcafbb	464762a0-c45f-45e6-a96a-179d28d8e575	Components and Templates	Vue components	2	15	t	\N	2026-01-19 10:56:48.43	2026-01-19 10:56:48.43
328d501e-43a5-40d2-9e12-b3828d21b055	a3a014c9-7374-4131-96f3-825b0315f7cf	AWS Overview	Understanding AWS services	1	20	t	\N	2026-01-19 10:56:48.435	2026-01-19 10:56:48.435
3e4926a5-a0d2-454a-a18f-7211991ef799	a3a014c9-7374-4131-96f3-825b0315f7cf	EC2 and S3	Core AWS services	2	20	t	\N	2026-01-19 10:56:48.439	2026-01-19 10:56:48.439
ba89a814-f54d-4199-ab50-862de07093ca	a3a014c9-7374-4131-96f3-825b0315f7cf	Cloud Security	AWS security best practices	3	20	t	\N	2026-01-19 10:56:48.444	2026-01-19 10:56:48.444
19d1b3ed-5d3a-4c71-9cb4-bd09df9630d1	339ff4e1-47ac-428b-a947-f0a6c99c71b7	React Native Basics	Getting started with React Native	1	20	t	\N	2026-01-19 10:56:48.447	2026-01-19 10:56:48.447
c5470474-9fca-4a32-96f8-c009d8c4ac83	339ff4e1-47ac-428b-a947-f0a6c99c71b7	Navigation and State	Managing navigation in mobile apps	2	15	t	\N	2026-01-19 10:56:48.448	2026-01-19 10:56:48.448
df7e5827-9184-480c-851c-13879fa19aad	c15bed7c-4276-4419-814a-01224e89d2e5	TypeScript Basics	Introduction to TypeScript	1	15	t	\N	2026-01-19 10:56:48.452	2026-01-19 10:56:48.452
bd6d6aca-c718-4b7e-9dae-c246252affa8	c15bed7c-4276-4419-814a-01224e89d2e5	Advanced Types	Complex TypeScript types	2	20	t	\N	2026-01-19 10:56:48.454	2026-01-19 10:56:48.454
e201724e-25ca-4da1-bc86-34dcca3d94d0	9e69a2b3-7ccd-4286-af82-5dab6e390dc4	MongoDB Introduction	Understanding MongoDB	1	15	t	\N	2026-01-19 10:56:48.456	2026-01-19 10:56:48.456
0b8f3b37-345e-46e0-b0e2-72c4772ef3a0	9e69a2b3-7ccd-4286-af82-5dab6e390dc4	CRUD Operations	Working with MongoDB	2	15	t	\N	2026-01-19 10:56:48.458	2026-01-19 10:56:48.458
392d148a-6ab2-47e0-bb07-1667cbf00c9a	9e69a2b3-7ccd-4286-af82-5dab6e390dc4	Indexing and Performance	Optimizing MongoDB	3	10	t	\N	2026-01-19 10:56:48.461	2026-01-19 10:56:48.461
7f467f86-98b7-4058-9f0d-9ab3a2d8c9ee	e6aef328-23a4-4d9c-b81c-bf13693b0593	Kubernetes Basics	Introduction to Kubernetes	1	25	t	\N	2026-01-19 10:56:48.463	2026-01-19 10:56:48.463
b02f0e16-2957-4bf5-b31f-b6c0d9ce6007	e6aef328-23a4-4d9c-b81c-bf13693b0593	Pods and Services	Core Kubernetes concepts	2	25	t	\N	2026-01-19 10:56:48.464	2026-01-19 10:56:48.464
19491dc8-893c-4dca-8adb-efb22bce9e63	e6aef328-23a4-4d9c-b81c-bf13693b0593	Deployments and Scaling	Managing applications	3	20	t	\N	2026-01-19 10:56:48.466	2026-01-19 10:56:48.466
\.


--
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.organizations (id, name, slug, domain, logo_url, settings, subscription_tier, is_active, created_at, updated_at) FROM stdin;
c033fa2c-914f-40dc-ac28-75a29cb68828	TechCorp Solutions	techcorp-solutions	techcorp.com	\N	{}	free	t	2026-01-19 10:32:02.646	2026-01-19 10:32:02.646
59c5a8b7-c99a-4ee0-9e23-fe3a96d48ebd	EduTech Academy	edutech-academy	edutech.edu	\N	{}	free	t	2026-01-19 10:56:48.011	2026-01-19 10:56:48.011
3576e5f6-0335-4427-b281-337003438c99	Cloud Services Inc	cloud-services-inc	cloudservices.io	\N	{}	free	t	2026-01-19 10:56:48.018	2026-01-19 10:56:48.018
\.


--
-- Data for Name: progress; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.progress (id, enrollment_id, module_id, content_id, trainee_id, status, progress_percentage, time_spent, last_accessed_at, started_at, completed_at, created_at, updated_at, content_data) FROM stdin;
57b8a428-ef4b-4aa1-8b04-568730ddc797	f9188917-a6c7-4175-9ef4-bed7da4fd8e8	bd6d6aca-c718-4b7e-9dae-c246252affa8	\N	e09b49d3-e50d-4eae-af62-82f34f2be4e8	completed	100.00	0	\N	2026-01-19 11:42:23.403	2026-01-19 11:42:23.403	2026-01-19 11:42:23.404	2026-01-19 11:42:23.404	\N
2ec7a99d-984c-40b0-b228-3d75edcaacda	b3bb0fdf-eb79-4aae-b3bd-5bfb4032754e	a27f3cfa-f8f5-4d09-98ce-1434e87763cb	0256756c-791e-4ad2-9c35-978400e88606	e09b49d3-e50d-4eae-af62-82f34f2be4e8	completed	100.00	0	2026-01-20 07:14:35.298	2026-01-20 07:14:35.298	2026-01-20 07:14:35.298	2026-01-20 07:14:35.301	2026-01-20 07:14:35.301	\N
220a16d1-a35e-4028-9cfc-64189814a96d	b3bb0fdf-eb79-4aae-b3bd-5bfb4032754e	a27f3cfa-f8f5-4d09-98ce-1434e87763cb	\N	e09b49d3-e50d-4eae-af62-82f34f2be4e8	completed	100.00	0	\N	2026-01-20 07:14:35.417	2026-01-20 07:14:35.417	2026-01-20 07:14:35.419	2026-01-20 07:14:35.419	\N
ebd0afae-c6cc-4085-ad91-449806d09f42	b3bb0fdf-eb79-4aae-b3bd-5bfb4032754e	3e4b040b-adef-4fb8-8596-b70b7ad3b4bb	6ec03e8a-54fe-4fdb-bf53-910bea6c403b	e09b49d3-e50d-4eae-af62-82f34f2be4e8	completed	100.00	0	2026-01-20 07:14:41.316	2026-01-20 07:14:41.316	2026-01-20 07:14:41.316	2026-01-20 07:14:41.319	2026-01-20 07:14:41.319	\N
f4e1b994-3941-4cf1-b032-bedf4c301c1c	b3bb0fdf-eb79-4aae-b3bd-5bfb4032754e	3e4b040b-adef-4fb8-8596-b70b7ad3b4bb	\N	e09b49d3-e50d-4eae-af62-82f34f2be4e8	completed	100.00	0	\N	2026-01-20 07:14:41.342	2026-01-20 07:14:41.342	2026-01-20 07:14:41.344	2026-01-20 07:14:41.344	\N
a31d0baa-62e3-4c95-8eef-6fe6b0cadf80	f9188917-a6c7-4175-9ef4-bed7da4fd8e8	df7e5827-9184-480c-851c-13879fa19aad	ca604de8-ce64-4f1f-b6a3-e4d3173bae9c	e09b49d3-e50d-4eae-af62-82f34f2be4e8	completed	100.00	0	2026-01-19 11:33:07.269	2026-01-19 11:33:07.269	2026-01-19 11:33:07.269	2026-01-19 11:33:07.27	2026-01-19 11:33:07.27	\N
22e6eefd-3f92-4541-aba0-ab0b34b68ed3	f9188917-a6c7-4175-9ef4-bed7da4fd8e8	df7e5827-9184-480c-851c-13879fa19aad	\N	e09b49d3-e50d-4eae-af62-82f34f2be4e8	completed	100.00	0	\N	2026-01-19 11:33:07.349	2026-01-19 11:33:07.349	2026-01-19 11:33:07.35	2026-01-19 11:33:07.35	\N
287f325f-6e9a-4c18-b3f0-a5da8fe48f44	f9188917-a6c7-4175-9ef4-bed7da4fd8e8	bd6d6aca-c718-4b7e-9dae-c246252affa8	a85d5d0d-5585-4db9-9cdb-01115a34c126	e09b49d3-e50d-4eae-af62-82f34f2be4e8	completed	100.00	0	2026-01-19 11:42:23.393	2026-01-19 11:42:23.393	2026-01-19 11:42:23.393	2026-01-19 11:42:23.394	2026-01-19 11:42:23.394	\N
\.


--
-- Data for Name: session_attendances; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.session_attendances (id, session_id, user_id, status, check_in_time, check_out_time, notes, created_at) FROM stdin;
\.


--
-- Data for Name: training_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.training_sessions (id, organization_id, course_id, title, description, instructor_id, department_id, session_type, start_time, end_time, location, meeting_url, max_participants, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, organization_id, department_id, "employeeId", username, email, password_hash, first_name, last_name, phone, address, photo_url, role, "position", bio, expertise, is_active, last_login, email_verified, created_at, updated_at) FROM stdin;
e09b49d3-e50d-4eae-af62-82f34f2be4e8	c033fa2c-914f-40dc-ac28-75a29cb68828	7a270975-2494-4099-a1e4-fe69e0a2e722	TRN001	trainee1	trainee1@example.com	$2b$10$oqOZOF5B96f2VWrGAtcZEOQBaXkUTSW..EYZgtUY.EKk61z..rui6	Alice	Anderson	+1234567900	\N	\N	trainee	Junior Developer	\N	{}	t	2026-01-20 06:52:42.46	f	2026-01-19 10:56:48.272	2026-01-20 06:52:42.501
cf74c8ff-5afa-4a25-9ee9-776415445845	59c5a8b7-c99a-4ee0-9e23-fe3a96d48ebd	51195058-10d4-4a04-ab23-4199a6a885cf	INST003	instructor3	instructor3@example.com	$2b$10$oqOZOF5B96f2VWrGAtcZEOQBaXkUTSW..EYZgtUY.EKk61z..rui6	Michael	Brown	+1234567892	\N	\N	instructor	Full Stack Instructor	Expert in modern web development frameworks	{Vue.js,TypeScript,MongoDB}	t	\N	f	2026-01-19 10:56:48.104	2026-01-19 10:56:48.104
7466cb32-8f15-4622-8af9-817fd3beeb25	c033fa2c-914f-40dc-ac28-75a29cb68828	e05b96ae-04e8-4f3f-ba5c-b008dd78accd	INST002	instructor2	instructor2@example.com	$2b$10$oqOZOF5B96f2VWrGAtcZEOQBaXkUTSW..EYZgtUY.EKk61z..rui6	Sarah	Johnson	+1234567891	\N	\N	instructor	Lead Instructor	Specialized in backend development and database design	{Python,PostgreSQL,Docker}	t	\N	f	2026-01-19 10:56:48.104	2026-01-19 10:56:48.104
8ca18eaa-45d1-4706-b043-1fb42a03a899	3576e5f6-0335-4427-b281-337003438c99	9c130b6a-b7b8-4972-8098-a2466602e7bf	INST004	instructor4	instructor4@example.com	$2b$10$oqOZOF5B96f2VWrGAtcZEOQBaXkUTSW..EYZgtUY.EKk61z..rui6	Emily	Davis	+1234567893	\N	\N	instructor	DevOps Instructor	Specialized in cloud infrastructure and CI/CD	{AWS,Kubernetes,Terraform}	t	\N	f	2026-01-19 10:56:48.104	2026-01-19 10:56:48.104
40eb8d7a-c3bb-43a8-9a41-9ea928456d86	59c5a8b7-c99a-4ee0-9e23-fe3a96d48ebd	fd98bec9-19c6-4343-a687-fd27b9a2697e	INST005	instructor5	instructor5@example.com	$2b$10$oqOZOF5B96f2VWrGAtcZEOQBaXkUTSW..EYZgtUY.EKk61z..rui6	David	Wilson	+1234567894	\N	\N	instructor	Mobile Development Instructor	Expert in mobile app development for iOS and Android	{"React Native",Flutter,Swift}	t	\N	f	2026-01-19 10:56:48.104	2026-01-19 10:56:48.104
a28bd472-f47f-4c0d-ab89-4ce8361af7d7	c033fa2c-914f-40dc-ac28-75a29cb68828	91f1f4dc-10ea-420c-8e98-8402174c1447	TRN003	trainee3	trainee3@example.com	$2b$10$oqOZOF5B96f2VWrGAtcZEOQBaXkUTSW..EYZgtUY.EKk61z..rui6	Charlie	Clark	+1234567902	\N	\N	trainee	Junior Developer	\N	{}	t	\N	f	2026-01-19 10:56:48.272	2026-01-19 10:56:48.272
1bbd0bd4-8b80-44de-b3d2-0f403fd36ab9	3576e5f6-0335-4427-b281-337003438c99	0c36c3ed-1c48-42b9-b78a-1e0457587589	TRN008	trainee8	trainee8@example.com	$2b$10$oqOZOF5B96f2VWrGAtcZEOQBaXkUTSW..EYZgtUY.EKk61z..rui6	Hannah	Harris	+1234567907	\N	\N	trainee	Junior Developer	\N	{}	t	\N	f	2026-01-19 10:56:48.272	2026-01-19 10:56:48.272
8641ae3d-d927-452b-954d-bb206942e47b	c033fa2c-914f-40dc-ac28-75a29cb68828	e05b96ae-04e8-4f3f-ba5c-b008dd78accd	TRN002	trainee2	trainee2@example.com	$2b$10$oqOZOF5B96f2VWrGAtcZEOQBaXkUTSW..EYZgtUY.EKk61z..rui6	Bob	Baker	+1234567901	\N	\N	trainee	Junior Developer	\N	{}	t	\N	f	2026-01-19 10:56:48.272	2026-01-19 10:56:48.272
eea443bc-470c-4044-b736-b50588be39a8	59c5a8b7-c99a-4ee0-9e23-fe3a96d48ebd	51195058-10d4-4a04-ab23-4199a6a885cf	TRN004	trainee4	trainee4@example.com	$2b$10$oqOZOF5B96f2VWrGAtcZEOQBaXkUTSW..EYZgtUY.EKk61z..rui6	Diana	Diaz	+1234567903	\N	\N	trainee	Junior Developer	\N	{}	t	\N	f	2026-01-19 10:56:48.272	2026-01-19 10:56:48.272
f84b55ad-7217-433f-871e-2d3d9fa4f0f3	59c5a8b7-c99a-4ee0-9e23-fe3a96d48ebd	b1ea932f-573e-4e4f-b95e-da975113c83e	TRN005	trainee5	trainee5@example.com	$2b$10$oqOZOF5B96f2VWrGAtcZEOQBaXkUTSW..EYZgtUY.EKk61z..rui6	Edward	Evans	+1234567904	\N	\N	trainee	Junior Developer	\N	{}	t	\N	f	2026-01-19 10:56:48.272	2026-01-19 10:56:48.272
f3a00fcb-f4d2-4dc9-b0e6-27eb8020eed0	59c5a8b7-c99a-4ee0-9e23-fe3a96d48ebd	b1ea932f-573e-4e4f-b95e-da975113c83e	TRN010	trainee10	trainee10@example.com	$2b$10$oqOZOF5B96f2VWrGAtcZEOQBaXkUTSW..EYZgtUY.EKk61z..rui6	Julia	Jones	+1234567909	\N	\N	trainee	Junior Developer	\N	{}	t	\N	f	2026-01-19 10:56:48.273	2026-01-19 10:56:48.273
52e78768-d815-4335-8109-3b6f6c3e0dbe	3576e5f6-0335-4427-b281-337003438c99	9c130b6a-b7b8-4972-8098-a2466602e7bf	TRN007	trainee7	trainee7@example.com	$2b$10$oqOZOF5B96f2VWrGAtcZEOQBaXkUTSW..EYZgtUY.EKk61z..rui6	George	Garcia	+1234567906	\N	\N	trainee	Junior Developer	\N	{}	t	\N	f	2026-01-19 10:56:48.272	2026-01-19 10:56:48.272
d5fe594f-a50c-4b73-b9a9-df9d39a62dfe	c033fa2c-914f-40dc-ac28-75a29cb68828	7a270975-2494-4099-a1e4-fe69e0a2e722	TRN009	trainee9	trainee9@example.com	$2b$10$oqOZOF5B96f2VWrGAtcZEOQBaXkUTSW..EYZgtUY.EKk61z..rui6	Ian	Irwin	+1234567908	\N	\N	trainee	Junior Developer	\N	{}	t	\N	f	2026-01-19 10:56:48.273	2026-01-19 10:56:48.273
e79c8b71-74ce-439e-93e3-21c9885ac1c9	59c5a8b7-c99a-4ee0-9e23-fe3a96d48ebd	fd98bec9-19c6-4343-a687-fd27b9a2697e	TRN006	trainee6	trainee6@example.com	$2b$10$oqOZOF5B96f2VWrGAtcZEOQBaXkUTSW..EYZgtUY.EKk61z..rui6	Fiona	Foster	+1234567905	\N	\N	trainee	Junior Developer	\N	{}	t	\N	f	2026-01-19 10:56:48.272	2026-01-19 10:56:48.272
4bc0e52c-aee0-4121-a277-01932fcb05ba	c033fa2c-914f-40dc-ac28-75a29cb68828	e05b96ae-04e8-4f3f-ba5c-b008dd78accd	INST001	instructor1	instructor1@example.com	$2b$10$oqOZOF5B96f2VWrGAtcZEOQBaXkUTSW..EYZgtUY.EKk61z..rui6	John	Smith	+1234567890	98 Trung Liet	\N	instructor	Senior Instructor	Experienced instructor with 10+ years in software development	{JavaScript,React,Node.js}	t	2026-01-25 15:06:01.258	f	2026-01-19 10:56:48.104	2026-01-25 15:06:01.3
d7c756d4-eb18-40ad-a863-1d07a286675c	c033fa2c-914f-40dc-ac28-75a29cb68828	\N	EMP-1768497542841	admin	admin@course.com	$2b$10$2EvTJ.wM3Cn0911t8VeNfObppG9J38XpEqC5Dum33bvfIvxjiYl4m	System	Admin	\N	\N	\N	admin	\N	\N	{}	t	2026-01-25 15:06:24.599	f	2026-01-15 17:19:02.846	2026-01-25 15:06:24.603
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- Name: assessment_attempts assessment_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_attempts
    ADD CONSTRAINT assessment_attempts_pkey PRIMARY KEY (id);


--
-- Name: assessments assessments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessments
    ADD CONSTRAINT assessments_pkey PRIMARY KEY (id);


--
-- Name: assignment_submissions assignment_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_submissions
    ADD CONSTRAINT assignment_submissions_pkey PRIMARY KEY (id);


--
-- Name: assignments assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: certificate_templates certificate_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificate_templates
    ADD CONSTRAINT certificate_templates_pkey PRIMARY KEY (id);


--
-- Name: certificates certificates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_pkey PRIMARY KEY (id);


--
-- Name: content content_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content
    ADD CONSTRAINT content_pkey PRIMARY KEY (id);


--
-- Name: course_prerequisites course_prerequisites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_prerequisites
    ADD CONSTRAINT course_prerequisites_pkey PRIMARY KEY (id);


--
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: enrollments enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: modules modules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: progress progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.progress
    ADD CONSTRAINT progress_pkey PRIMARY KEY (id);


--
-- Name: session_attendances session_attendances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_attendances
    ADD CONSTRAINT session_attendances_pkey PRIMARY KEY (id);


--
-- Name: training_sessions training_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_sessions
    ADD CONSTRAINT training_sessions_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: announcements_course_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX announcements_course_id_idx ON public.announcements USING btree (course_id);


--
-- Name: announcements_department_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX announcements_department_id_idx ON public.announcements USING btree (department_id);


--
-- Name: announcements_is_pinned_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX announcements_is_pinned_idx ON public.announcements USING btree (is_pinned);


--
-- Name: announcements_organization_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX announcements_organization_id_idx ON public.announcements USING btree (organization_id);


--
-- Name: announcements_published_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX announcements_published_at_idx ON public.announcements USING btree (published_at);


--
-- Name: assessment_attempts_assessment_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX assessment_attempts_assessment_id_idx ON public.assessment_attempts USING btree (assessment_id);


--
-- Name: assessment_attempts_enrollment_id_assessment_id_attempt_num_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX assessment_attempts_enrollment_id_assessment_id_attempt_num_key ON public.assessment_attempts USING btree (enrollment_id, assessment_id, attempt_number);


--
-- Name: assessment_attempts_enrollment_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX assessment_attempts_enrollment_id_idx ON public.assessment_attempts USING btree (enrollment_id);


--
-- Name: assessment_attempts_trainee_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX assessment_attempts_trainee_id_idx ON public.assessment_attempts USING btree (trainee_id);


--
-- Name: assessments_course_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX assessments_course_id_idx ON public.assessments USING btree (course_id);


--
-- Name: assessments_module_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX assessments_module_id_idx ON public.assessments USING btree (module_id);


--
-- Name: assessments_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX assessments_type_idx ON public.assessments USING btree (type);


--
-- Name: assignment_submissions_assignment_id_enrollment_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX assignment_submissions_assignment_id_enrollment_id_key ON public.assignment_submissions USING btree (assignment_id, enrollment_id);


--
-- Name: assignment_submissions_assignment_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX assignment_submissions_assignment_id_idx ON public.assignment_submissions USING btree (assignment_id);


--
-- Name: assignment_submissions_enrollment_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX assignment_submissions_enrollment_id_idx ON public.assignment_submissions USING btree (enrollment_id);


--
-- Name: assignment_submissions_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX assignment_submissions_status_idx ON public.assignment_submissions USING btree (status);


--
-- Name: assignment_submissions_trainee_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX assignment_submissions_trainee_id_idx ON public.assignment_submissions USING btree (trainee_id);


--
-- Name: assignments_course_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX assignments_course_id_idx ON public.assignments USING btree (course_id);


--
-- Name: assignments_due_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX assignments_due_date_idx ON public.assignments USING btree (due_date);


--
-- Name: assignments_module_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX assignments_module_id_idx ON public.assignments USING btree (module_id);


--
-- Name: audit_logs_action_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_action_idx ON public.audit_logs USING btree (action);


--
-- Name: audit_logs_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_created_at_idx ON public.audit_logs USING btree (created_at);


--
-- Name: audit_logs_entity_type_entity_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_entity_type_entity_id_idx ON public.audit_logs USING btree (entity_type, entity_id);


--
-- Name: audit_logs_organization_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_organization_id_idx ON public.audit_logs USING btree (organization_id);


--
-- Name: audit_logs_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_user_id_idx ON public.audit_logs USING btree (user_id);


--
-- Name: certificate_templates_organization_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX certificate_templates_organization_id_idx ON public.certificate_templates USING btree (organization_id);


--
-- Name: certificates_certificate_number_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX certificates_certificate_number_idx ON public.certificates USING btree (certificate_number);


--
-- Name: certificates_certificate_number_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX certificates_certificate_number_key ON public.certificates USING btree (certificate_number);


--
-- Name: certificates_enrollment_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX certificates_enrollment_id_idx ON public.certificates USING btree (enrollment_id);


--
-- Name: certificates_enrollment_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX certificates_enrollment_id_key ON public.certificates USING btree (enrollment_id);


--
-- Name: certificates_is_valid_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX certificates_is_valid_idx ON public.certificates USING btree (is_valid);


--
-- Name: content_content_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX content_content_type_idx ON public.content USING btree (content_type);


--
-- Name: content_module_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX content_module_id_idx ON public.content USING btree (module_id);


--
-- Name: course_prerequisites_course_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX course_prerequisites_course_id_idx ON public.course_prerequisites USING btree (course_id);


--
-- Name: course_prerequisites_course_id_prerequisite_course_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX course_prerequisites_course_id_prerequisite_course_id_key ON public.course_prerequisites USING btree (course_id, prerequisite_course_id);


--
-- Name: courses_department_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX courses_department_id_idx ON public.courses USING btree (department_id);


--
-- Name: courses_instructor_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX courses_instructor_id_idx ON public.courses USING btree (instructor_id);


--
-- Name: courses_organization_id_course_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX courses_organization_id_course_code_key ON public.courses USING btree (organization_id, course_code);


--
-- Name: courses_organization_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX courses_organization_id_idx ON public.courses USING btree (organization_id);


--
-- Name: courses_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX courses_status_idx ON public.courses USING btree (status);


--
-- Name: departments_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX departments_code_idx ON public.departments USING btree (code);


--
-- Name: departments_manager_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX departments_manager_id_key ON public.departments USING btree (manager_id);


--
-- Name: departments_organization_id_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX departments_organization_id_code_key ON public.departments USING btree (organization_id, code);


--
-- Name: departments_organization_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX departments_organization_id_idx ON public.departments USING btree (organization_id);


--
-- Name: enrollments_course_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX enrollments_course_id_idx ON public.enrollments USING btree (course_id);


--
-- Name: enrollments_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX enrollments_status_idx ON public.enrollments USING btree (status);


--
-- Name: enrollments_trainee_id_course_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX enrollments_trainee_id_course_id_key ON public.enrollments USING btree (trainee_id, course_id);


--
-- Name: enrollments_trainee_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX enrollments_trainee_id_idx ON public.enrollments USING btree (trainee_id);


--
-- Name: messages_course_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX messages_course_id_idx ON public.messages USING btree (course_id);


--
-- Name: messages_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX messages_created_at_idx ON public.messages USING btree (created_at);


--
-- Name: messages_is_read_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX messages_is_read_idx ON public.messages USING btree (is_read);


--
-- Name: messages_organization_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX messages_organization_id_idx ON public.messages USING btree (organization_id);


--
-- Name: messages_recipient_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX messages_recipient_id_idx ON public.messages USING btree (recipient_id);


--
-- Name: messages_sender_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX messages_sender_id_idx ON public.messages USING btree (sender_id);


--
-- Name: modules_course_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX modules_course_id_idx ON public.modules USING btree (course_id);


--
-- Name: modules_course_id_order_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX modules_course_id_order_key ON public.modules USING btree (course_id, "order");


--
-- Name: organizations_domain_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX organizations_domain_key ON public.organizations USING btree (domain);


--
-- Name: organizations_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX organizations_name_key ON public.organizations USING btree (name);


--
-- Name: organizations_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX organizations_slug_key ON public.organizations USING btree (slug);


--
-- Name: progress_content_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX progress_content_id_idx ON public.progress USING btree (content_id);


--
-- Name: progress_enrollment_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX progress_enrollment_id_idx ON public.progress USING btree (enrollment_id);


--
-- Name: progress_enrollment_id_module_id_content_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX progress_enrollment_id_module_id_content_id_key ON public.progress USING btree (enrollment_id, module_id, content_id);


--
-- Name: progress_module_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX progress_module_id_idx ON public.progress USING btree (module_id);


--
-- Name: progress_trainee_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX progress_trainee_id_idx ON public.progress USING btree (trainee_id);


--
-- Name: session_attendances_session_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX session_attendances_session_id_idx ON public.session_attendances USING btree (session_id);


--
-- Name: session_attendances_session_id_user_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX session_attendances_session_id_user_id_key ON public.session_attendances USING btree (session_id, user_id);


--
-- Name: session_attendances_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX session_attendances_status_idx ON public.session_attendances USING btree (status);


--
-- Name: session_attendances_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX session_attendances_user_id_idx ON public.session_attendances USING btree (user_id);


--
-- Name: training_sessions_course_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX training_sessions_course_id_idx ON public.training_sessions USING btree (course_id);


--
-- Name: training_sessions_instructor_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX training_sessions_instructor_id_idx ON public.training_sessions USING btree (instructor_id);


--
-- Name: training_sessions_organization_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX training_sessions_organization_id_idx ON public.training_sessions USING btree (organization_id);


--
-- Name: training_sessions_start_time_end_time_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX training_sessions_start_time_end_time_idx ON public.training_sessions USING btree (start_time, end_time);


--
-- Name: training_sessions_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX training_sessions_status_idx ON public.training_sessions USING btree (status);


--
-- Name: users_department_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_department_id_idx ON public.users USING btree (department_id);


--
-- Name: users_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_email_idx ON public.users USING btree (email);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_organization_id_employeeId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "users_organization_id_employeeId_key" ON public.users USING btree (organization_id, "employeeId");


--
-- Name: users_organization_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_organization_id_idx ON public.users USING btree (organization_id);


--
-- Name: users_role_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_role_idx ON public.users USING btree (role);


--
-- Name: users_username_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_username_idx ON public.users USING btree (username);


--
-- Name: users_username_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_username_key ON public.users USING btree (username);


--
-- Name: announcements announcements_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: announcements announcements_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: announcements announcements_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: announcements announcements_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: assessment_attempts assessment_attempts_assessment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_attempts
    ADD CONSTRAINT assessment_attempts_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES public.assessments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: assessment_attempts assessment_attempts_enrollment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_attempts
    ADD CONSTRAINT assessment_attempts_enrollment_id_fkey FOREIGN KEY (enrollment_id) REFERENCES public.enrollments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: assessment_attempts assessment_attempts_graded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_attempts
    ADD CONSTRAINT assessment_attempts_graded_by_fkey FOREIGN KEY (graded_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: assessment_attempts assessment_attempts_trainee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_attempts
    ADD CONSTRAINT assessment_attempts_trainee_id_fkey FOREIGN KEY (trainee_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: assessments assessments_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessments
    ADD CONSTRAINT assessments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: assessments assessments_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessments
    ADD CONSTRAINT assessments_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: assignment_submissions assignment_submissions_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_submissions
    ADD CONSTRAINT assignment_submissions_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.assignments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: assignment_submissions assignment_submissions_enrollment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_submissions
    ADD CONSTRAINT assignment_submissions_enrollment_id_fkey FOREIGN KEY (enrollment_id) REFERENCES public.enrollments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: assignment_submissions assignment_submissions_graded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_submissions
    ADD CONSTRAINT assignment_submissions_graded_by_fkey FOREIGN KEY (graded_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: assignment_submissions assignment_submissions_trainee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_submissions
    ADD CONSTRAINT assignment_submissions_trainee_id_fkey FOREIGN KEY (trainee_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: assignments assignments_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: certificate_templates certificate_templates_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificate_templates
    ADD CONSTRAINT certificate_templates_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: certificates certificates_enrollment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_enrollment_id_fkey FOREIGN KEY (enrollment_id) REFERENCES public.enrollments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: certificates certificates_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.certificate_templates(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: content content_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content
    ADD CONSTRAINT content_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: course_prerequisites course_prerequisites_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_prerequisites
    ADD CONSTRAINT course_prerequisites_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: course_prerequisites course_prerequisites_prerequisite_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_prerequisites
    ADD CONSTRAINT course_prerequisites_prerequisite_course_id_fkey FOREIGN KEY (prerequisite_course_id) REFERENCES public.courses(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: courses courses_certificate_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_certificate_template_id_fkey FOREIGN KEY (certificate_template_id) REFERENCES public.certificate_templates(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: courses courses_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: courses courses_instructor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: courses courses_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: departments departments_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: departments departments_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: enrollments enrollments_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: enrollments enrollments_trainee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_trainee_id_fkey FOREIGN KEY (trainee_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: messages messages_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: messages messages_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: messages messages_parent_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_parent_message_id_fkey FOREIGN KEY (parent_message_id) REFERENCES public.messages(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: messages messages_recipient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: modules modules_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: progress progress_content_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.progress
    ADD CONSTRAINT progress_content_id_fkey FOREIGN KEY (content_id) REFERENCES public.content(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: progress progress_enrollment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.progress
    ADD CONSTRAINT progress_enrollment_id_fkey FOREIGN KEY (enrollment_id) REFERENCES public.enrollments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: progress progress_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.progress
    ADD CONSTRAINT progress_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: progress progress_trainee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.progress
    ADD CONSTRAINT progress_trainee_id_fkey FOREIGN KEY (trainee_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: session_attendances session_attendances_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_attendances
    ADD CONSTRAINT session_attendances_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.training_sessions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: session_attendances session_attendances_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_attendances
    ADD CONSTRAINT session_attendances_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: training_sessions training_sessions_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_sessions
    ADD CONSTRAINT training_sessions_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: training_sessions training_sessions_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_sessions
    ADD CONSTRAINT training_sessions_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: training_sessions training_sessions_instructor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_sessions
    ADD CONSTRAINT training_sessions_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: training_sessions training_sessions_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_sessions
    ADD CONSTRAINT training_sessions_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: users users_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: users users_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict 0emPvfqC2UThdItWMSCmqCbEJH71bFsiCyJJkaUGETDZAV8qDGkSVRhVsQJHhKT

