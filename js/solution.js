'use strict';

//перемещение блока меню
class DragMenu {
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
		y = Math.min(y, document.documentElement.clientHeight);

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

class Switcher {
	constructor() {
		this.menu = document.querySelector('.menu');
		this.burger = this.menu.querySelector('.burger');
		this.currentImage = document.querySelector('.current-image');
		this.wrap = document.querySelector('.wrap.app');
		this.error = document.querySelector('.error');
		this.loader = document.querySelector('.image-loader');		
		
		this.initEvents();		
	}

	initEvents() {
		this.burger.addEventListener('click', this.reviewing.bind(this));

		Array
		  .from(this.menu.querySelectorAll('.mode'))
		  .forEach((node) => {
		  	node.addEventListener('click', this.toggleMenu.bind(this));
		  });

		this.wrap.addEventListener('drop', this.uploadImage.bind(this));
		this.wrap.addEventListener('dragover', event => {event.preventDefault()});
		document.addEventListener('DOMContendLoaded', this.checkReviewing());
		this.menu.querySelector('.menu_copy').addEventListener('click', this.copyLink.bind(this));
	}

	toggleMenu(event) {

		//console.log('переключение');

		let switcher = ['new', 'comments', 'draw', 'share'];
		let currentClassList = event.currentTarget.classList;
		
		//возможность кликнуть по комментариям
		Array.from(this.wrap.querySelectorAll('.comments__marker-checkbox')).forEach((item) => {
			item.checked = false;
			item.style.zIndex = 1;
			item.parentElement.checked = false;
			item.parentElement.style.zIndex = 1;
		});
		
		if (currentClassList.contains('new') && currentClassList.contains('active')) {
			//загрузка фото по клику "Загрузить новое"
			let inputFile = document.createElement('input');
			inputFile.setAttribute('type', 'file');			
			inputFile.addEventListener('input', this.uploadImage.bind(this));
			inputFile.click();
		} else {
			let mask = this.wrap.querySelector('canvas');
			mask.style.zIndex = 0;
			//console.log(mask)

			switcher.forEach(cls => {
				if (currentClassList.contains(cls) 
					&& !currentClassList.contains('active')) {

					//включаем публикацию
					if (cls === 'new') {
						return this.publication();
					}
					
					//убираем другие пункты отличные от выбранного
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

					if (!currentClassList.contains('new')) {
						this.burger.style.display = 'inline-block';
					}

					//уточнение позиции при переключении
					let position
					if (localStorage.position) {
						position = JSON.parse(localStorage.position);
						dragger.changePosition(position.x, position.y);
					}

					//отображение/отключение canvas при переключение на рисование					
					mask.style.zIndex = cls === 'draw' ? 1 : 0;
					if (cls === 'draw') {
						maskMaker.tick();
						//скрыть комментарии под маску для рисования 
						Array.from(this.wrap.querySelectorAll('.comments__marker-checkbox')).forEach((item) => {
							item.checked = false;
							item.style.zIndex = 0;
							item.parentElement.checked = false;
							item.parentElement.style.zIndex = 0;							
						});
					}					
					//console.log(cls);
				}
			});
		}
	}

	publication() {
		//появление меню после загрузки
		this.menu.style.display = 'block';

		//console.log('публикация')

		//убираем вывод ошибок
		this.error.style.display = 'none';
		//вывод меню публикации (загрузить фото)
		Array
			.from(this.menu.querySelectorAll('.mode, .burger'))
			.forEach((node) => {
				if (!node.classList.contains('new')) {
					node.style.display = 'none';
				} else {
					node.classList.add('active');
				}
			});
		
		this.currentImage.setAttribute('src', '');
		localStorage.reviewing = '';
	}

	reviewing() {
		//появление меню после загрузки
		this.menu.style.display = 'block';

		//console.log('рецензирование');

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

		//возможность кликнуть по комментариям
		let mask = this.wrap.querySelector('canvas');
		Array.from(this.wrap.querySelectorAll('.comments__marker-checkbox')).forEach((item) => {
			item.checked = false;
			item.style.zIndex = 1;
			item.parentElement.checked = false;
			item.parentElement.style.zIndex = 1;			
		});
		mask.style.zIndex = 0;
	}

	uploadImage(event) {
		event.preventDefault();		
		let image, form = new FormData();
		const error = this.error.querySelector('.error__message');
		let accept = ['image/png', 'image/jpeg'];
		form.append('title', 'Шаблон рецензирования');

		//проверяем откуда пришел файл
		if (event.type == 'input') {
			image = Array.from(event.target.files)[0];
			form.append('image', image);
		} else if (event.type == 'drop') {
			image = event.dataTransfer.files[0];
			form.append('image', image);
		}
		
		if (!this.menu.querySelector('.new.active')) {
			//вывод ошибки при вбросе фото в режиме рецензирования
			error.textContent = 'Чтобы загрузить новое изображение, пожалуйста, воспользуйтесь пунктом «Загрузить новое» в меню';
			this.error.style.display = 'block';
			return;
		} else {
			//проверяем тип файла
			if (accept.includes(image.type)) {
				this.error.style.display = 'none';
				const sourse = URL.createObjectURL(image);
				
				//отправляем на сервер
				this.sendImage(form);				
				  
				this.currentImage.addEventListener('load', (event) => {				
					URL.revokeObjectURL(event.target.src);
				});					
			} else {
				//вывод ошибоки при неверном типе файла		
				error.textContent = 'Неверный формат файла. Пожалуйста, выберите изображение в формате .jpg или .png.';
				this.error.style.display = 'block';
			}	
		}
	}

