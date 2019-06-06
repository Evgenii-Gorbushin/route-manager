import React from 'react';
import * as PropTypes from 'prop-types';
import './css/Map.css';

/**
 * Добавляет геообъекты на карту.
 * @param {Object} props
 * @param {Array} props.theRoute - точки маршрута.
 * @param {Object|null} props.theMap - содержит ссылку на глобальную переменную glMap.
 * @param {number|null} props.currentFocusPointOfRoute - индекс текущей точки маршрута в фокусе.
 * @returns {boolean}
 * @constructor
 */
function Route(props) {
  if (props.theMap !== null) {
    const { theMap, theRoute } = props;

    if (theRoute.length === 0) {
      if (theMap.collection !== null) {
        // Удаление из коллекции всех геообъектов.
        theMap.collection.removeAll();
      }

      return false;
    }

    let geoCollection = null;

    if (theMap.collection !== null) {
      // Удаление из коллекции всех геообъектов.
      geoCollection = theMap.collection;
      geoCollection.removeAll();
    } else {
      // Создание коллекции геообъектов.
      geoCollection = new theMap.ymaps.GeoObjectCollection({}, {
        draggable: true,
      });
      theMap.collection = geoCollection;
    }

    /**
     * Заполнение коллекции метками.
     * Получение массива координат меток.
     * @type {Array}
     */
    theRoute.forEach((item, index) => {
      const itemCoordinates = item.pos
        .split(' ')
        .map(i => parseFloat(i))
        .reverse();

      const geoPlacemark = new theMap.ymaps.Placemark(
        itemCoordinates,
        {
          iconContent: (index + 1),
          hintContent: item.address,
          balloonContent: item.address,
        },
        {
          preset: (props.currentFocusPointOfRoute === index) ? 'islands#greenIcon' : 'islands#blueIcon',
          zIndex: 750,
          pane: 'balloon',
        }
      );

      /**
       * @property {{geometry: {getCoordinates: function}}} thisPlacemark - возвращает координаты геообъекта,
       * при перемещении его на новое место мышью.
       */
      geoPlacemark.events.add('dragend', (e) => {
        const thisPlacemark = e.get('target');
        const newCoordinates = thisPlacemark.geometry.getCoordinates();

        props.changePointOfRoute(index, newCoordinates);
      });

      geoCollection.add(geoPlacemark);
    });

    // Создание пешего маршрута
    if (theRoute.length > 1) {
      const multiRoute = new theMap.ymaps.multiRouter.MultiRoute(
        {
          referencePoints: theRoute.map(item => item.address),
          params: {
            routingMode: 'pedestrian',
          },
        },
        {
          boundsAutoApply: false,
          wayPointVisible: false,
          routeDraggable: false,
        }
      );

      geoCollection.add(multiRoute);
    }

    theMap.map.geoObjects.add(geoCollection);

    // Изменение масштаба карты.
    const GeoBounds = geoCollection.getBounds();

    GeoBounds[0][0] -= 0.001;
    GeoBounds[0][1] -= 0.001;
    GeoBounds[1][0] += 0.001;
    GeoBounds[1][1] += 0.001;

    theMap.map.setBounds(GeoBounds);
  }

  return false;
}

// Отрисовывает маршрут пользователя на карте.
class Map extends React.PureComponent {
  constructor(props) {
    super(props);

    this.changePointOfRoute = this.changePointOfRoute.bind(this);
    this.waitLoadingMap = this.waitLoadingMap.bind(this);
    this.init = this.init.bind(this);

    this.nameOfGlMap = 'glMap';

    this.state = {
      theMap: null,
    };
  }

  /**
   * Изменение координат и адреса для точки маршрута, которая была перемещена на карте.
   * @param {number} index - номер позиции которую занимает перемещенная точка маршрута в маршруте пользователя.
   * @param {Array} newCoordinates - новые координаты перемещенной точки маршрута.
   */
  changePointOfRoute(index, newCoordinates) {
    const { theMap } = this.state;
    const { rearrangeRoute } = this.props;
    const theRoute = this.props.theRoute.slice();
    let newAddress = '';

    theMap.ymaps.geocode(newCoordinates).then((result) => {
      const firstGeoObject = result.geoObjects.get(0);

      newAddress = `${firstGeoObject.getCountry()}, ${firstGeoObject.getAddressLine()}`;

      theRoute[index].address = newAddress;
      theRoute[index].pos = newCoordinates
        .reverse()
        .toString()
        .replace(',', ' ');

      rearrangeRoute(theRoute);
    });
  }

  componentDidMount() {
    this.createLoadScript();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { defaultCityCoords } = this.props;

    if (prevProps.defaultCityCoords !== defaultCityCoords) {
      this.state.theMap.map.setCenter(defaultCityCoords, 10, {
        checkZoomRange: true,
      });
    }
  }

  // Создание script тегов для загрузки API Яндекс карт.
  createLoadScript() {
    if (window[this.nameOfGlMap] === undefined) {
      const loadScript = document.createElement('script');

      loadScript.src = 'https://api-maps.yandex.ru/2.1/?apikey=a71880e2-e5ff-4b9d-aea3-191eef5b54da&lang=ru_RU';
      loadScript.type = 'text/javascript';

      window[this.nameOfGlMap] = true;

      document.head.appendChild(loadScript);

      this.waitLoadingMap();
    }
  }

  // Инициализирует Яндекс карты.
  init() {
    function createMap(posX, posY) {
      const theMap = {
        ymaps: null,
        map: null,
        collection: null,
      };

      theMap.ymaps = window.ymaps;
      theMap.map = new theMap.ymaps.Map('map', {
        center: [posX, posY],
        zoom: 10,
      });

      this.setState({
        theMap,
      });
    }

    const createsMap = createMap.bind(this);

    // window.ymaps.geolocation.get()
    //   .then(result => {
    //     const [posX, posY] = result.geoObjects.position;
    //
    //     createsMap(posX, posY);
    //   })
    //   .catch(e => {
    //     console.log(e);
        createsMap(
          ...this.props.defaultCityCoords
        );
      // });
  }

  // Ожидание окончания загрузки API Яндекс карт.
  waitLoadingMap() {
    if (window.ymaps === undefined) {
      setTimeout(this.waitLoadingMap, 100);
    } else {
      if (window.ymaps.geolocation === undefined) {
        setTimeout(this.waitLoadingMap, 100);
      } else {
        window.ymaps.ready(this.init);
      }
    }
  }

  render() {
    return (
      <div className="map-container">
        <div className="rubber" />
        <div id="map" />
        <Route
          theRoute={this.props.theRoute}
          theMap={this.state.theMap}
          changePointOfRoute={this.changePointOfRoute}
          currentFocusPointOfRoute={this.props.currentFocusPointOfRoute}
        />
      </div>
    );
  }
}

Map.propTypes = {
  rearrangeRoute: PropTypes.func.isRequired,
  theRoute: PropTypes.array,
  defaultCityCoords: PropTypes.array,
  currentFocusPointOfRoute: PropTypes.number,
};

Map.defaultProps = {
  theRoute: [],
  defaultCityCoords: [],
  currentFocusPointOfRoute: null,
};

Route.propTypes = {
  changePointOfRoute: PropTypes.func.isRequired,
  theMap: PropTypes.object,
  theRoute: PropTypes.array,
  currentFocusPointOfRoute: PropTypes.number,
};

Route.defaultProps = {
  theMap: null,
  theRoute: [],
  currentFocusPointOfRoute: null,
};

export { Map, Route };
