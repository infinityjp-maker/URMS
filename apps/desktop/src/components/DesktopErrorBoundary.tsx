import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
};

/** React クラッシュ時の白画面を避け、復旧手順を表示する */
export class DesktopErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[URMS desktop]', error, info.componentStack);
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <div className="desktop-boot-error" role="alert">
        <h1>URMS — 画面を読み込めませんでした</h1>
        <p className="desktop-boot-error__message">{this.state.error.message}</p>
        <ol className="desktop-boot-error__steps">
          <li>
            ターミナルで <code>corepack pnpm dev:prepare</code> を実行
          </li>
          <li>
            <code>scripts\launch\start-dev-servers.bat</code> で API + 1420 を再起動
          </li>
          <li>
            ブラウザで <code>http://127.0.0.1:1420/</code> を開き直す（Ctrl+F5）
          </li>
        </ol>
        <button type="button" className="desktop-boot-error__button" onClick={this.handleReload}>
          再読み込み
        </button>
      </div>
    );
  }
}
