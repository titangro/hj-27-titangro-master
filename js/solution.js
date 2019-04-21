'use strict';

import DragMenu from './DragMenu.js';
import Masker from './Masker.js';
import Switcher from './Switcher.js';

function initApp() {
    document.addEventListener('DOMContendLoaded', new DragMenu);
    document.addEventListener('DOMContendLoaded', new Masker);
    document.addEventListener('DOMContendLoaded', new Switcher);
}

initApp();