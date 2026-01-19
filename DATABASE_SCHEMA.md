# Database Schema - Course Management System

## Overview
This document defines the complete database schema for transforming the school management system into a course management/training platform for organizations.

## Database Design Principles
- **Normalization**: 3NF (Third Normal Form) to reduce redundancy
- **Relationships**: Proper foreign keys and constraints
- **Indexing**: Strategic indexes for performance
- **Security**: Encrypted sensitive fields, audit trails
- **Scalability**: Support for multi-tenant organizations

---

## Entity Relationship Diagram (Conceptual)

```
Organizations (1) ──< (Many) Departments
Organizations (1) ──< (Many) Users
Departments (1) ──< (Many) Users
Users (1) ──< (Many) Courses (as Instructor)
Users (Many) ──< (Many) Courses (as Trainee) [Enrollments]
Courses (1) ──< (Many) Modules
Modules (1) ──< (Many) Content
Modules (1) ──< (Many) Assessments
Enrollments (1) ──< (Many) Progress
Progress (1) ──< (Many) AssessmentAttempts
Courses (1) ──< (Many) Certifications
```

---

## Tables

### 1. `organizations`
Stores organization/company information (for multi-tenant support)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `name` | VARCHAR(255) | NOT NULL, UNIQUE | Organization name |
| `slug` | VARCHAR(255) | NOT NULL, UNIQUE | URL-friendly identifier |
| `domain` | VARCHAR(255) | UNIQUE, NULLABLE | Custom domain (optional) |
| `logo_url` | TEXT | NULLABLE | Organization logo |
| `settings` | JSONB | DEFAULT '{}' | Organization-specific settings |
| `subscription_tier` | VARCHAR(50) | DEFAULT 'free' | free, basic, premium, enterprise |
| `is_active` | BOOLEAN | DEFAULT true | Active status |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_organizations_slug` ON `slug`
- `idx_organizations_domain` ON `domain`

---

### 2. `departments`
Represents departments/divisions within organizations (replaces "Classes")

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `organization_id` | UUID | FOREIGN KEY → organizations.id | Parent organization |
| `name` | VARCHAR(255) | NOT NULL | Department name |
| `code` | VARCHAR(50) | NOT NULL | Department code (e.g., "HR", "IT") |
| `description` | TEXT | NULLABLE | Department description |
| `manager_id` | UUID | FOREIGN KEY → users.id, NULLABLE | Department manager |
| `is_active` | BOOLEAN | DEFAULT true | Active status |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_departments_organization` ON `organization_id`
- `idx_departments_code` ON `code`
- UNIQUE(`organization_id`, `code`)

---

