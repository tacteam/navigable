
angular.module('module.tac.navigable')

.service('tac.navigable.options',[
  ()->
    autoremove: true
])

.directive('navigableDestroy', [
  'tac.navigable.options'
  (options)->
    scope: true
    restrict: 'A'
    link:(scope, element, attrs)->
      if not options.autoremove
        $scope.navigable.remove_on_destroy()
])

.directive('navigableLeafActiveOnce', [
  '$parse'
  ($parse)->
    scope: true
    restrict: 'A'
    link:(scope, element, attrs)->
      active_condition = attrs.navigableLeafActiveOnce
      if active_condition and $parse(active_condition)(scope)
        root = scope.navigable.root()
        if attrs.navigableLeafActiveForce or not root.active
          scope.navigable.make_active()
])

.directive('navigableLeafActive', [
  '$parse'
  ($parse)->
    scope: true
    restrict: 'A'
    link:(scope, element, attrs)->
      scope.$watch attrs.navigableLeafActive, (value)->
        if value 
          root = scope.navigable.root()
          if attrs.navigableLeafActiveForce or not root.active
            scope.navigable.make_active()
])

.directive('navigableCurrent', [
  '$parse'
  ($parse)->
    scope: true
    restrict: 'A'
    link:(scope, element, attrs)->
      current_condition = attrs.navigableCurrent
      if current_condition and $parse(current_condition)(scope)
        scope.navigable.become_current()
])

.directive('navigableModel', [
  '$parse'
  ($parse)->
    restrict: 'A'
    link:(scope, element, attrs)->
      model = $parse(attrs.navigableModel) scope
      model and (model.navigable = scope.navigable)
])

.directive('navigableScrollFrom', [
  'tac.navigable.scroll'
  (scroll)->
    scope: true
    restrict: 'A'
    link:(scope, element, attrs)->
      scroll.register_child(scope.navigable, attrs.navigableScrollFrom, element)
])

.directive('navigableScrollFrame', [
  'tac.navigable.scroll'
  (scroll)->
    scope: true
    restrict: 'A'
    link:(scope, element, attrs)->
      scroll.register_parent(scope.navigable, attrs.navigableScrollFrame, element)
])

.directive('navigablePullOut', [
  'tac.navigable.scroll'
  (scroll)->
    scope: true
    restrict: 'A'
    multiElement: true
    link: (scope, element, attr)->
      pulled_out = false
      scope.$watch attr.navigablePullOut, (value)->
        if value and not pulled_out
          pulled_out = true
          scope.navigable.pull_out()
        if not value and pulled_out
          pulled_out = false
          scope.navigable.integrate()
          
])

#TODO notificar a una serie de componentes padres por id
#evita el uso inncesario de eventos
.directive('navigableNotifyCreation', [
  ()->
    scope: true
    restrict: 'A'
    multiElement: true
    link: (scope, element, attr)->
      scope.child_added(scope.navigable)
])

.directive('navigableOnActive', [
  '$parse'
  ($parse)->
    scope: true
    restrict: 'A'
    multiElement: true
    link: (scope, element, attrs)->
      scope.navigable.on_active ->
        $parse(attrs.navigableOnActive) scope
        
])

.directive('navigableResizable', [
  '$timeout'
  'tac.navigable.scroll'
  ($timeout, scroll)->
    
    events_names = do ->
      result = []
      capitalized = 'webkit Webkit Moz O ms MS Khtml'.split(' ')
      lowercase   = 'webkit o'.split(' ')
      event_names = ['Animation', 'Transition']
      for event_name in event_names
        result.push event_name.toLowerCase() + 'end'
        for prefix in capitalized
          result.push prefix + event_name + 'End'
        for prefix in lowercase
          result.push prefix.toLowerCase() + event_name.toLowerCase() + 'end'
      result
      
    #to visualize event keys
    #console.log events_names.join('\n')
    
    horizontal   = key: 'horizontal'
    vertical     = key: 'vertical'
    
    scope: true
    restrict: 'A'
    multiElement: true
    link: (scope, element, attr)->
      
      element.on events_names.join(' '), (jqevent)->
        if jqevent.target is element[0]
          property = jqevent.originalEvent.propertyName
          if _.contains ['width', 'max-width'], property
            scope.navigable.resize(horizontal)
          if _.contains ['height', 'max-height'], property
            scope.navigable.resize(vertical)
            
      element.attrchange
        trackValues: true
        callback: (evnt)->
          if evnt.attributeName is 'class'
            scope.navigable.resize()
      
])


