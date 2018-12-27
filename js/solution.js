'use strict';

//перемещение блока меню
class DragMenu {
	constructor() {
		this.movedMenu = null;
		this.shiftX = 0;
		this.shiftY = 0;

let menuBar = document.querySelector('.menu');

document.addEventListener('mousedown', (event) => {
	event.preventDefault();
	if (event.target.classList.contains('drag')) {					
		const bounds = event.target.getBoundingClientRect();
		shiftX = event.pageX - bounds.left - window.pageXOffset;
		shiftY = event.pageY - bounds.top - window.pageYOffset;		
		movedMenu = event.target.parentElement;		
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
			let body = document.querySelector('body');
			let x = event.pageX - this.shiftX;
			let y = event.pageY - this.shiftY;

			//вычисление точной ширины и высоты блока меню
			let compytedStyle = getComputedStyle(this.movedMenu);			
						
			x = Math.max(x, body.offsetLeft);
			y = Math.max(y, body.offsetTop);
			x = Math.min(x, document.documentElement.clientWidth - parseFloat(compytedStyle.width.slice(0, -2)));
			y = Math.min(y, document.documentElement.clientHeight - parseFloat(compytedStyle.height.slice(0, -2)));

			this.movedMenu.style.setProperty('--menu-left', x + 'px');
			this.movedMenu.style.setProperty('--menu-top', y + 'px');
			this.setLocalstorage(x, y);	
		}
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

	setLocalstorage(x, y) {
		localStorage.posX = x;
		localStorage.posY = y;		
	}

	checkStorage() {
		let menu = document.querySelector('.menu');
		if (localStorage.posX && localStorage.posY) {
			menu.style.setProperty('--menu-left', localStorage.posX + 'px');
			menu.style.setProperty('--menu-top', localStorage.posY + 'px');			
		}
	}
}

class SwitchMenu {
	constructor() {
		this.menu = document.querySelector('.menu');
		this.burger = this.menu.querySelector('.burger');

		document.addEventListener('DOMContendLoaded', this.restartMenu());
		this.burger.addEventListener('click', this.showMenu.bind(this))
		
		Array
		  .from(this.menu.querySelectorAll('.mode'))
		  .forEach((node) => {
		  	node.addEventListener('click', this.toggleMenu.bind(this));
		  });
	}

	toggleMenu(event) {
		let switcher = ['new', 'comments', 'draw', 'share'];
		switcher.forEach(cls => {
			if (event.currentTarget.classList.contains(cls) 
				&& !event.currentTarget.classList.contains('active')) {
				Array
				  .from(this.menu.querySelectorAll('.mode'))
				  .forEach((node) => {
				  	node.style.display = 'none';
				  });
				
				this.menu.getElementsByClassName(cls)[0].style.display = 'inline-block';
				if (this.menu.querySelector('.' + cls + '-tools')) {
					this.menu.querySelector('.' + cls + '-tools').style.display = 'inline-block';
				}
				this.menu.getElementsByClassName(cls)[0].classList.add('active');
				this.burger.style.display = 'inline-block';
			}
		});
	}

	restartMenu () {
		//стартовое меню для тестов
		this.burger.style.display = 'none';
	}

	showMenu() {
		this.burger.style.display = 'none';

		Array
			.from(this.menu.querySelectorAll('.mode'))
			.forEach((node) => {
				node.style.display = 'inline-block';
				node.classList.remove('active');
			});

		Array
			.from(this.menu.querySelectorAll('.tool'))
			.forEach((node) => {
				node.style.display = 'none';
			});
	}
}

const dragger = new DragMenu;
document.addEventListener('DOMContendLoaded', dragger);
document.addEventListener('DOMContendLoaded', new SwitchMenu);

/*let res = Array.from(document.querySelector('.menu').children).map(item => {	
	return parseFloat(getComputedStyle(item).width.slice(0, -2));
});
console.log(res)
res = res.reduce((sum, item) => {
	if (item) {
		return sum + item;
	} else return sum;
}, 0);
console.log(res)*/
