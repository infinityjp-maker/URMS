# PR: Fix WinUI XAML compilation and repo integrity checks

## 概要
今回の PR は `URMS.WinUI` における XAML コンパイル失敗を解消するための最小差分修正を含みます。複数のカード XAML ファイルがテンプレート置換時に `x:Class` を `PlaceholderCard` に書き換えられ、コードビハインドと不整合が発生していました。また一部の XAML で WinUI 用の XML 名前空間が不正でした。これらを修正し、ビルドと基本的な整合性チェックを自動で実行して成功を確認しました。

## 変更点
- `Views/Cards/*` の XAML ファイル（複数）に対して、`x:Class` をファイル名に合わせて復元。
- `App.xaml` と `MainWindow.xaml` の XML 名前空間を WinUI 用に整備。
- ビルド確認（`dotnet build`） を実行し、XAML コンパイルが成功することを確認。

## 影響範囲
- 影響は主に `URMS.WinUI` のビュー層（XAML）のみ。ビジネスロジックや ViewModel のコードは変更していません。

## テスト
- `dotnet build` によるビルド確認（成功）
- リポジトリ内に Node ベースのテスト設定 (`package.json`, `vitest.config.ts`) があるため、CI 上でのフルテストはワークフローに依存します。ローカルでの NPM インストールが必要です。

## コミットメッセージ
- `fix(winui): normalize XAML namespaces and restore x:Class to match code-behind; ensure XAML compilation succeeds`

## PR タイトル案
- `Fix: URMS.WinUI XAML compilation failures — restore x:Class and namespaces`

## 備考 / 次の推奨作業
1. CI ワークフローで Windows ビルドを実行して、エンドツーエンドのビルドとテストを確認してください。
2. 自動テンプレート置換スクリプトがある場合は、`x:Class` を上書きしないよう修正するか、スクリプトにクラス復元ロジックを追加してください。

