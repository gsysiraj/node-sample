require('dotenv').config();
const mongoose = require("mongoose");
const env = process.env;
let connection = `${env.DB_CONNECTION}://${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`;
if (env.db_srv && env.db_srv != '') {
    connection = env.db_srv
}

// console.log(connection)
mongoose.connect(connection, {
    // useNewUrlParser: true,
    // useFindAndModify: false,
    // useCreateIndex: true,
    // useUnifiedTopology: true
});

mongoose.connection.on('error', () => console.log);
mongoose.connection.on('open', () => console.log("Connected to mongo server."));

mongoose.Promise = Promise;

module.exports = {
    mongoose,
    connection
};