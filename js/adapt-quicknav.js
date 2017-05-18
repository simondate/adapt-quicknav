define([
	'core/js/adapt',
	'./adapt-quicknavPageView',
	'./quicknav-placeholder'
], function(Adapt, QuickNavPageView) {

	var QuickNav = Backbone.Controller.extend({

		config: undefined,

		state: {
			lastBlock: undefined,
			currentMenu: undefined,
			currentPage: undefined,
			isFirstPage: false,
			isLastPage: false,
			menuPages: {}
		},

		initialize: function() {
			this.listenTo(Adapt, {
				"app:dataReady": this.onDataReady,
				"pageView:postRender": this.onPagePostRender,
				"blockView:postRender": this.onBlockPostRender
			});
		},

		onDataReady: function() {

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
			this.config = pageModel.get("_quicknav");

			if (this.config === undefined || (this.config._isEnabled !== true && this.config._isEnabled !== undefined)) {
				return;
			}

			var blocks = pageModel.findDescendants("blocks");
			var parentId = pageModel.get("_parentId");

			this.state.currentMenu = Adapt.findById(parentId);
			this.state.currentPage = pageModel;
			this.state.lastBlock = blocks.last();

		},

		onBlockPostRender: function(blockView) {

			if (this.state.lastBlock === undefined) return;
			if (blockView.model.get("_id") !== this.state.lastBlock.get("_id")) return;

			var element = blockView.$el.parent();

			this.updateState();

			var quickNavPageView = new QuickNavPageView({
				model: this.state.currentPage,
				config: this.config, 
				state: this.state,
				parent: this
			});
			quickNavPageView.undelegateEvents();

			var injectInto;
			if (this.config._injectIntoSelector) {
				injectInto = element.find(this.config._injectIntoSelector);
				if (injectInto.length > 0) {
					injectInto.append(quickNavPageView.$el);
				} else {
					element.append(quickNavPageView.$el);
				}
			} else {
				injectInto = element.find(".quicknav-component");
				if (injectInto.length > 0) {
					injectInto.append(quickNavPageView.$el);
				} else {
					element.append(quickNavPageView.$el);
				}
			}
			
			quickNavPageView.delegateEvents();

		},

		updateState: function() {

			this.state.isFirstPage = false;
			this.state.isLastPage = false;

			var pages;

			if (_.keys(this.state.menuPages).length === 0) {
				pages = _.pluck(new Backbone.Collection(Adapt.contentObjects.where({_type: "page", _isAvailable: true})).toJSON(), [ "_id" ]);
			} else if (!this.state.currentMenu) {
				this.state.isFirstPage = true;
				this.state.isLastPage = true;
				return;
			} else {
				pages = _.keys(this.state.menuPages[this.state.currentMenu.get("_id")]);
				
				pages = _.reject(pages, function(id) {
					var model = Adapt.contentObjects.findWhere({_id: id});
					return !model.get('_isAvailable');
				});
			}

			if (pages === undefined) return;

			var indexOfPage = _.indexOf(pages, this.state.currentPage.get("_id"));
			
			if (this.config._isContinuous == "local" || this.config._isContinuous == "global") {
				if (indexOfPage === 0 && indexOfPage == pages.length - 1 && this.config._isContinuous == "local") {
					this.state.isFirstPage = true;
					this.state.isLastPage = true;
				} else {
					this.state.isLastPage = false;
					this.state.isFirstPage = false;
				}
			} else {
				if (indexOfPage === 0) this.state.isFirstPage = true;
				if (indexOfPage == pages.length - 1) this.state.isLastPage = true;
			}

		}
	});

	Adapt.quicknav = new QuickNav();

	return QuickNav;

});
