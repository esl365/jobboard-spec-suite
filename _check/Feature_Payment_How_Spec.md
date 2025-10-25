**[규칙] 이 문서는 '결제' 도메인에만 적용되는 특수 규칙이다. `Master_How_Spec.md`의 규칙을 상속하고 확장한다.**

- **[관련 DDL]** 이 기능은 `schema.sql`의 다음 테이블을 주로 사용한다:
  - `product_packages`
  - `orders`
  - `point_transactions`
  - `user_wallets` (잔액 업데이트)
- **[관련 API]** 이 기능은 `api-spec.yaml`의 다음 엔드포인트를 구현한다:
  - `POST /orders/prepare`
  - `POST /orders/webhook`
- **[핵심 라이브러리]**
  - **[규칙: LIB-001]** 모든 결제 연동은 **Toss Payments SDK (또는 Iamport SDK)**를 사용해야 한다. (레거시 `pg_module/` 하위의 수동 로직은 폐기한다.)
- **[핵심 도메인 로직]**
  - **[규칙: DOM-002]** 결제 프로세스: 결제는 반드시 `POST /orders/prepare` API를 통해 `orders` 테이블에 `'PENDING'` 상태의 주문을 생성하는 것으로 시작해야 한다.
  - **[규칙: DOM-003]** 웹훅 처리: 실제 결제 승인, 포인트 지급(`user_wallets`, `point_transactions`), 상품 지급(`job_options` 등)은 **`POST /orders/webhook`** 엔드포인트가 PG사로부터 유효한 요청을 수신했을 때만 **비동기적**으로 처리되어야 한다.