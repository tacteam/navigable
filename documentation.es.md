### Guia de desarrollo TAC

# tac-navigable

El equipo TAC, desarrolló un conjunto de componentes que facilita la tarea de convertir un sitio convencional en una aplicación navegable por teclado.
**tac.navigable** es util solo en aplicaciones Angular.js, si bien se puede agregar a otro tipo de sitios, no es recomendable.
Cabe aclarar que existen alternativas no dinámicas o menos performantes:

[nekman.keynavigator](http://nekman.github.io/keynavigator)    
[fullscreensitenavigation](http://fullscreensitenavigation.com)    
[deck.js](http://imakewebthings.com/deck.js)    

**tac.navigable** está optimizado para evitar el uso indebido de eventos.    
La mayoría de los sitemas de navegación se basan en jQuery y realizan extensas búsquedas por clase o identificador sobre el arbol DOM para encontrar los nodos seleccionables.
Esto significa que el procesamiento de cada acción consume muchos recursos de la plataforma, cuanto más grande el sitio, más complejo el procesamiento.
**tac.navigable** genera un arbol virtual de navegación, vinculando los nodos como padres e hijos, de esta forma, para procesar una acción, solo debe subir y bajar niveles en busca del siguiente nodo disponible, lo que implica un procesamiento mínimo.

## Instalación

Este repositorio de distribuye a travez del administrador `bower`. Los fuentes de este módulo se pueden encontrar en el 
[repositorio general tacteam](https://github.com/tacteam/navigable).
Sientase a gusto de reportar problemas o proponer nuevas *features* en este repositorio

##### Bower

Este módulo puede ser instalado con `bower`.

```shell
bower install tac-navigable
```

Opcionalmente puede agregar el prefijo --save para agregar la dependencia al archivo bower.js

```shell
bower install tac-navigable --save
```

Luego agregue el correpondiente tag `<script>` a su `index.html`:

```html
<script src="/bower_components/tac-navigable/dist/navigable.js"></script>
```

## Documentación

##### Dependencia Angular

Debe agregar el identificador del componente a las dependencias Angular para que el módulo sea importado dentro de la aplicación.

```js
angular.module('main-application',[
  '...dependencies...',
  'module.tac.navigable',
  '...dependencies...'
])
```

Tenga en cuenta que **tac.keyboard** depende de los componentes
[**tac.keys**](https://github.com/tacteam/keys) y 
[**tac.navigable**](https://github.com/tacteam/navigable). 
Asegúrese de que estén presentes.

##### Inicialización del componente

```js
angular.module('main-application')
.run([
  '$rootScope',
  'tac.keys',
  'tac.navigable.root.main',
  function($rootScope, keys, rootMain) {
	keys.bind_keydown(document);
	keys.subscribe(rootMain);
	rootMain.bind_to($rootScope);
  }
])
```

##### Uso


## Licencia

No disponible aún.
