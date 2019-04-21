'use strict';

export default class Masker {
	constructor(canvas = document.createElement('canvas')) {
		this.currentImage = document.querySelector('.current-image');
		this.wrap = document.querySelector('.wrap.app');
		this.canvas = canvas;
		this.ctx = this.canvas.getContext('2d');
		this.curves = [];
		this.drawing = false;
		this.needsRepaint = false;
		this.radius = 4;

		this.commentsOff;
		this.commentsOn;

		this.remask = true;

		this.colorBox = {
			red: '#eb5d56', yellow:'#f4d22f', green: '#6ebf44', blue: '#52a7f7', purple: '#b36ae0'
		}
		this.tools = this.wrap.querySelectorAll('.draw-tools input');
		Array.from(this.tools).forEach(item => {
			item.addEventListener('click', event => {				
				this.color = this.colorBox[event.target.value];
			})
			if (item.checked) {
				this.color = this.colorBox[item.value];
			}
		});		
		this.canvas.style = `position: absolute;
						top: 50%;
						left: 50%;
						transform: translate(-50%, -50%);
						z-index: 0;`;

		this.initEvents();
		this.clearComments();
	}

	initEvents() {
		//console.log('beforeInit');
		this.currentImage.addEventListener('load', () => {			
			this.initCanvas();
			this.canvas.addEventListener('mousedown', this.activatePaint.bind(this));
			this.canvas.addEventListener('mouseup', this.deactivatePaint.bind(this));
			this.canvas.addEventListener('mouseup', this.sendMask.bind(this));
			this.canvas.addEventListener('mousedown', this.sendMask.bind(this));			
			this.canvas.addEventListener('mouseleave', this.deactivatePaint.bind(this));
			this.canvas.addEventListener('mousemove', this.draw.bind(this));
			//this.canvas.addEventListener('DOMContendLoaded', );
			//this.tick.bind(this);

			//события для комментариев
			this.canvas.addEventListener('click', this.showCommentForm.bind(this));

			this.commentsOff = document.querySelector('#comments-off');
			this.commentsOn = document.querySelector('#comments-on');
			this.commentsOn.checked = true;
			this.commentsOff.checked = false;

			this.commentsOn.addEventListener('change', this.toggleComments.bind(this));
			this.commentsOff.addEventListener('change', this.toggleComments.bind(this));

			//вебсокет
			this.connection = new WebSocket(`wss://neto-api.herokuapp.com/pic/${this.currentImage.dataset.id}`);
			this.connection.addEventListener('open', event => {
				//console.log(pic);
				console.log('Соединение установлено');
			});
			this.connection.addEventListener('message', message => {
				let res = JSON.parse(message.data);
				console.log(res);
				if (res.event === 'pic') {
					console.log('Получение данных изображения');
					if (res.pic.comments) {
						console.log('Получение списка комментариев');
						for(let key in res.pic.comments){
							const {left, top, message, timestamp} = res.pic.comments[key];
							this.createForm(left, top, message, timestamp);
						};
					}
					if (res.pic.mask) {
						console.log('Получение маски');
						this.addMask(res.pic.mask);
					}
				} else if (res.event === 'comment') {
					console.log('Получено новое сообщение');
					const {left, top, message, timestamp} = res.comment;
					this.createForm(left, top, message, timestamp);
				} else if (res.event === 'mask') {
					console.log('Обновилась маска изображения');
					this.addMask(res.url);
					this.sendMask();
				} else if (res.event === 'error') {
					console.log(`Произошла ошибка ${res.error.message}`)
				}
				console.log('Обновление события вебсокета');
			});
			this.connection.addEventListener('error', error => {
				console.log('Ошибка:', error);
			});
			this.connection.addEventListener('close', event => {
				console.log('Соединение закрыто');
			});
		});		

		//document.addEventListener('mouseup', this.dragOff.bind(this));
	}

	//рисовашка

	initCanvas() {
		this.canvas.width = getComputedStyle(this.currentImage).width.slice(0, -2);
		this.canvas.height = getComputedStyle(this.currentImage).height.slice(0, -2);
		if (!this.wrap.querySelector('canvas')){
			this.wrap.appendChild(this.canvas);
		}
	}

