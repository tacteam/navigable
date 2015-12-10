(function() {
  'use strict';
  angular.module('module.tac.navigable', []).factory('tac.navigable.common', function() {
    var common;
    return common = {
      remove: function(collection, elem) {
        var elem_index;
        elem_index = collection.indexOf(elem);
        return (elem_index > -1) && collection.splice(elem_index, 1);
      },
      eval_all: function(collection) {
        return function(self) {
          return function() {
            var callback, _i, _len, _results;
            _results = [];
            for (_i = 0, _len = collection.length; _i < _len; _i++) {
              callback = collection[_i];
              _results.push(callback.apply(self || callback, arguments));
            }
            return _results;
          };
        };
      },
      appender: function(collection) {
        return function(elem) {
          collection.push(elem);
          return function() {
            return common.remove(collection, elem);
          };
        };
      },
      navigable: function(component) {
        var on_active, on_inactive, on_update;
        on_update = [];
        on_active = [];
        on_inactive = [];
        component.on_update = common.appender(on_update);
        component.on_active = common.appender(on_active);
        component.on_inactive = common.appender(on_inactive);
        component.update = common.eval_all(on_update)(component);
        component.set_active = function(active) {
          var callbacks;
          if (this.active !== active) {
            this.active = active;
            callbacks = active ? on_active : on_inactive;
            common.eval_all(callbacks)(this)();
          }
          return this.active;
        };
        component.root = function() {
          return this.parent.root();
        };
        component.pull_out = function() {
          this.unbind_destroy();
          return this.parent.remove(this);
        };
        component.integrate = function() {
          this.parent.add(this);
          if (this.remove_on_destroy_flag) {
            return this.remove_on_destroy();
          }
        };
        component.make_active = function() {
          this.parent.set_current_component(this);
          return this.parent.activate(true, true);
        };
        component.become_current = function() {
          return this.parent.set_current_in_background(this);
        };
        component.use_index = function(scope) {
          var oridginal_id, set_priority;
          oridginal_id = component.identifier;
          set_priority = function(priority) {
            component.priority = priority;
            return component.identifier = oridginal_id + ' #' + priority;
          };
          scope.$watch('$index', function(value) {
            if (value !== component.priority) {
              set_priority(value);
              return component.parent.sort_next_time();
            }
          });
          return set_priority(scope.$index);
        };
        return component;
      }
    };
  });


  /*
  A simple jQuery function that can add listeners on attribute change.
  http://meetselva.github.io/attrchange/
  About License:
  Copyright (C) 2013-2014 Selvakumar Arumugam
  You may use attrchange plugin under the terms of the MIT Licese.
  https://github.com/meetselva/attrchange/blob/master/MIT-License.txt
   */

  (function($) {
    var MutationObserver, checkAttributes, isDOMAttrModifiedSupported;
    MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
    isDOMAttrModifiedSupported = function() {
      var flag, p;
      p = document.createElement('p');
      flag = false;
      if (p.addEventListener) {
        p.addEventListener('DOMAttrModified', (function() {
          flag = true;
        }), false);
      } else if (p.attachEvent) {
        p.attachEvent('onDOMAttrModified', function() {
          flag = true;
        });
      } else {
        return false;
      }
      p.setAttribute('id', 'target');
      return flag;
    };
    checkAttributes = function(chkAttr, e) {
      var attributes, keys;
      if (chkAttr) {
        attributes = this.data('attr-old-value');
        if (e.attributeName.indexOf('style') >= 0) {
          if (!attributes['style']) {
            attributes['style'] = {};
          }
          keys = e.attributeName.split('.');
          e.attributeName = keys[0];
          e.oldValue = attributes['style'][keys[1]];
          e.newValue = keys[1] + ':' + this.prop('style')[$.camelCase(keys[1])];
          attributes['style'][keys[1]] = e.newValue;
        } else {
          e.oldValue = attributes[e.attributeName];
          e.newValue = this.attr(e.attributeName);
          attributes[e.attributeName] = e.newValue;
        }
        return this.data('attr-old-value', attributes);
      }
    };
    $.fn.attrchange = function(a, b) {
      var cfg, mOptions, observer;
      if (typeof a === 'object') {
        cfg = {
          trackValues: false,
          callback: $.noop
        };
        if (typeof a === 'function') {
          cfg.callback = a;
        } else {
          $.extend(cfg, a);
        }
        if (cfg.trackValues) {
          this.each(function(i, el) {
            var attr, attributes, attrs, l;
            attributes = {};
            attr = void 0;
            i = 0;
            attrs = el.attributes;
            l = attrs.length;
            while (i < l) {
              attr = attrs.item(i);
              attributes[attr.nodeName] = attr.value;
              i++;
            }
            return $(this).data('attr-old-value', attributes);
          });
        }
        if (MutationObserver) {
          mOptions = {
            subtree: false,
            attributes: true,
            attributeOldValue: cfg.trackValues
          };
          observer = new MutationObserver(function(mutations) {
            return mutations.forEach(function(e) {
              var _this;
              _this = e.target;
              if (cfg.trackValues) {
                e.newValue = $(_this).attr(e.attributeName);
              }
              if ($(_this).data('attrchange-status') === 'connected') {
                return cfg.callback.call(_this, e);
              }
            });
          });
          return this.data('attrchange-method', 'Mutation Observer').data('attrchange-status', 'connected').data('attrchange-obs', observer).each(function() {
            return observer.observe(this, mOptions);
          });
        } else if (isDOMAttrModifiedSupported()) {
          return this.data('attrchange-method', 'DOMAttrModified').data('attrchange-status', 'connected').on('DOMAttrModified', function(event) {
            if (event.originalEvent) {
              event = event.originalEvent;
            }
            event.attributeName = event.attrName;
            event.oldValue = event.prevValue;
            if ($(this).data('attrchange-status') === 'connected') {
              return cfg.callback.call(this, event);
            }
          });
        } else if ('onpropertychange' in document.body) {
          return this.data('attrchange-method', 'propertychange').data('attrchange-status', 'connected').on('propertychange', function(e) {
            e.attributeName = window.event.propertyName;
            checkAttributes.call($(this), cfg.trackValues, e);
            if ($(this).data('attrchange-status') === 'connected') {
              return cfg.callback.call(this, e);
            }
          });
        }
        return this;
      } else if (typeof a === 'string' && $.fn.attrchange.hasOwnProperty('extensions') && $.fn.attrchange['extensions'].hasOwnProperty(a)) {
        return $.fn.attrchange['extensions'][a].call(this, b);
      }
    };
  })(window.jQuery);

}).call(this);

