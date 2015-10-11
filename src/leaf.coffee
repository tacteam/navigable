'use strict'

angular.module('module.tac.navigable')

.factory('tac.navigable.leaf', [
  '$injector'
  ($injector)->
    
    set_focus_behaviour = (navigable, element)->
      if element[0].type is 'text'
        navigable.on_active -> element[0].focus()
        navigable.on_not_active -> element[0].blur()
        
    process_editor_attr = (navigable, attrs, element)->
      if attrs.openEditor
        navigable.click = ->
          editorId = attrs.openEditor
          editorS = $injector.get(editorId)
          edition = editorS.edit element.val()
          edition.done (value)->
            element.val value
            element.trigger('input')
          edition.exit -> 
            navigable.set_active()
          
    run_calbacks = (callbacks, self)->
      for callback in callbacks
        callback self
    
    (element, attrs, clazz)->
      navigable =
        identifier: attrs.navigableLeafId
        handle: (key)->
          if key is 'enter'
            @click()
            return true
          false
        on_active_callbacks: []
        on_not_active_callbacks: []
        on_active: (callback)-> @on_active_callbacks.push callback
        on_not_active: (callback)-> @on_not_active_callbacks.push callback
        set_active: -> 
          run_calbacks @on_active_callbacks, this
          @active = true 
        set_not_active: -> 
          run_calbacks @on_not_active_callbacks, this
          @active = false
        set_navigable_link: (navigable_link)->
          @navigable_link = navigable_link
          set_focus_behaviour navigable, navigable_link
          @click = -> navigable_link.click()
        click: -> 
          element.click()
          true
        
      
      if clazz
        navigable.on_active -> element.addClass clazz
        navigable.on_not_active -> element.removeClass clazz
          
      set_focus_behaviour(navigable, element)
      process_editor_attr(navigable, attrs, element)
      
      navigable
          
])

.constant('tac.navigable.leaf.events',
  NAVIGABLE_PROCESSED: 'navigable_processed'
)

.directive('navigableLeafModel', [
  '$parse'
  'tac.navigable.leaf'
  'tac.navigable.leaf.events'
  ($parse, leaf, EVENTS) ->
    link: (scope, element, attrs) ->
      index = parseInt($parse('$index') scope)
      model = $parse(attrs.navigableLeafModel) scope
      component = leaf element, attrs
      model.navigable = component
      scope.add_navigable_component component, index
      scope.set_navigable_link = (navigable_link)-> component.set_navigable_link(navigable_link)
      scope.navigable_processed = true
      scope.$broadcast EVENTS.NAVIGABLE_PROCESSED
      scope.$emit EVENTS.NAVIGABLE_PROCESSED, model
      if attrs.removeOnDestroy
        scope.$on '$destroy', -> scope.remove_navigable_component component
      if attrs.navigableLeafActive
        component.parent.set_current_component component
        component.parent.set_active(true, true)
])

.directive('navigableLeaf', [
  '$parse'
  'tac.navigable.leaf'
  'tac.navigable.leaf.events'
  ($parse, leaf, EVENTS) ->
    link: (scope, element, attrs) ->
      component = leaf element, attrs, attrs.navigableLeafClass
      index = parseInt(attrs.navigableLeaf)
      if attrs.navigablePriorityModel
        index = ($parse attrs.navigablePriorityModel) scope
      scope.add_navigable_component component, index
      if attrs.navigableLeafActive
        component.parent.set_current_component component
        component.parent.set_active(true, true)
])

.directive('navigableLink', [
  '$parse'
  'tac.navigable.leaf.events'
  ($parse, EVENTS) ->
    
    link: (scope, element, attrs) ->
      if scope.navigable_processed
        scope.set_navigable_link element
      else
        scope.$on EVENTS.NAVIGABLE_PROCESSED, -> scope.set_navigable_link element
      
])
