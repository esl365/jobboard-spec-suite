diff --git a/specs/SPEC_GAPS.md b/specs/SPEC_GAPS.md
new file mode 100644
index 0000000000000000000000000000000000000000..b8f243614b1a31d39cb890bd3b7dd3a8d5ed1416
--- /dev/null
+++ b/specs/SPEC_GAPS.md
@@ -0,0 +1,4 @@
+## Legacy PG callback gaps
+- Gap: Inicis NOTI branch trusts only a hard-coded IP range and returns `OK` without verifying payload integrity, so spoofed notifications could succeed. Evidence: `pg_module/pg_db_update.php` checks `REMOTE_ADDR` and processes `P_STATUS` without cryptographic validation.【F:pg_module/pg_db_update.php†L1074-L1175】 Proposal: Require HMAC verification (e.g., hash of body with shared secret) and persist the expected hash per order before migration.
+- Gap: Inicis standard return depends on PHP session data (`$_SESSION['INI_PRICE']`) for amount validation, but server-to-server callbacks may arrive after the session expires. Evidence: commented guard notes in `pg_module/pg_db_update.php`.【F:pg_module/pg_db_update.php†L1373-L1380】 Proposal: Move expected amount to durable storage keyed by order and enforce comparison using canonical order totals.
+- Gap: AllTheGate (PC/mobile) flows perform no signature check and rely on session copies of the amount, making them vulnerable to tampering. Evidence: `pg_module/pg_db_update.php` branch compares `rAmt` to session state and proceeds on match.【F:pg_module/pg_db_update.php†L618-L650】【F:pg_module/pg_db_update.php†L817-L1015】 Proposal: Introduce server-generated nonce or HMAC token in future adapter layer and persist gross amount for deterministic verification.
