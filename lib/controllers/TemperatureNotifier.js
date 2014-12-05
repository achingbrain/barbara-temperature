var Autowire = require("wantsit").Autowire

TemperatureNotifier = function() {
  this._temperatureController = Autowire
  this._restify = Autowire
  this._logger = Autowire
  this._notifierClient = Autowire

  this._path = "/brews/" + process.env.BARBARA_BREW + "/temperatures"
  this._notificationInterval = process.env.BARBARA_NOTIFICATION_INTERVAL
}

TemperatureNotifier.prototype._sendRequest = function() {
  // don't post NaN...
  if(isNaN(this._temperatureController.getCelsius())) {
    return
  }

  // post the temperature
  this._logger.info("TemperatureNotifier Posting %d°C to %s", this._temperatureController.getCelsius(), this._path)

  this._notifierClient.post(this._path, {
    celsius: this._temperatureController.getCelsius()
  }, function(error) {
    if(error) {
      this._logger.error("TemperatureNotifier Could not report temperature to - %s", error.message)
    } else {
      this._logger.info("TemperatureNotifier Reported temperature OK")
    }

    setTimeout(this._sendRequest.bind(this), this._notificationInterval)
  }.bind(this))
}

TemperatureNotifier.prototype.afterPropertiesSet = function() {
  setTimeout(this._sendRequest.bind(this), this._notificationInterval)
}

module.exports = TemperatureNotifier
