import { Component, type ErrorInfo, type ReactNode } from 'react';
import { btn } from '../components/ui/styles';

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="mx-auto mt-24 max-w-md space-y-4 px-6">
        <h1 className="text-2xl font-semibold tracking-tight">Đã có lỗi</h1>
        <p className="leading-relaxed text-zinc-600 dark:text-zinc-300">
          Ứng dụng gặp sự cố ngoài dự kiến. Dữ liệu của bạn vẫn được giữ trong trình duyệt.
        </p>
        <button type="button" className={btn.primary} onClick={() => window.location.reload()}>
          Tải lại
        </button>
      </div>
    );
  }
}
