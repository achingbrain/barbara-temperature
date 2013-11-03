var five = require("johnny-five"),
	LOG = require("winston"),
	config = require("nconf"),
	Container = require("wantsit").Container,
	Columbo = require("columbo"),
	bonvoyage = require("bonvoyage"),
	restify = require("restify"),
	common = require("../brewbot-common"),
	TemperatureController = require("./controllers/TemperatureController");

// set up arguments
config.argv().env().file("config.json");

var container = new Container();
container.register("config", config);

container.createAndRegister("temperatureController", TemperatureController);

// create a REST api
container.createAndRegister("resourceDiscoverer", Columbo, {
	resourceCreator: function(resource, name) {
		return container.createAndRegister(name + "Resource", resource);
	}
});
container.createAndRegister("restServer", common.rest.RESTServer);

var bonvoyageClient = container.createAndRegister("seaportClient", bonvoyage.Client, {
	serviceType: config.get("registry:name")
});
bonvoyageClient.register({
	role: config.get("rest:name"),
	version: config.get("rest:version"),
	createService: function(port) {
		var restServer = container.find("restServer");
		restServer.start(port);
	}
});
bonvoyageClient.find(function(error, seaport) {
	if(error) {
		LOG.error("Error finding seaport", error);

		return;
	}

	container.register("seaport", seaport);

	LOG.info("Found seaport");

	container.find("temperatureController").onSeaportFound(seaport);
});
