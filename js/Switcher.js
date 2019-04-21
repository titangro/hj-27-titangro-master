'use strict';

import DragMenu from './DragMenu.js';
import Masker from './Masker.js';

const dragger = new DragMenu;
const maskMaker = new Masker;
console.log(dragger, maskMaker);

export default class Switcher {
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
			let canvas = this.wrap.querySelector('canvas');
			canvas.style.zIndex = 0;
			//console.log(canvas)

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
					canvas.style.zIndex = cls === 'draw' ? 1 : 0;
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

		console.log('публикация')

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
		if (this.wrap.querySelector('.mask')){
			this.wrap.querySelector('.mask').setAttribute('src', '');
		}		
		maskMaker.clearComments();
		if (window.location.search) {
			window.location.search = "";
		}
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
		let canvas = this.wrap.querySelector('canvas');
		Array.from(this.wrap.querySelectorAll('.comments__marker-checkbox')).forEach((item) => {
			item.checked = false;
			item.style.zIndex = 1;
			item.parentElement.checked = false;
			item.parentElement.style.zIndex = 1;			
		});
		canvas.style.zIndex = 0;
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
			this.menu.querySelector('.menu__url').setAttribute('value', link + '?id=' + id);
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
		if (navigator.clipboard) {
			navigator.clipboard.writeText(document.querySelector('.menu__url').value)
		  	.then((res) => {
		    	console.log('Ссылка скопирована в буфер обмена через Navigator');
		  	})
		  	.catch((err) => {
		    	console.log('Ошибка при сохранении ссылки в буфер:', err);
		  	});
		} else {
			const root = document.querySelector('.menu__url');
			const url = root.value;

			root.focus();
			root.select();

			try {  
		    	// Теперь, когда мы выбрали текст ссылки, выполним команду копирования
		    	const successful = document.execCommand('copy');  
		    	const msg = successful ? 'успешно' : 'неуспешно';
		    	console.log('Копирования проведено ' + msg);  
		  	} catch(err) {  
		   		console.log('Нет возможности для копирования');  
		  	}
		}
	}

	//вывод свойств изображения
	setImageProps(data) {
		this.currentImage.src = data.url;
		this.currentImage.dataset.id = data.id;
		this.currentImage.dataset.title = data.title;
		this.currentImage.dataset.timestamp = data.timestamp;		
	}
}