### 3. `users`
Stores all users (Admins, Instructors, Trainees) - replaces Teachers/Students/Parents

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `organization_id` | UUID | FOREIGN KEY → organizations.id, NULLABLE | User's organization |
| `department_id` | UUID | FOREIGN KEY → departments.id, NULLABLE | User's department |
| `employee_id` | VARCHAR(100) | NOT NULL | Employee/Trainee ID |
| `username` | VARCHAR(100) | NOT NULL, UNIQUE | Username for login |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE | Email address |
| `password_hash` | VARCHAR(255) | NOT NULL | Hashed password (bcrypt) |
| `first_name` | VARCHAR(100) | NOT NULL | First name |
| `last_name` | VARCHAR(100) | NOT NULL | Last name |
| `phone` | VARCHAR(20) | NULLABLE | Phone number |
| `address` | TEXT | NULLABLE | Address |
| `photo_url` | TEXT | NULLABLE | Profile photo URL |
| `role` | VARCHAR(50) | NOT NULL, CHECK | 'admin', 'instructor', 'trainee' |
| `position` | VARCHAR(100) | NULLABLE | Job title/position |
| `bio` | TEXT | NULLABLE | Biography (for instructors) |
| `expertise` | TEXT[] | DEFAULT '{}' | Areas of expertise (for instructors) |
| `is_active` | BOOLEAN | DEFAULT true | Active status |
| `last_login` | TIMESTAMP | NULLABLE | Last login timestamp |
| `email_verified` | BOOLEAN | DEFAULT false | Email verification status |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_users_organization` ON `organization_id`
- `idx_users_department` ON `department_id`
- `idx_users_email` ON `email`
- `idx_users_username` ON `username`
- `idx_users_employee_id` ON `employee_id`
- `idx_users_role` ON `role`

**Constraints:**
- UNIQUE(`organization_id`, `employee_id`) - Employee ID unique per org
- UNIQUE(`organization_id`, `email`) - Email unique per org (if multi-tenant)

---

### 4. `courses`
Represents training courses (replaces "Subjects")

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `organization_id` | UUID | FOREIGN KEY → organizations.id | Parent organization |
| `course_code` | VARCHAR(100) | NOT NULL | Course code (e.g., "HR-101") |
| `title` | VARCHAR(255) | NOT NULL | Course title |
| `description` | TEXT | NULLABLE | Course description |
| `instructor_id` | UUID | FOREIGN KEY → users.id | Primary instructor |
| `department_id` | UUID | FOREIGN KEY → departments.id, NULLABLE | Target department |
| `thumbnail_url` | TEXT | NULLABLE | Course thumbnail image |
| `difficulty_level` | VARCHAR(50) | DEFAULT 'beginner' | 'beginner', 'intermediate', 'advanced' |
| `estimated_duration` | INTEGER | NULLABLE | Estimated hours to complete |
| `max_enrollments` | INTEGER | NULLABLE | Maximum number of trainees |
| `is_certified` | BOOLEAN | DEFAULT false | Offers certificate upon completion |
| `certificate_template_id` | UUID | FOREIGN KEY → certificate_templates.id, NULLABLE | Certificate template |
| `status` | VARCHAR(50) | DEFAULT 'draft' | 'draft', 'published', 'archived' |
| `is_public` | BOOLEAN | DEFAULT false | Publicly visible (within org) |
| `tags` | TEXT[] | DEFAULT '{}' | Course tags for categorization |
| `metadata` | JSONB | DEFAULT '{}' | Additional course metadata |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |
| `published_at` | TIMESTAMP | NULLABLE | Publication date |

**Indexes:**
- `idx_courses_organization` ON `organization_id`
- `idx_courses_instructor` ON `instructor_id`
- `idx_courses_department` ON `department_id`
- `idx_courses_status` ON `status`
- `idx_courses_code` ON `course_code`
- UNIQUE(`organization_id`, `course_code`)

---

### 5. `course_prerequisites`
Many-to-many relationship for course prerequisites

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `course_id` | UUID | FOREIGN KEY → courses.id | Course requiring prerequisite |
| `prerequisite_course_id` | UUID | FOREIGN KEY → courses.id | Required course |
| `is_mandatory` | BOOLEAN | DEFAULT true | Must complete before enrollment |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

**Indexes:**
- `idx_prerequisites_course` ON `course_id`
- `idx_prerequisites_prerequisite` ON `prerequisite_course_id`
- UNIQUE(`course_id`, `prerequisite_course_id`)

---

### 6. `modules`
Course modules/lessons (replaces "Lessons")

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `course_id` | UUID | FOREIGN KEY → courses.id, ON DELETE CASCADE | Parent course |
| `title` | VARCHAR(255) | NOT NULL | Module title |
| `description` | TEXT | NULLABLE | Module description |
| `order` | INTEGER | NOT NULL | Display order in course |
| `estimated_duration` | INTEGER | NULLABLE | Estimated minutes to complete |
| `is_required` | BOOLEAN | DEFAULT true | Required for course completion |
| `unlock_condition` | JSONB | NULLABLE | Conditions to unlock module |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_modules_course` ON `course_id`
- `idx_modules_order` ON (`course_id`, `order`)

**Constraints:**
- UNIQUE(`course_id`, `order`) - Order unique per course

---

### 7. `content`
Stores course content (videos, documents, etc.)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `module_id` | UUID | FOREIGN KEY → modules.id, ON DELETE CASCADE | Parent module |
| `content_type` | VARCHAR(50) | NOT NULL | 'video', 'document', 'text', 'link', 'quiz' |
| `title` | VARCHAR(255) | NOT NULL | Content title |
| `description` | TEXT | NULLABLE | Content description |
| `order` | INTEGER | NOT NULL | Display order in module |
| `file_url` | TEXT | NULLABLE | File storage URL |
| `file_size` | BIGINT | NULLABLE | File size in bytes |
| `duration` | INTEGER | NULLABLE | Duration in seconds (for videos) |
| `content_data` | JSONB | NULLABLE | Additional content data |
| `is_required` | BOOLEAN | DEFAULT true | Required for module completion |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_content_module` ON `module_id`
- `idx_content_type` ON `content_type`
- `idx_content_order` ON (`module_id`, `order`)

---

### 8. `assessments`
Quizzes and assessments (replaces "Exams")

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `module_id` | UUID | FOREIGN KEY → modules.id, NULLABLE | Associated module |
| `course_id` | UUID | FOREIGN KEY → courses.id | Parent course |
| `title` | VARCHAR(255) | NOT NULL | Assessment title |
| `description` | TEXT | NULLABLE | Assessment description |
| `type` | VARCHAR(50) | DEFAULT 'quiz' | 'quiz', 'assignment', 'exam' |
| `passing_score` | INTEGER | DEFAULT 70 | Minimum score to pass (percentage) |
| `max_attempts` | INTEGER | NULLABLE | Maximum attempts allowed |
| `time_limit` | INTEGER | NULLABLE | Time limit in minutes |
| `is_required` | BOOLEAN | DEFAULT true | Required for completion |
| `questions` | JSONB | NOT NULL | Questions array (stored as JSON) |
| `settings` | JSONB | DEFAULT '{}' | Assessment settings |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_assessments_module` ON `module_id`
- `idx_assessments_course` ON `course_id`
- `idx_assessments_type` ON `type`

