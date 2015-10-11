'use strict'

angular.module('module.tac.navigable')

.factory('tac.navigable.panel.extender', [
  () ->
    opposite = 
      up: 'down'
      down: 'up'
      right: 'left'
      left: 'right'
      
    process_default_navigation:(navigable, config)->
      navigable.set_some_child = ->
        last_action = @root().last_action
        move_from = opposite[last_action]
        for from_key, child_priority of config.from
          if move_from is from_key
            return @['set_' + child_priority + '_child']()
        if config.default 
          return @['set_' + config.default + '_child']()
        @set_first_child()
      
    process_default_navigation_string:(navigable, defaultNavigationString)->
      if defaultNavigationString
        @process_default_navigation navigable, JSON.parse defaultNavigationString.replace(/'/g, '"')
        
])

.factory('tac.navigable.panel', [
  '$parse'
  'tac.navigable.panel.extender'
  ($parse, extender) ->
    (component, $scope, $attrs) ->
      index = $attrs.priority
      if $attrs.priorityModel
        index = ($parse $attrs.priorityModel) $scope
      component.set_priority(index)
      extender.process_default_navigation_string component, $attrs.defaultNavigation
      component
])

.controller('tac.navigable.vertical', [
  '$scope'
  '$attrs'
  'tac.navigable.extensible'
  'tac.navigable.panel'
  ($scope, $attrs, extensible, panel) ->
    $scope.navigable = panel(extensible.create_vertical($attrs.identifier), $scope, $attrs)
      .bind_to $scope
    
])

.controller('tac.navigable.horizontal', [
  '$scope'
  '$attrs'
  'tac.navigable.extensible'
  'tac.navigable.panel'
  ($scope, $attrs, extensible, panel) ->
    $scope.navigable = panel(extensible.create_horizontal($attrs.identifier), $scope, $attrs)
      .bind_to $scope
    
])
