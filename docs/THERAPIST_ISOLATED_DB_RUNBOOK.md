# PR #64: 隔離DB検証の実行手順（未承認・未実行）

対象は Supabase `bwgpogwkycjcwlvtrhan` / 組織 `boat-strike`。この手順は**データを含めない新規Branch**に限る。本番データ、実ユーザー、実鍵、画像・Storage、実通知は複製・変更・送信しない。Branchの作成・適用は別途承認後のみ。

## 作成前の判定

- Supabase組織Billing/UsageでPro、Spend Cap、今期の利用量、Branching Compute Hours、予測請求額を再確認。2026-11-27確認時はSpend Cap有効、通常枠未超過、Branching 352時間=$4.73、現時点の請求$30.45、予測$69.82（他のBranchの費用を含む）。この画面は後から更新される。Branch計算料金はSpend Capの対象外。
- 対象プロジェクトのBranch数0を再確認。新規Branchの見積価格と課金体系を確認し、追加課金が禁止されている間は**ここで停止**。Microは公称$0.01344/時、60分以内に削除しても時間単位の丸めと追加リソースを含む厳密な上限にはならない。
- ダッシュボードからBranchを作る場合、`Include data` は必ずOFF。GitHub連携によりPRをmainへマージしたり、Supabase BranchをbaseへMergeしたりしない。Branch作成後は別のproject_ref、host、Branch IDを記録し、本番refと一致したら直ちに中止。
- 対象BranchはbaseのMigration履歴を順番に適用してスキーマを作る。既存本番のmigration一覧には `create_resort_style_schema` から `interview_questionnaires` まで22件がある。BranchがReadyでも依存テーブル・列・関数・権限が揃わなければSQL適用を止める。手動で本番データをdumpしない。

## 時間管理と削除

作成時刻をJSTとUTCで記録し、スマートフォン等に**作成+35分で停止準備、+45分で削除開始、+55分で削除確認**のアラームを設定する。+35分までに検証が終わらない場合も新しい試験を始めない。SQLのエラー、余計なデータ、接続先の不一致、想定外の料金、認証/RLS失敗、削除操作の不具合を見つけたら即時停止し、Branch IDを使って`delete_branch`で削除する。作成+60分以内に`list_branches`で当該IDが消えたことを確認。削除不可なら残存と課金継続の可能性を直ちに報告し、Supabase Dashboard/サポートから削除する。自動削除タイマーの存在を前提にしない。Branchの後片付けに本番Migrationやrollback SQLを実行しない。

## 事前に用意する隔離接続

SQL editorは単一セッションの検査に限る。並列試験は2本の独立した**Branch向けPostgreSQL接続**を用意し、接続URIはローカルの秘密管理だけに置く。ログ、GitHub、画面共有にURIを出さない。接続先ホストとBranch project_refが一致し、本番ref `bwgpogwkycjcwlvtrhan` と異なることを各接続で確認する。検証用SQLには固定の匿名店舗ID `30000`、架空の担当者2人・顧客1人・管理者1人、SQL用有効トークン2件と失効トークン1件だけが入る。実店舗のアカウント・パスワードは不要。SQL上の `request.jwt.claim.sub` はDB関数単体の認可試験用であり、PostgRESTの署名済JWTの実機検証には代わらない。

## 実行順序

1. BranchがReadyで、本番と異なるrefかつ本番の顧客・予約・本人アカウントの行が複製されていないことを確認。Migrationが固定の店舗マスタを挿入する可能性があるため、単純に全テーブル0行とは判定しない。既存のmigration履歴、必要なpublicテーブルと`resort_private`スキーマを確認。既存の設定を本番側では変更しない。
2. `db/proposals/therapist-work-preflight.sql` を読み取り専用で実行。Branchの期待外の行・列・既存トリガがあれば停止。
3. A: `therapist-work-app.sql`。成功後、匿名のみの `therapist-isolated-seed.sql` を実行。予約は長時間1件と短い12件で**重複12組**、別ルームで月またぎ深夜予約1件。ここまではガードを付けない。Dashboard Branchで既存テーブルのデフォルト権限が欠けている場合、読み取り専用で本番と比較してから、Branchに限り `therapist-isolated-branch-grants.sql` を適用する。
4. B: `therapist-room-guard.sql`、C: `therapist-staff-notices.sql`、D: `therapist-admin-writes.sql` の順に適用。各ファイルは独立したトランザクションで、エラー後は次へ進まない。
5. `therapist-isolated-verification.sql` を実行。匿名・他人・失効のトークン拒否、ルームRPCの6キー・38枠、仕事開始/終了と再送、会計分離、会計だけの変更、時間変更拒否、キャンセル/再有効化、出勤・ルームの成功/失敗・ロールバック、00:00/05:00/10:00/月またぎを検査。スクリプト自体は最後にROLLBACKする。
6. 別の2接続で、`therapist-isolated-race-a.sql` と `therapist-isolated-race-b.sql` をほぼ同時に実行。Aは保存後12秒間ロック保持、Bは2秒待って同じルームへ保存を試みる。片方成功、もう片方が`23P01`で失敗を期待。`therapist-isolated-race-check.sql`で合計1件を確認。接続開始順によって勝者が変わる。失敗を成功扱いしない。別ルームへの移動、互いに逆順ロックが必要な更新、片方ロールバック時の再試行は追加の2接続試験として記録する。
7. NodeテストとNext.jsビルド、管理者保存画面、予約・会計・顧客・出勤・月報の回帰を隔離接続で確認する。Pushの実送信はしない。通知は非公開DB内の作成・既読・店舗別投影のみ確認する。
8. +45分または検証終了時点でBranchを削除し、+55分までに`list_branches`で消滅を確認。請求画面の更新は最大1時間遅れることがあるため、削除時刻と後日の使用量を記録する。

