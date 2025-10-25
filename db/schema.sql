-- 2025년 10월 TO-BE 스키마 (Modernized DDL)
-- Engine: InnoDB, Charset: utf8mb4

-- =================================================================
-- 섹션 1: 사용자, 인증 (RBAC) 및 프로필 (User & Auth)
-- [결정] 'happy_member' God Table을 인증/프로필/지갑으로 분리
-- =================================================================

-- 1.1. 사용자 인증 핵심 (JWT 기반)
-- Replaces: happy_member (Core Auth Parts)
CREATE TABLE users (
    user_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL, -- JWT 인증용 (Bcrypt/Argon2 해시)
    user_type ENUM('PERSONAL', 'COMPANY', 'ADMIN') NOT NULL,
    status ENUM('PENDING_VERIFICATION', 'ACTIVE', 'DORMANT', 'WITHDRAWN') NOT NULL DEFAULT 'PENDING_VERIFICATION',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at DATETIME
) COMMENT '사용자 인증 핵심 테이블 (JWT 기반)';

-- 1.2. 개인 회원 프로필
-- Replaces: happy_member (Personal Info Parts)
CREATE TABLE user_personal_profiles (
    user_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    contact_number VARCHAR(20) UNIQUE,
    birthdate DATE,
    -- (기타 개인 프로필 정보...)
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) COMMENT '개인 회원 상세 프로필';

-- 1.3. 기업 회원 프로필
-- Replaces: happy_member (Company Info Parts)
CREATE TABLE user_company_profiles (
    user_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
    company_name VARCHAR(100) NOT NULL,
    business_registration_number VARCHAR(50) NOT NULL UNIQUE,
    company_address TEXT,
    manager_name VARCHAR(100),
    manager_contact VARCHAR(20),
    -- (기타 기업 프로필 정보...)
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) COMMENT '기업 회원 상세 프로필';

-- 1.4. 사용자 지갑 (포인트)
-- Replaces: happy_member (guzic_view 등 포인트 컬럼)
CREATE TABLE user_wallets (
    user_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
    points_balance BIGINT NOT NULL DEFAULT 0 COMMENT '포인트 잔액',
    resume_read_coupons INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '이력서 열람권 잔여 개수',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) COMMENT '사용자 지갑 (포인트, 유료 쿠폰)';

-- 1.5. 역할 (RBAC)
-- [결정] 신규 RBAC 시스템
-- Replaces: happy_member_group, happy_member_level, happy_member_secure
CREATE TABLE roles (
    role_id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE COMMENT 'e.g., ADMIN, EMPLOYER_PREMIUM, JOBSEEKER_BASIC'
);

-- 1.6. 권한 (RBAC)
CREATE TABLE permissions (
    permission_id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    permission_name VARCHAR(100) NOT NULL UNIQUE COMMENT 'e.g., job:create, resume:read_full, admin:manage_users'
);

-- 1.7. 사용자-역할 매핑 (RBAC)
CREATE TABLE user_roles (
    user_id BIGINT UNSIGNED NOT NULL,
    role_id INT UNSIGNED NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE
);

-- 1.8. 역할-권한 매핑 (RBAC)
CREATE TABLE role_permissions (
    role_id INT UNSIGNED NOT NULL,
    permission_id INT UNSIGNED NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(permission_id) ON DELETE CASCADE
);


-- =================================================================
-- 섹션 2: 구인·구직 핵심 도메인 (Job Portal)
-- =================================================================