(function() {
  'use strict';
  angular.module('module.tac.navigable').factory('tac.navigable.component', [
    '$rootScope', 'tac.navigable.common', '$timeout', function($rootScope, common, $timeout) {
      var initial_handlers;
      initial_handlers = function() {
        return {
          up: function() {
            return false;
          },
          down: function() {
            return false;
          },
          left: function() {
            return false;
          },
          right: function() {
            return false;
          },
          enter: function() {
            return false;
          }
        };
      };
      return {
        basic: function(identifier) {
          var on_change_callbacks, removed, sort_request;
          on_change_callbacks = [];
          removed = false;
          sort_request = false;
          return common.navigable({
            identifier: identifier,
            on_change: common.appender(on_change_callbacks),
            after_change: common.eval_all(on_change_callbacks)(this),
            mark_removed: function() {
              var component, _i, _len, _ref, _results;
              removed = true;
              _ref = this.components;
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                component = _ref[_i];
                _results.push(component.mark_removed());
              }
              return _results;
            },
            bind_on_destroy: function(self) {
              return self.unbind_destroy = self.scope.$on('$destroy', function() {
                self.unbind_destroy();
                if (!removed) {
                  self.mark_removed();
                  return self.pull_out();
                }
              });
            },
            sort_components: function() {
              return this.components.sort(function(a, b) {
                if (a.priority > b.priority) {
                  return 1;
                } else if (b.priority > a.priority) {
                  return -1;
                } else {
                  return 0;
                }
              });
            },
            sort_next_time: function() {
              var next_time, self;
              if (sort_request) {
                return true;
              }
              self = this;
              sort_request = true;
              next_time = function() {
                self.sort_components();
                return sort_request = false;
              };
              return $timeout(next_time, 1);
            },
            unbind_destroy: function() {},
            remove_on_destroy: function() {
              this.remove_on_destroy_flag = true;
              if (this.scope) {
                this.bind_on_destroy(this);
              }
              return this;
            },
            set_priority: function(priority) {
              this.priority = priority;
              return this;
            },
            safe_apply: function(scope) {
              var phase;
              phase = $rootScope.$$phase;
              if (phase !== '$apply' && phase !== '$digest') {
                return scope.$apply();
              }
            },
            apply: function() {},
            remove_child_components: function() {
              this.components.length = 0;
              this.current_component = null;
              return this;
            },
            bind_to: function(scope, skip_add_to_parent) {
              var self;
              self = this;
              this.scope = scope;
              skip_add_to_parent || scope.$parent.add_navigable_component(this);
              this.apply = function() {
                return this.safe_apply(scope);
              };
              scope.add_navigable_component = function(component, index) {
                return self.add(component, index);
              };
              if (this.remove_on_destroy_flag) {
                this.bind_on_destroy(this);
              }
              return this;
            },
            set_current_in_background: function(child_component) {
              this.current_component = child_component;
              return this.after_change();
            },
            set_current_component: function(child_component, percolate_up) {
              var has_set, last_component;
              last_component = this.current_component;
              has_set = child_component.activate(percolate_up);
              if (has_set) {
                this.current_component = child_component;
                if (last_component && (last_component !== child_component)) {
                  last_component.deactivate();
                }
              }
              return has_set;
            },
            activate_down_to_up: function(child_component, changed_child) {
              var hast_to_change;
              this.set_active(true);
              hast_to_change = this.current_component !== child_component;
              if (hast_to_change) {
                this.set_current_component(child_component);
              }
              if (changed_child) {
                if (hast_to_change || this.parent.current_component !== this) {
                  return this.parent.activate_down_to_up(this, true);
                } else {
                  return this.apply();
                }
              }
            },
            set_first_child: function() {
              var child_index, has_set;
              has_set = false;
              child_index = 0;
              while (!has_set && child_index < this.components.length) {
                has_set = this.set_current_component(this.components[child_index]);
                child_index += 1;
              }
              return has_set;
            },
            set_last_child: function() {
              var child_index, has_set;
              has_set = false;
              child_index = this.components.length - 1;
              while (!has_set && child_index >= 0) {
                has_set = this.set_current_component(this.components[child_index]);
                child_index -= 1;
              }
              return has_set;
            },
            set_previous_child: function() {
              return this.current_component && this.set_current_component(this.current_component);
            },
            set_some_child: function() {
              return this.set_previous_child() || this.set_first_child();
            },
            activate: function(percolate_up, skip_set_child) {
              var has_set;
              if (!this.active) {
                if (skip_set_child) {
                  this.set_active(true);
                } else {
                  has_set = this.set_some_child();
                  this.set_active(has_set);
                }
              }
              percolate_up && this.parent.activate_down_to_up(this, true);
              return this.active;
            },
            deactivate: function(percolate_up) {
              this.set_active(false);
              if (this.current_component) {
                this.current_component.deactivate();
              }
              if (percolate_up) {
                return this.parent.deactivate(true);
              }
            },
            add: function(new_component, index) {
              var component, last, position, _i, _len, _ref;
              if (this.components.indexOf(new_component) > -1) {
                return console.error("trying to add same element twice [" + new_component.identifier + "]");
              } else {
                new_component.parent = this;
                if (typeof new_component.priority === 'undefined') {
                  if (typeof index !== 'undefined') {
                    new_component.priority = index;
                  } else {
                    new_component.priority = this.components.length;
                    if (this.components.length > 0) {
                      last = this.components[this.components.length - 1];
                      if (last.priority > new_component.priority) {
                        new_component.priority = last.priority + 1;
                      }
                    }
                  }
                }
                position = 0;
                _ref = this.components;
                for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                  component = _ref[_i];
                  if (component.priority < new_component.priority) {
                    position += 1;
                  }
                }
                return this.components.splice(position, 0, new_component);
              }
            },
            resize: function(options) {
              return this.parent.resize(options);
            },
            remove: function(component) {
              common.remove(this.components, component);
              if (this.current_component === component) {
                this.current_component = null;
                return this.active && this.deactivate(true);
              }
            },
            handle_on_selected: function(code) {
              return this.selected && this.selected.handle(code);
            },
            handle_inner: function(code) {
              var handler, has_handle;
              handler = this.handlers[code.key];
              has_handle = handler && handler(code, this);
              if (has_handle) {
                this.after_change();
              }
              return has_handle;
            },
            handle_by_child: function(code) {
              return this.current_component && this.current_component.handle(code);
            },
            handle: function(code) {
              return this.handle_by_child(code) || this.handle_inner(code);
            },
            current_index: function() {
              return this.components.indexOf(this.current_component);
            },
            last_index: function() {
              return this.components.length - 1;
            },
            initialize: function() {
              this.components = [];
              this.handlers = initial_handlers();
              this.on_update(function(options) {
                var components, _i, _len, _ref, _results;
                options = options || {};
                if (options.percolate_current) {
                  this.current_component && this.current_component.update(options);
                }
                if (options.percolate_children) {
                  _ref = this.components;
                  _results = [];
                  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                    components = _ref[_i];
                    _results.push(components.update(options));
                  }
                  return _results;
                }
              });
              return this;
            },
            and_extend: function(extensions) {
              this.handlers = angular.extend(this.handlers, extensions);
              return this;
            },
            go_forward: function(amount) {
              var current_index, last_index, set;
              current_index = this.current_index();
              last_index = this.last_index();
              if (current_index > -1 && (current_index + amount) <= last_index) {
                set = this.set_current_component(this.components[current_index + amount]);
                this.apply();
                return set;
              }
              return false;
            },
            go_back: function(amount) {
              var current_index, set;
              current_index = this.current_index();
              if (current_index > -1 && (current_index - amount) >= 0) {
                set = this.set_current_component(this.components[current_index - amount]);
                this.apply();
                return set;
              }
              return false;
            },
            previous_activable: function(amount) {
              var has_set, last_index, next_index;
              next_index = this.current_index() - 1;
              last_index = 0;
              has_set = false;
              while ((!has_set) && (next_index >= last_index)) {
                has_set = this.set_current_component(this.components[next_index]);
                next_index -= 1;
              }
              has_set && this.apply();
              return has_set;
            },
            next_activable: function() {
              var has_set, last_index, next_index;
              next_index = this.current_index() + 1;
              last_index = this.last_index();
              has_set = false;
              while ((!has_set) && (next_index <= last_index)) {
                has_set = this.set_current_component(this.components[next_index]);
                next_index += 1;
              }
              has_set && this.apply();
              return has_set;
            }
          });
        },
        horizontal: function(identifier) {
          var self;
          self = this.basic(identifier).initialize().and_extend({
            left: function(code, owner) {
              return owner.previous_activable();
            },
            right: function(code, owner) {
              return owner.next_activable();
            }
          });
          self.horizontal = true;
          return self;
        },
        vertical: function(identifier) {
          var self;
          self = this.basic(identifier).initialize().and_extend({
            up: function(code, owner) {
              return owner.previous_activable();
            },
            down: function(code, owner) {
              return owner.next_activable();
            }
          });
          self.vertical = true;
          return self;
        },
        multiline: function(identifier, line_length) {
          var self;
          if (typeof line_length !== 'number') {
            line_length = parseInt(line_length || 0);
          }
          self = this.basic(identifier).initialize().and_extend({
            left: function(code, owner) {
              if (owner.current_index() % line_length !== 0) {
                return owner.previous_activable();
              } else {
                return false;
              }
            },
            right: function(code, owner) {
              if ((owner.current_index() + 1) % line_length !== 0) {
                return owner.next_activable();
              } else {
                return false;
              }
            },
            up: function(code, owner) {
              return owner.go_back(line_length);
            },
            down: function(code, owner) {
              return owner.go_forward(line_length);
            }
          });
          self.vertical = self.multiline = self.horizontal = true;
          return self;
        }
      };
    }
  ]);

}).call(this);

