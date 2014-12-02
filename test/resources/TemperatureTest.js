var Temperature = require( "../../lib/resources/Temperature"),
  sinon = require("sinon"),
  expect = require("chai").expect

describe("Temperature", function() {
  var resource

  beforeEach(function() {
    resource = new Temperature()
    resource._logger = {
      info: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub(),
      debug: sinon.stub()
    }
    resource._temperatureController = {
      getCelsius: sinon.stub()
    }
  })

  it("should return temperature", function() {
    var temperature = 20
    var request = {
      reply: sinon.stub()
    }

    resource._temperatureController.getCelsius.returns(temperature);

    resource.retrieveOne(request);

    // should have returned temperature
    expect(request.reply.calledWith(temperature)).to.be.true
  })
})
