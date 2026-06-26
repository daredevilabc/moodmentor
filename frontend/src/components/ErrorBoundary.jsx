import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, () => this.setState({ hasError: false, error: null }))
      }
      return (
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="glass-card p-8 text-center space-y-4 max-w-md">
            <div className="text-6xl">😕</div>
            <h2 className="text-2xl font-bold text-white">Something went wrong</h2>
            <p className="text-dark-400">We encountered an unexpected error. Please try again.</p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="btn-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}