**Questions JSON Structure:**
```json
{
  "questions": [
    {
      "id": "uuid",
      "type": "multiple_choice" | "true_false" | "short_answer" | "essay",
      "question": "Question text",
      "options": ["Option 1", "Option 2", ...],
      "correct_answer": "correct_option_index" | "answer_text",
      "points": 10,
      "explanation": "Explanation text"
    }
  ]
}
```

---

### 9. `enrollments`
Trainee course enrollments

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `trainee_id` | UUID | FOREIGN KEY → users.id | Trainee user |
| `course_id` | UUID | FOREIGN KEY → courses.id | Enrolled course |
| `enrolled_by` | UUID | FOREIGN KEY → users.id, NULLABLE | Who enrolled (admin/instructor) |
| `enrollment_type` | VARCHAR(50) | DEFAULT 'self' | 'self', 'assigned', 'bulk' |
| `status` | VARCHAR(50) | DEFAULT 'enrolled' | 'enrolled', 'in_progress', 'completed', 'dropped' |
| `progress_percentage` | DECIMAL(5,2) | DEFAULT 0.00 | Overall progress (0-100) |
| `started_at` | TIMESTAMP | NULLABLE | When trainee started |
| `completed_at` | TIMESTAMP | NULLABLE | Completion date |
| `due_date` | TIMESTAMP | NULLABLE | Completion due date |
| `certificate_issued` | BOOLEAN | DEFAULT false | Certificate issued |
| `certificate_issued_at` | TIMESTAMP | NULLABLE | Certificate issue date |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Enrollment date |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_enrollments_trainee` ON `trainee_id`
- `idx_enrollments_course` ON `course_id`
- `idx_enrollments_status` ON `status`
- UNIQUE(`trainee_id`, `course_id`) - One enrollment per trainee per course

---

### 10. `progress`
Tracks trainee progress through modules and content

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `enrollment_id` | UUID | FOREIGN KEY → enrollments.id, ON DELETE CASCADE | Related enrollment |
| `module_id` | UUID | FOREIGN KEY → modules.id | Module being tracked |
| `content_id` | UUID | FOREIGN KEY → content.id, NULLABLE | Specific content item |
| `status` | VARCHAR(50) | DEFAULT 'not_started' | 'not_started', 'in_progress', 'completed' |
| `progress_percentage` | DECIMAL(5,2) | DEFAULT 0.00 | Progress for this item (0-100) |
| `time_spent` | INTEGER | DEFAULT 0 | Time spent in seconds |
| `last_accessed_at` | TIMESTAMP | NULLABLE | Last access timestamp |
| `started_at` | TIMESTAMP | NULLABLE | Started timestamp |
| `completed_at` | TIMESTAMP | NULLABLE | Completed timestamp |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_progress_enrollment` ON `enrollment_id`
- `idx_progress_module` ON `module_id`
- `idx_progress_content` ON `content_id`
- `idx_progress_status` ON `status`
- UNIQUE(`enrollment_id`, `module_id`, `content_id`) - One progress record per item

---

