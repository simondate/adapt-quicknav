define([
    'core/js/adapt',
    'core/js/models/componentModel'
], function(Adapt, ComponentModel) {

    var Model = ComponentModel.extend({

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

        getNavigationData: function() {

        /* 
            * Combine the config, model, order, index and type for each _buttons
            * Add each combined item to an array
        */

            var buttonTypeModels = {
                "_page": this.getCurrentPage(),
                "_up": this.getCurrentMenu(),
                "_root": Adapt.course,
                "_next": this.getNextPage(),
                "_previous": this.getPrevPage(),
                "_sibling": this.getSiblingPages()
            };

            var data = [];

            var buttons = this.get("_quicknav")._buttons;
            var order = 0;
            var item;

            for (var attrName in buttons) {

                var buttonConfig = buttons[attrName];
                var buttonModel = buttonTypeModels[attrName];

                if (attrName === "_sibling") {
                    // Generate sibling entries
                    _.each(buttonModel, function(model, index) {

                        item = model.toJSON();
                        _.extend(item, buttonConfig, { 
                            type: attrName, 
                            index: index, 
                            order: order++
                        });
                        data.push(item);

                    });

                    continue;

                }

                // Find buttonModel from config._customRouteId if not found in defined type
                if (buttonConfig._customRouteId) buttonModel = Adapt.findById(buttonConfig._customRouteId);
                buttonModel = buttonModel || Adapt.findById(buttonConfig._customRouteId);

                // Convert found buttonModel to json if exists or create an "undefined" json
                item = buttonModel ? buttonModel.toJSON() : { "_isHidden": true };

                _.extend(item, buttonConfig, { 
                    type: attrName, 
                    index: 0, 
                    order: order++
                });
                data.push(item);

            }

            data.sort(function(a, b) {
                return a._order - b._order;
            });

            return data;

        },

        getCurrentPage: function() {

            var parents = this.getParents();
            for (var i = 0, l = parents.models.length; i < l; i++) {

                var model = parents.models[i];
                switch (model.get("_type")) {
                    case "page":
                        return model;
                }

            }

        },

        getCurrentMenu: function() {

            var parents = this.getParents();
            for (var i = 0, l = parents.models.length; i < l; i++) {

                var model = parents.models[i];
                switch (model.get("_type")) {
                    case "menu": case "course":
                        return model;
                }

            }

        },

        getSiblingPages: function() {
            
            var currentMenu = this.getCurrentMenu();
            var siblingModels = currentMenu.getAllDescendantsQuickNav(true);

            siblingModels = _.filter(siblingModels, function(model) {
                return (model.get("_type") === "page" && model.get("_isAvailable"));
            });

            return siblingModels;

        },

        getPrevPage: function() {

            var currentPage = this.getCurrentPage();
            var currentPageId = currentPage.get("_id");

            var pages = this.getPages();

            var hasFoundCurrentPage = false;
            for (var i = pages.length-1; i > -1; i--) {

                var page = pages[i];
                var isNotAvailable = !page.get("_isAvailable");
                if (isNotAvailable) continue;

                if (!hasFoundCurrentPage && page.get("_id") === currentPageId) {
                    hasFoundCurrentPage = true;
                    continue;
                } 

                if (hasFoundCurrentPage) {
                    return page;
                }

            }

            return;

        },

        getNextPage: function() {

            var currentPage = this.getCurrentPage();
            var currentPageId = currentPage.get("_id");

            var pages = this.getPages();

            var hasFoundCurrentPage = false;
            for (var i = 0, l = pages.length; i < l; i++) {

                var page = pages[i];
                var isNotAvailable = !page.get("_isAvailable");
                if (isNotAvailable) continue;

                if (!hasFoundCurrentPage && page.get("_id") === currentPageId) {
                    hasFoundCurrentPage = true;
                    continue;
                } 

                if (hasFoundCurrentPage) {
                    return page;
                }

            }

            return;

        },

        getPages: function() {

            var config = this.get("_quicknav");

            var loop = false;
            var descendants;
            switch (config._isContinuous) {
                case "global":
                    loop = true;
                    descendants = Adapt.course.getAllDescendantsQuickNav(true);
                    break;
                case "local":
                    loop = true;
                default:
                    var currentMenu = this.getCurrentMenu();
                    descendants = currentMenu.getAllDescendantsQuickNav(true);
            }

            if (loop) {
                // Create a double copy to allow loop searching
                descendants = descendants.concat(descendants);
            }

            return _.filter(descendants, function(model) {
                return model.get("_type") === "page";
            });

        }

    });

    return Model;

});