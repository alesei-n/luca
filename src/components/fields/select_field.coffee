Luca.fields.SelectField = Luca.core.Field.extend
  events:
    "change select" : "change_handler"
  
  hooks:[
    "after:select"
  ]

  className: 'luca-ui-select-field luca-ui-field'

  template: "fields/select_field"

  initialize: (@options={})->
    _.extend @, @options
    _.extend @, Luca.modules.Deferrable
    _.bindAll @, "change_handler"

    Luca.core.Field.prototype.initialize.apply @, arguments

    @configure_collection()

  change_handler: (e)->
    me = my = $( e.currentTarget )
    console.log "Selected", me
  
  select_el: ()-> 
    $("select", @el)
  
  includeBlank: true

  blankValue: ''

  blankText: 'Select One'

  afterRender: ()->
    @select_el().html('')
    
    if @includeBlank
      @select_el().append("<option value='#{ @blankValue }'>#{ @blankText }</option>")

    if @collection?.each?
      @collection.each (model) =>
        value = model.get( @valueField )
        display = model.get( @displayField )
        selected = "selected" if @selected and value is @selected
        option = "<option #{ selected } value='#{ value }'>#{ display }</option>"
        @select_el().append( option )

    if @collection.data
      _( @collection.data ).each (pair)=>
        value = pair[0] 
        display = pair[1] 
        selected = "selected" if @selected and value is @selected
        option = "<option #{ selected } value='#{ value }'>#{ display }</option>"
        @select_el().append( option )

Luca.register "select_field", "Luca.fields.SelectField"
