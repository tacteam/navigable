'use strict'

angular.module('module.tac.navigable')

.factory('tac.navigable.leaf', [
  '$injector'
  '$interpolate'
  'tac.keys'
  'tac.navigable.common'
  ($injector, $interpolate, keys, common)->
    
    text_types = ['text','search','password']
    text_tags  = ['TEXTAREA','INPUT']

    is_text_elem = (element)->
      (element.nodeType is 1 and _.contains(text_tags, element.nodeName)) and
      (not element.type or _.contains(text_types, element.type))
    
    process_text_leaf = (navigable, element)->
      dom_elem = element[0]
      if is_text_elem dom_elem
        navigable.on_update   -> dom_elem.focus()
        navigable.on_active   -> dom_elem.focus()
        navigable.on_inactive -> dom_elem.blur()
        navigable.handlers.back_space = -> 
          keys.allow_default_once()
    
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
            navigable.activate()
    
    (scope, element, attrs)->
      removed = false
      navigable = common.navigable
        identifier: $interpolate(attrs.navigableLeaf)(scope)
        handlers:
          enter: ->
            navigable.click()
            true
        handle: (code)->
          handler = @handlers[code.key]
          handler and handler(code) 
        root: -> @parent.root()
        resize: (options)-> @parent.resize(options)
        activate: (percolate_up)-> 
          percolate_up and @parent.activate_down_to_up this, true
          @set_active true 
          
        deactivate: -> 
          @set_active false
        click: -> 
          element.click()
          true
        unbind_destroy: ->
        remove_on_destroy: ->
          this.remove_on_destroy_flag = true
          this.unbind_destroy = scope.$on '$destroy', -> 
            navigable.unbind_destroy()
            not removed and navigable.pull_out()
        mark_removed: ->
          removed = true
      do ->  
        clazz = attrs.navigableLeafClass or 'hover'
        navigable.on_active -> element.addClass clazz
        navigable.on_inactive -> element.removeClass clazz
        
        process_text_leaf(navigable, element)
        process_editor_attr(navigable, attrs, element)
        
        if typeof attrs.navigablePriority is 'string'
          navigable.priority = parseInt(attrs.navigablePriority)
        else if typeof scope.$index is 'number'
          navigable.use_index scope
      
      navigable
      
])

.controller('tac.navigable.leaf',[
  '$scope'
  '$element'
  '$attrs'
  'tac.navigable.leaf'
  'tac.navigable.options'
  ($scope, $element, $attrs, leaf, options) ->
    
    component = leaf($scope, $element, $attrs)
    $scope.$parent.add_navigable_component component
    $scope.navigable = component
    if options.autoremove
      $scope.navigable.remove_on_destroy()
      
])

.directive('navigableLeaf', [
  () ->
    scope: true
    restrict: 'A'
    priority: 501
    controller: 'tac.navigable.leaf'
])

