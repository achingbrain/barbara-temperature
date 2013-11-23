var SerialPort = require("serialport").SerialPort,
	Autowire = require("wantsit").Autowire,
	LOG = require("winston"),
	restify = require("restify");

var START_RESPONSE = 0xF0;
var END_RESPONSE = 0xF7;

TemperatureController = function() {
	this._config = Autowire;
	this._celsius = NaN;
};

TemperatureController.prototype._crc8 = function(data) {
	var crc = 0;

	for(var i = 0; i < data.length; i++) {
		var inbyte = data[i];

		for (var n = 8; n; n--) {
			var mix = (crc ^ inbyte) & 0x01;
			crc >>= 1;

			if (mix) {
				crc ^= 0x8C;
			}

			inbyte >>= 1;
		}
	}
	return crc;
};

TemperatureController.prototype._calculateTemperature = function(data) {
	var crc = this._crc8(data.slice(0, data.length - 1));

	if(crc != data[data.length - 1]) {
		LOG.warn("TemperatureController", "Data read from sensor may be corrupt", crc, " - ", Array.prototype.slice.call(data, 0, data.length));

		// return current average instead
		return this._celsius;
	}

	var raw = (data[1] << 8) | data[0];

	return raw / 16.0;
}

TemperatureController.prototype.afterPropertiesSet = function() {
	LOG.info("TemperatureController", "Connecting to board", this._config.get("arduino:port"));
	var serialPort = new SerialPort(this._config.get("arduino:port"), {
		baudrate: 9600
	});
	serialPort.on("open", function () {
		LOG.info("TemperatureController", this._config.get("arduino:port"), "initialised");

		var celsiusValues = [];
		var index = 0;
		var buffer = new Buffer(0);

		serialPort.on("data", function(data) {
			buffer = Buffer.concat([buffer, data]);

			if(buffer[0] == START_RESPONSE && buffer[buffer.length - 1] == END_RESPONSE) {
				var celsius = this._calculateTemperature(buffer.slice(1, buffer.length - 1));

				LOG.info("TemperatureController", celsius, "°C");

				if(index == 10) {
					index = 0;
				}

				celsiusValues[index] = celsius;

				index++;

				this._celsius = this._findAverage(celsiusValues);

				buffer = new Buffer(0);
			}
		}.bind(this));

		setInterval(function() {
			serialPort.write([1]);
		}, 10000);
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
	return this._celsius * 1.8 + 32.0;
}

module.exports = TemperatureController;