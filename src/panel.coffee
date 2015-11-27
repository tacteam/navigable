'use strict'

angular.module('module.tac.navigable')

.factory('tac.navigable.default.navigation', [
  () ->
    
    opposite = 
      up:    'down'
      down:  'up'
      left:  'right'
      right: 'left'

    process:(navigable, config)->
      navigable.set_some_child = ->
        last_action = @root().last_action
        move_from = opposite[last_action]
        for from_key, child_priority of config.from
          if move_from is from_key
            return @['set_' + child_priority + '_child']()
        if config.default 
          return @['set_' + config.default + '_child']()
        @set_first_child()

])

.factory('tac.navigable.panel', [
  '$parse'
  'tac.navigable.options'
  ($parse, options) ->
    (navigable, scope, attrs) ->
      if typeof attrs.navigablePriority is 'string'
        navigable.priority = attrs.navigablePriority
      else if typeof scope.$index is 'number'
        navigable.use_index scope
      navigable.bind_to(scope)
      if options.autoremove
        navigable.remove_on_destroy()
        
])

.controller('tac.navigable.vertical', [
  '$scope'
  '$element'
  '$attrs'
  'tac.navigable.component'
  'tac.navigable.panel'
  ($scope, $element, $attrs, component, panel) ->
    identifier = $attrs.navigableVertical
    $scope.navigable = panel(component.vertical(identifier), $scope, $attrs)
])

.controller('tac.navigable.horizontal', [
  '$scope'
  '$element'
  '$attrs'
  'tac.navigable.component'
  'tac.navigable.panel'
  ($scope, $element, $attrs, component, panel) ->
    identifier = $attrs.navigableHorizontal
    $scope.navigable = panel(component.horizontal(identifier), $scope, $attrs)
])

.controller('tac.navigable.multiline', [
  '$scope'
  '$element'
  '$attrs'
  'tac.navigable.component'
  'tac.navigable.panel'
  ($scope, $element, $attrs, component, panel) ->
    identifier = $attrs.navigableMultiline
    per_row = $attrs.navigablePerRow
    $scope.navigable = panel(component.multiline(identifier, per_row), $scope, $attrs)
])

.controller('tac.navigable.defaults', [
  '$scope'
  '$attrs'
  'tac.navigable.default.navigation'
  ($scope, $attrs, navigation) ->
    config = JSON.parse $attrs.navigableDefaults.replace(/'/g, '"')
    navigation.process $scope.navigable, config
])

.directive('navigableHorizontal', [
  ()->
    scope: true
    restrict: 'A'
    priority: 501
    controller:'tac.navigable.horizontal'
])

.directive('navigableVertical', [
  ()->
    scope: true
    restrict: 'A'
    priority: 501
    controller:'tac.navigable.vertical'
])

.directive('navigableMultiline', [
  ()->
    scope: true
    restrict: 'A'
    priority: 501
    controller:'tac.navigable.multiline'
])

.directive('navigableDefaults', [
  ()->
    scope: true
    restrict: 'A'
    priority: 500
    controller:'tac.navigable.defaults'
])






