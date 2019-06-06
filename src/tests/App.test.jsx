import React from 'react';
import App from '../App.jsx';
import { Map } from '../Map';
import { Address } from '../Address';
import { List } from '../List';
import { shallow } from 'enzyme';
import { theRoute, names } from './init';

const { app: n } = names;

describe('test the App component', () => {
  const app = shallow(
    <App />
  );
  const indexDefault = 0;
  const cleanUp = () =>
    app.setState({
      theRoute: [],
      currentFocusPointOfRoute: null,
    });

  afterEach(() => cleanUp());

  it('the App has been rendered', () => {
    expect(app.find(`.${n.className.app}`).exists())
      .toBe(true);
    expect(app.find(`.${n.className.leftColumn}`).exists())
      .toBe(true);
    expect(app.find(Map).exists())
      .toBe(true);
    expect(app.find(Address).exists())
      .toBe(true);
    expect(app.find(List).exists())
      .toBe(true);
  });

  it('test addPointToRoute', () => {
    const addPointToRoute = app.instance().addPointToRoute;
    const geoObject = theRoute[indexDefault];

    expect(app.state('theRoute'))
      .toHaveLength(0);

    // Добавим первую точку маршрута.
    addPointToRoute(geoObject);

    expect(app.state('theRoute'))
      .toHaveLength(1);
    expect(app.state('theRoute')[indexDefault])
      .toEqual(geoObject);

    // Попробуем добавить эту же точку маршрута еще раз.
    const result = addPointToRoute(geoObject);

    expect(app.state('theRoute'))
      .toHaveLength(1);
    expect(result)
      .toBe(`"${geoObject.address}" ${names.address.errorMessages.whenAddressAlreadyExists}.`);
  });

  it('test deletePointOfRoute', () => {
    const deletePointOfRoute = app.instance().deletePointOfRoute;
    const address = theRoute[indexDefault].address;

    app.setState({
      theRoute: theRoute.slice(),
    });

    expect(app.state('theRoute'))
      .toHaveLength(2);

    deletePointOfRoute(address);

    expect(app.state('theRoute'))
      .toHaveLength(1);
    expect(app.state('theRoute')[indexDefault])
      .toEqual(theRoute[indexDefault + 1]);
  });

  it('test rearrangeRoute', () => {
    const newRoute = theRoute.slice().reverse();
    const rearrangeRoute = app.instance().rearrangeRoute;

    rearrangeRoute(newRoute);

    expect(app.state('theRoute'))
      .toEqual(newRoute);
  });

  it('test setCurrentFocus', () => {
    const setCurrentFocus = app.instance().setCurrentFocus;
    const event = {
      type: 'focus',
      target: {
        name: indexDefault,
      },
    };

    expect(app.state('currentFocusPointOfRoute'))
      .toBe(null);

    // focus
    setCurrentFocus(event);

    expect(app.state('currentFocusPointOfRoute'))
      .toBe(indexDefault);

    // blur
    event.type = 'blur';
    setCurrentFocus(event);

    expect(app.state('currentFocusPointOfRoute'))
      .toBe(null);
  });

  afterAll(() => app.unmount());
});
