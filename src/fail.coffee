'use strict'

angular.module('module.tac.navigable')

.service('tac.navigable.fail.service', [
  () ->
    callbacks = []
    
    on_fail: (callback)->
      callbacks.push callback
    
    process: ()->
      for callback in callbacks
        callback()
        
])