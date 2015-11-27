
angular.module("module.tac.navigable")

.service('tac.navigable.scroll',[
  '$timeout'
  ($timeout)->
    
    frame_delay = parseInt(1000 / 60)
    
    relapse_times = 4
    
    px_re = /\px$/
    
    assert_valid_id = (value, element)->
      if typeof value isnt 'string' or value is ''
        console.log 'scroll parent id must be a non empty string'
        console.log 'element:'
        console.log element
        return false
      true
    
    parse_pixels = (in_pixels)->
      unless px_re.test in_pixels
        console.log 'must use margin in pixels for improve auto-scroll'
        return 0
      parseFloat in_pixels.replace(px_re, '')
    
    compute_margin = (jqelement)->
      top:    parse_pixels jqelement.css('margin-top')
      bottom: parse_pixels jqelement.css('margin-bottom')
      left:   parse_pixels jqelement.css('margin-left')
      right:  parse_pixels jqelement.css('margin-right')
      
    register_parent: (component, identifier, element) ->
      if not assert_valid_id(identifier, element) then return
      component.scroll = 
        identifier: identifier
        jqelement:  element
    
    register_child: (component, parent_id, jqelement) ->
      if not assert_valid_id(parent_id, element) then return
      frame = component.parent
      root  = component.root()
      while frame.parent and not frame.scroll or not frame.scroll.identifier is parent_id
        frame = frame.parent
      if frame is root
        #debug
        console.log 'cannot obtain scroll frame for id ' + parent_id
        console.log 'element:'
        console.log element
        return false
        
      element = jqelement[0]
      jqframe = frame.scroll.jqelement
      screen  = jqframe[0]
      options = undefined
      margin  = compute_margin jqelement
      
      y_pos = ->
        if frame.vertical
          viewport_top    = screen.scrollTop
          viewport_bottom = viewport_top + screen.offsetHeight
          elem_top        = element.offsetTop - screen.offsetTop - margin.top
          elem_bottom     = elem_top + element.offsetHeight + margin.top + margin.bottom
          if elem_top < viewport_top
            return elem_top
          else if elem_bottom > viewport_bottom
            return elem_bottom - screen.offsetHeight
        return null
          
      x_pos = ->
        if frame.horizontal
          viewport_left  = screen.scrollLeft
          viewport_rigth = viewport_left + screen.offsetWidth
          elem_left      = element.offsetLeft - screen.offsetLeft - margin.left
          elem_rigth    = elem_left + element.offsetWidth + margin.left + margin.rigth
          if elem_left < viewport_left
            return elem_left
          else if elem_rigth > viewport_rigth
            return elem_rigth - screen.offsetWidth
        return null
      
      current_poll = cancel: false
      cancel_poll = -> 
        current_poll.cancel = true
      allow_poll = -> 
        current_poll = cancel: false
        
      fix_position = ->
        change = false
        next_y_pos = y_pos()
        if next_y_pos isnt null
          change = true
          jqframe.scrollTop next_y_pos
        next_x_pos = x_pos()
        if next_x_pos isnt null
          change = true
          jqframe.scrollLeft next_x_pos
        change
        
      fix_position_sync = (relapse, permission)->->
        unless permission.cancel
          if fix_position()
            jqframe.stop()
            poll_on_position(0, permission)
          else
            if relapse
              poll_on_position(relapse - 1, permission)
      
      poll_on_position = (relapse, permission)->
        $timeout fix_position_sync(relapse, permission), frame_delay
        
      update_position = ->
        allow_poll()
        poll_on_position(relapse_times, current_poll)
      
      make_scroll = ->
        options = {}
        change = false
        next_y_pos = y_pos()
        if next_y_pos isnt null
          change = true
          options.scrollTop = next_y_pos
        next_x_pos = x_pos()
        if next_x_pos isnt null
          change = true
          options.scrollLeft = next_x_pos
        if change 
          cancel_poll()
          jqframe.stop().animate(options, '500')
      
      component.resize = (action)->
        if (action and frame[action.key])
          make_scroll()
        else 
          component.parent.resize(action)
          update_position()
      
      render = ->
        if component.parent.current_component is component
          make_scroll()
      
      #initialize
      component.on_update render
      component.on_active make_scroll
      component.on_inactive cancel_poll
      render()
      
])











