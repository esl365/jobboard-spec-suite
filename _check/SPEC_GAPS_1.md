diff --git a/specs/SPEC_GAPS.md b/specs/SPEC_GAPS.md
new file mode 100644
index 0000000000000000000000000000000000000000..5e60b03a1cb56cb604a673f0afcc200a7b6a4afe
--- /dev/null
+++ b/specs/SPEC_GAPS.md
@@ -0,0 +1,5 @@
+# Spec Gaps (2025-10-25)
+
+- The site exposes 100+ PHP scripts directly under the document root. I treated each as a routable endpoint for the inventory, but individual business behaviors were not reviewed unless cited (Top-10). Further verification is required to confirm which of these scripts are actively linked or deprecated.
+- Authorization helpers such as `happy_member_secure()` derive rules from configuration that was not fully inspected. The precise role-based access for some Top-10 flows (e.g., resume/job detail visibility) should be validated against deployment settings before refactoring.
+- Payment integrations delegate to vendor modules inside `pg_module/`, but the callback flow and external endpoints were not analyzed. Mapping real payment notification routes will need a deeper review of the PG vendor directories.
