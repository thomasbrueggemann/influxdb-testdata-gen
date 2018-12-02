const influx = require("influx");
const axios = require("axios");
const commandLineArgs = require("command-line-args");

// parse CLI options based on the rules below
const options = commandLineArgs([
	{ name: "host", alias: "h", type: String, defaultValue: "localhost" },
	{ name: "port", alias: "P", type: Number },
	{ name: "username", alias: "u", type: String },
	{ name: "password", alias: "p", type: String },
	{ name: "database", alias: "d", type: String }
]);

// merge the CLI options with the schema definition for influxdb
const influxOptions = Object.assign(
	{
		schema: [
			{
				measurement: "iss",
				tags: ["id", "visibility"],
				fields: {
					latitude: influx.FieldType.FLOAT,
					longitude: influx.FieldType.FLOAT,
					altitude: influx.FieldType.FLOAT,
					velocity: influx.FieldType.FLOAT,
					footprint: influx.FieldType.FLOAT,
					daynum: influx.FieldType.FLOAT,
					solar_lat: influx.FieldType.FLOAT,
					solar_lon: influx.FieldType.FLOAT
				}
			}
		]
	},
	options
);

// open a connection to the influxdb database
const influxDb = new influx.InfluxDB(influxOptions);

setInterval(async () => {
	try {
		// read ISS telemtry via REST API endpoint to acquire sample data
		const issTelemetryUrl = "https://api.wheretheiss.at/v1/satellites/25544";
		const telemetry = (await axios(issTelemetryUrl)).data;

		console.log(
			`Received IIS telemetry: ${telemetry.longitude}/${telemetry.latitude} at altitude ${
				telemetry.altitude
			} km`
		);

		await influxDb.writePoints([
			{
				measurement: "iss",
				timestamp: telemetry.timestamp,
				tags: { id: telemetry.id, visibility: telemetry.visibility },
				fields: {
					latitude: telemetry.latitude,
					longitude: telemetry.longitude,
					altitude: telemetry.altitude,
					velocity: telemetry.velocity,
					footprint: telemetry.footprint,
					daynum: telemetry.daynum,
					solar_lat: telemetry.solar_lat,
					solar_lon: telemetry.solar_lon
				}
			}
		]);
	} catch (e) {
		console.log(`Error retrieving ISS telemtry: ${e.message}`);
	}
}, 1050);
