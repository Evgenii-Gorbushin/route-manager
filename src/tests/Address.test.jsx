import React from 'react';
import { Address, ErrorMessage, SearchHint } from '../Address';
import { mount, shallow } from 'enzyme';
import { theRoute, names, sleep } from './init';

const { address: n } = names;

describe('test the ErrorMessage component', () => {
  const refAddressBar = {
    current: {
      offsetTop: 10,
      offsetLeft: 10,
      offsetHeight: 30,
      offsetWidth: 100,
    },
  };
  const errorMessage = shallow(
    <ErrorMessage
      errorMessageText=""
      refAddressBar={refAddressBar}
    />
  );
  const cleanUp = () =>
    errorMessage.setProps({
      errorMessageText: '',
    });

  it('is an empty render', () => {
    expect(errorMessage.isEmptyRender()).toBe(true);
  });

  it('renders the error message', () => {
    errorMessage.setProps({
      errorMessageText: 'some error',
    });

    expect(errorMessage.text())
      .toBe('some error');

    cleanUp();
  });

  afterAll(() => errorMessage.unmount());
});

describe('test the SearchHint component', () => {
  const mock = {
    onMouseEnterHandler: jest.fn(),
    onClick: jest.fn(),
  };
  const searchHintList = [{
    pos: '123',
    name: 'Москва',
    parent: 'Россия',
    onClick: mock.onClick,
  }];
  const element = document.createElement('input');
  const searchHint = shallow(
    <SearchHint
      searchHintList={[]}
      searchHintCurrentElement={0}
      currentInputElement={element}
      onMouseEnterHandler={mock.onMouseEnterHandler}
    />
  );
  const cleanUp = () =>
    searchHint.setProps({
      searchHintList: [],
    });
  const getLi = () => searchHint.find('li');
  const getDiv = () => searchHint.find('div[role="presentation"]');

  it('is an empty render', () => {
    expect(searchHint.isEmptyRender())
      .toBe(true);
  });

  it('the SearchHint has been successfully rendered with some data', () => {
    searchHint.setProps({
      searchHintList: searchHintList.slice(),
    });

    const li = getLi();
    const div = getDiv();

    expect(li.exists())
      .toBe(true);
    expect(div.exists())
      .toBe(true);

    cleanUp();
  });

  it('simulates the events', () => {
    searchHint.setProps({
      searchHintList: searchHintList.slice(),
    });

    const li = getLi();
    const div = getDiv();

    li.simulate('mouseenter');
    expect(mock.onMouseEnterHandler)
      .toHaveBeenCalledTimes(1);

    div.simulate('click');
    expect(mock.onClick)
      .toHaveBeenCalledTimes(1);

    jest.clearAllMocks();
    cleanUp();
  });

  afterAll(() => searchHint.unmount());
});

