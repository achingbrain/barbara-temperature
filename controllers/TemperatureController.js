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

	var board = new firmata.Board(this._config.get("arduino:port"), function (error) {
		if(error) {
			console.error(error);
			return;
		}

		var pin = this._config.get("arduino:pin");

		board.sendOneWireConfig(pin, true);
		board.sendOneWireSearch(pin, function(error, devices) {
			if(error) {
				console.error(error);
				return;
			}

			var device = devices[0];

			var readTemperature = function() {
				board.sendOneWireReset(pin);
				board.sendOneWireWrite(pin, device, 0x44);
				board.sendOneWireDelay(pin, 1000);
				board.sendOneWireReset(pin);
				board.sendOneWireWriteAndRead(pin, device, 0xBE, 9, function(error, data) {
					if(error) {
						console.error(error);
						return;
					}

					var raw = (data[1] << 8) | data[0];
					var celsius = raw / 16.0;
					var fahrenheit = celsius * 1.8 + 32.0;

					console.info("celsius", celsius);
					console.info("fahrenheit", fahrenheit);

					if(index == 10) {
						index = 0;
					}

					celciusValues[index] = celsius;
					farenheitValues[index] = fahrenheit;

					index++;
				});
			};
			readTemperature();

			setInterval(readTemperature, 5000);

			setInterval(function() {
				this._celsius = this._findAverage(celciusValues);
				this._farenheit = this._findAverage(farenheitValues);
			}.bind(this), 1000);
		});
	}.bind(this));
/*
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
	}.bind(this));*/
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
			/*client.post("/brews/" + this._config.get("brew:id") + "/temperature", {
				celcius: this._celsius
			}, function(error) {
				if(error) {
					LOG.error("Could not report temperature to", url, error);

					return;
				}
			});*/
			LOG.info("Would have posted", this._celsius, "degC");
		}.bind(this), 60000);
	}.bind(this));
}

module.exports = TemperatureController;