require('dotenv-safe').config()
require("./config/database")
const app = require("./app")

app.get('/', (req, res) => {
    console.log("Server is up and running")
    res.send("Server is up and running")
})

app.listen('3000', () => {
    console.log("listening on port 3000")
})