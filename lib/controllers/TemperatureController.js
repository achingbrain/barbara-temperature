var Autowire = require("wantsit").Autowire

TemperatureController = function() {
  this._logger = Autowire
  this._child_process = Autowire
  this._celsius = NaN
  this._values = []
  this._index = 0

  this._checkFrequency = process.env.BARBARA_FREQUENCY || 5000
}

TemperatureController.prototype._readTemperature = function() {
  var path = '/sys/bus/w1/devices/28-0000054c0b2f/w1_slave'

  this._child_process.execFile('cat', [path], function(error, stdout, stderr) {
    if(error) {
      this._logger.error('Could not read temperature', error)
      this._logger.error(stdout)
      this._logger.error(stderr)
    } else {

      if(this._index == 10) {
        this._index = 0
      }

      var rows = []

      stdout.split('\n').forEach(function(line) {
        line = line.trim()

        if(!line) {
          return
        }

        rows.push(line.trim().split(' '))
      })

      if(rows.length != 2) {
        this._logger.warn('Invalid output from sensor')
        this._logger.warn(stdout)
        this._logger.warn(stderr)
      } else {
        if(rows[0][rows[0].length - 1] != 'YES') {
          this._logger.warn('CRC check failed')
          this._logger.warn(stdout)
          this._logger.warn(stderr)
        } else {
          var tempColumn = rows[1][rows[1].length - 1]

          if(tempColumn.indexOf('=') == -1) {
            this._logger.warn('Unknown temperature column format', tempColumn)
            this._logger.warn(stdout)
            this._logger.warn(stderr)
          } else {
            var temp = parseInt(tempColumn.split('=')[1], 10) / 10000

            this._logger.info("TemperatureController %d°C", temp)

            this._values[this._index] = temp
            this._index++

            this._celsius = this._findAverage(this._values)
          }
        }
      }
    }

    setTimeout(this._readTemperature.bind(this), this._checkFrequency)
  }.bind(this))
}

TemperatureController.prototype.afterPropertiesSet = function() {
  setTimeout(this._readTemperature.bind(this), this._checkFrequency)
}

TemperatureController.prototype._findAverage = function(temperatures) {
  var count = 0

  temperatures.forEach(function(temperature) {
    count += temperature
  })

  return count/temperatures.length
}

TemperatureController.prototype.getCelsius = function() {
  return this._celsius
}

module.exports = TemperatureController