接続先を独立に照合した後、並列検査の操作例（URI値は画面・ログに表示しない）：

```bash
psql "$PR64_BRANCH_DATABASE_URL" -X -v ON_ERROR_STOP=1 \
  -f db/proposals/therapist-isolated-race-a.sql > /tmp/pr64-race-a.log 2>&1 &
pr64_a_pid=$!
psql "$PR64_BRANCH_DATABASE_URL" -X -v ON_ERROR_STOP=1 \
  -f db/proposals/therapist-isolated-race-b.sql > /tmp/pr64-race-b.log 2>&1 &
pr64_b_pid=$!
wait "$pr64_a_pid"; pr64_a_exit=$?
wait "$pr64_b_pid"; pr64_b_exit=$?
```

一方の終了コード0、もう一方の非0とログ中の`23P01`、続くrace-checkの成功を**すべて**要求する。通信障害や認証エラーの非0を競合成功とみなさない。2接続の時刻同期や一方の遅延がずれた場合も成功扱いにせず、+35分の停止期限を優先する。作業後は一時ログと接続URIを破棄する。

## 実施記録（2026-11-27、削除確認済み）

Branch `chpdurogfolldptvrohn` を1件だけ作成し、`with_data=false`、本番と別ref、作成直後の認証ユーザー・顧客・女の子・予約・出勤が各0件と確認。A→匿名seed→B→C→Dの適用成功。seedは予約14件（重複12組を構成する13件＋月またぎ1件）。SQL検査の初回は `smallint` 引数の明示不足、次は顧客の「少なくとも1ブランド」制約で失敗し、いずれも検査トランザクションがロールバック。テストSQLを修正後、会計・予約・出勤・ルームの成功と失敗時ロールバック、失効/他人トークン、開始/終了冪等性、会計非連動、05:00境界が通過。

Branchの既存テーブル権限が本番と異なり、`authenticated` が管理者等の既存テーブルを参照できなかった。権限を読み取り専用で比較後、Branchの6テーブルだけ本番と同等のCRUD権限を付与。これを本番の権限変更とはしない。2接続では同じ部屋の重複保存が1件のみ成功し、もう1件は `23P01`、10秒のロック保持中に後続が待つことも確認。MarroNの料金BEFOREトリガが施術時間を60→80分に再計算した後、AFTERガードが次の予約との重複を拒否して変更全体を戻すことを確認。匿名ロールで7営業日のルームRPCを取得し、個人・予約IDが返らないことを確認。スタッフ通知は許可された管理者の履歴と既読のみ、別管理者は閲覧・既読不可。privateの8テーブルは匿名/認証ロールにSELECT不可。

残る実機/UI・Push送信・全店舗の権限変更・複数ルームの逆順デッドロック試験は未実施。SQLツール経由の並列試験であり、署名済JWTを用いたアプリ経由の認証試験には代わらない。

Branch作成は **18:24:50 JST**、削除API成功は **18:32:40 JST**、`list_branches` で対象ID消滅を確認したのは **18:32:45 JST**（約8分）。対象のBranch ID `b3b7e64f-5e70-4b51-bde7-00bfec571e8e` とref `chpdurogfolldptvrohn` は削除済み。main Branchは残存。実際の請求反映には遅延があり、計算料金の確定値は請求画面の後日の確認待ち。

## 失敗時・公開判定

### 次回の逆順2ルーム試験（未実施）

匿名データだけの**新たに承認された隔離DB**で、上記A→seed→B→C→Dを適用した後に限る。`therapist-isolated-reverse-room-setup.sql` は2031-01-05に同一店舗の1番・2番ルームへ清掃ブロックを各1件作成する。実行前にこの日に既存のブロック・予約・出勤割当がないことを読み取り専用で確認する。既存Branchは削除済みで、今回このSQLを実行しない。

独立した接続A/Bで `therapist-isolated-reverse-room-a.sql` と `therapist-isolated-reverse-room-b.sql` を**同時**に開始する。Aは1番→2番、Bは2番→1番の順で更新し、各最初のUPDATE後に2秒待つ。互いの最初の更新が確実に終わってから二つ目が始まるよう、接続の実行ログと時刻を確認する。順序がずれた実行はデッドロックの有無を判定できないため不成立とする。各接続の `statement_timeout=15s`、`ON_ERROR_STOP=on` とし、無制限に待機しない。

期待値は片方がSQLSTATE `40P01` でトランザクション全体を失い、もう片方が `COMMIT`。`therapist-isolated-reverse-room-check.sql` で2件とも`closed`かつ更新後の枠となり、中途半端な片方だけの更新がないことを確認する。DBが選ぶ勝者は決め打ちしない。`40P01`以外の通信失敗・タイムアウト、両方成功、両方失敗、チェック不一致はすべて**検証失敗**。UIは自動再送せず、再読込後に二つのルームの新しい状態を表示してから人が再判断する。ブロックが予約や出勤へ与える影響も同じ再読込で確認する。試験後は隔離Branch全体を削除し、本番へこの匿名行を移さない。

今回は接続先と料金の再承認がないため、準備したSQLは静的検査だけで実行していない。

一つでもSQLの実行、権限、想定時刻、並列競合に失敗したら、そのBranchで原因を調査して**本番には適用せず**、時間上限内にBranchごと削除する。失敗したMigrationをmainに持ち込まない。`therapist-work-rollback.sql`は監査データがあると実行を拒む設計であり、匿名試験Branchでは削除が復旧方法。本番DBへは影響しない。開始・終了通知、7営業日ルーム、スマートフォン操作、Web Pushは最終目標として継続し、実DB・実機検証前の公開判定はHOLD。
