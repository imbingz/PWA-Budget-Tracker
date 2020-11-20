//Import required packages
const express = require("express");
const logger = require("morgan");
const mongoose = require("mongoose");
const compression = require("compression");

//Set up PORT env or localhost
const PORT = process.env.PORT || 3000;

const app = express();

//Initialize middelwares
app.use(logger("dev"));

app.use(compression());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static("public"));

// routes handler
app.use(require("./routes/api.js"));

//Connect to mongodb atlas and server
mongoose
	.connect(process.env.MONGODB_URI || "mongodb://localhost/workout", {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useCreateIndex: true,
		useFindAndModify: false
	})
	.then(() => {
		//Setup Server after connecting to db
		app.listen(PORT, () => {
			console.log(`listening on PORT ${PORT}, http://localhost:${PORT}`);
		});
	})
	.catch((error) => {
		console.log(error.message);
	});