	activatePaint(event) {		
		if (this.wrap.querySelector('.mode.draw').classList.contains('active')) {
			//console.log('activatePaint')
			this.drawing = true;
			//this.needsRepaint = true;
			const curve = [];
			curve.push(this.pushCurve(event.offsetX, event.offsetY, this.color));
			this.curves.push(curve);
			this.needsRepaint = true;
			this.ctx.moveTo(event.pageX, event.pageY);
		}
	}

	deactivatePaint(event) {
		if (this.wrap.querySelector('.mode.draw').classList.contains('active')) {
			//console.log('deactivatePaint')
			this.drawing = false;
			//this.needsRepaint = false;
		}	
	}

	draw(event) {
		if (this.drawing) {
			//console.log('draw painter')
			const point = this.pushCurve(event.offsetX, event.offsetY, this.color);			
			if (this.curves.length) {
				this.curves[this.curves.length - 1].push(point);
			} else {
				this.curves.push(point);
			}
    		this.needsRepaint = true;
			//this.circle(point);
			/*this.ctx.beginPath();
      		this.ctx.moveTo(x, y);
		    this.changeWidth(this.isReduce);
		    this.changeColor(event.shiftKey);
		    this.ctx.lineTo(x, y);
		    this.ctx.stroke();*/
		}
	}

	pushCurve(x, y, color) {
		return [x, y, color];
	}

	circle(point) {
		//console.log('circle')
	  	this.ctx.beginPath(); 
	  	this.ctx.fillStyle = point[2];
	  	this.ctx.arc(point[0], point[1], this.radius / 2, 0, 2 * Math.PI);
	  	this.ctx.fill();
	  	//this.ctx.closePath();
	}

	addCurve(points) {
		//console.log('addCurve')
		if (points) {
		  this.ctx.beginPath(); 
		  this.ctx.lineWidth = this.radius;
		  this.ctx.lineJoin = 'round';
		  this.ctx.lineCap = 'round';
		  this.ctx.strokeStyle = points[points.length - 1][2];

		  this.ctx.moveTo(points[0], points[1]);

		  for(let i = 1; i < points.length - 1; i++) {
		    this.smoothCurveBetween([points[i][0], points[i][1]], [points[i + 1][0], points[i + 1][1]]);
		  }

		  this.ctx.stroke();  
		}
	}

	smoothCurveBetween(point1, point2) {
		//console.log('smoothCurveBetween')
		//this.ctx.strokeStyle = 
		const curvePoint = point1.map((coord, idx) => (coord + point2[idx]) / 2);
  		this.ctx.quadraticCurveTo(...point1, ...curvePoint);
  		this.ctx.stroke();
	}	

