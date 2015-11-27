
angular.module("module.tac.navigable")

.service('tac.navigable.modal',[
  '$modal'
  '$controller'
  '$timeout'
  'tac.keys'
  'tac.navigable.root'
  ($modal, $controller, $timeout, keys, root)->
    open: (options)->
      
      keys.create_level()
      
      original_controller = options.controller
      
      controller = ['$scope', '$modalInstance']
      
      if original_controller
        for key of options.resolve
          controller.push key
          
      component = root('modal root')
      
      controller.push ($scope, $modalInstance)->
        component.bind_to($scope)
        keys.subscribe component
        
        if original_controller
          locals = {}
          for injection, index in arguments
            key = controller[index]
            locals[key] = arguments[index]
          $controller original_controller, locals
        
      options.controller = controller
          
      modalInstance = $modal.open options
      modalInstance.result.finally -> 
        keys.unsubscribe component
        keys.previous_level()
        
      modalInstance.opened.then ->
        $timeout (-> component.update(percolate_children:true)), (options.time or 100)
        
      modalInstance
      
])