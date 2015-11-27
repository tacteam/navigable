'use strict'

angular.module('module.tac.navigable')

.factory('tac.navigable.root',[
  'tac.navigable.component'
  'tac.navigable.fail'
  (component, failS)->(identifier)->
    
    root_component = component.basic(identifier).initialize()
    
    root_component.fail = ()->
      failS.process()
      false
    
    root_component.handle_inner = (code)->
      not @active and
      not _.isEmpty(@components) and
      @set_child_active() or @fail()
        
    root_component.root = ()->
      this
      
    root_component.dump = ()->
      concat = (memo, index)-> memo + ' '
      indent = (amount)-> _.reduce([1 .. amount], concat, '')
      dump = (level)->(component)-> 
        index = if typeof component.priority is 'undefined' then '' else component.priority
        active = if component.active then ' <active>' else ''
        console.log indent(level) + component.identifier + ' [' + index + ']' + active
        _.each component.components, dump(level+2)
      dump(2)(this)
      
    root_component.handle = (code)->
      @last_action = code.key
      @handle_by_child(code) or
      @handle_inner(code)
              
    root_component.set_child_active = ()-> 
      child_index = 0
      while not @active and child_index < @components.length
        @set_active @set_current_component @components[child_index]
        child_index += 1
      if @active then @current_component.apply()
      @active
      
    root_component.activate_down_to_up = (child_component, changed_child)->
      @set_active true
      @set_current_component child_component
      if changed_child
        @apply()
    
    root_component.deactivate = () ->
      @set_active false
      if @current_component then @current_component.deactivate()
      
    root_component.bind_to = (scope) ->
      self = this
      scope.add_navigable_component = (component, index)->
        self.add(component, index)
      this
      
    root_component.resize = -> 
    
    root_component
  
])

.controller('tac.navigable.root', [
  '$rootScope'
  '$scope'
  '$element'
  '$attrs'
  'tac.keys'
  'tac.navigable.root'
  ($rootScope, $scope, $element, $attrs, keys, root) ->
    
    identifier = $attrs.navigableRoot or 'root'
    component = root(identifier)
    #$rootScope.$on '$routeChangeStart', -> component.deactivate()
    keys.create_level()
    component.bind_to($scope)
    keys.subscribe component
    remove = $scope.$on '$destroy', -> 
      remove()
      keys.unsubscribe component
      keys.previous_level()
      
])

.directive('navigableRoot', [
  ()->
    scope: true
    restrict: 'A'
    priority: 501
    controller:'tac.navigable.root'
])