### 11. `assessment_attempts`
Stores trainee assessment attempts

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `enrollment_id` | UUID | FOREIGN KEY → enrollments.id | Related enrollment |
| `assessment_id` | UUID | FOREIGN KEY → assessments.id | Assessment taken |
| `attempt_number` | INTEGER | NOT NULL | Attempt number (1, 2, 3...) |
| `answers` | JSONB | NOT NULL | Trainee's answers |
| `score` | DECIMAL(5,2) | NULLABLE | Score percentage |
| `is_passed` | BOOLEAN | NULLABLE | Pass/fail status |
| `time_taken` | INTEGER | NULLABLE | Time taken in seconds |
| `started_at` | TIMESTAMP | DEFAULT NOW() | Start timestamp |
| `submitted_at` | TIMESTAMP | NULLABLE | Submission timestamp |
| `graded_at` | TIMESTAMP | NULLABLE | Grading timestamp (for manual grading) |
| `graded_by` | UUID | FOREIGN KEY → users.id, NULLABLE | Who graded (for manual) |
| `feedback` | TEXT | NULLABLE | Instructor feedback |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

**Indexes:**
- `idx_attempts_enrollment` ON `enrollment_id`
- `idx_attempts_assessment` ON `assessment_id`
- `idx_attempts_submitted` ON `submitted_at`
- UNIQUE(`enrollment_id`, `assessment_id`, `attempt_number`)

**Answers JSON Structure:**
```json
{
  "answers": [
    {
      "question_id": "uuid",
      "answer": "selected_option" | "answer_text",
      "is_correct": true | false,
      "points_earned": 10
    }
  ]
}
```

---

### 12. `certificate_templates`
Certificate templates for courses

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `organization_id` | UUID | FOREIGN KEY → organizations.id | Parent organization |
| `name` | VARCHAR(255) | NOT NULL | Template name |
| `template_html` | TEXT | NOT NULL | HTML template |
| `template_css` | TEXT | NULLABLE | CSS styles |
| `fields` | JSONB | NOT NULL | Dynamic fields configuration |
| `is_default` | BOOLEAN | DEFAULT false | Default template |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_cert_templates_org` ON `organization_id`

---

### 13. `certificates`
Issued certificates

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `enrollment_id` | UUID | FOREIGN KEY → enrollments.id | Related enrollment |
| `template_id` | UUID | FOREIGN KEY → certificate_templates.id | Template used |
| `certificate_number` | VARCHAR(100) | NOT NULL, UNIQUE | Certificate number |
| `pdf_url` | TEXT | NULLABLE | Generated PDF URL |
| `issued_at` | TIMESTAMP | DEFAULT NOW() | Issue date |
| `expires_at` | TIMESTAMP | NULLABLE | Expiration date |
| `is_valid` | BOOLEAN | DEFAULT true | Certificate validity |
| `revoked_at` | TIMESTAMP | NULLABLE | Revocation date |
| `revoked_reason` | TEXT | NULLABLE | Revocation reason |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

**Indexes:**
- `idx_certificates_enrollment` ON `enrollment_id`
- `idx_certificates_number` ON `certificate_number`
- `idx_certificates_valid` ON `is_valid`

---

### 14. `assignments`
Course assignments (replaces "Assignments" but with course context)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `course_id` | UUID | FOREIGN KEY → courses.id | Parent course |
| `module_id` | UUID | FOREIGN KEY → modules.id, NULLABLE | Associated module |
| `title` | VARCHAR(255) | NOT NULL | Assignment title |
| `description` | TEXT | NULLABLE | Assignment description |
| `instructions` | TEXT | NULLABLE | Assignment instructions |
| `due_date` | TIMESTAMP | NULLABLE | Due date |
| `max_score` | INTEGER | DEFAULT 100 | Maximum score |
| `is_required` | BOOLEAN | DEFAULT true | Required for completion |
| `created_by` | UUID | FOREIGN KEY → users.id | Creator |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_assignments_course` ON `course_id`
- `idx_assignments_module` ON `module_id`
- `idx_assignments_due_date` ON `due_date`

---

