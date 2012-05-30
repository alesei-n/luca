_.def('Luca.containers.TabView').extends('Luca.containers.CardView').with

  events:
    "click ul.nav-tabs li" : "select"

  hooks:[
    "before:select"
    "after:select"
  ]

  componentType: 'tab_view'

  className: 'luca-ui-tab-view tabbable'

  tab_position: 'top'

  tabVerticalOffset: '50px'

  initialize: (@options={})->
    Luca.containers.CardView::initialize.apply @, arguments
    _.bindAll @, "select", "highlightSelectedTab"
    @setupHooks( @hooks )

    @bind "after:card:switch", @highlightSelectedTab

  bodyElement: "div"

  bodyClassName: 'tab-content'

  activeTabSelector: ()->
    @tabSelectors().eq( @activeCard || @activeTab || @activeItem )

  beforeLayout: ()->
    @$el.addClass("tabs-#{ @tab_position }")

    if @tab_position is "below"
      @$el.append Luca.templates["containers/tab_view"](@)
      @$el.append Luca.templates["containers/tab_selector_container"](@)
    else
      @$el.append Luca.templates["containers/tab_selector_container"](@)
      @$el.append Luca.templates["containers/tab_view"](@)

    Luca.containers.CardView::beforeLayout?.apply @, arguments

  beforeRender: ()->
    Luca.containers.CardView::beforeRender?.apply @, arguments
    @activeTabSelector().addClass('active')

    if Luca.enableBootstrap and @tab_position is "left" or @tab_position is "right"
      @$el.wrap("<div class='row' />")
      @$el.addClass('span12')
      @tabContainerWrapper().addClass('span3')
      @tabContentWrapper().addClass('span9')

      if @tabVerticalOffset
        @tabContainerWrapper().css('padding-top', @tabVerticalOffset )

  highlightSelectedTab: ()->
    @tabSelectors().removeClass('active')
    @activeTabSelector().addClass('active')

  select: (e)->
    me = my = $( e.currentTarget )
    @trigger "before:select", @
    @activate my.data('target')
    @trigger "after:select", @

  tabContentWrapper: ()->
    $("##{ @cid }-tab-view-content")

  tabContainerWrapper: ()->
    $("##{ @cid }-tabs-selector")

  tabContainer: ()->
    $("ul##{ @cid }-tabs-nav")

  tabSelectors: ()->
    $( 'li.tab-selector', @tabContainer() )