(function() {
  'use strict';
  angular.module('module.tac.navigable').service('tac.navigable.fail', [
    function() {
      var callbacks;
      callbacks = [];
      return {
        on_fail: function(callback) {
          return callbacks.push(callback);
        },
        process: function() {
          var callback, _i, _len, _results;
          _results = [];
          for (_i = 0, _len = callbacks.length; _i < _len; _i++) {
            callback = callbacks[_i];
            _results.push(callback());
          }
          return _results;
        }
      };
    }
  ]);

}).call(this);

(function() {
  'use strict';
  angular.module('module.tac.navigable').factory('tac.navigable.leaf', [
    '$injector', '$interpolate', 'tac.keys', 'tac.navigable.common', function($injector, $interpolate, keys, common) {
      var is_text_elem, process_editor_attr, process_text_leaf, text_tags, text_types;
      text_types = ['text', 'search', 'password'];
      text_tags = ['TEXTAREA', 'INPUT'];
      is_text_elem = function(element) {
        return (element.nodeType === 1 && _.contains(text_tags, element.nodeName)) && (!element.type || _.contains(text_types, element.type));
      };
      process_text_leaf = function(navigable, element) {
        var dom_elem;
        dom_elem = element[0];
        if (is_text_elem(dom_elem)) {
          navigable.on_update(function() {
            return dom_elem.focus();
          });
          navigable.on_active(function() {
            return dom_elem.focus();
          });
          navigable.on_inactive(function() {
            return dom_elem.blur();
          });
          return navigable.handlers.back_space = function() {
            return keys.allow_default_once();
          };
        }
      };
      process_editor_attr = function(navigable, attrs, element) {
        if (attrs.openEditor) {
          return navigable.click = function() {
            var edition, editorId, editorS;
            editorId = attrs.openEditor;
            editorS = $injector.get(editorId);
            edition = editorS.edit(element.val());
            edition.done(function(value) {
              element.val(value);
              return element.trigger('input');
            });
            return edition.exit(function() {
              return navigable.activate();
            });
          };
        }
      };
      return function(scope, element, attrs) {
        var navigable, removed;
        removed = false;
        navigable = common.navigable({
          identifier: $interpolate(attrs.navigableLeaf)(scope),
          handlers: {
            enter: function() {
              navigable.click();
              return true;
            }
          },
          handle: function(code) {
            var handler;
            handler = this.handlers[code.key];
            return handler && handler(code);
          },
          root: function() {
            return this.parent.root();
          },
          resize: function(options) {
            return this.parent.resize(options);
          },
          activate: function(percolate_up) {
            percolate_up && this.parent.activate_down_to_up(this, true);
            return this.set_active(true);
          },
          deactivate: function() {
            return this.set_active(false);
          },
          click: function() {
            element.click();
            return true;
          },
          unbind_destroy: function() {},
          remove_on_destroy: function() {
            this.remove_on_destroy_flag = true;
            return this.unbind_destroy = scope.$on('$destroy', function() {
              navigable.unbind_destroy();
              return !removed && navigable.pull_out();
            });
          },
          mark_removed: function() {
            return removed = true;
          }
        });
        (function() {
          var clazz;
          clazz = attrs.navigableLeafClass || 'hover';
          navigable.on_active(function() {
            return element.addClass(clazz);
          });
          navigable.on_inactive(function() {
            return element.removeClass(clazz);
          });
          process_text_leaf(navigable, element);
          process_editor_attr(navigable, attrs, element);
          if (typeof attrs.navigablePriority === 'string') {
            return navigable.priority = parseInt(attrs.navigablePriority);
          } else if (typeof scope.$index === 'number') {
            return navigable.use_index(scope);
          }
        })();
        return navigable;
      };
    }
  ]).controller('tac.navigable.leaf', [
    '$scope', '$element', '$attrs', 'tac.navigable.leaf', 'tac.navigable.options', function($scope, $element, $attrs, leaf, options) {
      var component;
      component = leaf($scope, $element, $attrs);
      $scope.$parent.add_navigable_component(component);
      $scope.navigable = component;
      if (options.autoremove) {
        return $scope.navigable.remove_on_destroy();
      }
    }
  ]).directive('navigableLeaf', [
    function() {
      return {
        scope: true,
        restrict: 'A',
        priority: 501,
        controller: 'tac.navigable.leaf'
      };
    }
  ]);

}).call(this);

