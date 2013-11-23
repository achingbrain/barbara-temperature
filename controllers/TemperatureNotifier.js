var Autowire = require("wantsit").Autowire,
	LOG = require("winston"),
	restify = require("restify");

TemperatureNotifier = function() {
	this._config = Autowire;
	this._temperatureController = Autowire;
	this._seaport = Autowire;
};

TemperatureNotifier.prototype.afterPropertiesSet = function() {
	setInterval(function() {
		// don't post NaN...
		if(isNaN(this._temperatureController.getCelsius())) {
			return;
		}

		// look up statto
		var services = this._seaport.query(this._config.get("statto:name") + "@" + this._config.get("statto:version"));

		if(services.length == 0) {
			LOG.info("TemperatureNotifier", "No statto instance found!");

			return;
		}

		// post the temperature
		var url = "http://" + services[0].host + ":" + services[0].port;
		var path = "/brews/" + this._config.get("brew:id") + "/temperatures";

		LOG.info("TemperatureNotifier", "Posting", this._temperatureController.getCelsius(), "degC to", url + path);

		var client = restify.createJsonClient({
			url: url
		});
		client.post(path, {
			celsius: this._temperatureController.getCelsius()
		}, function(error) {
			if(error) {
				LOG.error("TemperatureNotifier", "Could not report temperature to", url, error.message);

				return;
			}

			LOG.info("TemperatureNotifier", "Reported temperature OK");
		});
	}.bind(this), this._config.get("notificationInterval"));
}

module.exports = TemperatureNotifier;