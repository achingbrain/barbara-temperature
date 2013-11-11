var firmata = require("firmata"),
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

	LOG.info("TemperatureController", "Connecting to board", this._config.get("arduino:port"));
	var board = new firmata.Board(this._config.get("arduino:port"), function (error) {
		LOG.info("Board", this._config.get("arduino:port"), "initialised");

		if(error) {
			LOG.error("TemperatureController", "Error connecting to board", error);
			return;
		}

		var pin = this._config.get("arduino:pin");

		board.sendOneWireConfig(pin, true);
		board.sendOneWireSearch(pin, function(error, devices) {
			if(error) {
				LOG.error("TemperatureController", "Error searching for 1-wire devices", error);
				return;
			}

			var device = devices[0];

			var readTemperature = function() {
				LOG.info("TemperatureController", "Reading temperature");
				board.sendOneWireReset(pin);
				board.sendOneWireWrite(pin, device, 0x44);
				board.sendOneWireDelay(pin, 1000);
				board.sendOneWireReset(pin);
				board.sendOneWireWriteAndRead(pin, device, 0xBE, 9, function(error, data) {
					if(error) {
						LOG.error("TemperatureController", "Error sending write and read", error.toString());
						return;
					}

					var raw = (data[1] << 8) | data[0];
					var celsius = raw / 16.0;
					var fahrenheit = celsius * 1.8 + 32.0;

					LOG.info("TemperatureController", celsius, "°C", fahrenheit, "°F");

					if(index == 10) {
						index = 0;
					}

					celciusValues[index] = celsius;
					farenheitValues[index] = fahrenheit;

					index++;

					this._celsius = this._findAverage(celciusValues);
					this._farenheit = this._findAverage(farenheitValues);
				}.bind(this));
			}.bind(this);

			// read the temperature now
			readTemperature();

			// and every 10 seconds
			setInterval(readTemperature, 10000);
		}.bind(this));
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

module.exports = TemperatureController;