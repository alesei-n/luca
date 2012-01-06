(function() {

  _.mixin(_.string);

  window.Luca = {
    core: {},
    containers: {},
    components: {},
    modules: {},
    fields: {},
    util: {},
    registry: {
      classes: {},
      namespaces: ["Luca.containers", "Luca.components"]
    },
    component_cache: {
      cid_index: {},
      name_index: {}
    }
  };

  Luca.registry.addNamespace = function(identifier) {
    Luca.registry.namespaces.push(identifier);
    return Luca.registry.namespaces = _(Luca.registry.namespaces).uniq();
  };

  Luca.cache = function(needle, component) {
    var lookup_id;
    if (component != null) Luca.component_cache.cid_index[needle] = component;
    component = Luca.component_cache.cid_index[needle];
    if ((component != null ? component.component_name : void 0) != null) {
      Luca.component_cache.name_index[component.component_name] = component.cid;
    } else if ((component != null ? component.name : void 0) != null) {
      Luca.component_cache.name_index[component.name] = component.cid;
    }
    if (component != null) return component;
    lookup_id = Luca.component_cache.name_index[needle];
    return Luca.component_cache.cid_index[lookup_id];
  };

  Luca.util.nestedValue = function(accessor, source_object) {
    return _(accessor.split(/\./)).inject(function(obj, key) {
      return obj = obj != null ? obj[key] : void 0;
    }, source_object);
  };

  Luca.registry.lookup = function(ctype) {
    var c, className, parents;
    c = Luca.registry.classes[ctype];
    if (c != null) return c;
    className = _.camelize(_.capitalize(ctype));
    parents = _(Luca.registry.namespaces).map(function(namespace) {
      return Luca.util.nestedValue(namespace, window);
    });
    return _.first(_.compact(_(parents).map(function(parent) {
      return parent[className];
    })));
  };

  Luca.util.LazyObject = function(config) {
    var component_class, constructor, ctype;
    ctype = config.ctype;
    component_class = Luca.registry.lookup(ctype);
    if (!component_class) {
      throw "Invalid Component Type: " + ctype + ".  Did you forget to register it?";
    }
    constructor = eval(component_class);
    return new constructor(config);
  };

  Luca.register = function(component, constructor_class) {
    var exists;
    exists = Luca.registry.classes[component];
    if (exists != null) {
      throw "Can not register component with the signature " + component + ". Already exists";
    } else {
      return Luca.registry.classes[component] = constructor_class;
    }
  };

  Luca.available_templates = function(filter) {
    var available;
    if (filter == null) filter = "";
    available = _(Luca.templates).keys();
    if (filter.length > 0) {
      return _(available).select(function(tmpl) {
        return tmpl.match(filter);
      });
    } else {
      return available;
    }
  };

  Luca.util.isIE = function() {
    try {
      Object.defineProperty({}, '', {});
      return false;
    } catch (e) {
      return true;
    }
  };

  $((function() {
    return $('body').addClass('luca-ui-enabled');
  })());

}).call(this);
(function() {

  Luca.modules.Deferrable = {
    configure_collection: function() {
      var collection;
      collection = this.collection || this.store || this.filterable_collection;
      if (collection && collection.base_url) {
        _.extend(collection, {
          url: function() {
            return collection.base_url;
          }
        });
        return this.deferrable = this.collection = new Luca.components.FilterableCollection(collection.initial_set, collection);
      }
    }
  };

}).call(this);
(function() {

  Luca.View = Backbone.View.extend({
    base: 'Luca.View'
  });

  Luca.View.original_extend = Backbone.View.extend;

  Luca.View.extend = function(definition) {
    var _base;
    _base = definition.render;
    _base || (_base = function() {
      if (!($(this.container) && $(this.el))) {
        if ($(this.el).html() !== "" && $(this.container).html() === "") {
          return $(this.container).append($(this.el));
        }
      }
    });
    definition.render = function() {
      var _this = this;
      if (this.deferrable) {
        this.trigger("before:render", this);
        this.deferrable.bind(this.deferrable_event, function() {
          if (_this.debugMode === "verbose") {
            console.log("Deferrable Render", _this.cid);
          }
          _base.apply(_this, arguments);
          return _this.trigger("after:render", _this);
        });
        return this.deferrable.fetch();
      } else {
        this.trigger("before:render", this);
        (function() {
          if (_this.debugMode === "verbose") {
            console.log("Normal Render", _this.cid);
          }
          return _base.apply(_this, arguments);
        })();
        return this.trigger("after:render", this);
      }
    };
    return Luca.View.original_extend.apply(this, [definition]);
  };

  _.extend(Luca.View.prototype, {
    trigger: function(event) {
      this.event = event;
      if (this.debugMode === "very-verbose") {
        console.log("Triggering", this.event, this.cid);
      }
      return Backbone.View.prototype.trigger.apply(this, arguments);
    },
    hooks: ["after:initialize", "before:render", "after:render"],
    deferrable_event: "reset",
    initialize: function(options) {
      this.options = options != null ? options : {};
      if (this.name != null) this.cid = _.uniqueId(this.name);
      _.extend(this, this.options);
      Luca.cache(this.cid, this);
      if (this.options.hooks) this.setupHooks(this.options.hooks);
      if (this.hooks && !this.options.hooks) this.setupHooks(this.hooks);
      this.setupHooks(Luca.View.prototype.hooks);
      return this.trigger("after:initialize", this);
    },
    setupHooks: function(set) {
      var _this = this;
      set || (set = this.hooks);
      return _(set).each(function(event) {
        var fn, parts, prefix;
        parts = event.split(':');
        prefix = parts.shift();
        parts = _(parts).map(function(p) {
          return _.capitalize(p);
        });
        fn = prefix + parts.join('');
        return _this.bind(event, function() {
          if (_this[fn]) return _this[fn].apply(_this, arguments);
        });
      });
    }
  });

}).call(this);
(function() {

  Luca.core.Field = Luca.View.extend({
    className: 'luca-ui-text-field luca-ui-field',
    template: 'fields/text_field',
    labelAlign: 'top',
    hooks: ["before:validation", "after:validation"],
    initialize: function(options) {
      this.options = options != null ? options : {};
      _.extend(this, this.options);
      Luca.View.prototype.initialize.apply(this, arguments);
      this.input_id || (this.input_id = _.uniqueId('field'));
      return this.input_name || (this.input_name = this.name);
    },
    beforeRender: function() {
      $(this.el).html(Luca.templates[this.template](this));
      return $(this.container).append($(this.el));
    }
  });

}).call(this);
(function() {

  Luca.core.Container = Luca.View.extend({
    hooks: ["before:components", "before:layout", "after:components", "after:layout"],
    className: 'luca-ui-container',
    rendered: false,
    component_class: 'luca-ui-panel',
    components: [],
    component_elements: function() {
      return $("." + this.component_class, this.el);
    },
    initialize: function(options) {
      this.options = options != null ? options : {};
      _.extend(this, this.options);
      this.setupHooks(Luca.core.Container.prototype.hooks);
      return Luca.View.prototype.initialize.apply(this, arguments);
    },
    do_layout: function() {
      this.trigger("before:layout", this);
      this.prepare_layout();
      return this.trigger("after:layout", this);
    },
    do_components: function() {
      this.trigger("before:components", this, this.components);
      this.prepare_components();
      this.create_components();
      this.render_components();
      return this.trigger("after:components", this, this.components);
    },
    prepare_layout: function() {
      return console.log(this.component_type, "should implement its own prepare layout");
    },
    prepare_components: function() {
      return console.log(this.component_type, "should implement its own prepare components method");
    },
    create_components: function() {
      var _this = this;
      return this.components = _(this.components).map(function(object, index) {
        var component;
        component = _.isObject(object) && (object.ctype != null) ? Luca.util.LazyObject(object) : object;
        if (!component.renderTo && component.options.renderTo) {
          component.container = component.renderTo = component.options.renderTo;
        }
        return component;
      });
    },
    render_components: function(debugMode) {
      var _this = this;
      this.debugMode = debugMode != null ? debugMode : "";
      return _(this.components).each(function(component) {
        component.getParent = function() {
          return _this;
        };
        $(component.renderTo).append($(component.el));
        return component.render();
      });
    },
    beforeRender: function() {
      this.do_layout();
      return this.do_components();
    },
    getComponent: function(needle) {
      return this.components[needle];
    },
    root_component: function() {
      return !(this.getParent != null);
    },
    getRootComponent: function() {
      if (this.root_component()) {
        return this;
      } else {
        return this.getParent().getRootComponent();
      }
    }
  });

}).call(this);
(function() {

  Luca.containers.SplitView = Luca.core.Container.extend({
    layout: '100',
    component_type: 'split_view',
    className: 'luca-ui-split-view',
    components: [],
    initialize: function(options) {
      var _this = this;
      this.options = options;
      Luca.core.Container.prototype.initialize.apply(this, arguments);
      return this.component_containers = _(this.components).map(function(component, componentIndex) {
        return _this.apply_panel_config.apply(_this, [component, componentIndex]);
      });
    },
    component_class: 'luca-ui-panel',
    apply_panel_config: function(panel, panelIndex) {
      var config, style_declarations;
      style_declarations = [];
      if (panel.height) {
        style_declarations.push("height: " + (_.isNumber(panel.height) ? panel.height + 'px' : panel.height));
      }
      if (panel.width) {
        style_declarations.push("width: " + (_.isNumber(panel.width) ? panel.width + 'px' : panel.width));
      }
      return config = {
        "class": this.component_class,
        id: "" + this.cid + "-" + panelIndex,
        style: style_declarations.join(';')
      };
    },
    prepare_layout: function() {
      var _this = this;
      return _(this.component_containers).each(function(container) {
        return $(_this.el).append("<div id='" + container.id + "' class='" + container["class"] + "' style='" + container.style + "' />");
      });
    },
    prepare_components: function() {
      return this.assign_containers();
    },
    assign_containers: function() {
      var _this = this;
      return this.components = _(this.components).map(function(object, index) {
        var panel;
        panel = _this.component_containers[index];
        object.container = object.renderTo = "#" + panel.id;
        object.parentEl = _this.el;
        return object;
      });
    }
  });

  Luca.register('split_view', "Luca.containers.SplitView");

}).call(this);
(function() {

  Luca.containers.ColumnView = Luca.containers.SplitView.extend({
    component_type: 'column_view',
    className: 'luca-ui-column-view',
    components: [],
    initialize: function(options) {
      this.options = options != null ? options : {};
      return Luca.containers.SplitView.prototype.initialize.apply(this, arguments);
    },
    component_class: 'luca-ui-column',
    autoLayout: function() {
      var _this = this;
      return _(this.components.length).times(function() {
        return parseInt(100 / _this.components.length);
      });
    },
    setColumnWidths: function() {
      this.columnWidths = this.layout != null ? _(this.layout.split('/')).map(function(v) {
        return parseInt(v);
      }) : this.autoLayout();
      return this.columnWidths = _(this.columnWidths).map(function(val) {
        return "" + val + "%";
      });
    },
    beforeLayout: function() {
      var _this = this;
      this.setColumnWidths();
      return _(this.columnWidths).each(function(width, index) {
        return _this.component_containers[index].style = "float:left; width: " + width + ";";
      });
    }
  });

  Luca.register('column_view', "Luca.containers.ColumnView");

}).call(this);
(function() {

  Luca.containers.CardView = Luca.core.Container.extend({
    component_type: 'card_view',
    className: 'luca-ui-card-view-wrapper',
    activeCard: 0,
    components: [],
    hooks: ['before:card:switch', 'after:card:switch'],
    initialize: function(options) {
      this.options = options;
      Luca.core.Container.prototype.initialize.apply(this, arguments);
      return this.setupHooks(this.hooks);
    },
    component_class: 'luca-ui-card',
    beforeLayout: function() {
      var _this = this;
      return this.cards = _(this.components).map(function(card, cardIndex) {
        return {
          "class": _this.component_class,
          style: "display:" + (cardIndex === _this.activeCard ? 'block' : 'none'),
          id: "" + _this.cid + "-" + cardIndex
        };
      });
    },
    prepare_layout: function() {
      var _this = this;
      return this.card_containers = _(this.cards).map(function(card, index) {
        $(_this.el).append("<div id='" + card.id + "' style='" + card.style + "' class='" + card["class"] + "' />");
        return $("#" + card.id);
      });
    },
    prepare_components: function() {
      return this.assignToCards();
    },
    assignToCards: function() {
      var _this = this;
      return this.components = _(this.components).map(function(object, index) {
        var card;
        card = _this.cards[index];
        object.container = object.renderTo = "#" + card.id;
        return object;
      });
    },
    activeComponent: function() {
      return this.getComponent(this.activeCard);
    },
    cycle: function() {
      var nextIndex;
      nextIndex = this.activeCard < this.components.length - 1 ? this.activeCard + 1 : 0;
      return this.activate(nextIndex);
    },
    hide_components: function() {
      return _(this.components).pluck('container');
    },
    activate: function(index) {
      var nowActive, previous;
      if (index === this.activeCard) return;
      previous = this.activeComponent();
      nowActive = this.getComponent(index);
      this.trigger("before:card:switch", previous, nowActive);
      _(this.card_containers).each(function(container) {
        return container.hide();
      });
      $(nowActive.container).show();
      this.activeCard = index;
      return this.trigger("after:card:switch", previous, nowActive);
    }
  });

  Luca.register('card_view', "Luca.containers.CardView");

}).call(this);
(function() {

  Luca.containers.FieldsetView = Luca.View.extend({
    component_type: 'fieldset_view',
    tagName: 'fieldset',
    className: 'luca-ui-fieldset',
    labelAlign: 'top',
    afterInitialize: function() {
      var _this = this;
      return this.components = _(this.components).map(function(component, index) {
        component.id = "" + _this.cid + "-" + index;
        component.ctype || (component.ctype = component.type + '_field');
        return Luca.util.LazyObject(component);
      });
    },
    beforeRender: function() {
      var _this = this;
      return _(this.components).each(function(component) {
        component.renderTo = component.container = _this.el;
        return component.render();
      });
    },
    render: function() {
      $(this.el).addClass("label-align-" + this.labelAlign);
      if (this.legend) $(this.el).append("<legend>" + this.legend + "</legend>");
      return $(this.container).append($(this.el));
    },
    initialize: function(options) {
      this.options = options != null ? options : {};
      _.extend(this, this.options);
      Luca.View.prototype.initialize.apply(this, arguments);
      return this.components || (this.components = this.fields);
    }
  });

}).call(this);
(function() {

  Luca.containers.ModalView = Luca.core.Container.extend({
    component_type: 'modal_view',
    className: 'luca-ui-modal-view',
    components: [],
    renderOnInitialize: true,
    showOnRender: false,
    hooks: ['before:show', 'before:hide'],
    defaultModalOptions: {
      minWidth: 375,
      maxWidth: 375,
      minHeight: 550,
      maxHeight: 550,
      opacity: 80,
      onOpen: function(modal) {
        this.onOpen.apply(this);
        return this.onModalOpen.apply(modal, [modal, this]);
      },
      onClose: function(modal) {
        this.onClose.apply(this);
        return this.onModalClose.apply(modal, [modal, this]);
      }
    },
    modalOptions: {},
    initialize: function(options) {
      var _this = this;
      this.options = options != null ? options : {};
      Luca.core.Container.prototype.initialize.apply(this, arguments);
      this.setupHooks(this.hooks);
      _(this.defaultModalOptions).each(function(value, setting) {
        var _base;
        return (_base = _this.modalOptions)[setting] || (_base[setting] = value);
      });
      this.modalOptions.onOpen = _.bind(this.modalOptions.onOpen, this);
      return this.modalOptions.onClose = _.bind(this.modalOptions.onClose, this);
    },
    onOpen: function() {
      return true;
    },
    onClose: function() {
      return true;
    },
    getModal: function() {
      return this.modal;
    },
    onModalOpen: function(modal, view) {
      view.modal = modal;
      modal.overlay.show();
      modal.container.show();
      return modal.data.show();
    },
    onModalClose: function(modal, view) {
      console.log(arguments);
      return $.modal.close();
    },
    prepare_layout: function() {
      return $('body').append($(this.el));
    },
    prepare_components: function() {
      var _this = this;
      return this.components = _(this.components).map(function(object, index) {
        object.container = _this.el;
        return object;
      });
    },
    afterInitialize: function() {
      $(this.el).hide();
      if (this.renderOnInitialize) return this.render();
    },
    afterRender: function() {
      if (this.showOnRender) return this.show();
    },
    wrapper: function() {
      return $($(this.el).parent());
    },
    show: function() {
      this.trigger("before:show", this);
      return $(this.el).modal(this.modalOptions);
    },
    hide: function() {
      return this.trigger("before:hide", this);
    }
  });

  Luca.register("modal_view", "Luca.containers.ModalView");

}).call(this);
(function() {

  Luca.containers.TabView = Luca.containers.CardView.extend({
    events: {
      "click .luca-ui-tab-container li": "select"
    },
    hooks: ["before:select"],
    component_type: 'tab_view',
    className: 'luca-ui-tab-view-wrapper',
    components: [],
    component_class: 'luca-ui-tab-panel',
    initialize: function(options) {
      this.options = options != null ? options : {};
      Luca.containers.CardView.prototype.initialize.apply(this, arguments);
      return _.bindAll(this, "select");
    },
    select: function(e) {
      var me, my;
      me = my = $(e.currentTarget);
      console.log("Selected A Tab", my);
      return this.activate(my.data('target-tab'));
    },
    tab_container: function() {
      return $("#" + this.cid + "-tab-container>ul");
    },
    beforeLayout: function() {
      $(this.el).append(Luca.templates["containers/tab_view"](this));
      this.create_tab_selectors();
      return Luca.containers.CardView.prototype.beforeLayout.apply(this, arguments);
    },
    create_tab_selectors: function() {
      var _this = this;
      return _(this.components).map(function(component, index) {
        var title;
        component.renderTo = "#" + _this.cid + "-tab-panel-container";
        title = component.title || ("Tab " + (index + 1));
        return _this.tab_container().append("<li data-target-tab='" + index + "'>" + title + "</li>");
      });
    }
  });

}).call(this);
(function() {

  Luca.containers.Viewport = Luca.core.Container.extend({
    className: 'luca-ui-viewport',
    fullscreen: true,
    initialize: function(options) {
      this.options = options != null ? options : {};
      Luca.core.Container.prototype.initialize.apply(this, arguments);
      if (this.fullscreen) return $('html,body').addClass('luca-ui-fullscreen');
    },
    prepare_layout: function() {
      var _this = this;
      return _(this.components).each(function(component) {
        return component.renderTo = _this.el;
      });
    },
    prepare_components: function() {
      return true;
    },
    render: function() {
      console.log("Rendering Viewport");
      return $(this.el).addClass('luca-ui-viewport');
    }
  });

}).call(this);
(function() {

  Luca.fields.CheckboxField = Luca.core.Field.extend({
    className: 'luca-ui-checkbox-field luca-ui-field',
    template: 'fields/checkbox_field',
    afterInitialize: function() {
      this.input_id || (this.input_id = _.uniqueId('field'));
      this.input_name || (this.input_name = this.name);
      return this.input_value || (this.input_value = 1);
    }
  });

  Luca.register("checkbox_field", "Luca.fields.CheckboxField");

}).call(this);
(function() {

  Luca.fields.SelectField = Luca.core.Field.extend({
    className: 'luca-ui-select-field luca-ui-field',
    template: "fields/select_field",
    initialize: function(options) {
      this.options = options != null ? options : {};
      _.extend(this, this.options);
      _.extend(this, Luca.modules.Deferrable);
      Luca.core.Field.prototype.initialize.apply(this, arguments);
      return this.configure_collection();
    },
    select_el: function() {
      return $("select", this.el);
    },
    includeBlank: true,
    blankValue: '',
    blankText: 'Select One',
    afterRender: function() {
      var _ref,
        _this = this;
      this.select_el().html('');
      if (this.includeBlank) {
        this.select_el().append("<option value='" + this.blankValue + "'>" + this.blankText + "</option>");
      }
      if (((_ref = this.collection) != null ? _ref.each : void 0) != null) {
        this.collection.each(function(model) {
          var display, option, selected, value;
          value = model.get(_this.valueField);
          display = model.get(_this.displayField);
          if (_this.selected && value === _this.selected) selected = "selected";
          option = "<option " + selected + " value='" + value + "'>" + display + "</option>";
          return _this.select_el().append(option);
        });
      }
      if (this.collection.data) {
        return _(this.collection.data).each(function(pair) {
          var display, option, selected, value;
          value = pair[0];
          display = pair[1];
          if (_this.selected && value === _this.selected) selected = "selected";
          option = "<option " + selected + " value='" + value + "'>" + display + "</option>";
          return _this.select_el().append(option);
        });
      }
    }
  });

  Luca.register("select_field", "Luca.fields.SelectField");

}).call(this);
(function() {

  Luca.fields.TextField = Luca.core.Field.extend({
    template: 'fields/text_field'
  });

  Luca.register("text_field", "Luca.fields.TextField");

}).call(this);
(function() {

  Luca.fields.TypeAheadField = Luca.fields.TextField.extend({
    className: 'luca-ui-field'
  });

}).call(this);
(function() {

  Luca.components.FilterableCollection = Backbone.Collection.extend({
    initialize: function(models, options) {
      if (options == null) options = {};
      _.extend(this, options);
      Backbone.Collection.prototype.initialize.apply(this, arguments);
      if (_.isFunction(this.beforeFetch)) {
        return this.bind("before:fetch", this.beforeFetch);
      }
    },
    fetch: function(options) {
      this.trigger("before:fetch", this);
      return Backbone.Collection.prototype.fetch.apply(this, arguments);
    },
    applyFilter: function(params) {
      this.params = params != null ? params : {};
    },
    parse: function(response) {
      if (this.root != null) {
        return response[this.root];
      } else {
        return response;
      }
    }
  });

}).call(this);
(function() {

  Luca.components.FormView = Luca.View.extend({
    className: 'luca-ui-form-view',
    hooks: ["before:submit"],
    container_type: 'column_view',
    initialize: function(options) {
      this.options = options != null ? options : {};
      _.extend(this, this.options);
      Luca.View.prototype.initialize.apply(this, arguments);
      return this.components || (this.components = this.fields);
    },
    beforeRender: function() {
      var _this = this;
      $(this.el).append("<form />");
      this.form = $('form', this.el);
      if (this.form_class) this.form.addClass(this.form_class);
      this.check_for_fieldsets();
      return this.components = _(this.components).map(function(fieldset, index) {
        fieldset.renderTo = fieldset.container = _this.form;
        fieldset.id = "" + _this.cid + "-" + index;
        return new Luca.containers.FieldsetView(fieldset);
      });
    },
    fieldsets_present: function() {
      return _(this.components).detect(function(obj) {
        return obj.ctype === "fieldset";
      });
    },
    check_for_fieldsets: function() {
      if (!this.fieldsets_present()) {
        return this.components = [
          {
            ctype: 'fieldset_view',
            components: this.components,
            container_type: this.container_type
          }
        ];
      }
    },
    afterRender: function() {
      _(this.components).each(function(component) {
        return component.render();
      });
      return $(this.container).append($(this.el));
    }
  });

  Luca.register('form_view', 'Luca.components.FormView');

}).call(this);
(function() {

  Luca.components.GridView = Luca.View.extend({
    events: {
      "dblclick .grid-view-row": "double_click_handler",
      "click .grid-view-row": "click_handler"
    },
    className: 'luca-ui-grid-view',
    scrollable: true,
    hooks: ["before:grid:render", "before:render:header", "before:render:row", "after:grid:render", "row:double:click", "row:click"],
    initialize: function(options) {
      this.options = options != null ? options : {};
      _.extend(this, this.options);
      _.extend(this, Luca.modules.Deferrable);
      Luca.View.prototype.initialize.apply(this, arguments);
      _.bindAll(this, "rowDoubleClick", "rowClick");
      this.collection || (this.collection = this.store);
      this.collection || (this.collection = this.filterable_collection);
      return this.configure_collection();
    },
    beforeRender: _.once(function() {
      this.trigger("before:grid:render", this);
      if (this.scrollable) $(this.el).addClass('scrollable-grid-view');
      $(this.el).html(Luca.templates["components/grid_view"]());
      this.table = $('table.luca-ui-grid-view', this.el);
      this.header = $("thead", this.table);
      this.body = $("tbody", this.table);
      this.footer = $("tfoot", this.table);
      if (this.scrollable) this.setDimensions();
      this.render_header();
      return $(this.container).append($(this.el));
    }),
    setDimensions: function() {
      this.height || (this.height = 285);
      $('.grid-view-body', this.el).height(this.height);
      $('tbody.scrollable', this.el).height(this.height - 23);
      this.width || (this.width = 756);
      $('.grid-view-body', this.el).width(this.width);
      $('.grid-view-body table', this.el).width(this.width);
      return this.set_default_column_widths();
    },
    pad_last_column: function() {
      var configured_column_widths, unused_width;
      configured_column_widths = _(this.columns).inject(function(sum, column) {
        return sum = column.width + sum;
      }, 0);
      unused_width = this.width - configured_column_widths;
      if (unused_width > 0) return this.last_column().width += unused_width;
    },
    set_default_column_widths: function() {
      var default_column_width;
      default_column_width = this.columns.length > 0 ? this.width / this.columns.length : 200;
      _(this.columns).each(function(column) {
        return column.width || (column.width = default_column_width);
      });
      return this.pad_last_column();
    },
    last_column: function() {
      return this.columns[this.columns.length - 1];
    },
    afterRender: function() {
      var _this = this;
      this.collection.each(function(model, index) {
        return _this.render_row.apply(_this, [model, index]);
      });
      return this.trigger("after:grid:render", this);
    },
    refresh: function() {
      return this.render();
    },
    render_header: function() {
      var headers,
        _this = this;
      this.trigger("before:render:header");
      headers = _(this.columns).map(function(column, column_index) {
        var style;
        style = column.width ? "width:" + column.width + "px;" : "";
        return "<th style='" + style + "' class='column-" + column_index + "'>" + column.header + "</th>";
      });
      return this.header.append("<tr>" + headers + "</tr>");
    },
    render_row: function(row, row_index) {
      var alt_class, cells,
        _this = this;
      this.trigger("before:render:row", row, row_index);
      cells = _(this.columns).map(function(column, col_index) {
        var display, style, value;
        value = _this.cell_renderer(row, column, col_index);
        style = column.width ? "width:" + column.width + "px;" : "";
        display = _.isUndefined(value) ? "" : value;
        return "<td style='" + style + "' class='column-" + col_index + "'>" + display + "</td>";
      });
      alt_class = row_index % 2 === 0 ? "even" : "odd";
      return this.body.append("<tr data-row-index='" + row_index + "' class='grid-view-row " + alt_class + "' id='row-" + row_index + "'>" + cells + "</tr>");
    },
    cell_renderer: function(row, column, columnIndex) {
      var source;
      if (_.isFunction(column.renderer)) {
        return column.renderer.apply(this, [row, column, columnIndex]);
      } else if (column.data.match(/\w+\.\w+/)) {
        source = row.attributes || row;
        return Luca.util.nestedValue(column.data, source);
      } else {
        return (typeof row.get === "function" ? row.get(column.data) : void 0) || row[column.data];
      }
    },
    double_click_handler: function(e) {
      var me, my, record, rowIndex;
      me = my = $(e.currentTarget);
      rowIndex = my.data('row-index');
      record = this.collection.at(rowIndex);
      return this.trigger("row:double:click", this, record, rowIndex);
    },
    click_handler: function(e) {
      var me, my, record, rowIndex;
      me = my = $(e.currentTarget);
      rowIndex = my.data('row-index');
      record = this.collection.at(rowIndex);
      this.trigger("row:click", this, record, rowIndex);
      $('.grid-view-row', this.body).removeClass('selected-row');
      return me.addClass('selected-row');
    }
  });

  Luca.register("grid_view", "Luca.components.GridView");

}).call(this);
(function() {
  Luca.templates || (Luca.templates = {});
  Luca.templates["components/grid_view"] = function(obj){var __p=[],print=function(){__p.push.apply(__p,arguments);};with(obj||{}){__p.push('<div class=\'luca-ui-grid-view-wrapper\'>\n  <div class=\'grid-view-header\'></div>\n  <div class=\'grid-view-body\'>\n    <table cellpadding=\'0\' cellspacing=\'0\' class=\'luca-ui-grid-view scrollable-table\' width=\'100%\'>\n      <thead class=\'fixed\'></thead>\n      <tbody class=\'scrollable\'></tbody>\n    </table>\n  </div>\n  <div class=\'grid-view-footer\'></div>\n</div>\n');}return __p.join('');};
}).call(this);
(function() {
  Luca.templates || (Luca.templates = {});
  Luca.templates["containers/tab_view"] = function(obj){var __p=[],print=function(){__p.push.apply(__p,arguments);};with(obj||{}){__p.push('<div class=\'luca-ui-tab-container\' id=\'', cid ,'-tab-container\'>\n  <ul></ul>\n</div>\n<div class=\'luca-ui-tab-panel-container\' id=\'', cid ,'-tab-panel-container\'></div>\n');}return __p.join('');};
}).call(this);
(function() {
  Luca.templates || (Luca.templates = {});
  Luca.templates["fields/checkbox_field"] = function(obj){var __p=[],print=function(){__p.push.apply(__p,arguments);};with(obj||{}){__p.push('<label for=\'', input_id ,'\'>\n  ', label ,'\n</label>\n<input name=\'', input_name ,'\' type=\'checkbox\' value=\'', input_value ,'\' />\n');}return __p.join('');};
}).call(this);
(function() {
  Luca.templates || (Luca.templates = {});
  Luca.templates["fields/select_field"] = function(obj){var __p=[],print=function(){__p.push.apply(__p,arguments);};with(obj||{}){__p.push('<label for=\'', input_id ,'\'>\n  ', label ,'\n</label>\n<select id=\'', input_id ,'\' name=\'', input_name ,'\'></select>\n');}return __p.join('');};
}).call(this);
(function() {
  Luca.templates || (Luca.templates = {});
  Luca.templates["fields/text_field"] = function(obj){var __p=[],print=function(){__p.push.apply(__p,arguments);};with(obj||{}){__p.push('<label for=\'', input_id ,'\'>\n  ', label ,'\n</label>\n<input id=\'', input_id ,'\' name=\'', input_name ,'\' type=\'text\' />\n');}return __p.join('');};
}).call(this);
(function() {



}).call(this);
