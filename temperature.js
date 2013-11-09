var LOG = require("winston"),
	config = require("nconf"),
	Container = require("wantsit").Container,
	Columbo = require("columbo"),
	bonvoyage = require("bonvoyage"),
	TemperatureController = require("./controllers/TemperatureController"),
	Hapi = require("hapi");

// set up arguments
config.argv().env().file("config.json");

var container = new Container();
container.register("config", config);

container.createAndRegister("temperatureController", TemperatureController);

// create a REST api
container.createAndRegister("columbo", Columbo, {
	resourceDirectory: config.get("rest:resources"),
	resourceCreator: function(resource, name) {
		return container.createAndRegister(name + "Resource", resource);
	}
});

var bonvoyageClient = container.createAndRegister("seaportClient", bonvoyage.Client, {
	serviceType: config.get("registry:name")
});
bonvoyageClient.register({
	role: config.get("rest:name"),
	version: config.get("rest:version"),
	createService: function(port) {
		var columbo = container.find("columbo");
		var server = Hapi.createServer("0.0.0.0", port, {
			cors: true
		});
		server.addRoutes(columbo.discover());
		server.start();

		LOG.info("RESTServer", "Running at", "http://localhost:" + port);
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