describe('test the Address component', () => {
  const mockAddPointToRoute = jest.fn()
    .mockReturnValue(false);
  const events = () => ({
    keyCode: 0,
    target: {
      id: n.id.idAddressBar,
      value: '',
      tagName: 'LI',
    },
  });
  const emptyCurrentAddress = {
    pos: '',
    name: '',
    address: '',
  };
  const emptyDefaultCity = {
    pos: '',
    address: '',
  };
  const templates = {
    currentAddress: {
      pos: theRoute[0].pos,
      name: theRoute[0].address,
      address: theRoute[0].address,
    },
    currentCity: {
      pos: theRoute[0].pos,
      address: theRoute[0].address,
    },
  };
  const address = mount(
    <Address
      addPointToRoute={mockAddPointToRoute}
    />
  );
  const divAddress = address.find(`.${n.className.divAddress}`);
  const textCityBar = address.find(`input#${n.id.idCityBar}`);
  const buttonCityBar = address.find(`input.${n.className.buttonClear}`);
  const textAddressBar = address.find(`input#${n.id.idAddressBar}`);
  const buttonAddressBar = address.find(`input.${n.className.buttonAdd}`);

  it('all elements have been rendered', () => {
    expect(divAddress.exists())
      .toBe(true);
    expect(textCityBar.exists())
      .toBe(true);
    expect(buttonCityBar.exists())
      .toBe(true);
    expect(textAddressBar.exists())
      .toBe(true);
    expect(buttonAddressBar.exists())
      .toBe(true);
  });

  it('shows a warning message if you press the "+" button before you chose some variant from the search hint list', () => {
    const event = events();

    // При старте приложения окно с предупреждение скрыто.
    expect(address.find(ErrorMessage).isEmptyRender())
      .toBe(true);

    // Если при пустом поле для ввода адреса нажали на кнопку "+", то появляется сообщение с предупреждением №1.
    buttonAddressBar.simulate('click');
    expect(address.find(`.${n.className.divError}`).text())
      .toBe(n.errorMessages.whenEmpty);

    // При нажатии любой кнопки в поле для ввода адреса, сообщение с предупреждением уходит.
    textAddressBar.simulate('keyup', event);
    expect(address.find(ErrorMessage).isEmptyRender())
      .toBe(true);

    // Если в поле для ввода адреса есть какой-нибудь контент, при этом из поисковой подсказки ничего не выбрали,
    // а затем нажали на кнопку "+", то появляется сообщение с предупреждением №2.
    textAddressBar.instance().value = 'some text';
    buttonAddressBar.simulate('click');
    expect(address.find(`.${n.className.divError}`).text())
      .toBe(n.errorMessages.whenSomething);

    // clean up
    textAddressBar.instance().value = '';
    address.setState({
      errorMessageText: '',
    });
  });

  it('shows a warning message after you press the "+" button if the address already exists in the route', () => {
    expect(address.find(ErrorMessage).isEmptyRender())
      .toBe(true);

    textAddressBar.instance().value = templates.currentAddress.address;
    address.setState({
      currentAddress: Object.assign({}, templates.currentAddress),
    });

    mockAddPointToRoute.mockReturnValueOnce(n.errorMessages.whenAddressAlreadyExists);

    buttonAddressBar.simulate('click');
    expect(address.find(`.${n.className.divError}`).text())
      .toBe(n.errorMessages.whenAddressAlreadyExists);

    // clear up
    textAddressBar.instance().value = '';
    address.setState({
      currentAddress: Object.assign({}, emptyCurrentAddress),
    });
  });

  it('test the search hint, part 1: makes the real query on the server,' +
    'selects and clicks on the first item of the search hint', async () => {
    const event = events();

    // При старте приложения окно с поисковой подсказкой скрыто.
    expect(address.find(SearchHint).isEmptyRender())
      .toBe(true);

    // Ввод адреса (осуществление запроса на сервер).
    event.target.value = theRoute[0].address;
    textAddressBar.instance().value = event.target.value;
    textAddressBar.simulate('keyup', event);

    await sleep(4999);
    address.update();

    // Поисковая подсказка появилась на экране.
    expect(address.find(`.${n.className.searchHint}`).exists())
      .toBe(true);

    // Ни одна из строк поисковой подсказки не выделена.
    expect(address.state('searchHintCurrentElement'))
      .toBe(-1);

    const li = address.find('li[value=0]');
    const div = address.find('li>div');

    // Поисковая подсказка содержит контент.
    expect(li.exists())
      .toBe(true);
    expect(div.exists())
      .toBe(true);

    // Мышь наведена на первую строку поисковой подсказки.
    event.target.value = 0;
    li.simulate('mouseenter', event);
    expect(address.state('searchHintCurrentElement'))
      .toBe(0);

    // В состоянии нет данных о выбранном из поисковой подсказки адресе.
    expect(address.state('currentAddress'))
      .toEqual(emptyCurrentAddress);

    div.simulate('click', event);

    // В состоянии есть данные о выбранном из поисковой подсказки адресе.
    expect(address.state('currentAddress').address)
      .not.toBe('');

    // clean up
    address.setState({
      currentAddress: Object.assign({}, emptyCurrentAddress),
      searchHintList: [],
    });
  });

  it('test the search hint, part 2: simulates the events', async () => {
    const event = events();
    const searchHintList = [{
      pos: theRoute[0].pos,
      name: theRoute[0].address,
      parent: 'Россия',
      onClick: jest.fn(),
    }];

    // Установим в состояние данные для поисковой подсказки.
    address.setState({
      searchHintList: searchHintList.slice(),
    });

    // Ни одна из строк поисковой подсказки не выделена.
    expect(address.state('searchHintCurrentElement'))
      .toBe(-1);

    // Навигация по строкам поисковой подсказки с помощью стрелок на клавиатуре (вниз).
    event.keyCode = 40;
    textAddressBar.simulate('keyup', event);

    // Выделена первая строка поисковой подсказки.
    expect(address.state('searchHintCurrentElement'))
      .toBe(0);

    // Навигация по строкам поисковой подсказки с помощью стрелок на клавиатуре (вверх).
    event.keyCode = 38;
    textAddressBar.simulate('keyup', event);

    // Ни одна из строк поисковой подсказки не выделена.
    expect(address.state('searchHintCurrentElement'))
      .toBe(-1);

    // esc.
    event.keyCode = 27;
    textAddressBar.simulate('keyup', event);

    // При нажатии клавиши esc, поисковая подсказка уходит с экрана.
    expect(address.find(SearchHint).isEmptyRender())
      .toBe(true);

    // esc again.
    event.target.value = 'some address';
    textAddressBar.simulate('keyup', event);

    /**
     * Только если в состоянии НЕТ данных об уже ранее выбранном из поисковой подсказки адресе:
     * при повторном нажатии клавиши esc, введенный ранее адрес удаляется.
     */
    expect(event.target.value)
      .toBe('');

    /**
     * esc again.
     * Установим в состояние данные о ранее выбранном из поисковой подсказки адресе.
     */
    address.setState({
      currentAddress: Object.assign({}, templates.currentAddress),
    });
    event.target.value = 'some address';
    textAddressBar.simulate('keyup', event);

    /**
     * Только если в состоянии ЕСТЬ данные об уже ранее выбранном из поисковой подсказки адресе:
     * при повторном нажатии клавиши esc, введенный ранее адрес подменяется адресом из состояния.
     */
    expect(event.target.value)
      .not.toBe('some address');

    // Установим в состоянии данные для поисковой подсказки.
    address.setState({
      searchHintList: searchHintList.slice(),
    });

    // Поисковая подсказка появилась на экране.
    expect(address.find(SearchHint).isEmptyRender())
      .toBe(false);

    divAddress.simulate('click', event);

    // При клике на div контейнере компоненты Address, поисковая подсказка уходит с экрана.
    expect(address.find(SearchHint).isEmptyRender())
      .toBe(true);

    // На всякий случай дождемся завершения работы всех вызовов fetch.
    await sleep(4999);

    // clean up
    address.setState({
      currentAddress: Object.assign({}, emptyCurrentAddress),
      searchHintList: [],
    });
  });

  it('if you clean the inputs value, the data from the state will be cleaned as well', () => {
    const event = events();

    address.setState({
      currentAddress: Object.assign({}, templates.currentAddress),
      defaultCity: Object.assign({}, templates.currentCity),
    });
    textCityBar.instance().value = templates.currentCity.address;

    expect(textCityBar.instance().value)
      .not.toBe('');
    expect(address.state('currentAddress').address)
      .not.toBe('');
    expect(address.state('defaultCity').address)
      .not.toBe('');

    event.keyCode = 8;
    textAddressBar.simulate('keyup', event);

    event.keyCode = 46;
    event.target.id = n.id.idCityBar;
    textCityBar.simulate('keyup', event);

    // clean up
    expect(textCityBar.instance().value)
      .toBe('');
    expect(address.state('currentAddress'))
      .toEqual(emptyCurrentAddress);
    expect(address.state('defaultCity'))
      .toEqual(emptyDefaultCity);
  });

  it('test the button "X"', () => {
    address.setState({
      defaultCity: Object.assign({}, templates.currentCity),
    });
    textCityBar.instance().value = templates.currentCity.address;

    expect(textCityBar.instance().value)
      .not.toBe('');
    expect(address.state('defaultCity').address)
      .not.toBe('');

    buttonCityBar.simulate('click');

    // clean up
    expect(textCityBar.instance().value)
      .toBe('');
    expect(address.state('defaultCity'))
      .toEqual(emptyDefaultCity);
  });

  it('test the button "+" (a successful click)', () => {
    address.setState({
      currentAddress: Object.assign({}, templates.currentAddress),
    });
    textAddressBar.instance().value = templates.currentAddress.address;

    expect(textAddressBar.instance().value)
      .not.toBe('');
    expect(address.state('currentAddress').address)
      .not.toBe('');

    buttonAddressBar.simulate('click');

    // clean up
    expect(textAddressBar.instance().value)
      .toBe('');
    expect(address.state('currentAddress'))
      .toEqual(emptyCurrentAddress);
    expect(mockAddPointToRoute)
      .toHaveBeenCalledWith(templates.currentAddress);
  });

  afterAll(() => address.unmount());
});