(function() {
  angular.module("module.tac.navigable").service('tac.navigable.modal', [
    '$modal', '$controller', '$timeout', 'tac.keys', 'tac.navigable.root', function($modal, $controller, $timeout, keys, root) {
      return {
        open: function(options) {
          var component, controller, key, modalInstance, original_controller;
          keys.create_level();
          original_controller = options.controller;
          controller = ['$scope', '$modalInstance'];
          if (original_controller) {
            for (key in options.resolve) {
              controller.push(key);
            }
          }
          component = root('modal root');
          controller.push(function($scope, $modalInstance) {
            var index, injection, locals, _i, _len;
            component.bind_to($scope);
            keys.subscribe(component);
            if (original_controller) {
              locals = {};
              for (index = _i = 0, _len = arguments.length; _i < _len; index = ++_i) {
                injection = arguments[index];
                key = controller[index];
                locals[key] = arguments[index];
              }
              return $controller(original_controller, locals);
            }
          });
          options.controller = controller;
          modalInstance = $modal.open(options);
          modalInstance.result["finally"](function() {
            keys.unsubscribe(component);
            return keys.previous_level();
          });
          modalInstance.opened.then(function() {
            return $timeout((function() {
              return component.update({
                percolate_children: true
              });
            }), options.time || 100);
          });
          return modalInstance;
        }
      };
    }
  ]);

}).call(this);

