var Container = require('wantsit').Container,
  Columbo = require('columbo'),
  Hapi = require('hapi'),
  path = require('path')

if(!process.env.BARBARA_BREW) {
  throw new Error('Please specify a brew id')
}

process.env.BARBARA_DATABASE = process.env.BARBARA_DATABASE || 'http://localhost:5984'
process.env.BARBARA_PORT = process.env.BARBARA_PORT || 7583
process.env.BARBARA_FREQUENCY = process.env.BARBARA_FREQUENCY || 10000
process.env.BARBARA_NOTIFICATION_INTERVAL = process.env.BARBARA_NOTIFICATION_INTERVAL || 500000
process.env.BARBARA_TEMPERATURE_SENSOR = process.env.BARBARA_TEMPERATURE_SENSOR || '28-0000054c0b2f'

var container = new Container()
container.register('restify', require('restify'))
container.register('child_process', require('child_process'))

var check = container.createAndRegister('sensorCheck', require('./lib/components/SensorCheck'))
check.on('ready', function() {
  container.createAndRegister('temperatureController', require('./lib/controllers/TemperatureController'))
  container.createAndRegister('temperatureNotifier', require('./lib/controllers/TemperatureNotifier'))

// create a REST api
  container.createAndRegister('columbo', Columbo, {
    resourceDirectory: path.resolve(__dirname, config.get('rest:resources')),
    resourceCreator: function(resource, name) {
      return container.createAndRegister(name + 'Resource', resource)
    }
  })

  var columbo = container.find('columbo')
  var server = Hapi.createServer('0.0.0.0', process.env.BARBARA_PORT, {
    cors: true
  })
  server.addRoutes(columbo.discover())
  server.start(function() {
    console.info('RESTServer', 'Running at', 'http://localhost:' + server.info.port)
  })
})
