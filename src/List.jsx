import React from 'react';
import * as PropTypes from 'prop-types';
import './css/List.css';

/**
 * Выводит адрес точки маршрута и кнопку для её удаления.
 * @param {Object} props
 * @param {string} props.index - индекс точки маршрута.
 * @param {string} props.address - адрес точки маршрута.
 * @param {string} props.nameOfClass - имя CSS класса.
 * @param {string} props.nameOfClassForButton - имя CSS класса.
 * @param {function} props.deletePointOfRoute - удаляет точку маршрута.
 * @param {function} props.setCurrentFocus - сохраняет в состоянии индекс точки маршрута получившей фокус.
 * @param {function} props.onDropHandler - обработчик события onDrop.
 * @returns {ReactElement}
 * @constructor
 */
function ListItem(props) {
  function onClickHandler() {
    props.deletePointOfRoute(props.address);
  }

  function onDragOverHandler(event) {
    event.preventDefault();
  }

  function onDragStartHandler(event) {
    event.dataTransfer.setData(
      props.nameOfClassForListItem,
      event.target.name
    );
  }

  function onDragEnterHandler(event) {
    event.target.style.borderColor = 'green';
  }

  function onDragLeaveHandler(event) {
    event.target.style.borderColor = 'lightblue';
  }

  return (
    <div
      className={props.nameOfClassForListItem}
    >
      <input
        type="button"
        value={`${props.index + 1}. ${props.address}`}
        name={props.index}
        tabIndex={0}
        className={`list-item-button ${props.nameOfClassForButton}`}
        draggable={true}
        onDragOver={onDragOverHandler}
        onDragStart={onDragStartHandler}
        onDragEnter={onDragEnterHandler}
        onDragLeave={onDragLeaveHandler}
        onDrop={props.onDropHandler}
        onFocus={props.setCurrentFocus}
        onBlur={props.setCurrentFocus}
      />
      <input
        type="button"
        value="X"
        tabIndex={0}
        className="list-item-button list-item-button-right"
        onClick={onClickHandler}
      />
    </div>
  );
}

/**
 * Выводит список из адресов точек маршрута.
 * Реализует интерактивное взаимодействие пользователя с этим списком (удаление, перемещение).
 */
class List extends React.PureComponent {
  constructor(props) {
    super(props);

    this.onDropHandler = this.onDropHandler.bind(this);

    // Имена CSS классов.
    this.nameOfClassForList = 'list';
    this.nameOfClassForListItem = 'list-item';
    this.nameOfClassForButton = 'list-item-button-left';
  }

  /**
   * Меняет местами перетаскиваемую точку маршрута, с точкой маршрута на место которой она была брошена.
   * @param {Object} event - событие onDrop.
   */
  onDropHandler(event) {
    const dragPointIndex = event.dataTransfer.getData(this.nameOfClassForListItem);
    const dropPointIndex = event.target.name;

    event.target.style.borderColor = 'lightblue';

    if (dragPointIndex !== dropPointIndex) {
      const theRoute = this.props.theRoute.slice();
      const dragPoint = theRoute[dragPointIndex];

      theRoute[dragPointIndex] = theRoute[dropPointIndex];
      theRoute[dropPointIndex] = dragPoint;

      this.props.rearrangeRoute(theRoute);
    }
  }

  render() {
    const theRoute = this.props.theRoute.slice();
    const { nameOfClassForListItem, nameOfClassForButton } = this;

    return (
      <div
        className={this.nameOfClassForList}
      >
        <span className="span-title">
          Список точек вашего маршрута:
        </span>

        {
          (theRoute.length) ? (
            theRoute.map((item, index) => (
              <ListItem
                key={item.pos + index}
                index={index}
                address={item.address}
                nameOfClassForListItem={nameOfClassForListItem}
                nameOfClassForButton={nameOfClassForButton}
                onDropHandler={this.onDropHandler}
                setCurrentFocus={this.props.setCurrentFocus}
                deletePointOfRoute={this.props.deletePointOfRoute}
              />
            ))
          ) : (
            <span className="span-empty">
              маршрут не содержит ни одной адресной точки
            </span>
          )
        }
      </div>
    );
  }
}

List.propTypes = {
  deletePointOfRoute: PropTypes.func.isRequired,
  setCurrentFocus: PropTypes.func.isRequired,
  rearrangeRoute: PropTypes.func.isRequired,
  theRoute: PropTypes.array,
};

List.defaultProps = {
  theRoute: [],
};

ListItem.propTypes = {
  index: PropTypes.number.isRequired,
  address: PropTypes.string.isRequired,
  onDropHandler: PropTypes.func.isRequired,
  deletePointOfRoute: PropTypes.func.isRequired,
  setCurrentFocus: PropTypes.func.isRequired,
  nameOfClassForButton: PropTypes.string.isRequired,
  nameOfClassForListItem: PropTypes.string.isRequired,
};

export { List, ListItem };
