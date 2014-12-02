var TemperatureNotifier = require('../../lib/controllers/TemperatureNotifier'),
  sinon = require('sinon'),
  expect = require('chai').expect

describe('TemperatureNotifier', function() {
  var notifier, clock

  beforeEach(function() {
    notifier = new TemperatureNotifier();
    notifier._logger = {
      info: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub(),
      debug: sinon.stub()
    }
    notifier._config = {

    }
    notifier._temperatureController = {
      getCelsius: sinon.stub()
    }
    notifier._restify = {
      createJsonClient: sinon.stub()
    }

    clock = sinon.useFakeTimers()
  })

  afterEach(function() {
    clock.restore()
  })

  it('should notify temperature', function() {
    var celsius = 20
    var restClient = {
      post: sinon.stub().callsArg(2)
    }

    var url = 'url'
    var path = 'path'

    notifier._databaseUrl = url
    notifier._path = path

    notifier._temperatureController.getCelsius.returns(celsius)
    notifier._restify.createJsonClient.withArgs({
      url: url
    }).returns(restClient)

    notifier._sendRequest()

    // restify should have been called
    expect(restClient.post.calledWith(path, {
      celsius: celsius
    }, sinon.match.func)).to.be.true
  })

  it('should not post NaN', function() {
    notifier._temperatureController.getCelsius.returns(NaN)

    notifier.afterPropertiesSet()

    expect(notifier._restify.createJsonClient.called).to.be.false
  })
})