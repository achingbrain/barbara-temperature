var LOG = require("winston"),
	Autowire = require("wantsit").Autowire;

Temperature = function() {
	this._temperatureController = Autowire;
};

Temperature.prototype.retrieveOne = function(request) {
	LOG.info("Incoming request. Current temperature", this._temperatureController.getCelsius(), "deg C", this._temperatureController.getFarenheit(), "deg F");

	var temperature;

	if(request.query.type == "farenheit") {
		temperature = this._temperatureController.getFarenheit();
	} else {
		temperature = this._temperatureController.getCelsius();
	}

	request.reply({
		"temperature": temperature
	});
};

module.exports = Temperature;