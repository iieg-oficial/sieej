import { Component } from 'react';
import { BrowserRouter } from 'react-router';
import ErrorPage from '@pages/ErrorPage.jsx';

class RootErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        console.error('[sieej] error no capturado', error, info?.componentStack);
    }

    resetError = () => {
        this.setState({ error: null });
    };

    render() {
        if (this.state.error) {
            return (
                <BrowserRouter basename={this.props.basename}>
                    <ErrorPage error={this.state.error} resetError={this.resetError} />
                </BrowserRouter>
            );
        }
        return this.props.children;
    }
}

export default RootErrorBoundary;
