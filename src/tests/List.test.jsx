import React from 'react';
import { List, ListItem } from '../List';
import { mount, shallow } from 'enzyme';
import { theRoute, names } from './init';

const { list: n } = names;
const mock = {
  deletePointOfRoute: jest.fn(),
  setCurrentFocus: jest.fn(),
  rearrangeRoute: jest.fn(),
  preventDefault: jest.fn(),
  setData: jest.fn(),
  onDropHandler: jest.fn(),
};
const indexDefault = 0;
const events = () => ({
  dataTransfer: {
    getData: () => 1,
    setData: mock.setData,
  },
  preventDefault: mock.preventDefault,
  target: {
    name: indexDefault,
    style: {
      borderColor: '',
    },
  },
});
const templates = {
  buttonLeft: (address) => `input[value="${indexDefault + 1}. ${address}"]`,
  buttonRight: 'input[value="X"]',
};

describe('test the ListItem component', () => {
  const address = theRoute[indexDefault].address;
  const { nameOfClassForListItem, nameOfClassForButtonL, nameOfClassForButtonR } = n.className;
  const listItem = shallow(
    <ListItem
      setCurrentFocus={mock.setCurrentFocus}
      address={address}
      deletePointOfRoute={mock.deletePointOfRoute}
      nameOfClassForButton={nameOfClassForButtonL}
      nameOfClassForListItem={nameOfClassForListItem}
      onDropHandler={mock.onDropHandler}
      index={indexDefault}
    />
  );
  const buttonRight = listItem.find(templates.buttonRight);
  const buttonLeft = listItem.find(templates.buttonLeft(address));
  const event = events();

  it('component has been rendered', () => {
    expect(buttonRight)
      .toBeTruthy();
    expect(buttonLeft)
      .toBeTruthy();
    expect(listItem.find(`.${nameOfClassForListItem}`).exists())
      .toBe(true);
    expect(listItem.find(`.${nameOfClassForButtonL}`).exists())
      .toBe(true);
    expect(listItem.find(`.${nameOfClassForButtonR}`).exists())
      .toBe(true);
  });

  it('test the simulations of the ListItem', () => {
    buttonRight.simulate('click');
    expect(mock.deletePointOfRoute)
      .toHaveBeenCalledTimes(1);
    expect(mock.deletePointOfRoute)
      .toHaveBeenCalledWith(address);

    buttonLeft.simulate('dragover', event);
    expect(mock.preventDefault)
      .toHaveBeenCalledTimes(1);

    buttonLeft.simulate('dragstart', event);
    expect(mock.setData)
      .toHaveBeenCalledTimes(1);
    expect(mock.setData)
      .toHaveBeenCalledWith(nameOfClassForListItem, indexDefault);

    buttonLeft.simulate('dragenter', event);
    expect(event.target.style.borderColor)
      .toBe(n.colors.focus);

    buttonLeft.simulate('dragleave', event);
    expect(event.target.style.borderColor)
      .toBe(n.colors.blur);

    buttonLeft.simulate('focus');
    buttonLeft.simulate('blur');
    expect(mock.setCurrentFocus)
      .toHaveBeenCalledTimes(2);

    buttonLeft.simulate('drop', event);
    expect(mock.onDropHandler)
      .toHaveBeenCalledTimes(1);
  });

  afterAll(() => {
    listItem.unmount();
    jest.clearAllMocks();
  });
});

describe('test the List component', () => {
  const { nameOfClassForList, spanTitle, spanEmpty } = n.className;
  const list = mount(
    <List
      deletePointOfRoute={mock.deletePointOfRoute}
      setCurrentFocus={mock.setCurrentFocus}
      rearrangeRoute={mock.rearrangeRoute}
    />
  );
  const cleanUp = () =>
    list.setProps({
      theRoute: [],
    });

  it('component has been rendered with theRoute.length === 0', () => {
    expect(list.find(`.${nameOfClassForList}`).exists())
      .toBe(true);
    expect(list.find(`.${spanTitle}`).exists())
      .toBe(true);
    expect(list.find(`.${spanEmpty}`).exists())
      .toBe(true);
    expect(list.find(ListItem))
      .toHaveLength(0);
  });

  it('component has been rendered with theRoute.length > 0', () => {
    list.setProps({
      theRoute: theRoute.slice(),
    });

    expect(list.find(`.${nameOfClassForList}`).exists())
      .toBe(true);
    expect(list.find(`.${spanTitle}`).exists())
      .toBe(true);
    expect(list.find(ListItem))
      .toHaveLength(2);

    cleanUp();
  });

  it('test onDropHandler', () => {
    list.setProps({
      theRoute: theRoute.slice(),
    });

    const listItem = list.find(ListItem).at(indexDefault);
    const buttonLeft = listItem.find(templates.buttonLeft(theRoute[indexDefault].address));
    const newRoute = theRoute.slice().reverse();
    const event = events();

    expect(listItem.exists())
      .toBe(true);
    expect(buttonLeft.exists())
      .toBe(true);

    buttonLeft.simulate('drop', event);
    expect(event.target.style.borderColor)
      .toBe(n.colors.blur);
    expect(mock.rearrangeRoute)
      .toHaveBeenCalledTimes(1);
    expect(mock.rearrangeRoute)
      .toHaveBeenCalledWith(newRoute);

    jest.clearAllMocks();
    cleanUp();
  });

  afterAll(() => list.unmount());
});
