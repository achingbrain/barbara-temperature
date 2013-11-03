var five = require("johnny-five"),
	Autowire = require("wantsit").Autowire,
	LOG = require("winston"),
	restify = require("restify");

TemperatureController = function() {
	this._config = Autowire;
	this._celsius = NaN;
	this._farenheit = NaN;
};

TemperatureController.prototype.afterPropertiesSet = function() {
	var celciusValues = [];
	var farenheitValues = [];
	var index = 0;

	this._board = new five.Board({port: this._config.get("arduino:port")});
	this._board.on("ready", function() {
		LOG.info("TemperatureController", "Board ready");
		var sensor = new five.Sensor("A0");

		sensor.on("data", function() {
			var voltage = this.value * 0.004882814;
			var celsius = (voltage - 0.5) * 100;

//			var temp = ( (data[1] << 8) + data[0] )*0.0625;

			//var celsius = (100 * (this.value / 1000) - 50).toFixed(2);
			var fahrenheit = celsius * (9/5) + 32;

			if(index == 10) {
				index = 0;
			}

			celciusValues[index] = celsius;
			farenheitValues[index] = fahrenheit;

			index++;
		});

		setInterval(function() {
			this._celsius = this._findAverage(celciusValues);
			this._farenheit = this._findAverage(farenheitValues);
		}.bind(this), 1000);
	}.bind(this));
}

TemperatureController.prototype._findAverage = function(temperatures) {
	var count = 0;

	temperatures.forEach(function(temperature) {
		count += temperature;
	});

	return count/temperatures.length;
}

TemperatureController.prototype.getCelsius = function() {
	return this._celsius;
}

TemperatureController.prototype.getFarenheit = function() {
	return this._farenheit;
}

TemperatureController.prototype.onSeaportFound = function(seaport) {
	seaport.get(this._config.get("statto:name") + "@" + this._config.get("statto:version"), function(services) {
		var url = "http://" + services[0].host + ":" + services[0].port;

		LOG.info("Will POST temperature to", url + "/brews/" + this._config.get("brew:id"));

		var client = restify.createJsonClient({
			url: url
		});

		// periodically report the temperature
		setInterval(function() {
			client.post("/brews/" + this._config.get("brew:id") + "/temperature", {
				celcius: this._celsius
			}, function(error) {
				if(error) {
					LOG.error("Could not report temperature to", url, error);

					return;
				}
			});
		}.bind(this), 60000);
	}.bind(this));
}

module.exports = TemperatureController;