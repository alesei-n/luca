Luca.fields.ButtonField = Luca.core.Field.extend
  form_field: true
  
  readOnly: true

  events: 
    "click input" : "click_handler"

  hooks:[
    "button:click"
  ]

  className: 'luca-ui-field luca-ui-button-field'
  
  template: 'fields/button_field'

  click_handler: (e)->
    me = my = $( e.currentTarget )
    @trigger "button:click"

  initialize: (@options={})->
    _.extend @options
    _.bindAll @, "click_handler"

    Luca.core.Field.prototype.initialize.apply @, arguments

  afterInitialize: ()->
    @input_id ||= _.uniqueId('button')
    @input_name ||= @name
    @input_value ||= @label ||= @text
    @input_type ||= "button"
    @input_class ||= "luca-button"

  setValue: ()-> true

Luca.register "button_field", "Luca.fields.ButtonField"
