require('dotenv-safe').config()
require("./config/database")
const app = require("./app")

app.get('/', (req, res) => {
    console.log("Server is up and running")
    res.send("Server is up and running")
})

app.listen(8080, '0.0.0.0', () => {
    console.log("listening on port 8080")
})