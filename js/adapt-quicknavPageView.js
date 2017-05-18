define([
	'core/js/adapt'
], function(Adapt) {

	var QuickNavPageView = Backbone.View.extend({
		
		className: "block quicknav",

		events: {
			"click #root": "onRoot",
			"click #previous": "onPrevious",
			"click #up": "onUp",
			"click #next": "onNext"
		},

		initialize: function(options) {

			this.state = options.state;
			this.config = options.config;
			this.parent = options.parent;

			this.listenTo(Adapt, 'remove', this.remove);

			this.render();

			this.setLocking();
			this.enableNextOnCompletion();

		},

		render: function() {

	        var template = Handlebars.templates["quicknav-bar"];

	        var data = this.model.toJSON();
	        data.state = this.state;
	        data.config = this.config;

	        this.$el.html(template(data));

	        return this;

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

		enableNextOnCompletion: function() {

			if (!this.config._isEnableNextOnCompletion) return;
				
			if (this.model.get("_isComplete")) {
				this.onPageCompleted();
			} else {
				this.listenTo(this.model, "change:_isComplete", this.onPageCompleted);
			}

			if (this.state._locked === true) {
            	this.$('#next').attr("disabled", "disabled");
            } else {
            	this.$('#next').removeAttr("disabled");
            }

		},

		onRoot: function() {
			this.navigateTo("/");
		},

		onPrevious:function() {
			var params = this.getParameters();

			if (params.pages === undefined) return;

			var indexOfCurrentPage = _.indexOf(params.pages, this.model.get("_id"));
			var indexOfPrevPage = this.getPrevPageIndex(params.menus, params.indexOfMenu, params.pages, indexOfCurrentPage);

			this.navigateTo(params.pages[indexOfPrevPage]);
		},

		onUp: function() {
			this.navigateTo(this.model.get("_parentId"));
		},

		onNext: function() {
			var params = this.getParameters();

			if (params.pages === undefined) return;

			var indexOfCurrentPage = _.indexOf(params.pages, this.model.get("_id"));
			var indexOfNextPage = this.getNextPageIndex(params.menus, params.indexOfMenu, params.pages, indexOfCurrentPage);

			this.navigateTo(params.pages[indexOfNextPage]);
		},

		getParameters: function() {

			var params = {};

			if (_.keys(this.state.menuPages).length === 0 || !this.state.currentMenu) {
				params.pages = _.pluck(new Backbone.Collection(Adapt.contentObjects.where({_type: "page"})).toJSON(), [ "_id" ]);
				return params;
			}

			params.menus = _.keys(this.state.menuPages);
			params.indexOfMenu = _.indexOf(params.menus, this.state.currentMenu.get("_id"));
			params.pages = _.keys(this.state.menuPages[this.state.currentMenu.get("_id")]);

			return params;
		},

		navigateTo: function(id) {

			if (id === Adapt.course.get("_id")) {
				id = "/";
			}

			var hash = "#" + (id === "/" ? id : "/id/" + id);
			Backbone.history.navigate(hash, {trigger:true, "replace": false});

		},

		onPageCompleted: function() {
			this.setLocking();
		},

		getPrevPageIndex: function(menus, indexOfMenu, pages, indexOfPage) {

			if (this.config._isContinuous == "global" && (menus !== undefined || !this.state.currentMenu)) {
				if (indexOfPage === 0 || !this.state.currentMenu) { //if page is at the beginning of the menu goto previous menu, last page
					if (this.config._global !== undefined && this.config._global._pagePrevious !== undefined) {
						this.navigateTo(this.config._global._pagePrevious);
						return;
					} else if (indexOfMenu === 0 && indexOfMenu == menus.length - 1) {
						//single menu, last page
					} else if (indexOfMenu === 0) {
						indexOfMenu = menus.length - 1; //last menu
						pages = _.keys(this.state.menuPages[menus[indexOfMenu]]); //get menu pages
					} else {
						indexOfMenu-=1; //previous menu
						pages = _.keys(this.state.menuPages[menus[indexOfMenu]]); //get menu pages
					}
					indexOfPage = pages.length - 1; //last page
				} else {
					indexOfPage-=1; //previous page
				}
			} else if (this.config._isContinuous == "local" || (this.config._isContinuous == "global" && menus === undefined)) {
				if (indexOfPage === 0 && indexOfPage == pages.length - 1) {
					//single page
				} else if (indexOfPage === 0) {
					indexOfPage = pages.length - 1; //last page
				} else {
					indexOfPage-=1; //previous page
				}
			} else {
				if (indexOfPage === 0) return;
				indexOfPage-=1; //previous page
			}

			if (this.isPageAvailable(pages, indexOfPage)) {
				return indexOfPage;
			} else {
				//uh-oh, that page isn't available - try again
				return this.getPrevPageIndex(menus, indexOfMenu, pages, indexOfPage);
			}

		},

		getNextPageIndex: function(menus, indexOfMenu, pages, indexOfPage) {

			if (this.config._isContinuous == "global" && (menus !== undefined || !this.state.currentMenu)) {
				if (indexOfPage === pages.length - 1 || !this.state.currentMenu) { //if page is at the end of the menu goto next menu, first page
					if (this.config._global !== undefined && this.config._global._pageNext !== undefined) {
						this.navigateTo(this.config._global._pageNext);
						return;
					} else if (indexOfMenu === 0 && indexOfMenu == menus.length - 1) {
						//single menu, first page
					} else if (indexOfMenu == menus.length - 1) {
						indexOfMenu = 0; //first menu
						pages = _.keys(this.state.menuPages[menus[indexOfMenu]]); //get menu pages
					} else {
						indexOfMenu+=1; //next menu
						pages = _.keys(this.state.menuPages[menus[indexOfMenu]]); //get menu pages
					}
					indexOfPage = 0; //first page
				} else {
					indexOfPage+=1; //next page
				}
			} else if (this.config._isContinuous == "local" || (this.config._isContinuous == "global" && menus === undefined)) {
				if (indexOfPage === 0 && indexOfPage == pages.length - 1) {
					//single page
				} else if (indexOfPage == pages.length - 1) {
					indexOfPage = 0; //first page
				} else {
					indexOfPage+=1; //next page
				}
			} else {
				if (indexOfPage == pages.length - 1) return;
				indexOfPage+=1; //next page
			}

			if (this.isPageAvailable(pages, indexOfPage)) {
				return indexOfPage;
			} else {
				//uh-oh, that page isn't available - try again
				return this.getNextPageIndex(menus, indexOfMenu, pages, indexOfPage);
			}

		},

		isPageAvailable: function(pages, indexOfPage) {

			var contentObject = Adapt.findById(pages[indexOfPage]);
			return contentObject.get('_isAvailable');
			
		}

	});

	return QuickNavPageView;
});