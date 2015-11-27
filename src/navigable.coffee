'use strict'

angular.module('module.tac.navigable', [])

.factory('tac.navigable.common',
  ()->
    common =
      remove: (collection, elem)->
        elem_index = collection.indexOf(elem)
        (elem_index > -1) and collection.splice(elem_index, 1)
        
      eval_all: (collection)->(self)->
        ()-> callback.apply(self or callback, arguments) for callback in collection
        
      appender: (collection)->(elem)->
        collection.push elem
        -> common.remove collection, elem
        
      navigable: (component)->
        on_update   = []
        on_active   = []
        on_inactive = []
        component.on_update   = common.appender on_update
        component.on_active   = common.appender on_active
        component.on_inactive = common.appender on_inactive
        component.update      = common.eval_all(on_update)(component)
        component.set_active  = (active)->
          if @active isnt active
            @active = active
            callbacks = if active then on_active else on_inactive
            common.eval_all(callbacks)(@)()
          @active
        component.root = ->
          @parent.root()
        component.pull_out = ->
          @unbind_destroy()
          @parent.remove(@)
        component.integrate = ->
          @parent.add(this)
          if @remove_on_destroy_flag
            @remove_on_destroy()
        component.make_active = ()->
          @parent.set_current_component(@)
          @parent.activate(true, true)
        component.become_current = ()->
          @parent.set_current_in_background(@)
        component.use_index = (scope)->
          oridginal_id = component.identifier
          set_priority = (priority)->
            component.priority = priority
            component.identifier = oridginal_id + ' #' + priority
          scope.$watch '$index', (value)->
            if value isnt component.priority
              set_priority value
              component.parent.sort_next_time()
          set_priority scope.$index
        component

)

###
A simple jQuery function that can add listeners on attribute change.
http://meetselva.github.io/attrchange/
About License:
Copyright (C) 2013-2014 Selvakumar Arumugam
You may use attrchange plugin under the terms of the MIT Licese.
https://github.com/meetselva/attrchange/blob/master/MIT-License.txt
###

(($) ->
  #initialize Mutation Observer
  MutationObserver = window.MutationObserver or window.WebKitMutationObserver

  isDOMAttrModifiedSupported = ->
    p = document.createElement('p')
    flag = false
    if p.addEventListener
      p.addEventListener 'DOMAttrModified', (->
        flag = true
        return
      ), false
    else if p.attachEvent
      p.attachEvent 'onDOMAttrModified', ->
        flag = true
        return
    else
      return false
    p.setAttribute 'id', 'target'
    flag

  checkAttributes = (chkAttr, e) ->
    if chkAttr
      attributes = @data('attr-old-value')
      if e.attributeName.indexOf('style') >= 0
        if !attributes['style']
          attributes['style'] = {}
        #initialize
        keys = e.attributeName.split('.')
        e.attributeName = keys[0]
        e.oldValue = attributes['style'][keys[1]]
        #old value
        e.newValue = keys[1] + ':' + @prop('style')[$.camelCase(keys[1])]
        #new value
        attributes['style'][keys[1]] = e.newValue
      else
        e.oldValue = attributes[e.attributeName]
        e.newValue = @attr(e.attributeName)
        attributes[e.attributeName] = e.newValue
      @data 'attr-old-value', attributes
      #update the old value object

  $.fn.attrchange = (a, b) ->
    if typeof a == 'object'
      #core
      cfg = 
        trackValues: false
        callback: $.noop
      #backward compatibility
      if typeof a == 'function'
        cfg.callback = a
      else
        $.extend cfg, a
      if cfg.trackValues
        #get attributes old value
        @each (i, el) ->
          attributes = {}
          attr = undefined
          i = 0
          attrs = el.attributes
          l = attrs.length
          while i < l
            attr = attrs.item(i)
            attributes[attr.nodeName] = attr.value
            i++
          $(@).data 'attr-old-value', attributes
          
      if MutationObserver
        #Modern Browsers supporting MutationObserver
        mOptions = 
          subtree: false
          attributes: true
          attributeOldValue: cfg.trackValues
        observer = new MutationObserver (mutations) ->
          mutations.forEach (e) ->
            _this = e.target
            #get new value if trackValues is true
            if cfg.trackValues
              e.newValue = $(_this).attr(e.attributeName)
            if $(_this).data('attrchange-status') == 'connected'
              #execute if connected
              cfg.callback.call _this, e
        
        return @data('attrchange-method', 'Mutation Observer')
          .data('attrchange-status', 'connected')
          .data('attrchange-obs', observer).each ->
            observer.observe @, mOptions
            
      else if isDOMAttrModifiedSupported()
        #Opera
        #Good old Mutation Events
        return @data('attrchange-method', 'DOMAttrModified')
          .data('attrchange-status', 'connected')
          .on 'DOMAttrModified', (event) ->
            if event.originalEvent
              event = event.originalEvent
            #jQuery normalization is not required 
            event.attributeName = event.attrName
            #property names to be consistent with MutationObserver
            event.oldValue = event.prevValue
            #property names to be consistent with MutationObserver
            if $(@).data('attrchange-status') == 'connected'
              #disconnected logically
              cfg.callback.call @, event
              
      else if 'onpropertychange' of document.body
        #works only in IE   
        return @data('attrchange-method', 'propertychange')
          .data('attrchange-status', 'connected')
          .on 'propertychange', (e) ->
            e.attributeName = window.event.propertyName
            #to set the attr old value
            checkAttributes.call $(@), cfg.trackValues, e
            if $(this).data('attrchange-status') == 'connected'
              #disconnected logically
              cfg.callback.call @, e
              
      return @
    else if typeof a == 'string' and 
      $.fn.attrchange.hasOwnProperty('extensions') and 
      $.fn.attrchange['extensions'].hasOwnProperty(a)
        #extensions/options
        return $.fn.attrchange['extensions'][a].call(@, b)
    return

  return
)(window.jQuery)
