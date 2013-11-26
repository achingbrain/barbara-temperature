var Autowire = require("wantsit").Autowire;

Temperature = function() {
	this._temperatureController = Autowire;
	this._logger = Autowire;
};

Temperature.prototype.retrieveOne = function(request) {
	this._logger.info("Incoming request. Current temperature", this._temperatureController.getCelsius(), "deg C", this._temperatureController.getFahrenheit(), "deg F");

	request.reply({
		"celsius": this._temperatureController.getCelsius(),
		"fahrenheit": this._temperatureController.getFahrenheit()
	});
};

module.exports = Temperature;
