# P0010 — Claude: 7-phase review for PR #4 + queue update

## Pre-conditions
- P0009 완료(충돌 해결 + 증거 댓글 3종)  
- `spec-runner / ci` **녹색**  
- drift 보고서 헤더에 **mismatches: 0**

## 7-Phase checklist (post as PR comments)
1. **Contract Conformance** – OpenAPI ↔ 구현 payload/에러 스키마 일치  
2. **Auth/RBAC** – prepare(보호됨), webhook(서명 검증)  
3. **DDL & ORM** – v1 승인 델타만, raw SQL 금지  
4. **Idempotency** – business keys 포함, 불일치 409  
5. **Exactly-Once** – de-dupe → 단일 TX 내 state+ledger, 재전송 200/무중복  
6. **Signature** – HMAC-SHA256 base64, **timingSafeEqual**, ±300s  
7. **Tooling/Preflight** – vendored Redocly 우선, **drift=0**, 테스트 전부 PASS

## Artifacts to post
- **Deliverable 1: Spec-Trace Coverage** (요약 표, 누락 0 기대)  
- **Deliverable 2: Preflight Gate** (tail 포함, drift=0)  
- **Deliverable 3: Exactly-Once Evidence** (코드 anchor + 테스트 링크)

## SPEC_GAPS
- GAP-001/002: **RESOLVED** 확인 재기록  
- GAP-003: vendored Redocly 도입으로 **CLOSED** 표기

## Final verdict
- 조건 충족 시: **APPROVE**(merge 권고)  
- 미충족 시: **REQUEST CHANGES** + 새로운 GAP 생성

## DONE (to be filled by Claude)
**Date:** YYYY-MM-DD  
**Links to comments:** (6개)  
**Verdict:** APPROVE / REQUEST CHANGES  
**Notes:** (선택)
