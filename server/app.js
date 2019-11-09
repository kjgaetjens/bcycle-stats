const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
const axios = require('axios')

//need to bring in models

app.use(cors())
app.use(express.json())

//will update PORT to be stored as an env variable
const PORT = 8080

//need to add mongo setup

app.get('/', (req, res) => {
    res.send('test')
})

app.post('/update-data', async (req, res) => {
    //add error handling
    let result = await axios('https://opendata.arcgis.com/datasets/1dc7a23374ac44cdae8553044bfeaf22_2.geojson')
    //bring in bus and metro data and run calc for nearest bcycle
})



app.listen(PORT, () => {
    console.log("Server is running...")
})