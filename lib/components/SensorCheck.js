var EventEmitter = require('events').EventEmitter,
  util = require('util'),
  Autowire = require('wantsit').Autowire

var SensorCheck = function() {
  EventEmitter.call(this)

  this._logger = Autowire
  this._child_process = Autowire

  this._sensor = process.env.BARBARA_TEMPERATURE_SENSOR
  this._slots = process.env.BARBARA_SLOTS
  this._device = '/sys/bus/w1/devices/' + this._sensor + '/w1_slave'
}
util.inherits(SensorCheck, EventEmitter)

SensorCheck.prototype.afterPropertiesSet = function() {
  this._checkOverlay(function(error, loaded) {
    if(error) throw error

    if(!loaded) {
      this._loadOverlay(function(error) {
        if(error) throw error

        this._checkSensor(function(error) {
          if(error) throw error

          this.emit('ready')
        }.bind(this))
      }.bind(this))
    } else {
      this._checkSensor(function(error) {
        if(error) throw error

        this.emit('ready')
      }.bind(this))
    }
  }.bind(this))
}

SensorCheck.prototype._checkOverlay = function(callback) {
  this._logger.info('Checking overlay in', this._slots)

  this._child_process.execFile('cat', [this._slots], function(error, stdout, stderr) {
    if(error) {
      this._logger.error('Could not read slot file', error)
      this._logger.error(stdout)
      this._logger.error(stderr)

      var err = new Error('Could not read slot file - ' + error.message)
      err.code = error.code
      err.stack = error.stack

      return callback(err)
    }

    var loaded = stdout.indexOf('BB-1WIRE-P9-22') != -1

    this._logger.info('Slots are', loaded ? '' : 'not', 'loaded')

    callback(undefined, loaded)
  }.bind(this))
}

SensorCheck.prototype._loadOverlay = function(callback) {
  this._logger.info('Checking overlay')

  this._child_process.exec('echo BB-1WIRE-P9-22 > ' + this._slots, function(error, stdout, stderr) {
    if(error) {
      this._logger.error('Could not load overlay', error)
      this._logger.error(stdout)
      this._logger.error(stderr)

      var err = new Error('Could not load overlay - ' + error.message)
      err.code = error.code
      err.stack = error.stack

      return callback(err)
    }

    this._logger.info('Loaded overlay')

    callback()
  }.bind(this))
}

SensorCheck.prototype._checkSensor = function(callback) {
  this._logger.info('Checking device', this._device)

  this._child_process.execFile('cat', [this._device], function(error, stdout, stderr) {
    if(error) {
      this._logger.error('Could not read sensor', error)
      this._logger.error(stdout)
      this._logger.error(stderr)

      var err = new Error('Could not read sensor - ' + error.message)
      err.code = error.code
      err.stack = error.stack

      return callback(err)
    }

    this._logger.info('Device ok')

    callback()
  }.bind(this))
}

module.exports = SensorCheck
