App.Collections.Projects = Backbone.Collection.extend({
	model: App.Models.Project,
	
	url: function() {
		return Routes.cctray_path();
	},

	getProjects: function () {
		this.projects = this.projects || new App.Collections.Projects(this.get('Projects').Project);
		return this.projects;
	},

	getProjectsForDisplay: function() {
		var compare = function(x,y) {
			if(x===y) return 0;
			return x>y ? 1 : -1;
		};
		var pipeline_stages = _.filter(this.models, function(model) {
			return model.get('name').split(' :: ').length<=2 && /promotion/i.test(model.get('name').split(' :: '));
		});
		var pipelines = _.groupBy(pipeline_stages, function(model) {
			return model.get('name').split(' :: ')[0];
		});
		var result = _.map(pipelines, function(group, key, collection) {
			var interestedJob =
				_.filter(group,function(model){return model.isFailing();}).concat(
				_.filter(group,function(model){return model.isBuilding();}),
				group);
			return interestedJob[0];
		});
		result = result.sort(function(model1, model2) {
			var diff = model2.getPriorityIndex() - model1.getPriorityIndex();
			if (!diff) {
				diff = -compare(model1.get('lastBuildTime'),model2.get('lastBuildTime'));
			}
			return diff;
		});
		var count = _.countBy(result, function(model) {return model.isFailing()? 'failing' : 'passing'});
		for (var i = 0; i < count.failing; i++) {
			result[i].set('serialNumber',count.failing - i);
		};
		for (var i = count.failing; i < result.length; i++) {
			result[i].set('serialNumber', result.length - i);
		};
		return result;
	},

	getFailingBuildsSortedByRecentlyFailed: function() {
		_.chain(this.models)
			.filter(function (model) { return model.isFailing(); })
			.filter(function (model) { return model.isSleeping(); })
			.sortBy('lastBuildTime')
			.reverse()
			.value();
	},

	getRunningBuilds: function() {
		_.chain(this.models)
			.filter(function (model) { return model.isFailing(); })
			.filter(function (model) { return model.isBuilding(); })
			.sortBy('lastBuildTime')
			.reverse()
			.value();		
	},

	getLongTimeNoRunBuilds: function() {},

});
