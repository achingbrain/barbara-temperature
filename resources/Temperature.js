var LOG = require("winston"),
	Autowire = require("wantsit").Autowire;

Temperature = function() {
	this._temperatureController = Autowire;
};

Temperature.prototype.retrieveOne = function(request) {
	LOG.info("Incoming request. Current temperature", this._temperatureController.getCelsius(), "deg C", this._temperatureController.getFarenheit(), "deg F");

	request.reply({
		"celsius": this._temperatureController.getCelsius(),
		"farenheit": this._temperatureController.getFarenheit()
	});
};

module.exports = Temperature;