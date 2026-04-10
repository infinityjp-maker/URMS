対象リポジトリ: infinityjp-maker/URMS
問題の概要: check-suite は生成されるが check-runs が 0 のまま
再現した run_id: 23149962343, 24198346858
再現した check_suite_id: 60777492111, 63967813492
発生日時 (ローカル): 2026-04-10 23:04:51 +09:00
期待動作: ワークフロー実行でチェックラン/ジョブが1件以上生成されること
実際の動作: チェックスイートは作成されるが check-runs/jobs が0件のまま
取得済み API 一覧 (ファイル名):
 - D:\GitHub\URMS\.gh-run-scripts\selfhosted_repair\api_checks\actions_permissions.json
 - D:\GitHub\URMS\.gh-run-scripts\selfhosted_repair\api_checks\actions_selected_actions_ref.json
 - D:\GitHub\URMS\.gh-run-scripts\selfhosted_repair\api_checks\actions_selected_actions.json
 - D:\GitHub\URMS\.gh-run-scripts\selfhosted_repair\api_checks\check_runs_60777492111.json
 - D:\GitHub\URMS\.gh-run-scripts\selfhosted_repair\api_checks\check_runs_63967813492.json
 - D:\GitHub\URMS\.gh-run-scripts\selfhosted_repair\api_checks\check_runs_64059541779.json
 - D:\GitHub\URMS\.gh-run-scripts\selfhosted_repair\api_checks\check_suite_60777492111.json
 - D:\GitHub\URMS\.gh-run-scripts\selfhosted_repair\api_checks\content.b64
 - D:\GitHub\URMS\.gh-run-scripts\selfhosted_repair\api_checks\dispatch_response_main_by_id.txt
 - D:\GitHub\URMS\.gh-run-scripts\selfhosted_repair\api_checks\dispatch_response_main.txt
 - D:\GitHub\URMS\.gh-run-scripts\selfhosted_repair\api_checks\dispatch_response_validate.txt
 - D:\GitHub\URMS\.gh-run-scripts\selfhosted_repair\api_checks\dispatch_response.txt
 - D:\GitHub\URMS\.gh-run-scripts\selfhosted_repair\api_checks\file_on_branch.json
 - D:\GitHub\URMS\.gh-run-scripts\selfhosted_repair\api_checks\gh_workflows_after_push.json
 - D:\GitHub\URMS\.gh-run-scripts\selfhosted_repair\api_checks\gh_workflows.json
 - D:\GitHub\URMS\.gh-run-scripts\selfhosted_repair\api_checks\list_runs_tmp.json
 - D:\GitHub\URMS\.gh-run-scripts\selfhosted_repair\api_checks\new_run_summary.json
 - D:\GitHub\URMS\.gh-run-scripts\selfhosted_repair\api_checks\new_run_workflow_summary.json
 - D:\GitHub\URMS\.gh-run-scripts\selfhosted_repair\api_checks\org_actions_permissions.json
 - D:\GitHub\URMS\.gh-run-scripts\selfhosted_repair\api_checks\pr_69_files.json
 - D:\GitHub\URMS\.gh-run-scripts\selfhosted_repair\api_checks\required_workflow_approvals.json
 - D:\GitHub\URMS\.gh-run-scripts\selfhosted_repair\api_checks\rerun_output.json
 - D:\GitHub\URMS\.gh-run-scripts\selfhosted_repair\api_checks\run_23149962343_approvals.json
 - D:\GitHub\URMS\.gh-run-scripts\selfhosted_repair\api_checks\run_23149962343_attempt1.json
 - D:\GitHub\URMS\.gh-run-scripts\selfhosted_repair\api_checks\run_23149962343_pending_deployments.json
 - D:\GitHub\URMS\.gh-run-scripts\selfhosted_repair\api_checks\run_23149962343_timing.json
 - D:\GitHub\URMS\.gh-run-scripts\selfhosted_repair\api_checks\run_23149962343.json
 - D:\GitHub\URMS\.gh-run-scripts\selfhosted_repair\api_checks\run_24198346858_annotations.json
 - D:\GitHub\URMS\.gh-run-scripts\selfhosted_repair\api_checks\run_24198346858_artifacts.json
 - D:\GitHub\URMS\.gh-run-scripts\selfhosted_repair\api_checks\run_24198346858_attempt1.json
 - D:\GitHub\URMS\.gh-run-scripts\selfhosted_repair\api_checks\run_24198346858_attempts.json
 - D:\GitHub\URMS\.gh-run-scripts\selfhosted_repair\api_checks\run_24198346858_cancel.json
 - D:\GitHub\URMS\.gh-run-scripts\selfhosted_repair\api_checks\run_24198346858_logs_err.txt
 - D:\GitHub\URMS\.gh-run-scripts\selfhosted_repair\api_checks\run_24198346858_logs.zip
 - D:\GitHub\URMS\.gh-run-scripts\selfhosted_repair\api_checks\run_24198346858_pending_deployments.json
 - D:\GitHub\URMS\.gh-run-scripts\selfhosted_repair\api_checks\run_24198346858_timing.json
 - D:\GitHub\URMS\.gh-run-scripts\selfhosted_repair\api_checks\run_24198346858.json
 - D:\GitHub\URMS\.gh-run-scripts\selfhosted_repair\api_checks\run_24228747374.json
 - D:\GitHub\URMS\.gh-run-scripts\selfhosted_repair\api_checks\run_jobs_23149962343.json
 - D:\GitHub\URMS\.gh-run-scripts\selfhosted_repair\api_checks\run_jobs_24215723846.json
 - D:\GitHub\URMS\.gh-run-scripts\selfhosted_repair\api_checks\support_readme.txt
 - D:\GitHub\URMS\.gh-run-scripts\selfhosted_repair\api_checks\test-hosted-runner.decoded.yml
 - D:\GitHub\URMS\.gh-run-scripts\selfhosted_repair\api_checks\workflow_runs_by_id.json
 - D:\GitHub\URMS\.gh-run-scripts\selfhosted_repair\api_checks\workflow_runs_tmp.json
 - D:\GitHub\URMS\.gh-run-scripts\selfhosted_repair\api_checks\workflows_list.json