	//отправка изображения на сервер
	sendImage(dataForm) {
		//вывод прелоадера
		this.loader.style.display = 'block';
		this.menu.style.display = 'none';

		//отправка нового фона на сервер
		fetch('https://neto-api.herokuapp.com/pic', {
			body: dataForm,
			credentials: 'same-origin',
			method: 'POST',
			//headers: { 'Content-Type': 'multipart/form-data' }
		})
			.then((res) => {
				if (200 <= res.status && res.status < 300) {
					return res;
				}
				throw new Error(res.statusText);
			})
			.then((res) => res.json())
			.then((data) => {
				if (data.error) {
					throw new Error(data.message);
				} else {
					this.setImageProps(data);					
					this.setReviewing(data);
					
					this.turnOffLoader(data.id);
				}				
			})
			.catch((error) => {
				console.log(error, error.message);
			})
	}

	getImageInfo(id) {
		//вывод прелоадера
		this.loader.style.display = 'block';
		this.menu.style.display = 'none';

		//отправка нового фона на сервер
		fetch(`https://neto-api.herokuapp.com/pic/${id}`)
			.then((res) => {
				if (200 <= res.status && res.status < 300) {
					return res;
				}
				throw new Error(res.statusText);
			})
			.then((res) => res.json())
			.then((data) => {
				if (data.error) {
					throw new Error(data.message);
				} else {
					this.setImageProps(data);					
					this.setReviewing(data);
					
					//вывод ссылки, переключить на режим поделиться(или комментирования, если изображением поделились)
					this.turnOffLoader(data.id, true);

					//вывести всю информацию о изображении: комментарии, маску
				}				
			})
			.catch((error) => {
				console.log(error, error.message);
			})
	}

	//сохранение фото для рецензирования
	setReviewing(data) {
		//получение ссылки на изображение в формате base64
		localStorage.reviewing = JSON.stringify({
			id: data.id,
			url: data.url,
			title: data.title,
			timestamp: data.timestamp,
		});
	}

	checkReviewing() {
		//проверка гет параметра
		const getParams = window.location.search.replace('?','').split('&').reduce((arr,item) => {
			const elem = item.split('=');
            arr[elem[0]] = elem[1];
            return arr;
		}, {});

		if (getParams.id) {
			//получение и вывод информации по изображению
			return this.getImageInfo(getParams.id);
		}

		//включение сохраненного режима
		if (!localStorage.reviewing) {
			return this.publication();
		}

		//вывод сохраненного изображения
		const data = JSON.parse(localStorage.reviewing);
		if (data) {
			this.loader.style.display = 'block';
			this.menu.style.display = 'none';
			this.setImageProps(data);
		}
		this.turnOffLoader(data.id);
	}

	//выключить прелоадер (режим поделиться)
	turnOffLoader(id, shared = false) {
		//изменить ссылку на актуальную, добавить ссылку на маску
		const link = 'http://titangro.ru/ui/index.html';

		this.currentImage.addEventListener('load', () => {
			this.loader.style.display = 'none';
			this.menu.querySelector('.menu__url').value = link + '?id=' + id;
			this.reviewing();

			//режим поделиться по умолчанию
			if (shared) {
				//если перейти по ссылки, которой поделились, попадаем в режим комментирования
				this.menu.querySelector('.comments').click();
			} else {
				this.menu.querySelector('.share').click();
			}
		});
	}

	//сохранение ссылки в буфер обмена
	copyLink() {
		navigator.clipboard.writeText(this.menu.querySelector('.menu__url').value)
		  .then((res) => {
		    console.log('Ссылка скопирована в буфер обмена');
		  })
		  .catch((err) => {
		    console.log('Ошибка при сохранении ссылки в буфер:', err);
		  });
	}

	//вывод свойств изображения
	setImageProps(data) {
		this.currentImage.src = data.url;
		this.currentImage.dataset.id = data.id;
		this.currentImage.dataset.title = data.title;
		this.currentImage.dataset.timestamp = data.timestamp;

		//в дальнейшем использовать свойства при обновлении сведений о изображении
		/*data.mask;
		data.comments = {
			key: {
				left,
				message,
				timestamp,
				top,
			}
		};*/
	}
}

class Masker {
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
				} else if (res.event === 'error') {
					console.log(`Произошла ошибка ${res.error.message}`)
				}
				console.log('Обновление события вебсокета');
			});
			this.connection.addEventListener('error', error => {
				console.log('Ошибка:', error.data);
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
		console.log('deactivatePaint');		
	}

	draw(event) {
		if (this.drawing) {
			//console.log('draw painter')
			const point = this.pushCurve(event.offsetX, event.offsetY, this.color);
			this.curves[this.curves.length - 1].push(point);
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
				form.querySelector('.comment').insertBefore(messageBox, form.querySelector('.comment').firstChild);
			}
		} else {
			if (message) {
				curForm.querySelector('.comment').insertBefore(messageBox, curForm.querySelector('.comment').firstChild);
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
			}
		}

		//поле для ввода сообщения
		if (event.target.classList.contains('comments__input')) {
			event.target.focus();
		}
	}

	//отправка маски на сервер
	sendMask() {
		if (this.curves.length && this.remask) {
			this.canvas.toBlob(
				blob => 
				this.connection.send(blob)
			);
			this.curves.length = 0;
			this.remask = false;
			let timeout = setTimeout(() => {
				console.log(this.remask);
				this.remask = true;
				clearTimeout(timeout);
			}, 5000)
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

const dragger = new DragMenu;
const maskMaker = new Masker;
document.addEventListener('DOMContendLoaded', dragger);
document.addEventListener('DOMContendLoaded', new Switcher);
document.addEventListener('DOMContendLoaded', maskMaker);
