"use client";

import React from "react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex items-center justify-center h-screen bg-background">
            <div className="text-center">
              <h2 className="text-xl font-light text-white/80 mb-2">
                Something went wrong
              </h2>
              <p className="text-sm text-white/40">
                Please refresh the page to continue
              </p>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}