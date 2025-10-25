<# pack-llm-context.ps1 — GitHub용 LLM 컨텍스트 ZIP 생성기 #>
param(
  [string]$Root = "C:\SpecCoding",
  [string]$Out = "llm-context.zip",
  [switch]$IncludeLegacy,
  [switch]$Placeholders
)

function Ensure-Dir($p){ if(-not(Test-Path $p)){ New-Item -ItemType Directory -Force -Path $p | Out-Null } }
function Ensure-File($p,$v=""){ Ensure-Dir ([IO.Path]::GetDirectoryName($p)); if(-not(Test-Path $p)){ Set-Content -LiteralPath $p -Value $v -Encoding UTF8 } }
function Full($rel){ Join-Path $Root $rel }

$Core  = @(".editorconfig",".gitattributes",".gitignore","README.md","package.json")
$Docs  = @("docs\SPEC_RUNNER_SEED.md","docs\OPENAPI_PATCH_GUIDE.md",
           "docs\llm-input-pack\Part1_Functional_Data_Spec.md",
           "docs\llm-input-pack\Part2_Functional_Endpoint_Spec.md",
           "docs\llm-input-pack\Part3A_Payments_Adapter_Contract.md",
           "docs\llm-input-pack\Part3B_LLM_Delivery_README.md")
$Prom  = @("prompts\Initial_Prompt_Spec_Runner.md","prompts\spec-runner.prompt.md")
$Specs = @("specs\Master_How_Spec.md","specs\Feature_Payment_How_Spec.md","specs\Feature_Job_How_Spec.md",
           "specs\policy.md","specs\SPEC_GAPS.md","specs\LessonsLearned.md","specs\Spec-Trace.yml","specs\glossary.yml")
$OAS   = @("openapi\api-spec.yaml","openapi\api-spec.payments.snippet.yaml")
$DB    = @("db\schema.pg.sql","migrations\20251025_0001_payments.sql")
$Scr   = @(
           "scripts\openapi-merge-payments.mjs","scripts\openapi-merge-payments.js",
           "scripts\spec-drift-check.mjs","scripts\spec-drift-check.js",
           "scripts\scan-forbidden.js","scripts\scan-forbidden.allowlist.json",
           "scripts\pack-llm-context.ps1","scripts\pack-llm-context.sh"
         )
$Src   = @("src\routes\auth.ts","src\routes\orders.prepare.ts","src\routes\orders.ts","src\routes\wallet.ts","src\routes\webhooks.payments.ts",
           "src\payments\registry.ts","src\payments\adapters\mock.ts","src\payments\adapters\iamport.ts",
           "src\infra\memory\payments.repos.ts")
$Dirs  = @("tests\payments\unit","tests\payments\integration",".github\workflows")
$Legacy= @("specs-legacy\LegacyMap.md","specs-legacy\DB_Core_Report.md","specs-legacy\Endpoints_Top10.md",
           "specs-legacy\PG_Callback_Map.md","specs-legacy\core-erd.mmd","specs-legacy\endpoints_top10.json",
           "specs-legacy\routing_inventory.md","specs-legacy\pg_callbacks.json","specs-legacy\pg_webhook_sequence.mmd",
           "specs-legacy\pg-webhooks-legacy.yaml","specs-legacy\schema.core.sql",
           "specs-legacy\gaps\SPEC_GAPS_1.md","specs-legacy\gaps\SPEC_GAPS_2.md",
           "specs-legacy\webhooks\webhook_noti.json","specs-legacy\webhooks\webhook_notify.json",
           "specs-legacy\webhooks\webhook_payment.json","specs-legacy\webhooks\webhook_pc.json")

$All = @(); $All += $Core+$Docs+$Prom+$Specs+$OAS+$DB+$Scr+$Src; if($IncludeLegacy){ $All += $Legacy }

# 필수 폴더 생성
@("docs\llm-input-pack","prompts","specs","openapi","db","migrations","scripts",
  "src\routes","src\payments\adapters","src\infra\memory",
  "tests\payments\unit","tests\payments\integration",".github\workflows") | % { Ensure-Dir (Full $_) }

# 플레이스홀더 생성
$Missing=@()
foreach($rel in $All){
  $abs = Full $rel
  if(-not(Test-Path $abs)){
    if($Placeholders){
      $banner = "<!-- placeholder: $rel -->"
      if ($rel -match '\.ya?ml$') { $banner = "# placeholder: $rel" }
      elseif ($rel -match '\.(ts|mjs|js)$') { $banner = "// placeholder: $rel" }
      Ensure-File $abs $banner
    } else { $Missing += $rel }
  }
}

if($Missing.Count -gt 0){ Write-Host "`n[WARN] Missing files (use -Placeholders to auto-create):"; $Missing | % { Write-Host " - $_" } }

# 수집
$Entries=@()
foreach($rel in $All){ $abs = Full $rel; if(Test-Path $abs){ $Entries += $abs } }
foreach($d in $Dirs){ $ad = Full $d; if(Test-Path $ad){ $Entries += $ad } }

if($Entries.Count -eq 0){ throw "Nothing to pack. Check -Root or use -Placeholders." }

# 출력 정보 문자열을 안전하게 구성
$mode   = if ($IncludeLegacy) { "core+legacy" } else { "core" }
$suffix = if ($Placeholders)  { " (placeholders)" } else { "" }

# 패킹
$OutPath = ([IO.Path]::IsPathRooted($Out)) ? $Out : (Join-Path (Get-Location) $Out)
if(Test-Path $OutPath){ Remove-Item -LiteralPath $OutPath -Force }
Write-Host "`n[PACK] Creating $OutPath"
Compress-Archive -Path $Entries -DestinationPath $OutPath -Force
Write-Host ("[OK] Packed {0} entries.`nRoot: {1}`nOut : {2}`nMode: {3}{4}" -f $Entries.Count, $Root, $OutPath, $mode, $suffix)
