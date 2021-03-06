change_handler = (e)-> @trigger "on:change", @, e

_.def('Luca.fields.TextField').extends('Luca.core.Field').with
  events:
    "blur input" : "blur_handler"
    "focus input" : "focus_handler"
    "change input" : "change_handler"

  template: 'fields/text_field'

  autoBindEventHandlers: true

  send_blanks: true

  initialize: (@options={})->
    Luca.core.Field::initialize.apply @, arguments

    @input_id ||= _.uniqueId('field')
    @input_name ||= @name
    @label ||= @name
    @input_class ||= @class

    if @prepend
      @$el.addClass('input-prepend')
      @addOn = @prepend

    if @append
      @$el.addClass('input-append')
      @addOn = @append

    @registerEvent("keydown input","keydown_handler") if @enableKeyEvents

  blur_handler: (e)->
    me = my = $( e.currentTarget )

  focus_handler: (e)->
    me = my = $( e.currentTarget )

  change_handler: change_handler
  keydown_handler: _.throttle ((e)-> change_handler.apply @, arguments), 300
