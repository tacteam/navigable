'use strict'

angular.module('module.tac.navigable')

.factory('tac.navigable.component', [
  '$rootScope'
  'tac.navigable.common'
  '$timeout'
  ($rootScope, common, $timeout) ->
    
    initial_handlers = ()->
      up: -> false
      down: -> false
      left: -> false
      right: -> false
      enter: -> false
      
    basic : (identifier)-> 
      on_change_callbacks   = []
      removed = false
      sort_request = false
      
      common.navigable  
        identifier: identifier
        on_change:    common.appender on_change_callbacks
        after_change: common.eval_all(on_change_callbacks)(this)
        
        mark_removed: ->
          removed = true
          component.mark_removed() for component in @components
      
        bind_on_destroy: (self)->
          self.unbind_destroy = self.scope.$on '$destroy', -> 
            self.unbind_destroy()
            if not removed
              self.mark_removed()
              self.pull_out()
              
        sort_components: ->
          @components.sort (a, b)->
            if a.priority > b.priority then 1
            else if b.priority > a.priority then -1
            else 0
        
        sort_next_time: ->
          if sort_request then return true
          self = this
          sort_request = true
          next_time = ->
            self.sort_components()
            sort_request = false
          $timeout next_time, 1
              
        unbind_destroy: ->
          
        remove_on_destroy: ->
          @remove_on_destroy_flag = true
          if @scope
            @bind_on_destroy this
          this
            
        set_priority:(priority)->
          @priority = priority
          this
        
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
          if @remove_on_destroy_flag
            @bind_on_destroy this
          this
          
        set_current_in_background: (child_component)->
          @current_component = child_component
          @after_change()
          
        set_current_component: (child_component, percolate_up)->
          last_component = @current_component
          has_set = child_component.activate(percolate_up)
          if has_set
            @current_component = child_component
            if last_component and (last_component isnt child_component)
              last_component.deactivate()
          has_set
  
        activate_down_to_up: (child_component, changed_child)->
          @set_active true
          hast_to_change = @current_component isnt child_component
          if hast_to_change
            @set_current_component child_component
          if changed_child
            if hast_to_change or @parent.current_component isnt this
              @parent.activate_down_to_up this, true
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
        
        activate: (percolate_up, skip_set_child)->
          if not @active
            if skip_set_child 
              @set_active true
            else
              has_set = @set_some_child()
              @set_active has_set
          percolate_up and @parent.activate_down_to_up this, true
          @active
          
        deactivate: (percolate_up)->
          @set_active false
          if @current_component then @current_component.deactivate()
          if percolate_up then @parent.deactivate true
            
        add: (new_component, index)->
          if @components.indexOf(new_component) > -1
            console.error "trying to add same element twice [" + new_component.identifier + "]" 
          else
            new_component.parent = this
            if typeof new_component.priority is 'undefined'
              unless typeof index is 'undefined'
                new_component.priority = index
              else
                new_component.priority = @components.length
                if @components.length > 0
                  last = @components[@components.length-1]
                  if last.priority > new_component.priority
                    new_component.priority = last.priority + 1
                  
            position = 0
            for component in @components
              if component.priority < new_component.priority
                position += 1
            @components.splice(position, 0, new_component)
            
        resize: (options)-> @parent.resize(options)
          
        remove: (component) -> 
          common.remove @components, component
          if @current_component is component
            @current_component = null
            @active and @deactivate true
        
        handle_on_selected:(code)->
          @selected and @selected.handle code
          
        handle_inner: (code)->
          handler = @handlers[code.key]
          has_handle = handler and handler(code, this) 
          if has_handle 
            @after_change()
          has_handle
          
        handle_by_child: (code)->
          @current_component and
          @current_component.handle(code)
          
        handle: (code)->
          @handle_by_child(code) or
          @handle_inner(code)
        
        current_index: -> 
          @components.indexOf @current_component
        
        last_index: -> 
          @components.length - 1
        
        initialize:()->
          @components = []
          @handlers = initial_handlers()
          @on_update (options)-> 
            options = options or {}
            if options.percolate_current
              @current_component and @current_component.update(options)
            if options.percolate_children
              for components in @components
                components.update(options)
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
    
    horizontal: (identifier)-> 
      self = @basic(identifier).initialize().and_extend
        left: (code, owner)->
          owner.previous_activable()
        right: (code, owner)->
          owner.next_activable()
      self.horizontal = true
      self
      
    vertical: (identifier)-> 
      self = @basic(identifier).initialize().and_extend
        up: (code, owner)->
          owner.previous_activable()
        down: (code, owner)->
          owner.next_activable()
      self.vertical = true
      self
        
    multiline: (identifier, line_length)-> 
      unless typeof line_length is 'number'
        line_length = parseInt(line_length or 0)
      self = @basic(identifier).initialize().and_extend 
        left: (code, owner)->
          if owner.current_index() % line_length isnt 0 then owner.previous_activable() else false
        right: (code, owner)->
          if (owner.current_index() + 1) % line_length isnt 0 then owner.next_activable() else false
        up: (code, owner)->
          owner.go_back line_length
        down: (code, owner)->
          owner.go_forward line_length
      self.vertical = self.multiline = self.horizontal = true
      self
    
])