(function() {
  angular.module('module.tac.navigable').service('tac.navigable.options', [
    function() {
      return {
        autoremove: true
      };
    }
  ]).directive('navigableDestroy', [
    'tac.navigable.options', function(options) {
      return {
        scope: true,
        restrict: 'A',
        link: function(scope, element, attrs) {
          if (!options.autoremove) {
            return $scope.navigable.remove_on_destroy();
          }
        }
      };
    }
  ]).directive('navigableLeafActiveOnce', [
    '$parse', function($parse) {
      return {
        scope: true,
        restrict: 'A',
        link: function(scope, element, attrs) {
          var active_condition, root;
          active_condition = attrs.navigableLeafActiveOnce;
          if (active_condition && $parse(active_condition)(scope)) {
            root = scope.navigable.root();
            if (attrs.navigableLeafActiveForce || !root.active) {
              return scope.navigable.make_active();
            }
          }
        }
      };
    }
  ]).directive('navigableLeafActive', [
    '$parse', function($parse) {
      return {
        scope: true,
        restrict: 'A',
        link: function(scope, element, attrs) {
          return scope.$watch(attrs.navigableLeafActive, function(value) {
            var root;
            if (value) {
              root = scope.navigable.root();
              if (attrs.navigableLeafActiveForce || !root.active) {
                return scope.navigable.make_active();
              }
            }
          });
        }
      };
    }
  ]).directive('navigableCurrent', [
    '$parse', function($parse) {
      return {
        scope: true,
        restrict: 'A',
        link: function(scope, element, attrs) {
          var current_condition;
          current_condition = attrs.navigableCurrent;
          if (current_condition && $parse(current_condition)(scope)) {
            return scope.navigable.become_current();
          }
        }
      };
    }
  ]).directive('navigableModel', [
    '$parse', function($parse) {
      return {
        restrict: 'A',
        link: function(scope, element, attrs) {
          var model;
          model = $parse(attrs.navigableModel)(scope);
          return model && (model.navigable = scope.navigable);
        }
      };
    }
  ]).directive('navigableScrollFrom', [
    'tac.navigable.scroll', function(scroll) {
      return {
        scope: true,
        restrict: 'A',
        link: function(scope, element, attrs) {
          return scroll.register_child(scope.navigable, attrs.navigableScrollFrom, element);
        }
      };
    }
  ]).directive('navigableScrollFrame', [
    'tac.navigable.scroll', function(scroll) {
      return {
        scope: true,
        restrict: 'A',
        link: function(scope, element, attrs) {
          return scroll.register_parent(scope.navigable, attrs.navigableScrollFrame, element);
        }
      };
    }
  ]).directive('navigablePullOut', [
    'tac.navigable.scroll', function(scroll) {
      return {
        scope: true,
        restrict: 'A',
        multiElement: true,
        link: function(scope, element, attr) {
          var pulled_out;
          pulled_out = false;
          return scope.$watch(attr.navigablePullOut, function(value) {
            if (value && !pulled_out) {
              pulled_out = true;
              scope.navigable.pull_out();
            }
            if (!value && pulled_out) {
              pulled_out = false;
              return scope.navigable.integrate();
            }
          });
        }
      };
    }
  ]).directive('navigableNotifyCreation', [
    function() {
      return {
        scope: true,
        restrict: 'A',
        multiElement: true,
        link: function(scope, element, attr) {
          return scope.child_added(scope.navigable);
        }
      };
    }
  ]).directive('navigableOnActive', [
    '$parse', function($parse) {
      return {
        scope: true,
        restrict: 'A',
        multiElement: true,
        link: function(scope, element, attrs) {
          return scope.navigable.on_active(function() {
            return $parse(attrs.navigableOnActive)(scope);
          });
        }
      };
    }
  ]).directive('navigableResizable', [
    '$timeout', 'tac.navigable.scroll', function($timeout, scroll) {
      var events_names, horizontal, vertical;
      events_names = (function() {
        var capitalized, event_name, event_names, lowercase, prefix, result, _i, _j, _k, _len, _len1, _len2;
        result = [];
        capitalized = 'webkit Webkit Moz O ms MS Khtml'.split(' ');
        lowercase = 'webkit o'.split(' ');
        event_names = ['Animation', 'Transition'];
        for (_i = 0, _len = event_names.length; _i < _len; _i++) {
          event_name = event_names[_i];
          result.push(event_name.toLowerCase() + 'end');
          for (_j = 0, _len1 = capitalized.length; _j < _len1; _j++) {
            prefix = capitalized[_j];
            result.push(prefix + event_name + 'End');
          }
          for (_k = 0, _len2 = lowercase.length; _k < _len2; _k++) {
            prefix = lowercase[_k];
            result.push(prefix.toLowerCase() + event_name.toLowerCase() + 'end');
          }
        }
        return result;
      })();
      horizontal = {
        key: 'horizontal'
      };
      vertical = {
        key: 'vertical'
      };
      return {
        scope: true,
        restrict: 'A',
        multiElement: true,
        link: function(scope, element, attr) {
          element.on(events_names.join(' '), function(jqevent) {
            var property;
            if (jqevent.target === element[0]) {
              property = jqevent.originalEvent.propertyName;
              if (_.contains(['width', 'max-width'], property)) {
                scope.navigable.resize(horizontal);
              }
              if (_.contains(['height', 'max-height'], property)) {
                return scope.navigable.resize(vertical);
              }
            }
          });
          return element.attrchange({
            trackValues: true,
            callback: function(evnt) {
              if (evnt.attributeName === 'class') {
                return scope.navigable.resize();
              }
            }
          });
        }
      };
    }
  ]);

}).call(this);

