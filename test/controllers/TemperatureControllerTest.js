var TemperatureController = require('../../lib/controllers/TemperatureController'),
  sinon = require('sinon'),
  expect = require('chai').expect

describe('TemperatureController', function() {
  var controller

  beforeEach(function() {
    controller = new TemperatureController()
    controller._logger = {
      info: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub(),
      debug: sinon.stub()
    }
    controller._child_process = {
      execFile: sinon.stub()
    }
  })

  it('should read temperature', function() {
    var output = '25 01 4b 46 7f ff 0b 10 65 : crc=65 YES\n'
    output += '25 01 4b 46 7f ff 0b 10 65 t=18312\n'

    controller._child_process.execFile.callsArgWith(2, undefined, output)

    controller._readTemperature()

    expect(controller.getCelsius()).to.equal(18.312)
  })

  it('should fail to read temperature', function() {
    controller._child_process.execFile.callsArgWith(2, new Error('urk!'))

    controller._readTemperature()

    expect(controller._logger.error.called).to.be.true
  })

  it('should survive CRC check failure', function() {
    var output = '25 01 4b 46 7f ff 0b 10 65 : crc=65 NO\n'
    output += '25 01 4b 46 7f ff 0b 10 65 t=18312\n'

    controller._child_process.execFile.callsArgWith(2, undefined, output)

    controller._readTemperature()

    expect(controller.getCelsius()).to.be.NaN
    expect(controller._logger.warn.called).to.be.true
  })

  it('should survive bad formatting', function() {
    var output = '25 01 4b 46 7f ff 0b 10 65 : crc=65 YES\n'
    output += '25 01 4b 46 7f ff 0b 10 65 t18312\n'

    controller._child_process.execFile.callsArgWith(2, undefined, output)

    controller._readTemperature()

    expect(controller.getCelsius()).to.be.NaN
    expect(controller._logger.warn.called).to.be.true
  })

  it('should survive bad input', function() {
    controller._child_process.execFile.callsArgWith(2, undefined, '')

    controller._readTemperature()

    expect(controller.getCelsius()).to.be.NaN
    expect(controller._logger.warn.called).to.be.true
  })

  it('should average temperature', function() {
    expect(controller._findAverage([5, 5])).to.equal(5)
    expect(controller._findAverage([10, 5])).to.equal(7.5)
  })
})
