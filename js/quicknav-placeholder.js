define([
    'core/js/adapt',
    'core/js/views/componentView'
], function(Adapt, ComponentView) {

    var QuickNavComponent = ComponentView.extend({

        preRender: function() {
            this.setCompletionStatus();
        },

        postRender: function() {
            this.setReadyStatus();
        }

    });

    Adapt.register("quicknav", QuickNavComponent);

    return QuickNavComponent;
});