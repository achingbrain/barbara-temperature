var TemperatureController = require(__dirname + "/../../controllers/TemperatureController"),
	sinon = require("sinon"),
	should = require("should");

module.exports["TemperatureController"] = {
	setUp: function(done) {
		this.controller = new TemperatureController();
		this.controller._logger = {
			info: function() {},
			warn: function() {},
			error: function() {},
			debug: function() {}
		};
		this.controller._config = {
			get: sinon.stub()
		}

		this.clock = sinon.useFakeTimers();

		done();
	},

	tearDown: function (done) {
		this.clock.restore();

		done();
	},

	"Should calculate temperature": function( test ) {
		var data = [237, 1, 75, 70, 127, 255, 3, 16, 226];

		var calculated = this.controller._calculateTemperature(data);

		calculated.should.equal(30.8125);

		test.done();
	},

	"Should survive corrupt data": function( test ) {
		var lastCalculated = 5;
		var data = [74, 1, 75, 70, 127, 255, 6, 16, 231];

		this.controller._celsius = lastCalculated;

		var calculated = this.controller._calculateTemperature(data);
		calculated.should.equal(lastCalculated);

		test.done();
	},

	"Should find average": function( test ) {
		var calculated = this.controller._findAverage([10, 5]);
		calculated.should.equal(7.5);

		test.done();
	},

	"Should return celsius": function( test ) {
		var celsius = 10;

		this.controller._celsius = celsius;

		var returned = this.controller.getCelsius();
		returned.should.equal(celsius);

		test.done();
	},

	"Should return farenheit": function( test ) {
		var celsius = -40;

		this.controller._celsius = celsius;

		var returned = this.controller.getFahrenheit();
		returned.should.equal(celsius);

		test.done();
	},

	"Should read temperature": function( test ) {
		this.controller._temperatureSensor = {
			on: sinon.stub()
		};

		// trigger setting up of the "open" event listener
		this.controller.afterPropertiesSet();

		// get on open callback
		var onOpenCall = this.controller._temperatureSensor.on.getCall(0);
		onOpenCall.calledWith("open", sinon.match.func);
		var onOpenCallback = onOpenCall.args[1];
		should(onOpenCallback).be.a.func;

		// trigger setting up of "data" event listener
		onOpenCallback();

		var onDataCall = this.controller._temperatureSensor.on.getCall(1);
		onDataCall.calledWith("data", sinon.match.func);
		var onDataCallback = onDataCall.args[1];
		should(onDataCallback).be.a.func;

		// send some data
		onDataCallback(new Buffer([0xF0, 237, 1, 75, 70, 127]));
		onDataCallback(new Buffer([255, 3, 16, 226, 0xF7]));

		this.controller.getCelsius().should.equal(30.8125);

		test.done();
	}
};
