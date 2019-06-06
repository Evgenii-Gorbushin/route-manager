import React from 'react';
import * as PropTypes from 'prop-types';
import './css/Address.css';

/**
 * Вывод на экран сообщение с ошибкой.
 * @param {Object} props
 * @param {string} props.errorMessageText - текст с ошибкой.
 * @param {Object} props.refElement - ref на HTMLInputElement.
 * @returns {ReactElement|null}
 * @constructor
 */
function ErrorMessage(props) {
  const messageText = props.errorMessageText;

  if (messageText !== '') {
    const nodeAddressBar = props.refElement.current;
    const errorMessageTop = `${nodeAddressBar.offsetTop + nodeAddressBar.offsetHeight + 5}px`;
    const errorMessageLeft = `${nodeAddressBar.offsetLeft + (nodeAddressBar.offsetWidth % 4)}px`;
    const styles = {
      top: errorMessageTop,
      left: errorMessageLeft,
      zIndex: 2,
    };

    return (
      <div className="div-error" style={styles} role="alert">
        {messageText}
      </div>
    );
  }

  return null;
}

/**
 * Выводит на экран всплывающую поисковую подсказку со списком геообъектов.
 * @param {Object} props
 * @param {HTMLInputElement} props.currentInputElement - ссылка на HTMLInputElement с которым в настоящий момент
 * взаимодействует пользователь.
 * @param {Array} props.searchHintList - массив c данными о геообъектах.
 * @param {number} props.searchHintCurrentElement - номер активного элемента всплывающей поисковой подсказки.
 * @param {function} props.onMouseEnterHandler - сохраняет в состоянии порядковый номер тега li на котором сработало
 * событие onMouseEnter.
 * @returns {ReactElement|null}
 * @constructor
 */
function SearchHint(props) {
  const currentInput = props.currentInputElement;
  const listVarieties = props.searchHintList;

  if (
    listVarieties.length > 0
    &&
    currentInput !== null
  ) {
    const addressList = listVarieties.map((row, index) => {
      let liClassName = '';

      if (props.searchHintCurrentElement === index) {
        liClassName = 'search-hint-li-hover';
      }

      return (
        <li
          key={row.pos + index}
          value={index}
          className={liClassName}
          onMouseEnter={props.onMouseEnterHandler}
        >
          <div
            role="presentation"
            onClick={row.onClick}
          >
            {row.name}
          </div>
          <span
            role="presentation"
            onClick={row.onClick}
          >
            {row.parent !== '' && `(${row.parent})`}
          </span>
        </li>
      );
    });

    const searchHintTop = `${currentInput.offsetTop + currentInput.offsetHeight - 5}px`;
    const searchHintLeft = `${currentInput.offsetLeft}px`;
    const styles = {
      top: searchHintTop,
      left: searchHintLeft,
      zIndex: 1,
    };

    return (
      <div id="searchHintContainer" className="search-hint" style={styles}>
        <ul>
          {addressList}
        </ul>
      </div>
    );
  }

  return null;
}

/**
 * Выводит текстовое поле и кнопку под единым label контейнером.
 * @param {Object} props
 * @param {string} props.id
 * @param {string} props.placeholder
 * @param {string} props.actionForButton
 * @param {number} props.maxLength
 * @param {function} props.onKeyUp
 * @param {function} props.onClick
 * @param {Object} props.theRef
 * @returns {ReactElement}
 * @constructor
 */
function Label(props) {
  let value = '';
  let className = '';
  let title = '';

  switch (props.actionForButton) {
    case 'add':
      value = '+';
      className = 'address-button-add';
      title = 'Адрес:';
      break;
    case 'clear':
      value = 'X';
      className = 'address-button-clear';
      title = 'Город:';
      break;
    default:
  }

  return (
    <label htmlFor={props.id}>
      <span>
        {title}
      </span>
      <input
        type="text"
        maxLength={props.maxLength}
        id={props.id}
        className="address-input-text"
        placeholder={props.placeholder}
        onKeyUp={props.onKeyUp}
        ref={props.theRef}
        tabIndex={0}
      />
      <input
        type="button"
        value={value}
        onClick={props.onClick}
        className={className}
        tabIndex={0}
      />
    </label>
  );
}

