const express = require('express');
const hbs = require('express-handlebars');
const http = require('http');
const axios = require('axios');
const Handlebars = require('handlebars');

const APP_PORT = process.env.WEB_PORT;
const API_HOSTNAME = process.env.API_HOSTNAME;
const API_PORT = process.env.API_PORT;
const API_URL = `http://${API_HOSTNAME}:${API_PORT}/api/v1/`;

// Handlebars Helpers

// Handlebars.registerHelper('loop', (n, block) => {
//     var cumulHTML = '';
//     for(var i = 0; i < n; i++)
//         cumulHTML += block.fn(i);
//     return cumulHTML;
// });

Handlebars.registerHelper('renderStarsHTML', function(rating) {
    let innerText
    if (rating === -1) {
        innerText = "No ratings";
    } else {
        const roundedRating = Math.round(rating);
        innerText = "★".repeat(roundedRating) + "☆".repeat(5 - roundedRating);
    }

    return `<span class="stars${rating == -1 ? '-no-ratings' : ''}">${innerText}</span>`
});

// Application Proper
const app = express();
app.engine('hbs', hbs.engine({extname:'hbs'}));
app.set('view engine', 'hbs');
app.use(express.static('./public'));

// Homepage
app.get('/', async (req, res) => {
    let rstrreq = (await axios.get(API_URL+'establishments'));
    let establishments;
    if (rstrreq.status != 200)
        establishments = new Array();
    else if (rstrreq.data.status != 200)
        establishments = new Array();
    else {
        establishments = rstrreq.data.data;
    }

    let renderData = {
        title: '6-7-ate-9 | Home',
        establishments: establishments,
        css: [
            'css/style.css',
            'css/home.css'
        ],
        js: [
            'js/script.js'
        ],
        searchBar: true,
        loginContainer: true
    }
    
    res.render('index.hbs', renderData )
})

app.get('/establishments', async (req, res) => {
    let rstrreq = (await axios.get(API_URL+'establishments'));
    let establishments;
    if (rstrreq.status != 200)
        establishments = new Array();
    else if (rstrreq.data.status != 200)
        establishments = new Array();
    else {
        establishments = rstrreq.data.data;
    }

    let renderData = {
        title: '6-7-ate-9 | Establishments',
        establishments: establishments,
        css: [
            'css/style.css',
            'css/home.css'
        ],
        js: [
            'js/script.js'
        ],
        searchBar: true,
        loginContainer: true
    }
    
    res.render('establishments.hbs', renderData )
});

app.get('/signup', async (req, res) => {
    res.send('Page for signup. Not yet implemented.')
});

app.get('/login', async (req, res) => {
    res.send('Page for login. Not yet implemented.')
})

app.get('/profile', async (req, res) => {
    res.send('Page for profile(current user profile). Not yet implemented.')
})

app.get('/profile/edit', async (req, res) => {
    res.send('Page for edit profile(current user profile). Not yet implemented.')
})

app.get('/profile/:id', async (req, res) => {
    res.send('Page for profile(given id of user). Not yet implemented.')
})

app.use( (req, res, next) => {
    // Replace with 404 page
    res.status(404).send('Error 404 Not Found!')
});

app.listen(APP_PORT)
