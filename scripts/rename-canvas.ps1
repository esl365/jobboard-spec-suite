# C:\SpecCoding\scripts\rename-canvas.ps1
param(
  [string]$Root = "C:\SpecCoding",
  [string]$Inbox = "C:\SpecCoding\_inbox",
  [switch]$Apply  # 실제 이동/이름변경 수행 (미지정 시 Dry-Run)
)

function Ensure-Dir($p) { if (-not (Test-Path $p)) { New-Item -ItemType Directory -Force -Path $p | Out-Null } }

# 표준 타깃 경로(정답 파일명/폴더)
# === Add/replace in $targets ===
$targets += @{
  '^api-spec\.yaml$'              = 'openapi\api-spec.yaml'

  '^core-erd\.mmd$'               = 'specs-legacy\core-erd.mmd'
  '^db_core_map\.json$'           = 'specs-legacy\db_core_map.json'
  '^DB_Core_Report\.md$'          = 'specs-legacy\DB_Core_Report.md'

  '^endpoints_top10\.json$'       = 'specs-legacy\endpoints_top10.json'
  '^Endpoints_Top10\.md$'         = 'specs-legacy\Endpoints_Top10.md'
  '^routing_inventory\.md$'       = 'specs-legacy\routing_inventory.md'

  '^Feature_Job_How_Spec\.md$'    = 'specs\Feature_Job_How_Spec.md'
  '^Feature_Payment_How_Spec\.md$'= 'specs\Feature_Payment_How_Spec.md'
  '^Master_How_Spec\.md$'         = 'specs\Master_How_Spec.md'
  '^policy\.md$'                  = 'specs\policy.md'

  '^Initial_Prompt\.md$'          = 'prompts\Initial_Prompt_Spec_Runner.md'  # 표준명으로 통일

  '^PG_Callback_Map\.md$'         = 'specs-legacy\PG_Callback_Map.md'
  '^pg_callbacks\.json$'          = 'specs-legacy\pg_callbacks.json'
  '^pg_webhook_sequence\.mmd$'    = 'specs-legacy\pg_webhook_sequence.mmd'
  '^pg-webhooks-legacy\.yaml$'    = 'specs-legacy\pg-webhooks-legacy.yaml'

  '^schema\.core\.pg\.sql$'       = 'db\schema.pg.sql'
  '^schema\.sql$'                 = 'db\schema.sql'
  '^schema\.core\.sql$'           = 'specs-legacy\schema.core.sql'           # 참고용 보관

  '^SPEC_GAPS\.md$'               = 'specs\SPEC_GAPS.md'
  '^SPEC_GAPS_1\.md$'             = 'specs\SPEC_GAPS_1.md'
  '^SPEC_GAPS_2\.md$'             = 'specs\SPEC_GAPS_2.md'

  '^webhook_noti\.json$'          = 'specs-legacy\webhooks\webhook_noti.json'
  '^webhook_notify\.json$'        = 'specs-legacy\webhooks\webhook_notify.json'
  '^webhook_payment\.json$'       = 'specs-legacy\webhooks\webhook_payment.json'
  '^webhook_pc\.json$'            = 'specs-legacy\webhooks\webhook_pc.json'
}


# 폴더 보장
@("$Root", "$Inbox",
  "$Root\prompts",
  "$Root\docs\llm-input-pack",
  "$Root\openapi",
  "$Root\scripts",
  "$Root\src\routes",
  "$Root\src\infra\memory",
  "$Root\src\payments\adapters",
  "$Root\tests\payments\integration",
  "$Root\specs",
  "$Root\specs-legacy",
  "$Root\specs-legacy\webhooks",
  "$Root\db"
) | ForEach-Object { Ensure-Dir $_ }


# 매칭/적용
$files = Get-ChildItem -File -Path $Inbox
if ($files.Count -eq 0) { Write-Host "[INFO] _inbox 폴더에 파일이 없습니다."; exit 0 }

$unmapped = @()
foreach ($f in $files) {
  $matched = $false
  foreach ($pattern in $targets.Keys) {
    if ($f.Name -match $pattern) {
      $rel = $targets[$pattern]
      $dest = Join-Path $Root $rel
      Write-Host ("{0}  =>  {1}" -f $f.Name, $rel)
      if ($Apply) {
        Ensure-Dir ([System.IO.Path]::GetDirectoryName($dest))
        Move-Item -LiteralPath $f.FullName -Destination $dest -Force
      }
      $matched = $true
      break
    }
  }
  if (-not $matched) { $unmapped += $f }
}

if (-not $Apply) { Write-Host "`n[Dry-Run] 실제 이동은 하지 않았습니다. -Apply 스위치를 주면 실행합니다." }
if ($unmapped.Count) {
  Write-Host "`n[Unmapped] 규칙에 안 걸린 파일(수동 매핑 필요):"
  $unmapped | ForEach-Object { Write-Host (" - " + $_.Name) }
  Write-Host "힌트: 규칙을 추가하려면 스크립트의 `$targets 해시테이블에 패턴=경로를 더하세요."
}