-- 2.1. 채용 공고
-- Replaces: job_guin (핵심 컬럼 현대화)
CREATE TABLE jobs (
    job_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    company_user_id BIGINT UNSIGNED NOT NULL COMMENT '공고를 등록한 기업 user_id',
    title VARCHAR(255) NOT NULL,
    description LONGTEXT NOT NULL COMMENT '채용 공고 본문 (HTML 또는 JSON)',
    status ENUM('DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'EXPIRED', 'FILLED', 'DELETED') NOT NULL DEFAULT 'DRAFT',
    
    -- 근무 조건 (JSON 또는 별도 테이블로 정규화 가능)
    employment_type VARCHAR(50) COMMENT 'e.g., FULL_TIME, PART_TIME, CONTRACT',
    salary_type ENUM('HOURLY', 'MONTHLY', 'YEARLY'),
    salary_min DECIMAL(15, 2),
    salary_max DECIMAL(15, 2),

    -- 레거시 분류 체계 (유지 또는 신규 테이블로 정규화)
    location_si_idx INT, 
    location_gu_idx INT,
    job_type_idx INT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL COMMENT '공고 마감일',
    
    FOREIGN KEY (company_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_expires_at (expires_at)
) COMMENT '채용 공고 마스터 테이블';

-- 2.2. 공고 유료 옵션
-- Replaces: job_guin (guin_banner1~3, guin_pick 등 옵션 컬럼)
CREATE TABLE job_options (
    job_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
    is_premium_listing BOOLEAN NOT NULL DEFAULT FALSE,
    is_main_banner BOOLEAN NOT NULL DEFAULT FALSE,
    is_hot_job BOOLEAN NOT NULL DEFAULT FALSE,
    options_expires_at DATETIME,
    FOREIGN KEY (job_id) REFERENCES jobs(job_id) ON DELETE CASCADE
) COMMENT '채용 공고별 유료 옵션 상태';

-- 2.3. 이력서
-- Replaces: job_per_document
CREATE TABLE resumes (
    resume_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    jobseeker_user_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    introduction TEXT,
    -- 2025년 표준: 복잡한 학력/경력은 JSON으로 저장하여 유연성 확보
    education_history JSON, -- e.g., [{"school": "A", "major": "B", "status": "GRADUATED"}]
    work_experience JSON,   -- e.g., [{"company": "C", "role": "D", "years": 2}]
    skills JSON,            -- e.g., ["Java", "Spring Boot", "AWS"]
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (jobseeker_user_id) REFERENCES users(user_id) ON DELETE CASCADE
) COMMENT '개인 회원 이력서 (JSON 필드 활용)';

-- 2.4. 지원 단계 마스터 (기업별 커스텀)
-- [결정] 신규 테이블 (레거시 고정 플래그 대체)
CREATE TABLE job_application_stages (
    stage_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    company_user_id BIGINT UNSIGNED NOT NULL,
    stage_name VARCHAR(100) NOT NULL COMMENT 'e.g., 서류 접수, 1차 면접, 최종 합격',
    stage_order INT NOT NULL COMMENT '단계 순서',
    is_default_stage BOOLEAN NOT NULL DEFAULT FALSE COMMENT '기본 제공 단계 여부',
    FOREIGN KEY (company_user_id) REFERENCES users(user_id) ON DELETE CASCADE
) COMMENT '기업별 커스텀 지원 단계 정의';

-- 2.5. 입사 지원 현황
-- Replaces: job_com_guin_per
CREATE TABLE job_applications (
    application_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    job_id BIGINT UNSIGNED NOT NULL,
    jobseeker_user_id BIGINT UNSIGNED NOT NULL,
    resume_id BIGINT UNSIGNED NOT NULL COMMENT '제출 당시의 이력서 ID',
    current_stage_id BIGINT UNSIGNED NOT NULL COMMENT '현재 채용 단계',
    status ENUM('ACTIVE', 'WITHDRAWN_BY_USER', 'HIRED', 'REJECTED_BY_COMPANY') NOT NULL DEFAULT 'ACTIVE',
    applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (job_id) REFERENCES jobs(job_id) ON DELETE CASCADE,
    FOREIGN KEY (jobseeker_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (resume_id) REFERENCES resumes(resume_id), -- ON DELETE SET NULL 또는 정책 필요
    FOREIGN KEY (current_stage_id) REFERENCES job_application_stages(stage_id),
    UNIQUE KEY uk_job_user (job_id, jobseeker_user_id) COMMENT '한 공고에 한 번만 지원 가능'
) COMMENT '입사 지원 현황';


-- =================================================================
-- 섹션 3: 결제 및 상품 (Payment & Products)
-- [결정] 레거시 논리 구조(장부 분리)는 유지하되 스키마 현대화
-- =================================================================

-- 3.1. 유료 상품 패키지
-- Replaces: job_money_package, job_money_package2
CREATE TABLE product_packages (
    package_id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    package_name VARCHAR(255) NOT NULL,
    price DECIMAL(15, 2) NOT NULL,
    -- 2025년 표준: 유연한 상품 구성을 위해 JSON 사용
    benefits JSON NOT NULL COMMENT 'e.g., {"premium_listings": 5, "resume_reads": 10, "duration_days": 30}',
    is_active BOOLEAN NOT NULL DEFAULT TRUE
) COMMENT '유료 상품 패키지 마스터';

-- 3.2. 주문
-- Replaces: job_jangboo, job_jangboo2 (통합)
CREATE TABLE orders (
    order_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL COMMENT '주문한 기업 회원',
    package_id INT UNSIGNED COMMENT '구매한 패키지 (단건 상품일 경우 NULL)',
    total_amount DECIMAL(15, 2) NOT NULL,
    payment_method VARCHAR(50) COMMENT 'e.g., CREDIT_CARD, TOSS_PAY, KAKAO_PAY',
    pg_transaction_id VARCHAR(255) UNIQUE COMMENT '결제사 거래 ID',
    status ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (package_id) REFERENCES product_packages(package_id)
) COMMENT '결제 주문 통합 테이블';

-- 3.3. 포인트 거래 내역 (장부)
-- Replaces: point_jangboo
CREATE TABLE point_transactions (
    transaction_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    amount BIGINT NOT NULL COMMENT '증감액 (충전: +, 사용: -)',
    reason_type VARCHAR(50) NOT NULL COMMENT 'e.g., CHARGE, USE_JOB_OPTION, USE_RESUME_READ, REFUND',
    related_order_id BIGINT UNSIGNED COMMENT '관련 주문 ID (충전 시)',
    description VARCHAR(255),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (related_order_id) REFERENCES orders(order_id),
    INDEX idx_user_id_created_at (user_id, created_at)
) COMMENT '포인트 장부 (모든 증감 내역)';