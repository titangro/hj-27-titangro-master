'use strict';

let movedMenu = null;
let shiftX = 0;
let shiftY = 0;

let menuBar = document.querySelector('.menu');

document.addEventListener('mousedown', (event) => {
	event.preventDefault();
	if (event.target.classList.contains('drag')) {					
		const bounds = event.target.getBoundingClientRect();
		shiftX = event.pageX - bounds.left - window.pageXOffset;
		shiftY = event.pageY - bounds.top - window.pageYOffset;		
		movedMenu = event.target.parentElement;		
	}
});
document.addEventListener('mousemove', (event) => {
	if (movedMenu) {
		event.preventDefault();
		let body = document.querySelector('body');
		let x = event.pageX - shiftX;
		let y = event.pageY - shiftY;

		x = Math.min(x, document.documentElement.clientWidth);
		y = Math.min(y, document.documentElement.clientHeight);
		x = Math.max(x, body.offsetLeft);
		y = Math.max(y, body.offsetTop);

		movedMenu.style.left = x + 'px';
		movedMenu.style.top	= y + 'px';
		movedMenu.classList.add('moving');	
	}
});
document.addEventListener('mouseup', (event) => {
	if (movedMenu) {
		event.preventDefault();
		movedMenu.style.visibility = 'hidden';
		let cart = document.elementFromPoint(event.clientX, event.clientY);		
		if (cart.id === 'trash_bin') {
			movedMenu.style.display = 'none';
		}	
		movedMenu.style.visibility = 'visible';
		movedMenu.classList.remove('moving');
		movedMenu = null;
	}	
})