/**
 * Выполняет взаимодействие с сервисом https://geocode-maps.yandex.ru:
 * 1. Осуществляет запросы к сервису на основании вводимой пользователем информации.
 * 2. Обрабатывает и выводит полученную информацию в виде поисковой всплывающей подсказки.
 * 3. Передает данные о выбранном пользователем геообъекте (новой точки маршрута) в компоненту App.
 */
class Address extends React.PureComponent {
  constructor(props) {
    super(props);

    this.resetDefaultCity = this.resetDefaultCity.bind(this);
    this.executeAddPointToRoute = this.executeAddPointToRoute.bind(this);
    this.onKeyUpHandler = this.onKeyUpHandler.bind(this);
    this.onMouseEnterHandler = this.onMouseEnterHandler.bind(this);
    this.removeSearchHintContainer = this.removeSearchHintContainer.bind(this);
    this.updateSearchHintContainer = this.updateSearchHintContainer.bind(this);

    this.refCityBar = React.createRef();
    this.refAddressBar = React.createRef();

    this.names = {
      idCityBar: 'cityBar',
      idAddressBar: 'addressBar',
    };

    this.state = {
      // Содержит данные о геообъекте, который был выбран пользователем из всплывающей поисковой подсказки.
      currentAddress: Address.getEmptyCurrentAddress(),

      /**
       * Поле для ввода города используется для облегчения дальнейшего ввода адреса,
       * пользователь может начинать ввод адреса сразу с улицы.
       */
      defaultCity: Address.getEmptyDefaultCity(),

      // Пользователь взаимодействует с полем город.
      nowWorkWithCityBar: false,

      // Содержит текст сообщения ошибки и ссылку на элемент, для которого необходимо вывести сообщение.
      errorMessage: {
        errorMessageText: '',
        element: null,
      },

      // Контент всплывающей поисковой подсказки.
      searchHintList: [],

      // Номер активного элемента всплывающей поисковой подсказки.
      searchHintCurrentElement: -1,
    };
  }

  /**
   * Возвращает объект с базовыми параметрами.
   * @returns {Object}
   */
  static getEmptyCurrentAddress() {
    return {
      pos: '',
      name: '',
      address: '',
    };
  }

  /**
   * Возвращает объект с базовыми параметрами.
   * @returns {Object}
   */
  static getEmptyDefaultCity() {
    return {
      pos: '',
      address: '',
    };
  }

  componentDidMount() {
    this.refCityBar.current.focus();
  }

  // Отправка данных о выбранном пользователем геообъекте в компоненту App.
  executeAddPointToRoute() {
    const addressBar = this.refAddressBar.current;
    const currentAddress = Object.assign({}, this.state.currentAddress);
    let errorMessageText = '';

    if (currentAddress.pos !== '') {

      if (addressBar.value !== currentAddress.address) {
        addressBar.value = currentAddress.address;
      }

      const hasError = this.props.addPointToRoute(
        currentAddress
      );

      if (hasError) {
        errorMessageText = hasError;
      } else {
        addressBar.value = '';
        this.resetCurrentAddress();
      }

    } else {

      if (addressBar.value === '') {
        errorMessageText = 'пожалуйста, введите адрес';
      } else {
        errorMessageText = 'пожалуйста, выберите нужный вам адрес из списка';
      }

    }

    if (errorMessageText !== '') {
      this.setState({
        errorMessage: {
          errorMessageText,
          element: this.refAddressBar,
        },
      });
    }
  }

  /**
   * Если поле город заполнено, то возвращает имя геообъекта, в противном случае полный адрес.
   * @returns {string}
   */
  getAppropriateAddress(someName = null, someAddress = null) {
    const defaultCityExists = (this.state.defaultCity.pos !== '');
    let name = someName;
    let address = someAddress;

    if (name === null) {
      const currentAddress = Object.assign({}, this.state.currentAddress);

      name = currentAddress.name;
      address = currentAddress.address;
    }

    return (defaultCityExists) ? name : address;
  }

