import React from 'react';
import { Address } from './Address';
import { List } from './List';
import { Map } from './Map';
import './css/App.css';

/**
 * Хранит данные о точках маршрута (геообъектах) в состоянии, реализует операции добавления/удаления точек маршрута.
 * 1. Сохраняет в состоянии данные о точках маршрута получаемых от компоненты Address.
 * 2. Передает данные о точках маршрута компоненте List для вывода списка точек маршрута на экран.
 * 3. Передает данные о точках маршрута компоненте Map для отрисовки маршрута на карте.
 */
class App extends React.Component {
  constructor(props) {
    super(props);

    this.addPointToRoute = this.addPointToRoute.bind(this);
    this.deletePointOfRoute = this.deletePointOfRoute.bind(this);
    this.rearrangeRoute = this.rearrangeRoute.bind(this);
    this.setCurrentFocus = this.setCurrentFocus.bind(this);
    this.setDefaultCityCoords = this.setDefaultCityCoords.bind(this);

    this.state = {
      // Массив с данными о точках маршрута (геообъектах).
      theRoute: [],

      // Индекс текущей точки маршрута в фокусе.
      currentFocusPointOfRoute: null,

      // Координаты города выбранного городом по умолчанию, начальное значение Москва.
      defaultCityCoords: [55.76, 37.64],
    };
  }

  /**
   * 1. Компонента Address передает данные о новой точке маршрута (геообъекте).
   * 2. Эти данные сохраняются в состоянии.
   * @param {Object} geoObject - данные геообъекта.
   * @param {string} geoObject.pos - строковое представление координат геообъекта.
   * @param {string} geoObject.address - адрес новой точки маршрута (геообъекта).
   * @returns {string|boolean} возвращает сообщение об ошибке в случае, если геообъект уже находится в составе маршрута.
   */
  addPointToRoute(geoObject) {
    const theRoute = this.state.theRoute.slice();
    const isUnique = theRoute.every(item => (item.address !== geoObject.address));

    if (isUnique) {
      theRoute.push({
        pos: geoObject.pos,
        address: geoObject.address,
      });

      this.setState({
        theRoute,
      });
    } else {
      return `"${geoObject.address}" уже содержится в вашем маршруте.`;
    }

    return false;
  }

  /**
   * Удаляет точку маршрута.
   * @param {string} address - адрес точки маршрута.
   */
  deletePointOfRoute(address) {
    const newRoute = this.state.theRoute.filter((item) => (
      !(item.address === address)
    ));

    this.setState({
      theRoute: newRoute,
    });
  }

  /**
   * Сохранение в состоянии измененного маршрута.
   * @param {Array} newRoute - измененный маршрут.
   */
  rearrangeRoute(newRoute) {
    this.setState({
      theRoute: newRoute,
    });
  }

  /**
   * Сохраняет в состоянии индекс точки маршрута получившей фокус.
   * @param {Object} event - события onFocus/onBlur.
   */
  setCurrentFocus(event) {
    const currentFocusPointOfRoute = (event.type === 'blur') ? null : Number.parseInt(event.target.name, 10);

    this.setState({
      currentFocusPointOfRoute,
    });
  }

  /**
   * Устанавливает координаты для города выбранного в качестве города по умолчанию.
   * @param {Array} coords - координаты города.
   */
  setDefaultCityCoords(coords) {
    this.setState({
      defaultCityCoords: coords,
    });
  }

  render() {
    return (
      <div className="app">
        <div className="left-column">
          <Address
            addPointToRoute={this.addPointToRoute}
            setDefaultCityCoords={this.setDefaultCityCoords}
          />
          <List
            theRoute={this.state.theRoute}
            deletePointOfRoute={this.deletePointOfRoute}
            rearrangeRoute={this.rearrangeRoute}
            setCurrentFocus={this.setCurrentFocus}
          />
        </div>
        <Map
          theRoute={this.state.theRoute}
          rearrangeRoute={this.rearrangeRoute}
          currentFocusPointOfRoute={this.state.currentFocusPointOfRoute}
          defaultCityCoords={this.state.defaultCityCoords}
        />
      </div>
    );
  }
}

export default App;
