var LOG = require("winston"),
	config = require("nconf"),
	Container = require("wantsit").Container,
	Columbo = require("columbo"),
	bonvoyage = require("bonvoyage"),
	Hapi = require("hapi"),
	path = requre("path");

// set up arguments
config.argv().env().file(path.resolve(__dirname, "config.json"));

var container = new Container();
container.register("config", config);

container.createAndRegister("temperatureController", require(path.resolve(__dirname, "./controllers/TemperatureController")));
container.createAndRegister("temperatureNotifier", require(path.resolve(__dirname, "./controllers/TemperatureNotifier")));

// create a REST api
container.createAndRegister("columbo", Columbo, {
	resourceDirectory: path.resolve(__dirname, config.get("rest:resources")),
	resourceCreator: function(resource, name) {
		return container.createAndRegister(name + "Resource", resource);
	}
});

// inject a dummy seaport - we'll overwrite this when the real one becomes available
container.register("seaport", {
	query: function() {
		return [];
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
bonvoyageClient.on("seaportUp", function(seaport) {
	container.register("seaport", seaport);
});
