export default class SortableList {
  CLASSES = {
    list: 'sortable-list',
    listItem: 'sortable-list__item',
    dragged: 'sortable-list__item_dragging',
  };

  SELECTORS = {
    list: `.${this.CLASSES.list}`,
    listItem: `.${this.CLASSES.listItem}`,
    grabHandle: '[data-grab-handle]',
    deleteHandle: '[data-delete-handle]',
  };

  onPointerDown = (event) => {
    const item = event.target.closest(this.SELECTORS.listItem);
    if (!item) return;
    event.preventDefault();
    const handleGrab = event.target.closest(this.SELECTORS.grabHandle);
    const handleDelete = event.target.closest(this.SELECTORS.deleteHandle);

    if (handleGrab) {
      this.dragstart(item, event);
    } else if (handleDelete) {
      item.remove();
    }
  }

  onPointerUp = (event) => {
    event.preventDefault();
    this.dragend();
  }

  onPointerMove = (event) => {
    event.preventDefault();
    this.setStyles(this.dragged, {
      left: `${event.x - this.shiftX}px`,
      top: `${event.y - this.shiftY}px`,
    });

    this.dragged.style.visibility = 'hidden';
    const elementBellow = document.elementFromPoint(event.x, event.y);
    this.dragged.style.visibility = '';

    // Если курсор вышел за пределы окна, то бросаем перетаскиваемый элемент
    if (!elementBellow) {
      this.dragend();
      return;
    }

    // Элемент над которым находится курсор в данный момент перетаскивания
    const droppable = elementBellow.closest(this.SELECTORS.listItem);

    // Если в этот элемент нельзя сбросить, то завершаем функцию
    if (!droppable || droppable === this.currentDroppable) {
      this.currentDroppable = null;
      return;
    }

    const coordY = droppable.getBoundingClientRect().top;

    // Узнаем направление движения курсора
    const moveDirection = this.getMoveDirection(this.pageY, event.pageY);
    this.pageY = event.pageY;

    // Если курсор зашел на элемент доступный для сбрасывания на него, то перемещаем плейсхолдер на его место
    if (event.pageY > coordY) {
      const element = (moveDirection === 'down') ? droppable.nextSibling : droppable;
      this.insertPlaceholder(element);
    }

    this.currentDroppable = droppable;
  }

  constructor({items} = {}) {
    this.elements = items;
    this.render();
    this.addEventListeners();
  }

  render() {
    const list = document.createElement('ul');
    list.classList.add(this.CLASSES.list);
    const elements = this.elements.map((element) => this.getListItem(element));
    list.append(...elements);
    this.placeholder = this.getPlaceholder();
    this.element = list;
  }

  getListItem(elem) {
    const element = typeof elem === 'object' ? elem : this.toHTML(elem); // Добавил поддержку строк, а не только DOM элеиментов
    element.classList.add(this.CLASSES.listItem);
    return element;
  }

  getPlaceholder() {
    const placeholder = document.createElement('div');
    placeholder.classList.add('sortable-list__placeholder');
    return placeholder;
  }

  addEventListeners() {
    document.addEventListener('pointerdown', this.onPointerDown);
  }

  removeEventListeners() {
    document.removeEventListener('pointerdown', this.onPointerDown);
  }

  setStyles(element, props) {
    for (const prop in props) {
      element.style[prop] = props[prop];
    }
  }

  dragstart(dragged, event) {
    this.dragged = dragged;
    document.addEventListener('pointerup', this.onPointerUp);

    const draggedRect = this.dragged.getBoundingClientRect();
    this.shiftX = event.clientX - draggedRect.left;
    this.shiftY = event.clientY - draggedRect.top;

    this.draggedHeight = this.dragged.clientHeight;
    this.draggedWidth = this.dragged.clientWidth;

    this.setStyles(this.dragged, {
      width: `${this.draggedWidth}px`,
      left: `${event.x - this.shiftX}px`,
      top: `${event.y - this.shiftY}px`,
    });
    this.setStyles(this.placeholder, {
      height: `${this.draggedHeight}px`
    });

    this.insertPlaceholder(this.dragged);
    this.dragged.classList.add(this.CLASSES.dragged);

    document.addEventListener('pointermove', this.onPointerMove);
  }

  dragend() {
    this.element.insertBefore(this.dragged, this.placeholder);
    this.placeholder.remove();
    this.setStyles(this.dragged, {
      width: '',
      left: '',
      top: '',
    });

    this.dragged.classList.remove('sortable-list__item_dragging');
    this.dragged = null;

    document.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('pointerup', this.onPointerUp);
  }

  getMoveDirection(oldY, newY) {
    if (oldY < newY) {
      return 'down';
    } else if (oldY > newY) {
      return 'up';
    }
  }

  insertPlaceholder(element) {
    this.element.insertBefore(this.placeholder, element);
  }

  toHTML(htmlString) {
    const htmlObject = document.createElement('div');
    htmlObject.innerHTML = htmlString;
    return htmlObject.firstElementChild;
  }

  remove() {
    if (this.element) this.element.remove();
    this.element = null;
    this.removeEventListeners();
  }

  destroy() {
    this.remove();
  }
}
