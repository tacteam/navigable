(function() {
  'use strict';
  angular.module('module.tac.navigable').factory('tac.navigable.extensible', [
    '$rootScope', function($rootScope) {
      var initial_handlers, log_action, log_creation, log_mode;
      log_mode = false;
      log_action = function(component, action) {
        if (log_mode) {
          console.log(component.identifier + ' handle ' + action);
        }
        return true;
      };
      log_creation = function(component, action) {
        if (log_mode) {
          console.log(component.identifier + ' creation ');
        }
        return true;
      };
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
        create_basic: function(identifier) {
          var on_change_callbacks;
          log_creation(this);
          on_change_callbacks = [];
          return {
            identifier: identifier,
            root: function() {
              return this.parent.root();
            },
            bind_on_destroy: function(self) {
              var remove;
              return remove = self.scope.$on('$destroy', function() {
                remove();
                return self.parent.remove(self);
              });
            },
            remove_on_destroy: function() {
              if (!this.scope) {
                this.remove_on_destroy_flag = true;
              } else {
                this.bind_on_destroy(this);
              }
              return this;
            },
            set_priority: function(priority) {
              this.priority = priority;
              return this;
            },
            on_change: function(callback) {
              on_change_callbacks.push(callback);
              return function() {
                return _.remove(on_change_callbacks, callback);
              };
            },
            after_change: function() {
              var on_change_callback, _i, _len, _results;
              _results = [];
              for (_i = 0, _len = on_change_callbacks.length; _i < _len; _i++) {
                on_change_callback = on_change_callbacks[_i];
                _results.push(on_change_callback(this));
              }
              return _results;
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
              scope.remove_navigable_component = function(component) {
                return self.remove(component);
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
              has_set = child_component.set_active(percolate_up);
              if (has_set) {
                this.current_component = child_component;
                if (last_component && (last_component !== child_component)) {
                  last_component.set_not_active();
                }
              }
              return has_set;
            },
            set_active_down_to_up: function(child_component, changed_child) {
              var hast_to_change;
              this.active = true;
              hast_to_change = this.current_component !== child_component;
              if (hast_to_change) {
                this.set_current_component(child_component);
              }
              if (changed_child) {
                if (hast_to_change || this.parent.current_component !== this) {
                  return this.parent.set_active_down_to_up(this, true);
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
            set_active: function(percolate_up, skip_set_child) {
              if (!this.active) {
                if (skip_set_child) {
                  this.active = true;
                } else {
                  this.active = this.set_some_child();
                }
              }
              percolate_up && this.parent.set_active_down_to_up(this, true);
              return this.active;
            },
            set_not_active: function(percolate_up) {
              this.active = false;
              if (this.current_component) {
                this.current_component.set_not_active();
              }
              if (percolate_up) {
                return this.parent.set_not_active(true);
              }
            },
            add: function(new_component, index) {
              var component, position, _i, _len, _ref;
              if (this.components.indexOf(new_component) > -1) {
                return console.error("trying to add same element twice [" + new_component.identifier + "]");
              } else {
                new_component.parent = this;
                new_component.priority = new_component.priority || index || 0;
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
            remove: function(component) {
              _.remove(this.components, component);
              if (this.current_component === component) {
                this.current_component = null;
                return this.set_not_active(true);
              }
            },
            handle_on_selected: function(key) {
              return this.selected && this.selected.handle(key);
            },
            handle_inner: function(key) {
              var handler, has_handle;
              handler = this.handlers[key];
              has_handle = handler && handler(this);
              if (has_handle) {
                this.after_change();
              }
              return has_handle;
            },
            handle_by_child: function(key) {
              return this.current_component && this.current_component.handle(key);
            },
            handle: function(key) {
              return this.handle_by_child(key) || this.handle_inner(key);
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
          };
        },
        create_horizontal: function(identifier) {
          return this.create_basic(identifier).initialize().and_extend({
            left: function(self) {
              return self.previous_activable();
            },
            right: function(self) {
              return self.next_activable();
            }
          });
        },
        create_vertical: function(identifier) {
          return this.create_basic(identifier).initialize().and_extend({
            up: function(self) {
              return self.previous_activable();
            },
            down: function(self) {
              return self.next_activable();
            }
          });
        },
        create_multiline: function(identifier, line_length) {
          return this.create_basic(identifier).initialize().and_extend({
            left: function(self) {
              if (self.current_index() % line_length !== 0) {
                return self.previous_activable();
              } else {
                return false;
              }
            },
            right: function(self) {
              if ((self.current_index() + 1) % line_length !== 0) {
                return self.next_activable();
              } else {
                return false;
              }
            },
            up: function(self) {
              return self.go_back(line_length);
            },
            down: function(self) {
              return self.go_forward(line_length);
            }
          });
        }
      };
    }
  ]);

}).call(this);

(function() {
  'use strict';
  angular.module('module.tac.navigable').service('tac.navigable.fail.service', [
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
    '$injector', function($injector) {
      var process_editor_attr, run_calbacks, set_focus_behaviour;
      set_focus_behaviour = function(navigable, element) {
        if (element[0].type === 'text') {
          navigable.on_active(function() {
            return element[0].focus();
          });
          return navigable.on_not_active(function() {
            return element[0].blur();
          });
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
              return navigable.set_active();
            });
          };
        }
      };
      run_calbacks = function(callbacks, self) {
        var callback, _i, _len, _results;
        _results = [];
        for (_i = 0, _len = callbacks.length; _i < _len; _i++) {
          callback = callbacks[_i];
          _results.push(callback(self));
        }
        return _results;
      };
      return function(element, attrs, clazz) {
        var navigable;
        navigable = {
          identifier: attrs.navigableLeafId,
          handle: function(key) {
            if (key === 'enter') {
              this.click();
              return true;
            }
            return false;
          },
          on_active_callbacks: [],
          on_not_active_callbacks: [],
          on_active: function(callback) {
            return this.on_active_callbacks.push(callback);
          },
          on_not_active: function(callback) {
            return this.on_not_active_callbacks.push(callback);
          },
          set_active: function() {
            run_calbacks(this.on_active_callbacks, this);
            return this.active = true;
          },
          set_not_active: function() {
            run_calbacks(this.on_not_active_callbacks, this);
            return this.active = false;
          },
          set_navigable_link: function(navigable_link) {
            this.navigable_link = navigable_link;
            set_focus_behaviour(navigable, navigable_link);
            return this.click = function() {
              return navigable_link.click();
            };
          },
          click: function() {
            element.click();
            return true;
          }
        };
        if (clazz) {
          navigable.on_active(function() {
            return element.addClass(clazz);
          });
          navigable.on_not_active(function() {
            return element.removeClass(clazz);
          });
        }
        set_focus_behaviour(navigable, element);
        process_editor_attr(navigable, attrs, element);
        return navigable;
      };
    }
  ]).constant('tac.navigable.leaf.events', {
    NAVIGABLE_PROCESSED: 'navigable_processed'
  }).directive('navigableLeafModel', [
    '$parse', 'tac.navigable.leaf', 'tac.navigable.leaf.events', function($parse, leaf, EVENTS) {
      return {
        link: function(scope, element, attrs) {
          var component, index, model;
          index = parseInt($parse('$index')(scope));
          model = $parse(attrs.navigableLeafModel)(scope);
          component = leaf(element, attrs);
          model.navigable = component;
          scope.add_navigable_component(component, index);
          scope.set_navigable_link = function(navigable_link) {
            return component.set_navigable_link(navigable_link);
          };
          scope.navigable_processed = true;
          scope.$broadcast(EVENTS.NAVIGABLE_PROCESSED);
          scope.$emit(EVENTS.NAVIGABLE_PROCESSED, model);
          if (attrs.removeOnDestroy) {
            scope.$on('$destroy', function() {
              return scope.remove_navigable_component(component);
            });
          }
          if (attrs.navigableLeafActive) {
            component.parent.set_current_component(component);
            return component.parent.set_active(true, true);
          }
        }
      };
    }
  ]).directive('navigableLeaf', [
    '$parse', 'tac.navigable.leaf', 'tac.navigable.leaf.events', function($parse, leaf, EVENTS) {
      return {
        link: function(scope, element, attrs) {
          var component, index;
          component = leaf(element, attrs, attrs.navigableLeafClass);
          index = parseInt(attrs.navigableLeaf);
          if (attrs.navigablePriorityModel) {
            index = ($parse(attrs.navigablePriorityModel))(scope);
          }
          scope.add_navigable_component(component, index);
          if (attrs.navigableLeafActive) {
            component.parent.set_current_component(component);
            return component.parent.set_active(true, true);
          }
        }
      };
    }
  ]).directive('navigableLink', [
    '$parse', 'tac.navigable.leaf.events', function($parse, EVENTS) {
      return {
        link: function(scope, element, attrs) {
          if (scope.navigable_processed) {
            return scope.set_navigable_link(element);
          } else {
            return scope.$on(EVENTS.NAVIGABLE_PROCESSED, function() {
              return scope.set_navigable_link(element);
            });
          }
        }
      };
    }
  ]);

}).call(this);

(function() {
  'use strict';
  angular.module('module.tac.navigable', []);

}).call(this);

(function() {
  'use strict';
  angular.module('module.tac.navigable').factory('tac.navigable.panel.extender', [
    function() {
      var opposite;
      opposite = {
        up: 'down',
        down: 'up',
        right: 'left',
        left: 'right'
      };
      return {
        process_default_navigation: function(navigable, config) {
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
        },
        process_default_navigation_string: function(navigable, defaultNavigationString) {
          if (defaultNavigationString) {
            return this.process_default_navigation(navigable, JSON.parse(defaultNavigationString.replace(/'/g, '"')));
          }
        }
      };
    }
  ]).factory('tac.navigable.panel', [
    '$parse', 'tac.navigable.panel.extender', function($parse, extender) {
      return function(component, $scope, $attrs) {
        var index;
        index = $attrs.priority;
        if ($attrs.priorityModel) {
          index = ($parse($attrs.priorityModel))($scope);
        }
        component.set_priority(index);
        extender.process_default_navigation_string(component, $attrs.defaultNavigation);
        return component;
      };
    }
  ]).controller('tac.navigable.vertical', [
    '$scope', '$attrs', 'tac.navigable.extensible', 'tac.navigable.panel', function($scope, $attrs, extensible, panel) {
      return $scope.navigable = panel(extensible.create_vertical($attrs.identifier), $scope, $attrs).bind_to($scope);
    }
  ]).controller('tac.navigable.horizontal', [
    '$scope', '$attrs', 'tac.navigable.extensible', 'tac.navigable.panel', function($scope, $attrs, extensible, panel) {
      return $scope.navigable = panel(extensible.create_horizontal($attrs.identifier), $scope, $attrs).bind_to($scope);
    }
  ]);

}).call(this);

(function() {
  'use strict';
  angular.module('module.tac.navigable').factory('tac.navigable.root', [
    'tac.navigable.extensible', 'tac.navigable.fail.service', function(extensible, failS) {
      return function(identifier) {
        var root_component;
        root_component = extensible.create_basic(identifier).initialize();
        root_component.fail = function() {
          failS.process();
          return false;
        };
        root_component.handle_inner = function(key) {
          return !this.active && !_.isEmpty(this.components) && this.set_child_active() || this.fail();
        };
        root_component.root = function() {
          return this;
        };
        root_component.handle = function(code) {
          var key;
          key = code.is_number ? 'number_' + code.number : code.key;
          this.last_action = key;
          return this.handle_by_child(key) || this.handle_inner(key);
        };
        root_component.set_child_active = function() {
          var child_index;
          child_index = 0;
          while (!this.active && child_index < this.components.length) {
            this.active = this.set_current_component(this.components[child_index]);
            child_index += 1;
          }
          if (this.active) {
            this.current_component.apply();
          }
          return this.active;
        };
        root_component.set_active_down_to_up = function(child_component, changed_child) {
          this.active = true;
          this.set_current_component(child_component);
          if (changed_child) {
            return this.apply();
          }
        };
        root_component.set_not_active = function() {
          this.active = false;
          if (this.current_component) {
            return this.current_component.set_not_active();
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
        return root_component;
      };
    }
  ]).factory('tac.navigable.root.main', [
    '$rootScope', 'tac.navigable.root', function($rootScope, root_component) {
      var root_service;
      root_service = root_component('root');
      $rootScope.$on('$routeChangeStart', function() {
        return root_service.set_not_active();
      });
      return root_service;
    }
  ]);

}).call(this);
