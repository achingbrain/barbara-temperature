var winston = require("winston"),
	config = require("nconf"),
	Container = require("wantsit").Container,
	Columbo = require("columbo"),
	bonvoyage = require("bonvoyage"),
	Hapi = require("hapi"),
	path = require("path"),
	SerialPort = require("serialport").SerialPort;

// set up arguments
config.argv().env().file(path.resolve(__dirname, "config.json"));

var container = new Container();
container.register("config", config);

// set up logging
container.createAndRegister("logger", winston.Logger, {
	transports: [
		new (winston.transports.Console)({
			timestamp: true,
			colorize: true
		})
	]
});

container.createAndRegister("temperatureController", require(path.resolve(__dirname, "./controllers/TemperatureController")));
container.createAndRegister("temperatureNotifier", require(path.resolve(__dirname, "./controllers/TemperatureNotifier")));

// create a REST api
container.createAndRegister("columbo", Columbo, {
	resourceDirectory: path.resolve(__dirname, config.get("rest:resources")),
	resourceCreator: function(resource, name) {
		return container.createAndRegister(name + "Resource", resource);
	}
});

// the temperature sensor we will use
container.createAndRegister("temperatureSensor", SerialPort, this._config.get("arduino:port"), {
	baudrate: 9600
});

// inject a dummy seaport - we'll overwrite this when the real one becomes available
container.register("seaport", {
	query: function() {
		return [];
	}
});

// register restify module
container.register("restify", require("restify"));

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

		container.find("logger").info("RESTServer", "Running at", "http://localhost:" + port);
	}
});
bonvoyageClient.on("seaportUp", function(seaport) {
	container.register("seaport", seaport);
});