  /**
   * Возвращает ссылку на HTMLInputElement с которым в настоящий момент взаимодействует пользователь.
   * @returns {HTMLInputElement}
   */
  getCurrentInputElement() {
    const { nowWorkWithCityBar } = this.state;

    return (nowWorkWithCityBar) ? this.refCityBar.current : this.refAddressBar.current;
  }

  /**
   * Выполняет запрос к сервису https://geocode-maps.yandex.ru на основании строки с адресом введенной пользователем.
   * @param {string} currentString - строка с адресом введенная пользователем.
   * @param {boolean} nowWorkWithCityBar - true если в настоящий момент пользователь взаимодействует с полем город.
   */
  makeQuery(currentString, nowWorkWithCityBar) {
    const defaultCity = Object.assign({}, this.state.defaultCity);
    const options = {
      method: 'GET',
      cache: 'no-cache',
    };

    /**
     * Построение текста запроса.
     * @returns {string}
     */
    const buildQuery = () => {
      let results = 10;
      let geocode = '&geocode=';
      let query = 'https://geocode-maps.yandex.ru/1.x/' +
        '?apikey=a71880e2-e5ff-4b9d-aea3-191eef5b54da' +
        '&format=json';

      if (nowWorkWithCityBar) {
        results = 20;
      } else if (defaultCity.address !== '') {
        geocode += encodeURIComponent(`${defaultCity.address}+`);
      }

      query += `&results=${results}`;
      query += geocode + encodeURIComponent(currentString);

      return query;
    };

    fetch(buildQuery(), options)
      .then(response => (response.status === 200) ? response.json() : false)
      .then(result => this.processResponse(result.response))
      .catch(error => console.log(error));
  }

  /**
   * Обработка действий осуществляемых пользователем в полях ввода HTMLInputElement.
   * @param {Object} event - событие onKeyUp.
   * @returns {boolean} false в случае отсутствия необходимости делать запрос.
   */
  onKeyUpHandler(event) {
    const { keyCode, target } = event;
    const { idCityBar, idAddressBar } = this.names;
    const idElement = target.id;
    const currentString = target.value;
    const nowWorkWithCityBar = (idElement === this.names.idCityBar);

    this.setState({
      errorMessage: {
        errorMessageText: '',
        element: null,
      },
      nowWorkWithCityBar,
    });

    if ([13, 27, 37, 38, 39, 40].indexOf(keyCode) + 1) {
      const searchHintList = this.state.searchHintList.slice();
      const listLength = searchHintList.length;
      let currentElement = this.state.searchHintCurrentElement;

      switch (keyCode) {
        case 13:
          if (currentElement >= 0) {
            searchHintList[currentElement].onClick();
          } else if (
            idElement === idAddressBar
            &&
            currentString !== ''
          ) {
            this.executeAddPointToRoute();
          } else if (
            idElement === idCityBar
            &&
            currentString !== ''
            &&
            currentElement === -1
          ) {
            this.setState({
              errorMessage: {
                errorMessageText: 'пожалуйста, выберите нужный вам город из списка',
                element: this.refCityBar,
              },
            });
          }

          return false;
        case 27:
          if (searchHintList.length === 0) {
            if (
              idElement === idCityBar
              &&
              currentString !== ''
            ) {
              event.target.value = this.state.defaultCity.address;
            } else if (
              idElement === idAddressBar
              &&
              currentString !== ''
            ) {
              event.target.value = this.getAppropriateAddress();
            }
          }

          this.removeSearchHintContainer();

          return false;
        case 37:
          return false;
        case 38:
          if (
            listLength > 0
            &&
            currentElement > -1
          ) {
            this.setState({
              searchHintCurrentElement: (currentElement -= 1),
            });
          }

          return false;
        case 39:
          return false;
        case 40:
          if (
            listLength > 0
            &&
            currentElement < (listLength - 1)
          ) {
            this.setState({
              searchHintCurrentElement: (currentElement += 1),
            });
          }

          return false;
        default:
      }
    }

    if (currentString !== '') {
      this.makeQuery(currentString, nowWorkWithCityBar);
    } else if ([8, 46].indexOf(keyCode) + 1) {

      if (idElement === idCityBar) {
        this.resetDefaultCity();
      } else if (idElement === idAddressBar) {
        this.resetCurrentAddress();
      }

    }
  }

