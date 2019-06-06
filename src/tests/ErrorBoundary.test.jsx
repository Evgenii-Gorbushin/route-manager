import React from 'react';
import ErrorBoundary from '../ErrorBoundary';
import { shallow } from 'enzyme';
import { child } from './init';

describe('test the ErrorBoundary component', () => {
  const cleanUp = (errorBoundary) => errorBoundary.unmount();

  it('renders without crashing', () => {
    const errorBoundary = shallow(
      <ErrorBoundary>
        { child }
      </ErrorBoundary>
    );

    expect(errorBoundary.state('hasError'))
      .toBe(false);
    expect(errorBoundary.text())
      .toBe(child);

    cleanUp(errorBoundary);
  });

  it('renders with crashing', () => {
    const errorBoundary = shallow(
      <ErrorBoundary>
        { child }
      </ErrorBoundary>
    );

    errorBoundary.setState({
      hasError: true,
    });

    expect(errorBoundary.state('hasError'))
      .toBe(true);
    expect(errorBoundary.text())
      .toBe('');

    cleanUp(errorBoundary);
  });
});
