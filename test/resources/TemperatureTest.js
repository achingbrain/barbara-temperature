var Temperature = require(__dirname + "/../../resources/Temperature"),
	sinon = require("sinon"),
	should = require("should");

module.exports["Temperature"] = {
	setUp: function(done) {
		this.resource = new Temperature();
		this.resource._logger = {
			info: sinon.stub(),
			warn: sinon.stub(),
			error: sinon.stub(),
			debug: sinon.stub()
		};
		this.resource._temperatureController = {
			getCelsius: sinon.stub(),
			getFahrenheit: sinon.stub()
		};

		done();
	},

	"Should return temperature": function( test ) {
		var temperature = 20;
		var request = {
			reply: sinon.stub()
		};

		this.resource._temperatureController.getCelsius.returns(temperature);
		this.resource._temperatureController.getFahrenheit.returns(temperature);

		this.resource.retrieveOne(request);

		// should have returned temperature
		var call = request.reply.getCall(0);
		call.args[0].celsius.should.equal(temperature);
		call.args[0].fahrenheit.should.equal(temperature);

		test.done();
	}
};