  /**
   * Сохраняет в состоянии порядковый номер тега li на которым сработало событие onMouseEnter.
   * @param {Object} event - событие onMouseEnter.
   */
  onMouseEnterHandler(event) {
    const { target } = event;
    const currentElement = (target.tagName === 'LI') ? target.value : target.parentElement.value;

    this.setState({
      searchHintCurrentElement: currentElement,
    });
  }

  /**
   * Сохранение в состоянии данных о геообъекте, который был выбран пользователем из всплывающей поисковой подсказки.
   * @param {Object} objArguments - содержит данные о выбранном геообъекте.
   * @param {string} objArguments.pos - строковое представление координат геообъекта.
   * @param {string} objArguments.name - имя геообъекта.
   * @param {string} objArguments.address - полный адрес геообъекта.
   */
  processChoice(objArguments) {
    const { nowWorkWithCityBar } = this.state;
    const addressBar = this.refAddressBar.current;
    const coords = objArguments.pos;

    if (nowWorkWithCityBar) {
      const cityBar = this.refCityBar.current;
      const defaultCity = {
        pos: coords,
        address: objArguments.address,
      };
      const currentAddress = Address.getEmptyCurrentAddress();

      cityBar.value = objArguments.address;

      if (addressBar.value !== '') {
        addressBar.value = '';
      }

      this.setState({
        defaultCity,
        currentAddress,
      });

      this.props.setDefaultCityCoords(
        coords
          .split(' ')
          .reverse()
          .map(item => parseFloat(item))
      );

      cityBar.focus();
    } else {
      const currentAddress = {
        pos: coords,
        name: objArguments.name,
        address: objArguments.address,
      };

      this.setState({
        currentAddress,
      });

      addressBar.value = this.getAppropriateAddress(objArguments.name, objArguments.address);
      addressBar.focus();
    }

    this.removeSearchHintContainer();
  }

  /**
   * Создание и вывод на экран списка геообъектов на основании информации полученной от сервиса https://geocode-maps.yandex.ru.
   * @param {{GeoObjectCollection: {featureMember: Array}}} json - содержит ответ от сервиса.
   * @returns {boolean} false в случае если пользователь уже удалил введенную им ранее строку с адресом или
   * ответ от сервиса не содержит результатов.
   */
  processResponse(json) {
    const result = json.GeoObjectCollection.featureMember;
    const searchHintList = [];
    const currentInputElement = this.getCurrentInputElement();
    const { nowWorkWithCityBar } = this.state;

    if (
      currentInputElement.value === ''
      ||
      !result
    ) {
      return false;
    }

    if (result.length > 0) {
      /**
       * @param {{GeoObject: Object}} row - объект относится к Яндекс картам,
       * содержит в себе данные о геообъекте (точке на карте).
       * @property {{
       *   metaDataProperty: {
       *     GeocoderMetaData: Object,
       *   },
       *   Point: Object,
       *   description: string,
       *   name: string,
       * }} geoObject - объект относится к Яндекс картам.
       */
      result.forEach(row => {
        const geoObject = row.GeoObject;
        const geoMetaData = geoObject.metaDataProperty.GeocoderMetaData;
        const conditionForCityBar = (
          nowWorkWithCityBar
          &&
          (geoMetaData.kind === 'locality' || geoMetaData.kind === 'province')
        );

        if (
          !nowWorkWithCityBar
          ||
          conditionForCityBar
        ) {
          const objArguments = {
            pos: geoObject.Point.pos,
            name: geoObject.name,
            address: geoMetaData.text,
          };
          const newRow = Object.assign({}, objArguments);

          newRow.parent = (geoObject.description) ? geoObject.description : '';
          newRow.onClick = this.processChoice.bind(this, objArguments);

          searchHintList.push(newRow);
        }

        if (searchHintList.length > 10) {
          return false;
        }
      });
    }

    this.updateSearchHintContainer(searchHintList);
  }

