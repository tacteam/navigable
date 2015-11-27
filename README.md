### TAC Development Guide

# tac-navigable 

The TAC team developed a set of components that makes it easy to convert a conventional site into an navigable by keyboard application.
**tac.navigable** is useful only in applications Angular.js, if well this can be added to other sites, it is not recommended.
It is clear that there are no-dynamic or less performant alternatives:

[nekman.keynavigator](http://nekman.github.io/keynavigator)    
[fullscreensitenavigation](http://fullscreensitenavigation.com)    
[deck.js](http://imakewebthings.com/deck.js)  

**tac.navigable** is optimized to avoid the misuse of events.
Most of the navigation systems are based on jQuery and perform extensive searches by class or identifier over the DOM tree to find selectable nodes.
This means that every action processing consumes a lot of platform resources, the bigger the site, the more complex processing.
**tac.navigable** generates a virtual tree navigation, linking the nodes as parents and children, in this way, to process an action, you only has to percolete over levels in search of the next available node, which involves minimal processing.

<a href="wiki/images/percolate.png?raw=true" title="percolate events system" alt="percolate events system" target="_blank">
  <img src="wiki/images/percolate.png?raw=true" width="200"/>
</a>

## Install

This repo is for distribution on `bower`. The source for this module is in the
[main TacTeam repo](https://github.com/tacteam/navigable).
Please file issues and pull requests against that repo.

### bower

You can install this package with `bower`.

```shell
bower install tac-navigable
```

Optionally you can add --save prefix to add package to bower.js

```shell
bower install tac-navigable --save
```

Then add a `<script>` to your `index.html`:

```html
<script src="/bower_components/tac-navigable/dist/navigable.js"></script>
```

##### Angular dependency

You must add the component identifier to Angular dependencies in order to load module into the application.

```js
angular.module('main-application',[
  '...dependencies...',
  'module.tac.navigable',
  '...dependencies...'
])
```

Note that **tac.navigable** depends on 
[**tac.keys**](https://github.com/tacteam/keys) and 
[**tac.navigation**](https://github.com/tacteam/navigation) components. 
Make sure these are present.

##### Initialize component

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

##### Documentation

Available only in spanish: 
<a href="documentation.es.md" title="spanish documentation" alt="spanish documentation">documentation</a>

## License

License is not available yet
