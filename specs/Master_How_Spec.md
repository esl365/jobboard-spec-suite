**[규칙] 이 문서는 프로젝트의 '헌법'이다. 모든 코드 생성 시 이 전역 규칙을 최우선으로 준수해야 한다.**



#### 1. 아키텍처 (Architecture)



- **[규칙: API-First]** 이 프로젝트는 **헤드리스(Headless)** 백엔드다. 서버는 **순수 JSON**만 반환하며, 절대 HTML을 생성하거나 렌더링하지 않는다. (`.php` 파일 기반의 레거시 라우팅은 폐기한다.)
- **[규칙: Stateless]** 모든 API 엔드포인트는 **상태 비저장(Stateless)**으로 구현한다. 사용자 세션 정보는 파일이나 서버 메모리가 아닌, 오직 **JWT 토큰**을 통해서만 식별한다.



#### 2. 인증 및 인가 (AuthN/AuthZ)



- **[규칙: JWT]** 모든 인증은 **`jwtBearerAuth` (JWT)**를 사용한다. 로그인 API는 `AccessToken`과 `RefreshToken`을 발급한다. (세부 사항은 `api-spec.yaml` 참조)
- **[규칙: RBAC]** 모든 권한 검사는 **RBAC(역할 기반 접근 제어)**를 따른다. `schema.sql`의 `roles`, `permissions`, `user_roles`, `role_permissions` 테이블을 사용한다. API 엔드포인트별로 필요한 `permission`을 검사하는 미들웨어(또는 가드)를 구현해야 한다. (레거시 `happy_member_secure` 로직은 폐기한다.)



#### 3. 데이터베이스 (Database)



- **[규칙: DDL 준수]** 데이터베이스 스키마는 **`schema.sql`** 파일의 정의를 **100%** 준수한다.
- **[규칙: ORM 사용]** 데이터베이스 접근 시 절대 원시 SQL 쿼리 문자열을 사용하지 않는다. **Eloquent, Doctrine, Prisma, TypeORM** 등 프로젝트에 선정된 ORM(Object-Relational Mapper)을 통해서만 상호작용한다. (레거시 `inc/lib.php`의 수동 쿼리 방식은 폐기한다.)



#### 4. API 계약 (API Contract)



- **[규칙: OpenAPI 준수]** 모든 API 라우트, 요청(Request) DTO, 응답(Response) DTO는 **`api-spec.yaml`** 파일의 정의를 **100%** 준수한다.
- **[규칙: 표준 응답]** 모든 성공 응답은 `2xx` 상태 코드를, 모든 실패 응답은 `4xx` 또는 `5xx` 상태 코드와 함께 `api-spec.yaml`에 정의된 **`ErrorResponse`** 스키마(`{status: "error", message: "...", code: "..."}`)를 반환한다. (레거시 `msgclose`, `go` 함수 방식은 폐기한다.)



#### 5. 코딩 표준 (Coding Standards)



- **[규칙: Naming]** 데이터베이스 컬럼명은 DDL에 정의된 대로 `snake_case`를 사용한다. API JSON 본문과 코드 내 변수/함수명은 `camelCase`를 사용한다.
- **[규칙: Error Handling]** 모든 오류는 표준 예외(Standard Exceptions)를 `throw`하여 처리한다. 예외는 전역 오류 처리 미들웨어에서 감지하여 표준 `ErrorResponse` JSON으로 변환해 반환한다. (`exit`, `die` 사용은 금지한다.)
