var SensorCheck = require('../../lib/components/SensorCheck'),
  sinon = require('sinon'),
  expect = require('chai').expect

describe('SensorCheck', function() {
  var check

  beforeEach(function() {
    check = new SensorCheck()
    check._logger = {
      info: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub(),
      debug: sinon.stub()
    }
    check._child_process = {
      execFile: sinon.stub()
    }
  })

  it('should check overlay', function(done) {
    var output = ' 0: 54:PF---\n'
    output += ' 1: 55:PF---\n'
    output += ' 2: 56:PF---\n'
    output += ' 3: 57:PF---\n'
    output += ' 4: ff:P-O-L Bone-LT-eMMC-2G,00A0,Texas Instrument,BB-BONE-EMMC-2G\n'
    output += ' 5: ff:P-O-L Bone-Black-HDMI,00A0,Texas Instrument,BB-BONELT-HDMI\n'
    output += ' 11: ff:P-O-L Override Board Name,00A0,Override Manuf,BB-1WIRE-P9-22\n'

    check._child_process.execFile.withArgs('cat', sinon.match.array).callsArgWith(2, undefined, output)

    check._checkOverlay(function(error, loaded) {
      expect(error).to.not.exist

      expect(loaded).to.be.true

      done()
    })
  })

  it('should not find overlay', function(done) {
    var output = ' 0: 54:PF---\n'
    output += ' 1: 55:PF---\n'
    output += ' 2: 56:PF---\n'
    output += ' 3: 57:PF---\n'
    output += ' 4: ff:P-O-L Bone-LT-eMMC-2G,00A0,Texas Instrument,BB-BONE-EMMC-2G\n'
    output += ' 5: ff:P-O-L Bone-Black-HDMI,00A0,Texas Instrument,BB-BONELT-HDMI\n'
    output += ' 11: ff:P-O-L Override Board Name,00A0,Override Manuf\n'

    check._child_process.execFile.withArgs('cat', sinon.match.array).callsArgWith(2, undefined, output)

    check._checkOverlay(function(error, loaded) {
      expect(error).to.not.exist

      expect(loaded).to.be.false

      done()
    })
  })

  it('should fail to find overlay', function(done) {
    check._child_process.execFile.withArgs('cat', sinon.match.array).callsArgWith(2, new Error('urk!'))

    check._checkOverlay(function(error, loaded) {
      expect(error).to.be.ok

      done()
    })
  })

  it('should load overlay', function(done) {
    check._child_process.execFile.withArgs('echo', sinon.match.array).callsArg(2)

    check._loadOverlay(function(error) {
      expect(error).to.not.exist

      done()
    })
  })

  it('should fail to load overlay', function(done) {
    check._child_process.execFile.withArgs('echo', sinon.match.array).callsArgWith(2, new Error('urk!'))

    check._loadOverlay(function(error) {
      expect(error).to.be.ok

      done()
    })
  })

  it('should check sensor', function(done) {
    check._child_process.execFile.withArgs('cat', sinon.match.array).callsArg(2)

    check._checkSensor(function(error) {
      expect(error).to.not.exist

      done()
    })
  })

  it('should fail to check sensor', function(done) {
    check._child_process.execFile.withArgs('cat', sinon.match.array).callsArgWith(2, new Error('urk!'))

    check._checkSensor(function(error) {
      expect(error).to.be.ok

      done()
    })
  })

  it('should load overlay and check sensor', function(done) {
    check._checkOverlay = sinon.stub()
    check._loadOverlay = sinon.stub()
    check._checkSensor = sinon.stub()

    check._checkOverlay.callsArgWith(0, undefined, false)
    check._loadOverlay.callsArgWith(0, undefined)
    check._checkSensor.callsArgWith(0, undefined)

    check.on('ready', done)
    check.afterPropertiesSet()
  })

  it('should find overlay and check sensor', function(done) {
    check._checkOverlay = sinon.stub()
    check._checkSensor = sinon.stub()

    check._checkOverlay.callsArgWith(0, undefined, true)
    check._checkSensor.callsArgWith(0, undefined)

    check.on('ready', done)
    check.afterPropertiesSet()
  })
})
