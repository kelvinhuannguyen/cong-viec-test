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
      <div role="alert" className="mx-auto mt-24 max-w-md space-y-4 p-6 text-center">
        <h1 className="text-xl font-bold">Đã có lỗi</h1>
        <p className="text-slate-600 dark:text-slate-300">
          Ứng dụng gặp sự cố ngoài dự kiến. Dữ liệu của bạn vẫn được giữ trong trình duyệt.
        </p>
        <button type="button" className={btn.primary} onClick={() => window.location.reload()}>
          Tải lại
        </button>
      </div>
    );
  }
}
