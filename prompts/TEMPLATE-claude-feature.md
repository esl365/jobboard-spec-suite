# P{number}: {Feature Title}

**Created:** YYYY-MM-DD
**Priority:** High | Medium | Low
**Estimate:** {time estimate}
**Agent:** Claude Code
**Type:** Feature Development

## Context

{왜 이 기능이 필요한가? 배경 설명}

**Related Issues:**
- #{issue_number}

**Dependencies:**
- {다른 작업이나 라이브러리}

**Business Value:**
- {이 기능이 제공하는 가치}

## Task

### 1. Architecture Design

{시스템 아키텍처 설계}
- Database schema changes (if any)
- API endpoints design
- Service layer structure
- Data flow diagram (optional)

### 2. Implementation Steps

1. **Database Layer**
   ```sql
   -- Example migration
   CREATE TABLE users (
     id SERIAL PRIMARY KEY,
     ...
   );
   ```

2. **API Layer**
   ```typescript
   // Example endpoint
   POST /api/v1/users
   GET /api/v1/users/:id
   ```

3. **Business Logic**
   - Service functions
   - Validation rules
   - Error handling

4. **Testing**
   - Unit tests (80% coverage target)
   - Integration tests
   - API tests

### 3. Codex Coordination (병렬 작업)

**Codex will handle:**
- UI components
- Frontend integration
- Styling

**Claude provides:**
- API documentation
- Response/request schemas
- Error codes

**Integration point:**
- After Claude completes backend → Codex starts frontend

## Success Criteria

- [ ] Database schema implemented and migrated
- [ ] All API endpoints implemented and documented
- [ ] Business logic covered with tests (>80% coverage)
- [ ] Error handling comprehensive
- [ ] Integration tests pass
- [ ] API documentation complete (OpenAPI/Swagger)
- [ ] Code follows project style guidelines
- [ ] Security best practices applied
- [ ] Performance requirements met

## Technical Specifications

### API Endpoints

```yaml
POST /api/v1/resource
Request:
  {
    "field1": "string",
    "field2": "number"
  }
Response:
  200: { "id": 1, "created_at": "..." }
  400: { "error": "validation error" }
  500: { "error": "internal error" }
```

### Database Schema

```sql
-- Migrations to create
migrations/YYYYMMDD_HHMM_feature_name.sql
```

### Test Coverage Requirements

- Unit tests: 80%+
- Integration tests: Key flows covered
- Edge cases: Error scenarios tested

## STOP Rules

**If any of these occur, STOP and update `specs/SPEC_GAPS.md`:**

1. **Spec ambiguity**: Requirements unclear → Document and request clarification
2. **Breaking changes**: API changes affect existing features → Propose migration plan
3. **Performance issues**: Implementation doesn't meet requirements → Document bottleneck
4. **Dependency issues**: Required libraries incompatible → Propose alternatives
5. **Security concerns**: Implementation has security risks → Document and propose fix

## Related

- Branch: `claude/feature-{description}`
- Base: `main`
- Codex Prompt: `prompts/P{number+1}-codex-{description}-ui.md`
- Spec: `specs/Feature_{Name}_How_Spec.md`
- OpenAPI: `openapi/api-spec.yaml`

---

## DONE (YYYY-MM-DD)

_(To be filled after completion)_

**Summary:** [Brief description of what was accomplished]

**Changes:**
- Database: [migrations created, tables modified]
- API: [endpoints implemented]
- Services: [business logic added]
- Tests: [test files created, coverage achieved]

**Evidence:**
- Commit: [commit hash]
- Branch: `claude/feature-{description}`
- PR: #{PR_number}
- Test Results:
  ```
  Tests: 45 passed, 45 total
  Coverage: 85%
  ```
- Performance:
  - Endpoint response time: < 200ms
  - Query efficiency: N+1 queries avoided

**Integration:**
- Codex frontend: Ready for integration
- API docs: Updated at /api-docs
- Database: Migrated successfully

**Notes:**
- [Any challenges encountered]
- [Decisions made and rationale]
- [Future improvements]
- [Known limitations]
