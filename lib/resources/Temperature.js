var Autowire = require("wantsit").Autowire

Temperature = function() {
  this._temperatureController = Autowire
  this._logger = Autowire
}

Temperature.prototype.retrieveOne = function(request) {
  this._logger.info("Incoming request. Current temperature %d°C", this._temperatureController.getCelsius());

  request.reply(this._temperatureController.getCelsius())
}

module.exports = Temperature