	repaint() {
		//console.log('repaint')
	  	this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);	  	
	  	this.curves
		    .forEach((curve) => {
		      this.circle(curve[0]);
		      this.addCurve(curve);
		    });
	}

	tick() {
		//console.log('tick')
		if(this.needsRepaint) {
			this.repaint();
			this.needsRepaint = false;
		}

		window.requestAnimationFrame(this.tick.bind(this));
	}

	//создание комментариев

	//очистка поля для комментариев
	clearComments() {
		Array.from(this.wrap.querySelectorAll('.comments__form'))
			.forEach(node => {
				if (node.parentNode) {
			       node.parentNode.removeChild(node);
			    }
			});
	}

	//создать новый маркер для комментариев
	showCommentForm(event) {
		if (this.wrap.querySelector('.mode.comments').classList.contains('active')
			&& this.commentsOn.checked) {
			this.createForm(event.offsetX, event.offsetY);		
		}		
	}	

	createForm(left, top, message = null, timestamp = null) {
		const bound = this.currentImage.getBoundingClientRect();		
		let curForm = null;
		Array.from(this.wrap.querySelectorAll('.comments__form')).forEach(form => {
			//console.log(left + Math.floor(bound.left) - 20, form.style.left.slice(0,-2), top + Math.floor(bound.y), form.style.top.slice(0,-2));
			//console.log(form.style.left.slice(0,-2), form.style.top.slice(0,-2))
			if (form.style.left.slice(0,-2) == left + Math.floor(bound.x) - 20
				&& form.style.top.slice(0,-2) == top + Math.floor(bound.y)) {
				curForm = form;	
			}
			form.querySelector('.loader').style.display = 'none';
		});

		const messageBox = this.engineComments(this.generateComment(timestamp, message));
		if (!curForm) {
			const form = this.engineComments(this.generateCommentForm(left, top));
			form.addEventListener('click', this.toggleMarks.bind(this));
			this.wrap.appendChild(form);
			
			if (message) {
				form.querySelector('.comment').insertBefore(messageBox, form.querySelector('.comment').lastChild);
			}
		} else {
			if (message) {
				curForm.querySelector('.comment').insertBefore(messageBox, curForm.querySelector('.comment').lastChild);
			}
		}
		
		//console.log(left, top, message, timestamp);
	}

	addMask(url) {
		let mask;
		if (!this.wrap.querySelector('.mask')) {
			mask = document.createElement('img');
			mask.classList.add('mask');
			mask.setAttribute('src', url);
			mask.style = `position:absolute;
						top: 50%;
						left: 50%;
						transform: translate(-50%, -50%);
						display: block;
						box-shadow: 0.1rem 0.17rem 1rem #000000;
						z-index: 0;`
			this.wrap.insertBefore(mask ,this.currentImage.nextSibling);
		} else {
			mask = this.wrap.querySelector('.mask');
			mask.setAttribute('src', url);
		}
	}

	//скрыть маркеры по кнопке
	toggleComments() {
		Array.from(this.wrap.querySelectorAll('.comments__form')).forEach((item) => {
			item.style.display = this.commentsOff.checked ? 'none' : 'block';
		});
	}

	//изменение уровня видимости у маркеров
	toggleMarks(event) {
		//открытие только 1 маркера
		const bound = this.currentImage.getBoundingClientRect();
		if (event.target.classList.contains('comments__marker-checkbox')) {
			//event.target.setAttribute(disabled, "");
			Array.from(this.wrap.querySelectorAll('.comments__marker-checkbox')).forEach((item) => {
				item.checked = false;
				item.parentElement.style.zIndex = 0;
			});
			event.target.checked = true;
			event.target.parentElement.style.zIndex = 1;
		}

		//закрытие маркера
		if (event.target.classList.contains('comments__close')) {
			event.target.parentElement.parentElement.children[1].checked = false;
		}

		//отправление сообщения на сервер
		if (event.target.classList.contains('comments__submit')) {
			event.preventDefault();
			console.log(event.target.parentElement.querySelector('.loader'));
			event.target.parentElement.querySelector('.loader').style.display = 'block';
			const message = event.target.previousSibling.previousSibling.value;
			if (message != "") {
				const left = +event.currentTarget.style.left.slice(0, -2) - Math.floor(bound.x) + 20,
					top = +event.currentTarget.style.top.slice(0, -2) - Math.floor(bound.y);
					console.log(left, top)
				this.sendComment(message, left, top);
				event.target.previousSibling.previousSibling.value = "";
			}
		}

		//поле для ввода сообщения
		if (event.target.classList.contains('comments__input')) {
			event.target.focus();
		}
	}

	//отправка маски на сервер
	sendMask() {
		//if (event.type == 'mouseup') this.remask = true;
		console.log(1)
		if (this.curves.length && this.remask) {			
			this.remask = false;
			let timeout = setTimeout(() => {
				console.log(this.remask);
				this.remask = true;
				this.canvas.toBlob(
					blob => 
					this.connection.send(blob)
				);
				this.curves.length = 0;
				clearTimeout(timeout);					
 			}, 1000)
		}		
	}	

	//отправка сообщения на сервер
	sendComment(message, left, top) {
		const dataForm = `message=${encodeURIComponent(message)}&left=${encodeURIComponent(Math.floor(left))}&top=${encodeURIComponent(Math.floor(top))}`;
		let xhr = new XMLHttpRequest();
		xhr.open("POST", `https://neto-api.herokuapp.com/pic/${this.currentImage.dataset.id}/comments`, true);
		xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');		
		//console.log(dataForm);
		xhr.onreadystatechange = function() {
		  if (this.readyState != 4) {		  	
		  	return;
		  }
		  //Новое сообщение
		  let data = JSON.parse(this.responseText);
		  console.log(data);
		}

		xhr.send(dataForm);
	}

	//шаблонизатор нового сообщения
	generateComment(timestamp, message) {
		return {
			tag: 'div',
			cls: 'comment',
			childs: [{
				tag: 'p',
				cls: 'comment__time',
				childs: this.showDate(timestamp),
			},{
				tag: 'p',
				cls: 'comment__message',
				childs: message,
			}]
		}
	}

	showDate(timestamp) {
		let date = new Date(timestamp);
		let day = date.getDate();
		day = +day < 10 ? '0' + day : day;
		let month = date.getMonth();
		month = +month < 10 ? '0' + (month + 1) : month;
		let year = date.getFullYear();
		let hours = date.getHours();
		hours = +hours < 10 ? '0' + hours : hours;
		let minutes = date.getMinutes();
		minutes = +minutes < 10 ? '0' + minutes : minutes;
		let seconds = date.getSeconds();
		seconds = +seconds < 10 ? '0' + seconds : seconds;
		return day + '.' + month + '.' + year + ' ' + hours + ':' + minutes + ':' + seconds;
	}

	//шаблонизатор для формы комментариев
	generateCommentForm(x, y) {
		const bound = this.currentImage.getBoundingClientRect();
		//console.log(bound)
		const visibility = this.commentsOn.checked ? 'block;' : 'none;';
		return {
			tag: 'form',
			cls: 'comments__form',
			attrs: {
				style: `z-index: 0;
						left: ${Math.floor(bound.x) + x - 20}px; 
						top: ${Math.floor(bound.y) + y}px; 
						display: ${visibility}`,
				/*style: `z-index: 0;
						left: ${Math.floor(x)}px; 
						top: ${Math.floor(y)}px; 
						display: ${visibility}`,*/
			},
			childs: [{
				tag: 'span',
				cls: 'comments__marker',
			},{
				tag: 'input',
				cls: 'comments__marker-checkbox',
				attrs: {
					type: 'checkbox'
				}
			},{
				tag: 'div',
				cls: 'comments__body',
				childs: [{
					tag: 'div',
					cls: 'comment',
					childs: [{
						tag: 'div',
						cls: 'loader',
						attrs: {
							style: 'display: none;'
						},
						childs: [{tag: 'span'},{tag: 'span'},{tag: 'span'},{tag: 'span'},{tag: 'span'}],
					}]
				},{
					tag: 'textarea',
					cls: 'comments__input',
					attrs: {
						type: 'text',
						placeholder: 'Напишите ответ...',
					}
				},{
					tag: 'input',
					cls: 'comments__close',
					attrs: {
						type: 'button',
						value: 'Закрыть',
					}
				},{
					tag: 'input',
					cls: 'comments__submit',
					attrs: {
						type: 'submit',
						value: 'Отправить',
					}
				}]
			}]
		}
	}

				/*[comments.reduce((frm, comment) => {
					frm.appendChild(generateOneComment(comment));
					return frm;
				}, document.createDocumentFragment()),]*/

	//шаблонизатор 1 сообщения
	generateOneComment(comment) {
		return {
			tag: 'div',
			cls: 'comment',
			childs: [{
				tag: 'p',
				cls: 'comment__time',
				childs: comment.timestamp,
			},{
				tag: 'p',
				cls: 'comment__message',
				childs: comment.message,
			}]
		}
	}

	//ядро для обработки шаблонов
	engineComments(node) {
		if (node === undefined || node === null || node === null) {
			return createTextNode('');
		}
		if (typeof node === 'string' || typeof node === 'number' || typeof block === true) {				
			return document.createTextNode(node);		
		}
		if (Array.isArray(node)) {
			return node.reduce((frm, elem) => {
				frm.appendChild(this.engineComments(elem));
				return frm;
			}, document.createDocumentFragment());
		}
		const element = document.createElement(node.tag || 'div');
		element.classList.add(...[].concat(node.cls).filter(Boolean));

	    if (node.attrs) {
	        Object.keys(node.attrs).forEach(key => {
	           	element.setAttribute(key, node.attrs[key]);
	        });
	    }
	    
	    if (node.childs) {
	        element.appendChild(this.engineComments(node.childs));
	    }

	    return element;
	}
	throttle(callback, delay) {
		let isWaiting = false;
	    return function(){
	      	if (isWaiting) {
	      		callback.apply(this, arguments);
	      		isWaiting = true;
	      		setTimeout(() => {
	      			isWaiting = false;
	      		}, delay);
	      	}
	    }
	}
}