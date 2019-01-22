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
		let position = JSON.parse(localStorage.position);
		if (position) {
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
		this.container = document.querySelector('.wrap.app');
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

		this.container.addEventListener('drop', this.uploadImage.bind(this));
		this.container.addEventListener('dragover', event => {event.preventDefault()});
		document.addEventListener('DOMContendLoaded', this.checkReviewing());
		this.menu.querySelector('.menu_copy').addEventListener('click', this.copyLink.bind(this));
	}

	toggleMenu(event) {

		//console.log('переключение');

		let switcher = ['new', 'comments', 'draw', 'share'];
		let currentClassList = event.currentTarget.classList;
		
		if (currentClassList.contains('new') && currentClassList.contains('active')) {
			//загрузка фото по клику "Загрузить новое"
			let inputFile = document.createElement('input');
			inputFile.setAttribute('type', 'file');			
			inputFile.addEventListener('input', this.uploadImage.bind(this));
			inputFile.click();
		} else {

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
					let position = JSON.parse(localStorage.position);
					dragger.changePosition(position.x, position.y);
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
		const getParams = location.search.replace('?','').split('&').reduce((arr,item) => {
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
		const link = 'file:///F:/gits/hj-27-titangro-master/index.html';

		this.currentImage.addEventListener('load', () => {
			this.loader.style.display = 'none';
			this.menu.querySelector('.menu__url').value = link + '?' + id;
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

	//добавление комментария к  изображению
	//POST /pic/${id}/comments

	//обновление данных в реальном времени
	//wss://neto-api.herokuapp.com/pic/${id}
}

class Commenter {
	constructor() {
		this.currentImage = document.querySelector('.current-image');
		this.wrap = document.querySelector('.wrap.app');
		this.commentsOff = document.querySelector('#comments-off');
		this.commentsOn = document.querySelector('#comments-on');

		this.initEvents();
	}

	initEvents() {
		this.commentsOn.checked = true;
		this.commentsOff.checked = false;

		this.currentImage.addEventListener('click', this.showCommentForm.bind(this));
		this.commentsOn.addEventListener('change', this.toggleComments.bind(this));
		this.commentsOff.addEventListener('change', this.toggleComments.bind(this));
	}

	//создать новый маркер для комментариев
	showCommentForm(event) {		
		if (this.wrap.querySelector('.mode.comments').classList.contains('active')
			&& this.commentsOn.checked) {
			const form = this.engineComments(this.generateCommentForm(event.layerX, event.layerY));		
			this.wrap.appendChild(form);
		}		
	}

	//скрыть маркеры по кнопке
	toggleComments() {
		Array.from(this.wrap.querySelectorAll('.comments__form')).forEach((item) => {
			item.style.display = this.commentsOff.checked ? 'none' : 'block';
		});
	}

	//шаблонизатор для формы комментариев
	generateCommentForm(x, y) {
		const visibility = this.commentsOn.checked ? 'block;' : 'none;';
		return {
			tag: 'form',
			cls: 'comments__form',
			attrs: {
				style: `left: ${x - 10}px; top: ${y + 10}px; display: ${visibility}`,
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
}

class Painter {
	constructor() {
		this.initEvents();
	}

	initEvents() {

	}
}

const dragger = new DragMenu;
document.addEventListener('DOMContendLoaded', dragger);
document.addEventListener('DOMContendLoaded', new Switcher);
document.addEventListener('DOMContendLoaded', new Commenter);
document.addEventListener('DOMContendLoaded', new Painter);

//альтернативное получение ссылки на изображение
/*fetch(sourse)
	.then(response => response.blob())
	.then(blob => new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.addEventListener('loadend', () => resolve(reader.result));
		reader.addEventListener('error', reject);
		reader.readAsDataURL(blob)
	}))
	.then(dataUrl => {			  	
		this.sendImage(dataUrl);
	})*/