define([
    'core/js/adapt'
], function(Adapt) {

    var QuickNavController = Backbone.Controller.extend({

        state: {
            lastBlock: null,
            currentMenu: null,
            currentMenuId: null,
            currentPage: null,
            currentPageId: null,
            isFirstPage: false,
            isLastPage: false,
            menuPages: {}
        },

        initialize: function() {
            this.listenTo(Adapt, {
                "app:dataReady": this.fetchMenuPages,
                "pageView:postRender": this.onPagePostRender
            });
        },

        fetchMenuPages: function() {

            var menus = [Adapt.course].concat(Adapt.contentObjects.where({_type: "menu"}));

            _.each(menus, _.bind(function(menu) {

                var id = menu.get("_id");
                var pages = Adapt.contentObjects.where({_type: "page", _parentId: id });
                
                this.state.menuPages[id] = {};

                _.each(pages, _.bind(function(page) {
                    this.state.menuPages[id][page.get("_id")] = page;
                }, this));

            }, this));

        },

        onPagePostRender: function(pageView) {

            var pageModel = pageView.model;

            var blocks = pageModel.findDescendants("blocks");
            var parentId = pageModel.get("_parentId");

            this.state.currentMenu = Adapt.findById(parentId);
            this.state.currentMenuId = parentId;
            this.state.currentPage = pageModel;
            this.state.currentPageId = pageModel.get("_id");
            this.state.lastBlock = blocks.last();

        }
        
    });

    Adapt.quicknav = new QuickNavController();

    return QuickNavController;

});
