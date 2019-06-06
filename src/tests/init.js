import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

configure({ adapter: new Adapter() });

const theRoute = [
  { pos: '20.549798 54.723372', address: 'Россия, Калининград, Чувашская улица, 2' },
  { pos: '20.550265 54.72398', address: 'Россия, Калининград, Чувашская улица, 3' },
];
const names = {
  map: {
    nameOfGlMap: 'glMap',
    className: {
      container: 'map-container',
      rubber: 'rubber',
      map: 'map',
    },
    returns: {
      defaultCoords: [55.76, 37.64],
    },
  },
  list: {
    className: {
      nameOfClassForList: 'list',
      nameOfClassForListItem: 'list-item',
      nameOfClassForButtonL: 'list-item-button-left',
      nameOfClassForButtonR: 'list-item-button-right',
      spanTitle: 'span-title',
      spanEmpty: 'span-empty',
    },
    colors: {
      focus: 'green',
      blur: 'lightblue',
    },
  },
  address: {
    id: {
      idCityBar: 'cityBar',
      idAddressBar: 'addressBar',
    },
    className: {
      buttonAdd: 'address-button-add',
      buttonClear: 'address-button-clear',
      divError: 'div-error',
      searchHint: 'search-hint',
      divAddress: 'address',
    },
    errorMessages: {
      whenEmpty: 'пожалуйста, введите адрес',
      whenSomething: 'пожалуйста, выберите нужный вам адрес из подсказки',
      whenAddressAlreadyExists: 'уже содержится в вашем маршруте',
    },
  },
  app: {
    className: {
      app: 'app',
      leftColumn: 'left-column',
    },
  },
};
const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));
const child = 'hello world';

export { theRoute, names, sleep, child };
