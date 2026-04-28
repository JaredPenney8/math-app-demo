import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("App crashed:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, fontFamily: "Inter" }}>
          <h2>Something went wrong</h2>
          <p>The app hit an error, but didn’t crash completely.</p>

          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              background: "#2563eb",
              color: "white",
              border: "none",
              cursor: "pointer"
            }}
          >
            Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}