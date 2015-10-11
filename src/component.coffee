'use strict'

angular.module('module.tac.navigable')

.factory('tac.navigable.extensible', [
  '$rootScope'
  ($rootScope) ->
    
    log_mode = false
    
    log_action = (component, action)->    
      if log_mode then console.log component.identifier + ' handle ' + action
      true
      
    log_creation = (component, action)->    
      if log_mode then console.log component.identifier + ' creation '
      true
    
    initial_handlers = ()->
      up: -> false
      down: -> false
      left: -> false
      right: -> false
      enter: -> false
    
    create_basic : (identifier)->
      log_creation this
      on_change_callbacks = []
      
      identifier: identifier
      
      root: ->
        @parent.root()
        
      bind_on_destroy: (self)->
        remove = self.scope.$on '$destroy', -> 
          remove()
          self.parent.remove self
      
      remove_on_destroy: ->
        if not @scope
          @remove_on_destroy_flag = true
        else
          @bind_on_destroy this
        this
          
      set_priority:(priority)->
        @priority = priority
        this
      
      on_change: (callback)->
        on_change_callbacks.push callback
        -> _.remove on_change_callbacks, callback
        
      after_change: ->
        for on_change_callback in on_change_callbacks
          on_change_callback(this)
      
      safe_apply: (scope)->
        phase = $rootScope.$$phase;
        if phase isnt '$apply' and phase isnt '$digest'
          scope.$apply()
          
      apply:->
        
      remove_child_components: ->
        @components.length = 0
        @current_component = null
        this
      
      bind_to: (scope, skip_add_to_parent) ->
        self = this
        @scope = scope
        skip_add_to_parent || scope.$parent.add_navigable_component(this)
        @apply = -> @safe_apply scope
        scope.add_navigable_component = (component, index)-> self.add(component, index)
        scope.remove_navigable_component = (component)-> self.remove(component)
        if @remove_on_destroy_flag
          @bind_on_destroy this
        this
        
      set_current_in_background: (child_component)->
        @current_component = child_component
        @after_change()
        
      set_current_component: (child_component, percolate_up)->
        last_component = @current_component
        has_set = child_component.set_active(percolate_up)
        if has_set
          @current_component = child_component
          if last_component and (last_component isnt child_component)
            last_component.set_not_active()
        has_set

      set_active_down_to_up: (child_component, changed_child)->
        @active = true
        hast_to_change = @current_component isnt child_component
        if hast_to_change
          @set_current_component child_component
        if changed_child
          if hast_to_change or @parent.current_component isnt this
            @parent.set_active_down_to_up this, true
          else
            @apply()
        
      set_first_child: ->   
        has_set = false   
        child_index = 0
        while not has_set and child_index < @components.length
          has_set = @set_current_component @components[child_index]
          child_index += 1
        has_set
      
      set_last_child: ->
        has_set = false
        child_index = @components.length-1
        while not has_set and child_index >= 0
          has_set = @set_current_component @components[child_index]
          child_index -= 1
        has_set
        
      set_previous_child: ->
        @current_component and @set_current_component @current_component
        
      set_some_child: ->
        @set_previous_child() or @set_first_child()
      
      set_active: (percolate_up, skip_set_child)->
        if not @active
          if skip_set_child 
            @active = true
          else
            @active = @set_some_child()
        percolate_up and @parent.set_active_down_to_up this, true
        @active
        
      set_not_active: (percolate_up)->
        @active = false
        if @current_component then @current_component.set_not_active()
        if percolate_up then @parent.set_not_active true
          
      add: (new_component, index)->
        if @components.indexOf(new_component) > -1
          console.error "trying to add same element twice [" + new_component.identifier + "]" 
        else
          new_component.parent = this
          new_component.priority = new_component.priority or index or 0
          position = 0
          for component in @components
            if component.priority < new_component.priority
              position += 1
          @components.splice(position, 0, new_component)
        
      remove: (component) -> 
        _.remove @components, component
        if @current_component is component
          @current_component = null
          @set_not_active true
      
      handle_on_selected:(key)->
        @selected and @selected.handle key
        
      handle_inner: (key)->
        handler = @handlers[key]
        has_handle = handler and handler(this) 
        if has_handle 
          #@parent.set_active_down_to_up this
          @after_change()
        has_handle
        
      handle_by_child: (key)->
        @current_component and
        @current_component.handle(key)
        
      handle: (key)->
        @handle_by_child(key) or
        @handle_inner(key)
      
      current_index: -> 
        @components.indexOf @current_component
      
      last_index: -> 
        @components.length - 1
      
      initialize:()->
        @components = []
        @handlers = initial_handlers()
        this
      
      and_extend:(extensions)->
        @handlers = angular.extend @handlers, extensions
        this
        
      go_forward:(amount)->
        current_index = @current_index()
        last_index = @last_index()
        if current_index > -1 and (current_index + amount) <= last_index
          set = @set_current_component @components[current_index+amount]
          @apply()
          return set
        false
        
      go_back:(amount)->
        current_index = @current_index()
        if current_index > -1 and (current_index - amount)  >= 0
          set = @set_current_component @components[current_index-amount]
          @apply()
          return set
        false
        
      previous_activable:(amount)->
        next_index = @current_index() - 1
        last_index = 0
        has_set = false
        while (not has_set) and (next_index >= last_index)
          has_set = @set_current_component @components[next_index]
          next_index -= 1
        has_set and @apply()
        has_set
      
      next_activable:()->
        next_index = @current_index() + 1
        last_index = @last_index()
        has_set = false
        while (not has_set) and (next_index <= last_index)
          has_set = @set_current_component @components[next_index]
          next_index += 1
        has_set and @apply()
        has_set
    
    create_horizontal: (identifier)-> @create_basic(identifier).initialize().and_extend
      left: (self)->
        self.previous_activable()
      right: (self)->
        self.next_activable()
    
    create_vertical: (identifier)-> @create_basic(identifier).initialize().and_extend 
      up: (self)->
        self.previous_activable()
      down: (self)->
        self.next_activable()
        
    create_multiline: (identifier, line_length)-> @create_basic(identifier).initialize().and_extend 
      left: (self)->
        if self.current_index() % line_length isnt 0 then self.previous_activable() else false
      right: (self)->
        if (self.current_index() + 1) % line_length isnt 0 then self.next_activable() else false
      up: (self)->
        self.go_back line_length
      down: (self)->
        self.go_forward line_length
    
    
])