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

<a href="wiki/images/percolate.png?raw=true" title="percolate events system" alt="percolate events system" target="_blank">
  <img src="wiki/images/percolate.png?raw=true" width="200"/>
</a>

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

Antes de empezar es necesario entender el paradigma de navegación que **tac.navigable** utiliza.    
La aplicación procesa toda la página como paneles horizontales y verticales, cada panel es una rama del arbol de navegación, y los elementos seleccionables las hojas del mismo.
Además es necesario contar con un elemento raiz. Que es abstracto y sirve de nexo entre todos los nodos del sistema. También es la puerta de acceso al arbol, es decir, donde las acciones son solicitadas.

A modo de ejemplo, podemos ver como una pagina web modelo es desglosada en sus componentes.

<a href="wiki/images/navigation-raw.png?raw=true" title="percolate events system" alt="percolate events system" target="_blank">
  <img src="wiki/images/navigation-raw.png?raw=true" width="400"/>
</a>

Convirtiendose en algo como esto:

<a href="wiki/images/navigation-grow.png?raw=true" title="percolate events system" alt="percolate events system" target="_blank">
  <img src="wiki/images/navigation-grow.png?raw=true" width="400"/>
</a>

Las acciones básicas que procesa el arbol son las siguientes:

* Arriba
* Abajo
* Izquierda
* Derecha
* Enter

Si representamos nuestra página de forma simple. Asi se podría ver el comportamiento ante alguna de estas acciones.

<a href="wiki/images/navigation-actions.png?raw=true" title="percolate events system" alt="percolate events system" target="_blank">
  <img src="wiki/images/navigation-actions.png?raw=true" width="400"/>
</a>

Una vez hecha la aclaración, pasemos a entender como convertir nuestro sitio en una aplicación navegable.

Angular.js procesa cualquier contenido html antes de incrustarlo en la página. Verificando los atributos de los elementos y ejecutando programas asociados a los mismos.
Este mecanismo se conoce como `directives system`. Todos los atributos conocidos del framework como `ng-repeat`, `ng-controller`, `ng-include`, etc. son en realidad directives.
**tac.team** aprovechó esta característica para hacer más amigable la tarea y desarroló un conjunto de nuevas *directives*.

#### navigable-leaf

```html
<button class="search-submit" 
  type="submit" 
  navigable-leaf="1"
  navigable-leaf-id="search-submit"
  navigable-leaf-class="hover" >
  Search
</button>
```

Agregar el atributo `navigable-leaf` a un elemento html lo convierte automáticamente en un hoja de navegación, o sea un nodo seleccionable.    
El valor de dicho atributo denota la posición que ocupará el elemento dentro de su panel padre.    
Pero además debemos explicitar como se le comunicara al usuario que ese elemento está seleccionado.    
El valor del atributo `navigable-leaf-class` representa una clase css que sera agregada o removida del elemento DOM cuando sea activado o desactivado.    
`navigable-leaf-id` es un identificador semántico, y sirve para identificar este nodo dentro del arbol general si deseamos *debuggear* nuestro código.

#### navigable-leaf-model

```html
<a class="category-container"
    ng-repeat="button in buttons | orderBy:'priority':true" 
    navigable-leaf-model="button"
    ng-class="{hover: button.navigable.active}"
    ng-href="#{{button.href}}"
    >
    {{button.name}}
</a>
```

`navigable-leaf-model` permite generar hojas automáticamente dentro de un `ng-repeat`.
La aplicación agrega a cada objeto *model* dentro de la colección un `navigable`.
Ademas genera un nuevo $scope angular y ejecuta un $apply sobre este si se realizan cambios.
En el ejemplo podemos ver que junto con *directive* `ng-class` se puede agregar clases css dependiendo del valor de navigable.active.

`navigable-leaf-model` soporta el ordenamiento de la colección. Pero si el criterio de ordenación cambia, o nuevos elementos son agregados a la colección en una posición diferente de la última, la colección debe ser reemplazada por una nueva referencia.
Esto se puede implementar facilmente con un copiado del array en su nueva formación.

#### navigable-link

```html
<div id="my-div"
  navigable-leaf-model='tile'
  navigable-leaf-id="{{'tile #' + $index}}"
  ng-class="{hover: tile.navigable.active}">
  <span>tile.description</span>
  <a navigable-link 
    class="tile-view"
    ng-href="#/"
    ng-class="{hover: tile.navigable.active}">
    <img ng-src="{{tile.img}}" />
  </a>
</div>
```

La tecla ***enter*** arroja un evento de **click** sobre el elemento DOM asociado al componente de navegación.
En el ejemplo anterior, en principio el evento se ejecutaría sobre `div#my-div` lo no implicaría un redireccionamiento.
Para solucionar esto *tac.team* agregó la *directive* **navigable-link**, esta asocia un elemento hijo del predeterminado.
En el ejemplo anterior, si bien se tiene acceso al modelos en todo el código, la acción ***enter*** redireccionará la aplicación correctamente.