(function() {
  'use strict';
  angular.module('module.tac.navigable').factory('tac.navigable.default.navigation', [
    function() {
      var opposite;
      opposite = {
        up: 'down',
        down: 'up',
        left: 'right',
        right: 'left'
      };
      return {
        process: function(navigable, config) {
          return navigable.set_some_child = function() {
            var child_priority, from_key, last_action, move_from, _ref;
            last_action = this.root().last_action;
            move_from = opposite[last_action];
            _ref = config.from;
            for (from_key in _ref) {
              child_priority = _ref[from_key];
              if (move_from === from_key) {
                return this['set_' + child_priority + '_child']();
              }
            }
            if (config["default"]) {
              return this['set_' + config["default"] + '_child']();
            }
            return this.set_first_child();
          };
        }
      };
    }
  ]).factory('tac.navigable.panel', [
    '$parse', 'tac.navigable.options', function($parse, options) {
      return function(navigable, scope, attrs) {
        if (typeof attrs.navigablePriority === 'string') {
          navigable.priority = attrs.navigablePriority;
        } else if (typeof scope.$index === 'number') {
          navigable.use_index(scope);
        }
        navigable.bind_to(scope);
        if (options.autoremove) {
          return navigable.remove_on_destroy();
        }
      };
    }
  ]).controller('tac.navigable.vertical', [
    '$scope', '$element', '$attrs', 'tac.navigable.component', 'tac.navigable.panel', function($scope, $element, $attrs, component, panel) {
      var identifier;
      identifier = $attrs.navigableVertical;
      return $scope.navigable = panel(component.vertical(identifier), $scope, $attrs);
    }
  ]).controller('tac.navigable.horizontal', [
    '$scope', '$element', '$attrs', 'tac.navigable.component', 'tac.navigable.panel', function($scope, $element, $attrs, component, panel) {
      var identifier;
      identifier = $attrs.navigableHorizontal;
      return $scope.navigable = panel(component.horizontal(identifier), $scope, $attrs);
    }
  ]).controller('tac.navigable.multiline', [
    '$scope', '$element', '$attrs', 'tac.navigable.component', 'tac.navigable.panel', function($scope, $element, $attrs, component, panel) {
      var identifier, per_row;
      identifier = $attrs.navigableMultiline;
      per_row = $attrs.navigablePerRow;
      return $scope.navigable = panel(component.multiline(identifier, per_row), $scope, $attrs);
    }
  ]).controller('tac.navigable.defaults', [
    '$scope', '$attrs', 'tac.navigable.default.navigation', function($scope, $attrs, navigation) {
      var config;
      config = JSON.parse($attrs.navigableDefaults.replace(/'/g, '"'));
      return navigation.process($scope.navigable, config);
    }
  ]).directive('navigableHorizontal', [
    function() {
      return {
        scope: true,
        restrict: 'A',
        priority: 501,
        controller: 'tac.navigable.horizontal'
      };
    }
  ]).directive('navigableVertical', [
    function() {
      return {
        scope: true,
        restrict: 'A',
        priority: 501,
        controller: 'tac.navigable.vertical'
      };
    }
  ]).directive('navigableMultiline', [
    function() {
      return {
        scope: true,
        restrict: 'A',
        priority: 501,
        controller: 'tac.navigable.multiline'
      };
    }
  ]).directive('navigableDefaults', [
    function() {
      return {
        scope: true,
        restrict: 'A',
        priority: 500,
        controller: 'tac.navigable.defaults'
      };
    }
  ]);

}).call(this);

(function() {
  'use strict';
  angular.module('module.tac.navigable').factory('tac.navigable.root', [
    'tac.navigable.component', 'tac.navigable.fail', function(component, failS) {
      return function(identifier) {
        var root_component;
        root_component = component.basic(identifier).initialize();
        root_component.fail = function() {
          failS.process();
          return false;
        };
        root_component.handle_inner = function(code) {
          return !this.active && !_.isEmpty(this.components) && this.set_child_active() || this.fail();
        };
        root_component.root = function() {
          return this;
        };
        root_component.dump = function() {
          var concat, dump, indent;
          concat = function(memo, index) {
            return memo + ' ';
          };
          indent = function(amount) {
            var _i, _results;
            return _.reduce((function() {
              _results = [];
              for (var _i = 1; 1 <= amount ? _i <= amount : _i >= amount; 1 <= amount ? _i++ : _i--){ _results.push(_i); }
              return _results;
            }).apply(this), concat, '');
          };
          dump = function(level) {
            return function(component) {
              var active, index;
              index = typeof component.priority === 'undefined' ? '' : component.priority;
              active = component.active ? ' <active>' : '';
              console.log(indent(level) + component.identifier + ' [' + index + ']' + active);
              return _.each(component.components, dump(level + 2));
            };
          };
          return dump(2)(this);
        };
        root_component.handle = function(code) {
          this.last_action = code.key;
          return this.handle_by_child(code) || this.handle_inner(code);
        };
        root_component.set_child_active = function() {
          var child_index;
          child_index = 0;
          while (!this.active && child_index < this.components.length) {
            this.set_active(this.set_current_component(this.components[child_index]));
            child_index += 1;
          }
          if (this.active) {
            this.current_component.apply();
          }
          return this.active;
        };
        root_component.activate_down_to_up = function(child_component, changed_child) {
          this.set_active(true);
          this.set_current_component(child_component);
          if (changed_child) {
            return this.apply();
          }
        };
        root_component.deactivate = function() {
          this.set_active(false);
          if (this.current_component) {
            return this.current_component.deactivate();
          }
        };
        root_component.bind_to = function(scope) {
          var self;
          self = this;
          scope.add_navigable_component = function(component, index) {
            return self.add(component, index);
          };
          return this;
        };
        root_component.resize = function() {};
        return root_component;
      };
    }
  ]).controller('tac.navigable.root', [
    '$rootScope', '$scope', '$element', '$attrs', 'tac.keys', 'tac.navigable.root', function($rootScope, $scope, $element, $attrs, keys, root) {
      var component, identifier, remove;
      identifier = $attrs.navigableRoot || 'root';
      component = root(identifier);
      keys.create_level();
      component.bind_to($scope);
      keys.subscribe(component);
      return remove = $scope.$on('$destroy', function() {
        remove();
        keys.unsubscribe(component);
        return keys.previous_level();
      });
    }
  ]).directive('navigableRoot', [
    function() {
      return {
        scope: true,
        restrict: 'A',
        priority: 501,
        controller: 'tac.navigable.root'
      };
    }
  ]);

}).call(this);

(function() {
  angular.module("module.tac.navigable").service('tac.navigable.scroll', [
    '$timeout', function($timeout) {
      var assert_valid_id, compute_margin, frame_delay, parse_pixels, px_re, relapse_times;
      frame_delay = parseInt(1000 / 60);
      relapse_times = 4;
      px_re = /\px$/;
      assert_valid_id = function(value, element) {
        if (typeof value !== 'string' || value === '') {
          console.log('scroll parent id must be a non empty string');
          console.log('element:');
          console.log(element);
          return false;
        }
        return true;
      };
      parse_pixels = function(in_pixels) {
        if (!px_re.test(in_pixels)) {
          console.log('must use margin in pixels for improve auto-scroll');
          return 0;
        }
        return parseFloat(in_pixels.replace(px_re, ''));
      };
      compute_margin = function(jqelement) {
        return {
          top: parse_pixels(jqelement.css('margin-top')),
          bottom: parse_pixels(jqelement.css('margin-bottom')),
          left: parse_pixels(jqelement.css('margin-left')),
          right: parse_pixels(jqelement.css('margin-right'))
        };
      };
      return {
        register_parent: function(component, identifier, element) {
          if (!assert_valid_id(identifier, element)) {
            return;
          }
          return component.scroll = {
            identifier: identifier,
            jqelement: element
          };
        },
        register_child: function(component, parent_id, jqelement) {
          var allow_poll, cancel_poll, current_poll, element, fix_position, fix_position_sync, frame, jqframe, make_scroll, margin, options, poll_on_position, render, root, screen, update_position, x_pos, y_pos;
          if (!assert_valid_id(parent_id, element)) {
            return;
          }
          frame = component.parent;
          root = component.root();
          while (frame.parent && !frame.scroll || !frame.scroll.identifier === parent_id) {
            frame = frame.parent;
          }
          if (frame === root) {
            console.log('cannot obtain scroll frame for id ' + parent_id);
            console.log('element:');
            console.log(element);
            return false;
          }
          element = jqelement[0];
          jqframe = frame.scroll.jqelement;
          screen = jqframe[0];
          options = void 0;
          margin = compute_margin(jqelement);
          y_pos = function() {
            var elem_bottom, elem_top, viewport_bottom, viewport_top;
            if (frame.vertical) {
              viewport_top = screen.scrollTop;
              viewport_bottom = viewport_top + screen.offsetHeight;
              elem_top = element.offsetTop - screen.offsetTop - margin.top;
              elem_bottom = elem_top + element.offsetHeight + margin.top + margin.bottom;
              if (elem_top < viewport_top) {
                return elem_top;
              } else if (elem_bottom > viewport_bottom) {
                return elem_bottom - screen.offsetHeight;
              }
            }
            return null;
          };
          x_pos = function() {
            var elem_left, elem_rigth, viewport_left, viewport_rigth;
            if (frame.horizontal) {
              viewport_left = screen.scrollLeft;
              viewport_rigth = viewport_left + screen.offsetWidth;
              elem_left = element.offsetLeft - screen.offsetLeft - margin.left;
              elem_rigth = elem_left + element.offsetWidth + margin.left + margin.rigth;
              if (elem_left < viewport_left) {
                return elem_left;
              } else if (elem_rigth > viewport_rigth) {
                return elem_rigth - screen.offsetWidth;
              }
            }
            return null;
          };
          current_poll = {
            cancel: false
          };
          cancel_poll = function() {
            return current_poll.cancel = true;
          };
          allow_poll = function() {
            return current_poll = {
              cancel: false
            };
          };
          fix_position = function() {
            var change, next_x_pos, next_y_pos;
            change = false;
            next_y_pos = y_pos();
            if (next_y_pos !== null) {
              change = true;
              jqframe.scrollTop(next_y_pos);
            }
            next_x_pos = x_pos();
            if (next_x_pos !== null) {
              change = true;
              jqframe.scrollLeft(next_x_pos);
            }
            return change;
          };
          fix_position_sync = function(relapse, permission) {
            return function() {
              if (!permission.cancel) {
                if (fix_position()) {
                  jqframe.stop();
                  return poll_on_position(0, permission);
                } else {
                  if (relapse) {
                    return poll_on_position(relapse - 1, permission);
                  }
                }
              }
            };
          };
          poll_on_position = function(relapse, permission) {
            return $timeout(fix_position_sync(relapse, permission), frame_delay);
          };
          update_position = function() {
            allow_poll();
            return poll_on_position(relapse_times, current_poll);
          };
          make_scroll = function() {
            var change, next_x_pos, next_y_pos;
            options = {};
            change = false;
            next_y_pos = y_pos();
            if (next_y_pos !== null) {
              change = true;
              options.scrollTop = next_y_pos;
            }
            next_x_pos = x_pos();
            if (next_x_pos !== null) {
              change = true;
              options.scrollLeft = next_x_pos;
            }
            if (change) {
              cancel_poll();
              return jqframe.stop().animate(options, '500');
            }
          };
          component.resize = function(action) {
            if (action && frame[action.key]) {
              return make_scroll();
            } else {
              component.parent.resize(action);
              return update_position();
            }
          };
          render = function() {
            if (component.parent.current_component === component) {
              return make_scroll();
            }
          };
          component.on_update(render);
          component.on_active(make_scroll);
          component.on_inactive(cancel_poll);
          return render();
        }
      };
    }
  ]);

}).call(this);
