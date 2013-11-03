var LOG = require("winston"),
	Autowire = require("wantsit").Autowire;

Config = function() {
	this._config = Autowire;
	this._seaport = Autowire;
};

Config.prototype.retrieveOne = function(request) {
	var config = {
		type: "temperature",
		brew: {
			id: this._config.get("brew:id")
		},
		upstream: [],
		downstream: [{
			type: "brew",
			id: this._config.get("temperature:brew")
		}]
	};

	// add registry connection
	this._seaport.query(this._config.get("registry:service") + "@" + this._config.get("registry:version")).forEach(function(service) {
		config.upstream.push({
			role: this._config.get("registry:service"),
			version: this._config.get("registry:version"),
			host: service.host + ":" + service.port,
			weight: 0.5
		});
	}.bind(this));

	// add api server connection
	this._seaport.query(this._config.get("api:name") + "@" + this._config.get("api:version")).forEach(function(service) {
		config.upstream.push({
			role: this._config.get("api:name"),
			version: this._config.get("api:version"),
			host: service.host + ":" + service.port,
			weight: 0.5
		});
	}.bind(this));

	request.reply(config);
};

Config.prototype.toString = function() {
	return "Config resource"
}

module.exports = Config;