#### Paneles

Los paneles constituyen un nuevo $scope angular y por lo tanto es posible agregarlos de forma genérica con *controllers* predeterminados o programáticamente.

##### Paneles predeterminados

```html
<div class="information-container"
  ng-controller="tac.navigable.vertical"
  identifier="application left top"
  priority="1">
  ...
</div>

```

`tac.navigable.vertical` y `tac.navigable.horizontal` son controllers predeterminados que agregan el comportamiento de paneles a nuestra aplicación, la diferencia entre los mismos es que uno responde a las acciones verticales (arriba, abajo) y el otro a las horizontales (derecha, izquierda)
Los paneles se pueden anidar, y por lo tanto también poseen una posición dentro de su panel padre. Esta posición se indica con el atributo `priority`.
El valor de `identifier` es solo para tareas de *debugging*

##### Convertir nuestros *controllers* en paneles navegables

```js
angular.module('main-application')
.controller('custom-vertical-controller', [
  '$scope', 
  'tac.navigable.extensible', 
  function($scope, extensible) {
    $scope.navigable = extensible.create_vertical('application left top')
      .set_priority(2)
      .bind_to($scope);
  }
]);
```

#### Paneles multilineales

En algunos casos se desea trabajar con un esquema de tabla o matriz. Este contexto esta cubierto por el *controller* **multiline** .

```js
angular.module('main-application')
.controller('custom-multiline-controller', [
  '$scope', 
  'tac.navigable.extensible', 
  function($scope, extensible) {
    $scope.navigable = extensible.create_multiline('screenshots', 10)
      .set_priority(3)
      .bind_to($scope)
  }
]);
```

En este ejemplo de construye un panel multilinea de 10 elementos por linea.    
De esta manera se puede navegar, por ejemplo, del tercer elemento de la primer fila al tercer elemento de la segunda fila con la tecla `abajo`.

##### Configurando nuestros paneles

* posición predeterminada

```js
angular.module('main-application')
.controller('custom-vertical-controller', [
  '$scope', 
  'tac.navigable.extensible', 
  'tac.navigable.panel.extender', 
  function($scope, extensible, extender) {
    $scope.navigable = extensible.create_vertical('application left top')
      .set_priority(2)
      .bind_to($scope);
    extender.process_default_navigation($scope.navigable, {
      'from':{
        'down':'last'
      }, 
      'default':'first'
    });
  }
]);
```

```html
<div class="information-container"
  ng-controller="tac.navigable.vertical"
  identifier="application left top"
  priority="2"
  default-navigation="{'from':{'down':'last'}, 'default':'first'}">
  ...
</div>

```

Los dos *controllers* anteriores son análogos. Verticales, con posición `2` sobre su panel padre y con la misma navegación predeterminada.

La `navegación predeterminada` define el comportamiento de la navegación con respecto al estado anterior del arbol general.
De forma predeterminada los paneles tienen 'memoria', es decir que pueden volver a activar su último nodo activo. La navegación predeterminada impide que lo haga en ciertos contextos.
En los ejemplos provistos, el atributo `default:first` define que el primer elemento será activado cuando la navegación se posicione sobre el panel.
También se puede configurar el comportamiento del panel según la acción en cuestión.
En el ejemplo anterior si el elemento seleccionado anterior estaba debajo del panel actual, se seleccionará el último elemento del mismo.


* remove-on-destroy

Para optimizar el procesamiento los componentes del arbol no se eliminan automaticamente. Si así lo hicieses, al remover una rama de 15 elementos se produciría la misma cantidad de acciones de *remove*.
En cambio, se puede agregar un valor *flag* al componente para que la aplicación lo remueva cuando su correspondiente vista sea eliminada.


```html
<button class="search-submit" 
  type="submit" 
  navigable-leaf="1"
  navigable-leaf-id="search-submit"
  navigable-leaf-class="hover" 
  remove-on-destroy="true">
  Search
</button>
```

```js
angular.module('main-application')
.controller('custom-vertical-controller', [
  '$scope', 
  'tac.navigable.extensible', 
  function($scope, extensible) {
    $scope.navigable = extensible.create_vertical('application left top')
      .set_priority(2)
      .remove_on_destroy()
      .bind_to($scope);
  }
]);
```

Esta funcionalidad está disponible para los paneles y para los componentes `navigable-leaf`.

* on_change

Los componentes **panel** son observables, se puede asociar un comportamiento, o varios, a los cambios sobre un panel.

```js
$scope.navigable.on_change(
  function(){
    $scope.some_control();
  }
);
```

## Licencia

No disponible aún.
