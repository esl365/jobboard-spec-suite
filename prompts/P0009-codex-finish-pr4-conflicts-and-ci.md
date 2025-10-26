* # P0009 — Codex: Finish PR #4 (vendor redocly) conflicts + CI evidence

  ## Context
  - PR: **#4 — chore(ci): vendor redocly cli for offline preflight**
  - Head branch: `codex/run-pre-flight-and-log-issues-8cw2da`
  - Base branch: `main`
  - Branch protection: `spec-runner / ci` 체크 **필수**
  - Conflicted files (GitHub UI가 표시한 목록)
    - `package.json`
    - `scripts/openapi-lint.mjs`
    - `src/infra/memory/payments.repos.ts`
    - `src/payments/adapters/mock.ts`
    - `src/payments/registry.ts`
    - `src/routes/webhooks.payments.ts`

  ## Objective
  1) 충돌 해결(3-way merge)  
  2) vendored Redocly CLI 우선 사용 고정(offline에서도 `npm run preflight` 동작)  
  3) CI 통과 증거(프리플라이트/테스트 tail + drift=0) 댓글로 게시  

  ## Canonical merge rules
  - **package.json**  
    - `"preflight": "node scripts/openapi-lint.mjs && node scripts/spec-drift-check.mjs"` 유지  
    - vendored CLI 우선: `tools/redocly-cli/redocly` → 없으면 global → 마지막으로 offline fallback
  - **scripts/openapi-lint.mjs**  
    - vendored 우선 + 명확한 상태 출력: `mode=vendored|global|fallback`
  - **mock adapter / webhook**  
    - 서명 **base64** + `crypto.timingSafeEqual` 준수  
    - webhook는 **rawBody** 필수(재직렬화 금지)
  - **repos/registry**  
    - mock provider만 기본 등록(외부 provider 미포함)

  ## Tasks
  - [ ] `git merge main` 충돌 해결(로컬 3-way 권장)  
  - [ ] `npm run preflight` 실행 → tail(마지막 ~20줄) 캡쳐  
  - [ ] `npm test` 실행 → tail(마지막 ~20줄) 캡쳐  
  - [ ] `reports/spec-openapi-ddl-drift.md` 상단 mismatch 헤더 확인( **mismatches: 0** )  
  - [ ] PR #4에 **증거 댓글** 3개 게시  
    1) Preflight tail  
    2) Test tail  
    3) Drift 헤더 첫 10줄
  - [ ] 이 파일 맨 아래 **DONE 섹션** 갱신

  ## Deliverables (to post on PR #4)
  - [ ] **Preflight Gate**: `openapi-lint mode`, 오류 0, `drift=0` 표기  
  - [ ] **Tests**: 모든 suite PASS  
  - [ ] **Signature & RawBody**: 관련 코드 라인 anchor 2~3곳(파일:라인)

  ## STOP rules
  - drift > 0, hex 서명, rawBody 미포착, de-dupe가 side-effect 이후 수행 → **즉시 중단 & 코멘트**

  ---

  ## DONE (to be filled by Codex)
  **Date:** YYYY-MM-DD  
  **Commits:** `<hash1>`, `<hash2>`  
  **Preflight tail:** (붙여넣기)  
  **Test tail:** (붙여넣기)  
  **Drift header (first 10 lines):** (붙여넣기)  
  **Notes:** (선택)
