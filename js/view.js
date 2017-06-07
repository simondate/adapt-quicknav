define([
    'core/js/adapt',
    'core/js/views/componentView',
    './quicktip'
], function(Adapt, ComponentView, QuickTip) {

    var QuickNavComponent = ComponentView.extend({
       
        className: "quicknav",

        events: {
            "click button": "onButtonClick",
            "mouseover button": "onButtonMouseOver"
        },

        preRender: function() {

            this.setCompletionStatus();
            this.model.updateState();

            this.state = Adapt.quicknav.state;
            this.config = this.model.get("_quicknav")

            this.listenTo(Adapt, 'remove', this.remove);
            this.listenTo(this.model, "change:_isComplete", this.onPageCompleted);

            this.ids = this.model.getNavigationIds();

        },

        render: function() {

            var template = Handlebars.templates["quicknav"];

            var data = this.model.toJSON();
            data.state = this.state;
            data.config = this.config;

            for (var k in this.ids) {
                var id = this.ids[k];
                if (!id) data[k] = null;
                else data[k] = Adapt.findById(id).toJSON();
            }

            data.siblings = this.model.getDirectSiblings().toJSON();

            this.$el.html(template(data));

            _.defer(_.bind(this.postRender, this));

            return this;

        },

        postRender: function() {
            
            this.setLocking();
            this.enableNextOnCompletion();

            this.setReadyStatus();
            
        },

        setLocking: function() {

            this.state._locked = false;

            var config = this.config;
            if (!config._lock) return;

            var contentObjects = config._lock;
            var completeCount = 0;

            for (var i = 0; i < contentObjects.length; i++) {

                var contentObject = Adapt.contentObjects.findWhere({
                    _id:contentObjects[i]
                });

                var isComplete = contentObject.get("_isComplete");
                var isAvailable = contentObject.get("_isAvailable");
                if (!isComplete && isAvailable) continue;
                
                completeCount++;

            }

            if (completeCount >= contentObjects.length) return;
            
            this.state._locked = true;

        },

        onPageCompleted: function() {

            this.setLocking();

            _.defer(_.bind(this.checkSiblingLocking, this));

            this.toggleNextButton();

        },

        checkSiblingLocking: function() {

            this.$(".sibling").each(function(index, item) {
                
                var $item = $(item);
                var id = $item.attr("id");
                var model = Adapt.findById(id);

                if (model.get("_isComplete")) {
                    $item.addClass("complete");
                }

                if (!model.get("_isLocked")) {
                    $item.removeClass("locked").removeClass("disabled");
                } else {
                    $item.addClass("locked").addClass("disabled");
                }

            });

        },

        enableNextOnCompletion: function() {

            if (!this.config._isEnableNextOnCompletion) return;
                
            if (this.model.get("_isComplete")) {
                this.onPageCompleted();
            }

            this.toggleNextButton();

        },

        toggleNextButton: function() {
            
            if (this.state._locked === true) {
                this.$('#next').addClass("disabled");
                return;
            }
            
            this.$('#next').removeClass("disabled");
            
        },

        onButtonClick: function(event) {

            var $target = $(event.target);
            if ($target.hasClass("locked") || $target.hasClass("selected")) {
                return;
            }

            var onClick = $target.attr("click");
            var id = $target.attr("id");

            if (onClick) {
                var func = new Function('view', 'Adapt', onClick);
                func(this, Adapt);
                return;
            }

            if (!this.ids[id]) {
                this.navigateTo(id);
                return;
            }

            this.navigateTo(this.ids[id]);

        },

        onButtonMouseOver: function(event) {

            var $target = $(event.target);
            var quicktip = $target.attr("quicktip");

            if (!quicktip) return;

            if (Adapt.quicktip) {
                
                if( Adapt.quicktip.id === $target.attr("id")) {
                    event.stopPropagation();
                    return;
                }

                Adapt.quicktip.remove();
            }

            var quicktip = new QuickTip({
                parent: this,
                $target: $target,
                event: event
            });

            this.$(".quicknav-inner").append(quicktip.$el);

            event.stopPropagation();

        },

        navigateTo: function(id) {

            if (id === Adapt.course.get("_id")) {
                id = "/";
            }

            var hash = "#" + (id === "/" ? id : "/id/" + id);
            Backbone.history.navigate(hash, {trigger:true, "replace": false});

        }

    });

    return QuickNavComponent;

});