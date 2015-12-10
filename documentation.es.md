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

Tenga en cuenta que **tac.navigable** depende de los componentes
[**tac.keys**](https://github.com/tacteam/keys) y 
[**tac.navigable**](https://github.com/tacteam/navigable). 
Asegúrese de que estén presentes.

##### Inicialización del componente

```js
angular.module('main-application')
.run([
  '$rootScope',
  'tac.keys',
  function($rootScope, keys) {
	keys.bind_keydown(document);
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
**tac.team** aprovechó esta característica para hacer más amigable la tarea y desarrolló un conjunto de nuevas *directives*.

#### navigable-root

```html
<html>
  <head>
  </head>
  <body ng-app="application" navigable-root="root de navegacion">
  </body>
</html>
```

El atributo `navigable-root` convierte al elemento DOM en la raíz de navegación, lo eventos se inciarán en este componente y fluirán a travez de los hijos del mismo.
Sin este atributo la navegación no puede ser inicializada y se generará un conjunto de errores en consola.

#### navigable-leaf

```html
<button class="search-submit"
  type="submit"
  navigable-leaf="boton ejecucion busqueda"
  navigable-priority="0"
  >
  Search
</button>
```

Agregar el atributo `navigable-leaf` a un elemento html lo convierte automáticamente en un hoja de navegación, o sea un nodo seleccionable.    
El valor de dicho atributo denota el identificador del nodo de navegación, el mismo es útil, por ejemplo, para encotrar errores dentro del arbol.     
`navigable-priority` determina la posición que ocupará el elemento dentro de su panel padre. Si este atributo no esta presente, se intentará obtener el atributo `$index`, generado dentro de los `ng-repeat` de Angular.js.    


#### navigable-model

```html
<a class="buttons-link"
    ng-repeat="button in buttons" 
    navigable-leaf="button"
    navigable-model="button"
    ng-href="#{{button.href}}"
    >
    {{button.name}}
</a>
```

`navigable-model` permite asociar el componente navegable a un elemento dentro del scope actual.
Uno de los casos mas comunes es donde queremos obtenerlo dentro de una lista asociada a un `ng-repeat`.
La aplicación agrega a cada objeto *model* dentro de la colección un atributo `navigable` que hace referencia al componente navegable.
En el ejemplo podemos ver que junto con la *directive* `ng-class` se puede agregar clases css dependiendo del valor de navigable.active.

### navigable-leaf-class

Se utiliza CSS para comunicar al usuario el flujo de la navegación.    
De esta forma, cada vez que un elemento se activa, se agrega la clase CSS 'hover' al elemento del DOM.   
`navigable-leaf-class` sobrescribe la clase CSS predeterminada.

```html
<a class="buttons-link"
    ng-repeat="button in buttons" 
    navigable-leaf="button"
    ng-class="{activo: navigable.active}"
    navigable-leaf-class="seleccionado"
    ng-href="#{{button.href}}"
    >
    {{button.name}}
</a>
```

En este caso se agregaran 2 clases CSS al activarse el componente

* **activo** por `ng-class`
* **seleccionado** por `navigable-leaf-class`

### order-by

Como se explicó anteriormente, para generar elementos navegables dentro de un `ng-repeat` solo es necesario agregar el componente navegable dentro del template.
Automaticamente el arbol de navegación copiará el orden de los elementos en la vista.    
Ante un cambio de ordenamiento, los componentes detectan el cambio, actualizan su prioridad y se reordenan en el siguiente **update** javascript.

### ng-click

La tecla ***enter*** arroja un evento de ***click*** sobre el elemento DOM asociado al componente de navegación.    
Gracias a esto, podemos utilizar la directive `ng-click` de Angular para ejecutar comportamientos sobre nuestro $scope.
Si el componente actual de la navegación es un enlace de tipo `<a>`, la acción ***enter*** redireccionará la aplicación correctamente.

#### Paneles

Los paneles generan un nuevo $scope angular y es posible agregarlos con atributos HTML.

##### Paneles predeterminados

```html
<div class="information-container"
  navigable-vertical="application left"
  navigable-priority="0">
  <div class="information-header"
    navigable-horizontal="application left top"
    ng-controller="information.header"
    navigable-priority="0">
  </div>
  <div class="information-body"
    navigable-horizontal="application left center"
    ng-controller="information.body"
    navigable-priority="1">
  </div>
</div>
```

`tac.navigable.vertical` y `tac.navigable.horizontal` son controllers con una prioridad mayor a los predeterminados de Angular que agregan el comportamiento de paneles a nuestra aplicación, la diferencia entre los mismos es que uno responde a las acciones verticales (arriba, abajo) y el otro a las horizontales (derecha, izquierda)
Los paneles se pueden anidar, y por lo tanto también poseen una posición dentro de su panel padre. Esta posición se indica con el atributo `navigable-priority`.

##### Convertir nuestros *controllers* en paneles navegables

Es posible también crear nuestros componentes navegables de forma programática.

```js
angular.module('main-application')
.controller('custom-vertical-controller', [
  '$scope', 
  'tac.navigable.component', 
  function($scope, component) {
    $scope.navigable = component.vertical('application left top')
      .set_priority(2)
      .bind_to($scope);
      
    $scope.navigable.handlers.backspace = function(code, action){
      alert('No se puede volver atras.')
    };
  }
]);
```

Y como podemos ver en el ejemplo, agregar comportamiento a nuestro componente.   
Esto también es posible si nuestro scope fue armado como panel navegable en la plantilla HTML.    
En este último caso nuestro componente navegable se encontrará disponible en `$scope.navigable`

#### Paneles multilineales

En algunos casos se desea trabajar con un esquema de tabla o matriz. Este contexto esta cubierto por el *controller* **multiline** .

```js
angular.module('main-application')
.controller('custom-multiline-controller', [
  '$scope', 
  'tac.navigable.component', 
  function($scope, component) {
    $scope.navigable = component.multiline('matriz personalizada', 10)
      .set_priority(3)
      .bind_to($scope)
  }
]);
```

En este ejemplo de construye un panel multilinea de 10 elementos por linea.    
De esta manera se puede navegar, por ejemplo, del tercer elemento de la primer fila al tercer elemento de la segunda fila con la tecla `abajo`.

También se puede realizar esta configuración en la plantilla HTML.

```html
<div class="commands"
  ng-controller="information.commands"
  navigable-multiline="matriz de comandos"
  navigable-per-row="10"
  navigable-priority="3"
  >
  <div class="command"
    ng-repeat="command in commands"
    navigable-leaf="command"
    ng-click="command.action()"
    >
    {{command.name}}
  </div>
</div>
```

##### Paneles scope y acceso a modelos

Como se explicó anteriormente cada componente navegable genera su propio $childScope, esto genera un inconveniente de acceso al modelo desde la vista.    
Supongamos un input navegable con `ng-model="itemName"`.    
El elemento quedara asociado al **$scope** del componente navegable en lugar de modificar el atributo del scope provisto en nuestro controller general.    
Para solucionar este inconveniente se recomienda usar un sistema de ***namespaces***.    
Angular configura como prototype de cada scope a su scope padre, por lo que se puede obtener un atributo de cualquier scope padre accediendolo desde alguno de sus nodos.    

    scope.namespace.item = items[0]

En este ejemplo se generan dos acciones:    

* una de getter sobre scope para obtener el objeto namespace
* otra de setter para asignar el atributo item sobre namespace

Esta cualidad se puede aprovechar de la siguiente manera:

```html
<div navegable-vertical="formulario" ng-controller="producto.formulario">
  <input class="producto-input"
    navigable-leaf="producto modify input"
    navigable-priority="0"
    navigable-leaf-active="true"
    open-editor="tac.keyboard"
    placeholder="nombre"
    ng-model="producto.name"
  />
</div>

```

```js
angular.module('main-application')
.controller('producto.formulario', [
  '$scope', 
  function($scope) {
    $scope.producto = {};
  }
]);
```

Cuando el input emita un evento de *change* se asignará el nuevo valor como `name` del objeto `producto` en el scope del controlador.


#### Configurando nuestros paneles

##### posición predeterminada

```js
angular.module('main-application')
.controller('custom-vertical-controller', [
  '$scope', 
  'tac.navigable.component', 
  'tac.navigable.default.navigation', 
  function($scope, component, navigation) {
    $scope.navigable = component.vertical('application left top')
      .set_priority(2)
      .bind_to($scope);
    navigation.process($scope.navigable, {
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
  navigable-vertical="application left top"
  navigable-priority="2"
  navigation-defaults="{'from':{'down':'last'}, 'default':'first'}">
  ...
</div>

```

Los dos *controllers* anteriores son análogos. Verticales, con posición `2` sobre su panel padre y con la misma navegación predeterminada.

La `navegación predeterminada` define el comportamiento de la navegación con respecto al estado anterior del arbol general.
De forma predeterminada los paneles tienen 'memoria', es decir que pueden volver a activar su último nodo activo. La navegación predeterminada impide que lo haga en ciertos contextos.
En los ejemplos provistos, el atributo `default:first` define que el primer elemento será activado cuando la navegación se posicione sobre el panel.
También se puede configurar el comportamiento del panel según la acción en cuestión.
En el ejemplo anterior si el elemento seleccionado anterior estaba debajo del panel actual, se seleccionará el último elemento del mismo.



##### on_change 

Los componentes **panel** son observables sobre el cambio de nodo hijo activo, se puede asociar un comportamiento, o varios, a este tipo de cambio.

```js
$scope.navigable.on_change(
  function(){
    $scope.some_control();
  }
);
```

##### on_active on_deactive

Todos componentes son observables sobre su activacion o desactivacion y se puede asociar un comportamiento, o varios, a este tipo de cambio.

```js
$scope.navigable.on_active(
  function(){
    $scope.some_control();
  }
);
$scope.navigable.on_deactive(
  function(){
    $scope.other_control();
  }
);
```

##### navigable-on-active

El comportamiento de activacion tambien tiene su **directive** correspondiente, y permite ejecutar un procesamiento en el **controller** a travez de un atributo HTML.

```html
<a class="buttons-link"
    ng-repeat="button in buttons" 
    navigable-leaf="button"
    navigable-on-active="$scope.description = button.description"
    ng-href="#{{button.href}}"
    >
    {{button.name}}
</a>
```

En este ejemplo podemos mostrar una descripcion global conforme el usuario navega sobre los botones.

##### navigable-leaf-active-once navigable-leaf-active 

Estas **directives** permiten posicionar la navegación sobre un componente, validando una condición en el controlador.    
La diferencia entre ambas es que una se procesa solo cuando la hoja es creada y la otra cada vez que se efectúa un **$apply** sobre el **$scope**.    
Además se tiene que cumplir la condición de que no haya otro nodo seleccionado.    
Esta última validación se puede obviar agregando el atributo `navigable-leaf-active-force` con un valor verdadero

```html
<a class="etiqueta-name selectable-label"
  navigable-leaf="etiqueta name {{categoria.etiqueta.name}}"
  navigable-leaf-active-once="categorias.indexOf(categoria) == 0"
  navigable-leaf-active="selected == categorias"
  navigable-priority="0"
  ng-click="categoria.collapse = !categoria.collapse"
  href 
>
```

##### navigable-current

Similar a `navigable-leaf-active` esta directive convirte al componente en hijo actual de su panel padre, pero sin convertirlo en nodo activo general.    
Esto permite por ejemplo que cuando el panel padre sea activado, el hijo cuya condición *navigable-current* es verdadera se activara también.    
En el caso de un panel *scrolleable* se ejecutara el posicionaminto del *viewport* sobre le *navigable-current* al crearse la vista asociada.

##### navigable-pull-out

Esta *directive* permite excluir temporalmente un componente del arbol, análogo al `ng-hide` de Angular, valida una condición en el scope actual en cada actualización del mismo, excluyendo o insertando el componente segun el valor de verdad.    

```html
<a class="label"
  navigable-leaf="etiqueta name {{categoria.etiqueta.name}}"
  navigable-pull-out="categoria.hidden"
  ng-show="!categoria.hidden"
>
```

##### navigable-destroy

Los componentes del arbol se eliminan automáticamente.    
Cuando un rama del DOM es eliminada todos los nodos se desprenden de sus nodos padres. 
Al remover una rama de 15 elementos se produce la misma cantidad de acciones de *remove*, lo que significa un procesamiento pesado para la plataforma.       
Para optimizar la aplicación se puede configurar y permitir que solo algunas nodos se desprendan de sus padres.
Así, por ejemeplo si sabemos que las páginas de una aplicación se conserven intactas hasta ser eliminadas, podemos hacer que solo el primer elemento dentro del `ng-view` se desprenda del arbol.

Para empezar debemos deshabilitar el **autoremove**.

```js
angular.module('main-application')
.run([
  '$rootScope',
  'tac.keys',
  'tac.navigable.options',
  function($rootScope, keys, nav_options) {
	keys.bind_keydown(document);
	nav_options.autoremove = false;
  }
])
```

Luego marcar los elementos que se deben desprender del arbol cuando su vista asociada sea destruida.

* Mediante atributos:
```html
<button class="search-submit" 
  type="submit" 
  navigable-leaf="1"
  navigable-leaf-id="search-submit"
  navigable-leaf-class="hover" 
  navigable-destroy="true">
  Search
</button>
```

* Programáticamente:
```js
angular.module('main-application')
.controller('custom-vertical-controller', [
  '$scope', 
  'tac.navigable.component', 
  function($scope, component) {
    $scope.navigable = component.vertical('application left top')
      .set_priority(2)
      .remove_on_destroy()
      .bind_to($scope);
  }
]);
```

### Modals

**tac.navigation** provee su propio servicio para desplegar ventanas modales en la pantalla.    
`tac.navigation.modal` respeta la interfaz del servicio $modal de angular-bootstrap.    

```js
angular.module('main-application')
.controller('custom-controller', [
  '$scope', 
  'tac.navigable.modal', 
  function($scope, modal) {
    $scope.modificar = function(container) {
      $modalInstance = modal.open({
        windowClass: 'create-dialog',
        templateUrl: 'site/views/modals/create.html',
        controller:  'modal.create',
        backdrop:    'static',
        resolve: {
          container: function() {
            return container;
          }
        }
      });
      $modalInstance.result.then function() {
        if(container.item){
          console.log('el item fué modificado');
        }
        else{
          console.log('el item fué eliminado');
        }
      };
    };
  }
]);
```

El servicio inicializa un nuevo root de navegación, por lo que no es necesario incluir la directive `navigable-root`.
En el controller de la ventana modal podemos inyectar '$modalInstance' que hace referencia a la ventana modal, y nos permite controlarla.

### Scroll automático

Para aumentar el rendimiento de las aplicaciones **tacteam** desarrolló un conjunto de componentes que permiten configurar la navegación y hacerla *auto-scrolleable*.
Cómo funciona esto:
Los paneles se pueden registrar como cuadros de *scrolling*.
Todos los componentes pueden registrarse para ser posicionados automáticamente dentro de un cuadro cuando se activen.

```html
<div class="etiqueta-viewport"
  navigable-vertical="categorias"
  navigable-scroll-frame="categorias-frame">
  <a class="etiqueta-container"
    ng-repeat="categoria in categorias"
    navigable-leaf="categoria"
    navigable-scroll-from="categorias-frame"
    ng-click="categoria.collapse = !categoria.collapse"
    >
    <span
      ng-class="{collapse: categoria.collapse}"
      navigable-resizable="true"
      >
      {{categoria.description}}
    </span>
    {{categoria.name}}
  </a>
</div>
```

Las *directives* `navigable-scroll-frame` y `navigable-scroll-from` configuran los componentes para que al activarse cada uno de los *links*, se efectúe la animación correspondiente sobre la propiedad ***topScroll*** del `div` padre hasta la posicion donde el enlace sea visible completamente.
`navigable-resizable` detecta el cambio sobre las clases css del elemento y notifica al componente de navegación mas cercano para comprobar si es necesario un posicionamiento de la vista y realizar la animación correspondiente.

### Debugg

En cualquier momento el arbol de navegación puede ser impreso en consola presionando la combinación de teclas `ctrl + d`

##### *features* pendientes

* navigable-notify-creation
* multiline defaults
* colspan en multiline

## Licencia

No disponible aún.
