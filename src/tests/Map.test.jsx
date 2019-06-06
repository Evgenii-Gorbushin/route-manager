import React from 'react';
import { Map, Route } from '../Map';
import { mount, shallow } from 'enzyme';
import { theRoute, names, sleep } from './init';

const { map: n } = names;
const returns = {
  geoObjects: {
    position: [10.00, 20.00],
  },
  newPointOfRoute: {
    coords: [30.00, 40.00],
    country: 'Russia',
    address: 'some address',
  },
};
const theMaps = () => ({
  collection: {
    add: jest.fn(),
    removeAll: jest.fn(),
    getBounds: jest.fn(() => [[0, 0], [0, 0]]),
  },
  ymaps: {
    GeoObjectCollection: jest.fn(() => ({
      add: jest.fn(),
      getBounds: jest.fn(() => [[0, 0], [0, 0]]),
    })),
    Placemark: jest.fn(() => ({
      events: {
        add: jest.fn(),
      },
    })),
    multiRouter: {
      MultiRoute: jest.fn(),
    },
    geocode: () =>
      new Promise(resolve => resolve({
        geoObjects: {
          get: () => ({
            getCountry: () => returns.newPointOfRoute.country,
            getAddressLine: () => returns.newPointOfRoute.address,
          }),
        },
      })),
  },
  map: {
    geoObjects: {
      add: jest.fn(),
    },
    setBounds: jest.fn(),
  },
});

describe('test the Route component', () => {
  const cleanUp = () => {
    jest.clearAllMocks();

    route.setProps({
      theMap: null,
      theRoute: [],
      currentFocusPointOfRoute: null,
    });
  };
  const route = shallow(
    <Route
      changePointOfRoute={jest.fn()}
    />
  );

  afterEach(() => cleanUp());

  it('the Map has an empty render if theMap === null', () => {
    expect(route.isEmptyRender())
      .toBe(true);
  });

  it('the Map has an empty render if theRoute === [];' +
    'removeAll() has been called', () => {
    const theMap = theMaps();

    route.setProps({
      theMap,
    });

    expect(route.isEmptyRender())
      .toBe(true);
    expect(theMap.collection.removeAll)
      .toHaveBeenCalledTimes(1);
  });

  it('the Map creates the geoobjects;' +
    'test the presets of the placemarks', () => {
    /**
     * Первый прогон в случае когда theMap.collection !== null, имитация работы с уже существующей коллекцией геообъектов.
     * Второй прогон в случае когда theMap.collection === null, имитация создания коллекции геообъектов.
     */
    for (let i = 0; i < 2; i += 1) {
      const theMap = theMaps();

      if (i === 1) {
        theMap.collection = null;
      }

      route.setProps({
        currentFocusPointOfRoute: i,
        theRoute: theRoute.slice(),
        theMap,
      });

      // placemark
      const placemark = theMap.ymaps.Placemark;
      theRoute.forEach((item, index) => {
        const itemCoordinates = item.pos
          .split(' ')
          .map(i => parseFloat(i))
          .reverse();
        const presetShouldBe = (index === i) ? 'islands#greenIcon' : 'islands#blueIcon';

        expect(placemark.mock.calls[index][1].hintContent)
          .toBe(item.address);
        expect(placemark.mock.calls[index][1].balloonContent)
          .toBe(item.address);
        expect(placemark.mock.calls[index][2].preset)
          .toBe(presetShouldBe);
        expect(placemark.mock.calls[index][0])
          .toEqual(expect.arrayContaining(itemCoordinates));

        return itemCoordinates;
      });

      expect(placemark).toHaveBeenCalledTimes(2);

      // multiRoute
      const multiRoute = theMap.ymaps.multiRouter.MultiRoute;

      expect(multiRoute)
        .toHaveBeenCalledTimes(1);

      // collection / GeoObjectCollection
      const collection = theMap.collection;

      if (i === 1) {
        expect(theMap.ymaps.GeoObjectCollection)
          .toHaveBeenCalledTimes(1);
      } else {
        expect(collection.removeAll)
          .toHaveBeenCalledTimes(1);
      }

      expect(collection.add.mock.calls)
        .toHaveLength(3);
      expect(collection.add.mock.calls[0][0].events.add)
        .toHaveBeenCalledTimes(1);
      expect(collection.add.mock.calls[1][0].events.add)
        .toHaveBeenCalledTimes(1);
      expect(collection.add.mock.calls[2][0])
        .toBeInstanceOf(multiRoute);
      expect(collection.getBounds)
        .toHaveBeenCalledTimes(1);

      // map
      const map = theMap.map;

      expect(map.geoObjects.add.mock.calls[0][0])
        .toEqual(collection);
      expect(map.setBounds.mock.calls[0][0])
        .toEqual(expect.arrayContaining([[-0.001, -0.001], [0.001, 0.001]]));
    }
  });

  afterAll(() => route.unmount());
});

describe('test the Map component', () => {
  const cleanUp = (map) => {
    map.unmount();

    delete window.ymaps;
    delete window[n.nameOfGlMap];
  };

  it('initialize theMap', async () => {
    /**
     * i === 0, местоположение пользователя удалось определить.
     * i === 1, местоположение пользователя не удалось определить.
     */
    for (let i = 0; i < 2; i += 1) {
      const map = shallow(
        <Map
          rearrangeRoute={jest.fn()}
        />
      );
      const promiseReturn = (i === 0) ? returns : new Error();
      const gotCoords = (i === 0) ? returns.geoObjects.position : n.returns.defaultCoords;

      expect(map.find(`.${n.className.container}`).exists())
        .toBe(true);
      expect(map.find(`.${n.className.rubber}`).exists())
        .toBe(true);
      expect(map.find(`#${n.className.map}`).exists())
        .toBe(true);
      expect(map.find(Route).exists())
        .toBe(true);
      expect(map.state('theMap'))
        .toBe(null);
      expect(window[n.nameOfGlMap])
        .toBe(true);

      window.ymaps = {
        Map: jest.fn((...args) => (args[1].center)),
        ready: (f) => f(),
        geolocation: {
          get: jest.fn(() =>
            new Promise(resolve => setTimeout(resolve(promiseReturn), 1))),
        },
      };

      await sleep(101);

      expect(map.state('theMap').map)
        .toEqual(gotCoords);

      cleanUp(map);
    }
  });

  it('test that rearrangeRoute has been called with the changed route', async () => {
    const mockRearrangeRoute = jest.fn();
    const map = mount(
      <Map
        rearrangeRoute={mockRearrangeRoute}
        theRoute={theRoute.slice()}
      />
    );
    const index = 0;
    const { newPointOfRoute } = returns;
    const newRoute = theRoute.slice();
    const theMap = theMaps();

    map.setState({
      theMap,
    });

    newRoute[index].address = `${newPointOfRoute.country}, ${newPointOfRoute.address}`;
    newRoute[index].pos = newPointOfRoute.coords
      .reverse()
      .toString()
      .replace(',', ' ');

    map.instance().changePointOfRoute(index, returns.newPointOfRoute.coords);

    await sleep(10);

    expect(mockRearrangeRoute)
      .toHaveBeenCalledTimes(1);
    expect(mockRearrangeRoute.mock.calls[0][0])
      .toEqual(newRoute);

    cleanUp(map);
    jest.clearAllMocks();
  });
});