### 15. `assignment_submissions`
Trainee assignment submissions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `assignment_id` | UUID | FOREIGN KEY → assignments.id | Related assignment |
| `enrollment_id` | UUID | FOREIGN KEY → enrollments.id | Trainee enrollment |
| `submission_text` | TEXT | NULLABLE | Text submission |
| `submission_files` | TEXT[] | DEFAULT '{}' | File URLs |
| `score` | DECIMAL(5,2) | NULLABLE | Score received |
| `feedback` | TEXT | NULLABLE | Instructor feedback |
| `status` | VARCHAR(50) | DEFAULT 'submitted' | 'submitted', 'graded', 'returned' |
| `submitted_at` | TIMESTAMP | DEFAULT NOW() | Submission timestamp |
| `graded_at` | TIMESTAMP | NULLABLE | Grading timestamp |
| `graded_by` | UUID | FOREIGN KEY → users.id, NULLABLE | Who graded |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_submissions_assignment` ON `assignment_id`
- `idx_submissions_enrollment` ON `enrollment_id`
- `idx_submissions_status` ON `status`
- UNIQUE(`assignment_id`, `enrollment_id`) - One submission per trainee per assignment

---

### 16. `training_sessions`
Scheduled training sessions/events (replaces "Events")

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `organization_id` | UUID | FOREIGN KEY → organizations.id | Parent organization |
| `course_id` | UUID | FOREIGN KEY → courses.id, NULLABLE | Related course |
| `title` | VARCHAR(255) | NOT NULL | Session title |
| `description` | TEXT | NULLABLE | Session description |
| `instructor_id` | UUID | FOREIGN KEY → users.id | Session instructor |
| `department_id` | UUID | FOREIGN KEY → departments.id, NULLABLE | Target department |
| `session_type` | VARCHAR(50) | DEFAULT 'live' | 'live', 'webinar', 'workshop', 'meeting' |
| `start_time` | TIMESTAMP | NOT NULL | Session start time |
| `end_time` | TIMESTAMP | NOT NULL | Session end time |
| `location` | VARCHAR(255) | NULLABLE | Physical or virtual location |
| `meeting_url` | TEXT | NULLABLE | Video conference URL |
| `max_participants` | INTEGER | NULLABLE | Maximum participants |
| `status` | VARCHAR(50) | DEFAULT 'scheduled' | 'scheduled', 'ongoing', 'completed', 'cancelled' |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_sessions_org` ON `organization_id`
- `idx_sessions_course` ON `course_id`
- `idx_sessions_instructor` ON `instructor_id`
- `idx_sessions_time` ON `start_time`, `end_time`
- `idx_sessions_status` ON `status`

---

### 17. `session_attendances`
Tracks attendance for training sessions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `session_id` | UUID | FOREIGN KEY → training_sessions.id | Training session |
| `user_id` | UUID | FOREIGN KEY → users.id | Attendee |
| `status` | VARCHAR(50) | DEFAULT 'registered' | 'registered', 'attended', 'absent', 'excused' |
| `check_in_time` | TIMESTAMP | NULLABLE | Check-in timestamp |
| `check_out_time` | TIMESTAMP | NULLABLE | Check-out timestamp |
| `notes` | TEXT | NULLABLE | Attendance notes |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

**Indexes:**
- `idx_attendances_session` ON `session_id`
- `idx_attendances_user` ON `user_id`
- `idx_attendances_status` ON `status`
- UNIQUE(`session_id`, `user_id`) - One attendance record per user per session

---

### 18. `announcements`
Course and organization announcements

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `organization_id` | UUID | FOREIGN KEY → organizations.id | Parent organization |
| `course_id` | UUID | FOREIGN KEY → courses.id, NULLABLE | Related course (if course-specific) |
| `department_id` | UUID | FOREIGN KEY → departments.id, NULLABLE | Target department |
| `title` | VARCHAR(255) | NOT NULL | Announcement title |
| `content` | TEXT | NOT NULL | Announcement content |
| `priority` | VARCHAR(50) | DEFAULT 'normal' | 'low', 'normal', 'high', 'urgent' |
| `is_pinned` | BOOLEAN | DEFAULT false | Pinned to top |
| `published_at` | TIMESTAMP | NULLABLE | Publication date |
| `expires_at` | TIMESTAMP | NULLABLE | Expiration date |
| `created_by` | UUID | FOREIGN KEY → users.id | Creator |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_announcements_org` ON `organization_id`
- `idx_announcements_course` ON `course_id`
- `idx_announcements_department` ON `department_id`
- `idx_announcements_published` ON `published_at`
- `idx_announcements_pinned` ON `is_pinned`

---

### 19. `messages`
Internal messaging system

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `organization_id` | UUID | FOREIGN KEY → organizations.id | Parent organization |
| `sender_id` | UUID | FOREIGN KEY → users.id | Message sender |
| `recipient_id` | UUID | FOREIGN KEY → users.id, NULLABLE | Direct recipient |
| `course_id` | UUID | FOREIGN KEY → courses.id, NULLABLE | Related course |
| `subject` | VARCHAR(255) | NULLABLE | Message subject |
| `content` | TEXT | NOT NULL | Message content |
| `is_read` | BOOLEAN | DEFAULT false | Read status |
| `read_at` | TIMESTAMP | NULLABLE | Read timestamp |
| `is_archived` | BOOLEAN | DEFAULT false | Archived status |
| `parent_message_id` | UUID | FOREIGN KEY → messages.id, NULLABLE | Reply to message |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

**Indexes:**
- `idx_messages_org` ON `organization_id`
- `idx_messages_sender` ON `sender_id`
- `idx_messages_recipient` ON `recipient_id`
- `idx_messages_course` ON `course_id`
- `idx_messages_read` ON `is_read`
- `idx_messages_created` ON `created_at`

---

### 20. `audit_logs`
Audit trail for security and compliance

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `organization_id` | UUID | FOREIGN KEY → organizations.id, NULLABLE | Related organization |
| `user_id` | UUID | FOREIGN KEY → users.id, NULLABLE | User who performed action |
| `action` | VARCHAR(100) | NOT NULL | Action type (e.g., 'user.created', 'course.deleted') |
| `entity_type` | VARCHAR(100) | NULLABLE | Entity type (e.g., 'user', 'course') |
| `entity_id` | UUID | NULLABLE | Entity ID |
| `changes` | JSONB | NULLABLE | What changed (before/after) |
| `ip_address` | VARCHAR(45) | NULLABLE | IP address |
| `user_agent` | TEXT | NULLABLE | User agent string |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Action timestamp |

**Indexes:**
- `idx_audit_org` ON `organization_id`
- `idx_audit_user` ON `user_id`
- `idx_audit_action` ON `action`
- `idx_audit_entity` ON (`entity_type`, `entity_id`)
- `idx_audit_created` ON `created_at`

---

## Database Functions & Triggers

### 1. Auto-update `updated_at` timestamp
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Repeat for other tables...
```

