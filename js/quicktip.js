define([
    'core/js/adapt'
], function(Adapt) {

    var QuickTip = Backbone.View.extend({
        
        className: "quicktip",

        initialize: function(options) {

            _.bindAll(this, "onBodyMouseOver", "postRender", "show");
            this.show = _.debounce(this.show, 17);

            $(document).on("mouseover", this.onBodyMouseOver);
            this.listenTo(Adapt, "remove", this.remove);

            Adapt.quicktip = this;

            this.parent = options.parent;
            this.$target = options.$target;
            this.event = options.event;
            this.id = this.$target.attr("id");

            this.model = {
                text: this.$target.attr("quicktip"),
                id: this.$target.attr("id")
            };
            
            this.render();          

        },

        render: function() {

            var template = Handlebars.templates["quicktip"];

            this.$el.html(template(this.model));

            _.defer(this.postRender);

        },

        postRender: function() {

            var buttonPosition = this.$target.position();

            var marginLeft = parseInt(this.$(".triangle").css("margin-left"));
            var triangleWidth = (this.$(".triangle").outerWidth() / 2);
            var buttonWidth = (this.$target.outerWidth(true)/2);

            var position = {
                "top": buttonPosition.top,
                "left": (buttonPosition.left+buttonWidth)-marginLeft-triangleWidth,
                "right": this.$el.outerWidth() + ((buttonPosition.left+buttonWidth)-marginLeft-triangleWidth)
            };

            var $offsetParent = this.$el.offsetParent();
            var parentLeft = $offsetParent.offset().left;
            var parentRight = parentLeft + $offsetParent.innerWidth();
            var rightDifference = position.right - parentRight;
            var leftDifference = position.left - parentLeft;

            var offset = position.right > parentRight ? rightDifference : position.left <= parentLeft ? leftDifference : 0;
            position.left = position.left - offset
            
            this.$el.css({
                top: position.top,
                left: position.left - 1
            });

            this.$el.find(".triangle").css({
                left: offset
            });

            this.show();

        },

        show: function() {
            this.$el.addClass("show");
        },

        onBodyMouseOver: function() {

            Adapt.quicktip = null;
            $(document).off("mouseover", this.onBodyMouseOver);
            this.remove();

        }

    });

    return QuickTip;

});
