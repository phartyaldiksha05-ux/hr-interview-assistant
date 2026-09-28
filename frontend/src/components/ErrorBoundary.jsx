import { Component } from "react";

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Meetwise UI rendering failed", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main role="alert" className="app-error-boundary">
          <span className="workspace-overline">MEETWISE</span>
          <h1>This page could not be displayed</h1>
          <p>Your saved candidate information is still in the workspace. Reload the page to try again.</p>
          <button type="button" className="workspace-primary-action" onClick={() => window.location.reload()}>
            Reload page
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}