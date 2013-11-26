var TemperatureNotifier = require(__dirname + "/../../controllers/TemperatureNotifier"),
	sinon = require("sinon"),
	should = require("should");

module.exports["TemperatureNotifier"] = {
	setUp: function(done) {
		this.controller = new TemperatureNotifier();
		this.controller._logger = {
			info: sinon.stub(),
			warn: sinon.stub(),
			error: sinon.stub(),
			debug: sinon.stub()
		};
		this.controller._config = {
			get: sinon.stub()
		};
		this.controller._temperatureController = {
			getCelsius: sinon.stub()
		};
		this.controller._seaport = {
			query: sinon.stub()
		};
		this.controller._restify = {
			createJsonClient: sinon.stub()
		}

		this.clock = sinon.useFakeTimers();

		done();
	},

	tearDown: function (done) {
		this.clock.restore();

		done();
	},

	"Should notify temperature": function( test ) {
		var celsius = 20;
		var notificationInterval = 10;
		var service = {
			host: "foo",
			port: 10
		};
		var brewId = "foo";
		var stattoName = "statto";
		var stattoVersion = "1.0.0";
		var restClient = {
			post: sinon.stub().callsArg(2)
		}

		this.controller._temperatureController.getCelsius.returns(celsius);
		this.controller._config.get.withArgs("notificationInterval").returns(notificationInterval);
		this.controller._config.get.withArgs("statto:name").returns(stattoName);
		this.controller._config.get.withArgs("statto:version").returns(stattoVersion);
		this.controller._config.get.withArgs("brew:id").returns(brewId);
		this.controller._seaport.query.withArgs(stattoName + "@" + stattoVersion).returns([service]);
		this.controller._restify.createJsonClient.withArgs({
			url: "http://" + service.host + ":" + service.port
		}).returns(restClient);

		this.controller.afterPropertiesSet();

		// fire setInterval
		this.clock.tick(notificationInterval + 1);

		// restify should have been called
		restClient.post.getCall(0).calledWith("/brews/" + brewId + "/temperatures", sinon.match.obj, sinon.match.func);

		test.done();
	},

	"Should not post NaN": function( test ) {
		var celsius = NaN;
		var notificationInterval = 10;

		this.controller._temperatureController.getCelsius.returns(celsius);
		this.controller._config.get.withArgs("notificationInterval").returns(notificationInterval);

		this.controller.afterPropertiesSet();

		// fire setInterval
		this.clock.tick(notificationInterval + 1);

		// should not have queried seaport for statto
		this.controller._seaport.query.neverCalledWith();

		test.done();
	}
};
