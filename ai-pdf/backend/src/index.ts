import express from "express"
import bodyParser from "body-parser"
import cors from "cors"
import config from "./config/config"

const app = express()

app.use(bodyParser.json())
app.use(cors())

app.get("/", (req, res) => {
  res.send("Hello World!")
})

app.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`)
})
