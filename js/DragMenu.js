'use strict';

//перемещение блока меню
export default class DragMenu {
	constructor() {
		this.movedMenu = null;
		this.shiftX = 0;
		this.shiftY = 0;
		this.menu = document.querySelector('.menu');

		this.initEvents();		
	}

	initEvents() {
		document.addEventListener('mousedown', this.dragOn.bind(this));
		document.addEventListener('mousemove', this.dragMove.bind(this));
		document.addEventListener('mouseup', this.dragOff.bind(this));
		document.addEventListener('DOMContendLoaded', this.checkPosition());
	}

	dragOn(event) {
		event.preventDefault();
		if (event.target.classList.contains('drag')) {		
			const bounds = event.target.getBoundingClientRect();
			this.shiftX = event.pageX - bounds.left - window.pageXOffset;
			this.shiftY = event.pageY - bounds.top - window.pageYOffset;
			localStorage.shiftX = this.shiftX;
			localStorage.shiftY	= this.shiftY;	
			this.movedMenu = event.target.parentElement;		
		}
	}

	dragMove(event) {
		if (this.movedMenu) {
			event.preventDefault();
			let x = event.pageX - this.shiftX;
			let y = event.pageY - this.shiftY;
			this.changePosition(x, y);
		}
	}

	changePosition(x, y) {
		let body = document.querySelector('body');

		let menu = this.movedMenu ? this.movedMenu : this.menu;

		//вычисление точной ширины блока меню через его детей
		let compytedWidthMenu = Array.from(menu.children).reduce((sum, item) => {			
			if (getComputedStyle(item).width !== 'auto' && item.style.display !== 'none') {
				//console.log(+getComputedStyle(item).width.slice(0, -2))
				return sum + +getComputedStyle(item).width.slice(0, -2);
			} else {
				return sum;
			}		
		}, 0);
		//добавляем бордер для объекта меню
		compytedWidthMenu += 2 * getComputedStyle(menu).borderRightWidth.slice(0, -2);		

		//ограничение позиции меню
		x = Math.max(x, body.offsetLeft);
		y = Math.max(y, body.offsetTop);
		x = Math.min(x, document.documentElement.clientWidth - compytedWidthMenu);
		y = Math.min(y, document.documentElement.clientHeight - menu.clientHeight);

		//console.log(y)

		menu.style.setProperty('--menu-left', x + 'px');
		menu.style.setProperty('--menu-top', y + 'px');
		this.setPosition(x, y);
	}

	dragOff(event) {
		if (this.movedMenu) {
			event.preventDefault();
			this.movedMenu.style.visibility = 'hidden';
			let cart = document.elementFromPoint(event.clientX, event.clientY);		
			if (cart.id === 'trash_bin') {
				this.movedMenu.style.display = 'none';
			}	
			this.movedMenu.style.visibility = 'visible';
			this.movedMenu.classList.remove('moving');
			this.movedMenu = null;
		}	
	}

	//сохранение позиции меню
	setPosition(x, y) {
		localStorage.position = JSON.stringify({x, y});
	}

	checkPosition() {
		if (!localStorage.position) {
			return
		} else {
			let position = JSON.parse(localStorage.position);
			this.menu.style.setProperty('--menu-left', position.x + 'px');
			this.menu.style.setProperty('--menu-top', position.y + 'px');			
		}
	}
}