  // Убирает с экрана всплывающую поисковую подсказку.
  removeSearchHintContainer() {
    const searchHintLength = this.state.searchHintList.length;

    if (searchHintLength > 0) {
      this.setState({
        searchHintList: [],
        searchHintCurrentElement: -1,
      });
    }
  }

  /**
   * Удаление из состояния информации об адресе {currentAddress},
   * который ранее был выбран пользователем из всплывающей поисковой подсказки.
   */
  resetCurrentAddress() {
    this.setState({
      currentAddress: Address.getEmptyCurrentAddress(),
    });

    this.removeSearchHintContainer();
  }

  // Удаление из состояния информации о городе.
  resetDefaultCity() {
    const refCityBar = this.refCityBar.current;

    this.setState({
      defaultCity: Address.getEmptyDefaultCity(),
    });

    if (refCityBar.value !== '') {
      refCityBar.value = '';
    }

    this.removeSearchHintContainer();
  }

  /**
   * Обновляет контент поисковой всплывающей подсказки
   * @param {Array} searchHintList - контент.
   */
  updateSearchHintContainer(searchHintList) {
    this.setState({
      searchHintList,
      searchHintCurrentElement: -1,
    });
  }

  render() {
    const { names } = this;

    return (
      <div
        role="presentation"
        className="address"
        onClick={this.removeSearchHintContainer}
      >
        <Label
          id={names.idCityBar}
          maxLength={60}
          placeholder="Можно оставить пустым"
          onKeyUp={this.onKeyUpHandler}
          onClick={this.resetDefaultCity}
          theRef={this.refCityBar}
          actionForButton="clear"
        />
        <Label
          id={names.idAddressBar}
          maxLength={150}
          placeholder="Введите адрес новой точки маршрута"
          onKeyUp={this.onKeyUpHandler}
          onClick={this.executeAddPointToRoute}
          theRef={this.refAddressBar}
          actionForButton="add"
        />
        <ErrorMessage
          errorMessageText={this.state.errorMessage.errorMessageText}
          refElement={this.state.errorMessage.element}
        />
        <SearchHint
          searchHintList={this.state.searchHintList}
          searchHintCurrentElement={this.state.searchHintCurrentElement}
          currentInputElement={this.getCurrentInputElement()}
          onMouseEnterHandler={this.onMouseEnterHandler}
        />
      </div>
    );
  }
}

Address.propTypes = {
  addPointToRoute: PropTypes.func.isRequired,
  setDefaultCityCoords: PropTypes.func.isRequired,
};

ErrorMessage.propTypes = {
  errorMessageText: PropTypes.string,
  refElement: PropTypes.object,
};

ErrorMessage.defaultProps = {
  errorMessageText: '',
  refElement: null,
};

SearchHint.propTypes = {
  onMouseEnterHandler: PropTypes.func.isRequired,
  searchHintList: PropTypes.array,
  searchHintCurrentElement: PropTypes.number,
  currentInputElement: PropTypes.instanceOf(HTMLInputElement),
};

SearchHint.defaultProps = {
  searchHintList: [],
  searchHintCurrentElement: -1,
  currentInputElement: null,
};

Label.propTypes = {
  id: PropTypes.string.isRequired,
  placeholder: PropTypes.string.isRequired,
  actionForButton: PropTypes.string.isRequired,
  maxLength: PropTypes.number.isRequired,
  onKeyUp: PropTypes.func.isRequired,
  onClick: PropTypes.func.isRequired,
  theRef: PropTypes.object.isRequired,
};

export { Address, ErrorMessage, SearchHint, Label };
