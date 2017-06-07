define([
    'core/js/adapt',
    'core/js/models/componentModel'
], function(Adapt, ComponentModel) {

    var QuickNavModel = ComponentModel.extend({

        defaults: function() {
            return $.extend({}, _.result(ComponentModel.prototype, "defaults"), {
                "_isOptional": true,
                "_isComplete": true,
                "_isInteractionComplete": true,
                "_pageLevelProgress": {
                    "_isEnabled": false
                }
            });
        },

        getConfig: function() {
            return this.get("_quicknav");
        },

        getDirectSiblings: function() {

            var result = new Backbone.Collection();

            var currentMenuPages = Adapt.quicknav.state.menuPages[Adapt.quicknav.state.currentMenu.get("_id")];

            for (var k in currentMenuPages) {
                var model = Adapt.findById(k);
                if (!model.get("_isAvailable")) continue;
                result.add(Adapt.findById(k));
            }

            return result;

        },

        getNavigationIds: function() {

            return {
                next: this.getNextPageId(),
                previous: this.getPrevPageId(),
                up: this.getCurrentMenu.get("_parentId"),
                root: Adapt.course.get("_id")
            };

        },

        getCurrentPage: function() {
            
            var parents = this.getParents();
            for (var i = parents.models.length-1; i > -1; i--) {
                var model = parents.models[i];
                switch (model.get("_type")) {
                    case "page":
                        return model;
                }
            }

        },

        getCurrentMenu: function() {
            
            var parents = this.getParents();
            for (var i = parents.models.length-1; i > -1; i--) {
                var model = parents.models[i];
                switch (model.get("_type")) {
                    case "menu": case "course":
                        return model;
                }
            }
            
        },

        getPrevPageID: function() {

            var config = this.getConfig();

            var currentPage = this.getCurrentPage();
            var currentPageId = currentPage.get("_id");
            var currentMenu = this.getCurrentMenu();

            var loop = false;
            var descendants;
            switch (config._isContinuous) {
                case "global":
                    loop = true;
                    descendants = Adapt.course.getAllDescendants(true);
                    break;
                case "local":
                    loop = true;
                default:
                    descendants = currentMenu.getAllDescendants(true);
            }

            if (loop) {
                descendants = descendants.concat(descendants);
            }

            var pageIndex = -1, found = false;
            for (var i = descendants.length-1; i > -1; i--) {

                var descendant = descendants[i];
                if (!descendant.get("_isAvailable")) continue;

                if (!found && descendant.get("_id") === currentPageId) {
                    found = true
                    continue;
                } 

                if (found && descendant.get("_type") === "page") {
                    return descendant;
                }

            }

            return;

        },

        getNextPageID: function() {

            var config = this.getConfig();

            var currentPage = this.getCurrentPage();
            var currentPageId = currentPage.get("_id");
            var currentMenu = this.getCurrentMenu();

            var loop = false;
            var descendants;
            switch (config._isContinuous) {
                case "global":
                    loop = true;
                    descendants = Adapt.course.getAllDescendants(true);
                    break;
                case "local":
                    loop = true;
                default:
                    descendants = currentMenu.getAllDescendants(true);
            }

            if (loop) {
                descendants = descendants.concat(descendants);
            }

            var pageIndex = -1, found = false;
            for (var i = 0, l = descendants.length; i < l; i++) {

                var descendant = descendants[i];
                if (!descendant.get("_isAvailable")) continue;

                if (!found && descendant.get("_id") === currentPageId) {
                    found = true
                    continue;
                } 

                if (found && descendant.get("_type") === "page") {
                    return descendant;
                }

            }

            return;

        }

    });

    return QuickNavModel;

});