### 2. Calculate enrollment progress
```sql
CREATE OR REPLACE FUNCTION calculate_enrollment_progress(enrollment_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
    total_modules INTEGER;
    completed_modules INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_modules
    FROM modules m
    JOIN courses c ON m.course_id = c.id
    JOIN enrollments e ON e.course_id = c.id
    WHERE e.id = enrollment_uuid;
    
    SELECT COUNT(*) INTO completed_modules
    FROM progress p
    WHERE p.enrollment_id = enrollment_uuid
    AND p.status = 'completed';
    
    IF total_modules = 0 THEN
        RETURN 0;
    END IF;
    
    RETURN (completed_modules::DECIMAL / total_modules::DECIMAL) * 100;
END;
$$ LANGUAGE plpgsql;
```

### 3. Auto-generate certificate number
```sql
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.certificate_number := 'CERT-' || TO_CHAR(NOW(), 'YYYY') || '-' || 
                              LPAD(NEXTVAL('certificate_seq')::TEXT, 8, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_cert_number BEFORE INSERT ON certificates
    FOR EACH ROW EXECUTE FUNCTION generate_certificate_number();
```

---

## Database Migrations Strategy

### Initial Migration Order:
1. `organizations`
2. `departments`
3. `users`
4. `certificate_templates`
5. `courses`
6. `course_prerequisites`
7. `modules`
8. `content`
9. `assessments`
10. `enrollments`
11. `progress`
12. `assessment_attempts`
13. `assignments`
14. `assignment_submissions`
15. `training_sessions`
16. `session_attendances`
17. `announcements`
18. `messages`
19. `certificates`
20. `audit_logs`

---

## Security Considerations

1. **Password Hashing**: Use bcrypt with salt rounds ≥ 10
2. **Encryption**: Encrypt sensitive fields (PII) at rest
3. **Row-Level Security**: Implement RLS for multi-tenant isolation
4. **Indexes**: Strategic indexing for performance without exposing data
5. **Backups**: Regular automated backups
6. **Audit Trail**: Comprehensive logging for compliance

---

## Performance Optimization

1. **Indexes**: All foreign keys and frequently queried columns
2. **Partitioning**: Consider partitioning large tables (audit_logs, messages) by date
3. **Materialized Views**: For complex analytics queries
4. **Connection Pooling**: Use connection pooler (PgBouncer)
5. **Query Optimization**: Use EXPLAIN ANALYZE for slow queries

---

## Notes

- All UUIDs use PostgreSQL's `uuid_generate_v4()` function
- Timestamps use `TIMESTAMP WITH TIME ZONE` for timezone awareness
- JSONB fields allow flexible schema evolution
- Soft deletes can be implemented with `deleted_at` columns if needed
- Consider adding `version` columns for optimistic locking
