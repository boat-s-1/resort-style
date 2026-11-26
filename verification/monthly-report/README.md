# PR #63 匿名の画面・PDF検証

この検証は本番DBを使わない。実行時に一時ページを作り、匿名の予約4件と経費75件を既存の集計・画面コンポーネントへ渡す。Supabase URLはローカルのダミーへ上書きし、ブラウザの外部通信は遮断する。一時ページは終了時に削除する。

準備済み環境で `node verification/monthly-report/run.mjs` を実行すると、`verification/monthly-report/output/` にPC・スマートフォン画面とA4縦PDFが出る。実行にはNextの依存パッケージとPlaywright Chromiumが必要。PDFのページ検査は `pdfinfo` と `pdftotext -layout` で、全ページの空白と1〜75の明細、表見出しの繰り返しを確認し、最後に各ページを目視する。

GitHub Actionsはこのリポジトリに既存のワークフローがないため、実行を事前承認なしに追加・起動しない。匿名サンプルのPDFであり、実データ数値の照合にはならない。
