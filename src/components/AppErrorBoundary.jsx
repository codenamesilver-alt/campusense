import { Component } from 'react';

// A render-time throw unmounts the whole React tree, which shows the user a blank
// white page with no way back. This keeps the shell alive and offers a reload.
class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled UI error:', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-lg w-full bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900">This page failed to load</h1>
          <p className="mt-2 text-sm text-slate-600">
            Something went wrong while rendering. Reload to try again. If it keeps happening,
            the error below identifies the cause.
          </p>
          <pre className="mt-4 p-3 bg-slate-900 text-slate-100 text-xs rounded overflow-auto max-h-48 whitespace-pre-wrap">
            {String(this.state.error?.stack || this.state.error)}
          </pre>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-slate-900 text-white text-sm rounded hover:bg-slate-700"
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }
}

export default AppErrorBoundary;
