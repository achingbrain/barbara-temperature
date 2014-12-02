var EventEmitter = require('events').EventEmitter,
  util = require('util'),
  Autowire = require('wantsit').Autowire

var SensorCheck = function() {
  EventEmitter.call(this)

  this._logger = Autowire
  this._child_process = Autowire

  this._sensor = process.env.BARBARA_TEMPERATURE_SENSOR || '28-0000054c0b2f'
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
  this._child_process.execFile('cat', ['/sys/devices/bone_capemgr.*/slots'], function(error, stdout, stderr) {
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

    callback(undefined, loaded)
  }.bind(this))
}

SensorCheck.prototype._loadOverlay = function(callback) {
  this._child_process.execFile('echo', ['BB-1WIRE-P9-22', '>', '/sys/devices/bone_capemgr.*/slots'], function(error, stdout, stderr) {
    if(error) {
      this._logger.error('Could not load overlay', error)
      this._logger.error(stdout)
      this._logger.error(stderr)

      var err = new Error('Could not load overlay - ' + error.message)
      err.code = error.code
      err.stack = error.stack

      return callback(err)
    }

    callback()
  }.bind(this))
}

SensorCheck.prototype._checkSensor = function(callback) {
  this._child_process.execFile('cat', ['/sys/bus/w1/devices/' + this._sensor + '/w1_slave'], function(error, stdout, stderr) {
    if(error) {
      this._logger.error('Could not read sensor', error)
      this._logger.error(stdout)
      this._logger.error(stderr)

      var err = new Error('Could not read sensor - ' + error.message)
      err.code = error.code
      err.stack = error.stack

      return callback(err)
    }

    callback()
  }.bind(this))
}

module.exports = SensorCheck
