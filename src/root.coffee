'use strict'

angular.module('module.tac.navigable')

.factory('tac.navigable.root',[
  'tac.navigable.extensible'
  'tac.navigable.fail.service'
  (extensible, failS)->(identifier)->
    
    root_component = extensible.create_basic(identifier).initialize()
    
    root_component.fail = ()->
      failS.process()
      false
    
    root_component.handle_inner = (key)->
      not @active and
      not _.isEmpty(@components) and
      @set_child_active() or @fail()
        
    root_component.root = ()->
      this
      
    root_component.handle = (code)->
      key = if code.is_number then 'number_' + code.number else code.key
      @last_action = key
      @handle_by_child(key) or
      @handle_inner(key)
              
    root_component.set_child_active = ()-> 
      child_index = 0
      while not @active and child_index < @components.length
        @active = @set_current_component @components[child_index]
        child_index += 1
      if @active then @current_component.apply()
      @active
      
    root_component.set_active_down_to_up = (child_component, changed_child)->
      @active = true
      @set_current_component child_component
      if changed_child
        @apply()
    
    root_component.set_not_active = () ->
      @active = false
      if @current_component then @current_component.set_not_active()
      
    root_component.bind_to = (scope) ->
      self = this
      scope.add_navigable_component = (component, index)->
        self.add(component, index)
      this
      
    root_component
  
])

.factory('tac.navigable.root.main', [
  '$rootScope'
  'tac.navigable.root'
  ($rootScope, root_component) ->
    
    root_service = root_component('root')
    $rootScope.$on '$routeChangeStart', -> root_service.set_not_active()
    root_service
    
])
