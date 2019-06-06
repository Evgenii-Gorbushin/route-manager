import React from 'react';
import * as PropTypes from 'prop-types';

// В случае возникновения ошибки в приложении выводит сообщение об ошибке на экран.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
    };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      hasError: true,
    });

    console.error(error);
    console.error(errorInfo);

    document.write('404 что-то пошло не так.');
  }

  render() {
    const hasError = this.state.hasError;
    const children = this.props.children;

    if (hasError) {
      return false;
    }

    return children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node,
};

ErrorBoundary.defualtProps = {
  children: null,
};

export default ErrorBoundary;
