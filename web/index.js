const express = require('express')
const hbs = require('express-handlebars')
const http = require ('http')

const port = process.env.WEB_PORT
const app = express()

app.engine('hbs', hbs.engine({extname:'hbs'}))
app.set('view engine', 'hbs')

app.route('/')
    .get( (req, res) => {
        res.render('index.hbs', { title: "test page b" } )
    })

app.listen(port)
