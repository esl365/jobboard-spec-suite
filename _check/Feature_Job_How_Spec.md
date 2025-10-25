**[규칙] 이 문서는 '구인·구직' 도메인에만 적용되는 특수 규칙이다. `Master_How_Spec.md`의 규칙을 상속하고 확장한다.**

- **[관련 DDL]** 이 기능은 `schema.sql`의 다음 테이블을 주로 사용한다:
  - `jobs`
  - `job_options`
  - `job_applications`
  - `job_application_stages`
  - `resumes`
- **[관련 API]** 이 기능은 `api-spec.yaml`의 다음 엔드포인트를 구현한다:
  - `GET /jobs`
  - `POST /jobs`
  - `POST /jobs/{jobId}/apply`
  - (기타 관련 API...)
- **[핵심 도메인 로직]**
  - **[규칙: POL-001]** 지원 단계 커스터마이징: 레거시 고정 플래그(`read_ok` 등)는 **폐기**한다. 모든 지원 단계 로직은 `job_application_stages` 및 `job_application_status` 테이블을 기반으로 작동해야 한다. (다음 5단계의 '최종 정책 결정서' 참조)
  - **[규칙: DOM-001]** 공고 등록: `POST /jobs`로 공고 생성 시, `status`는 기본값인 `'DRAFT'` 또는 `'PENDING_REVIEW'`로 설정되어야 하며, 관리자 승인 API가 호출되기 전까지 `'ACTIVE'` 상태가 되어서는 안 된다.
