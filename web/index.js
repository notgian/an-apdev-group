const express = require('express');
const hbs = require('express-handlebars');
const bodyParser = require('body-parser');
const session = require('express-session');
const http = require('http');
const axios = require('axios');
const Handlebars = require('handlebars');
const FormData = require('form-data');
const Busboy = require('busboy');
const multer = require('multer')
const { PassThrough } = require('stream');
const path = require('path');

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

    return `<span class="stars${rating == -1 ? '-no-ratings' : ''} star-rating">${innerText}</span>`
});

Handlebars.registerHelper('truncate', function (str, len) {
    if (typeof str !== 'string') return str;
    if (str.length > len) {
        let truncated = str.substring(0, len);
        let lastSpace = truncated.lastIndexOf(' ');
        if (lastSpace > 0) truncated = truncated.substring(0, lastSpace);
        return truncated + '...';
    }
    return str;
});


Handlebars.registerHelper('normalizeName', function (str) {
    if (typeof str !== 'string') return str;
    return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
});

// Application Proper
const app = express();
app.engine('hbs', hbs.engine({extname:'hbs'}));
app.set('view engine', 'hbs');
app.use(express.static('./public'));
app.use(express.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use(session({
    secret: 'secret-key-here',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 30 * 60 * 60 * 1000, // Session expires in 30 days
        httpOnly: true,
        // secure: process.env.NODE_ENV === 'production'
    }
}));
const upload = multer({ storage: multer.memoryStorage() });

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
            '/css/style.css',
            '/css/home.css'
        ],
        js: [
            '/js/script.js'
        ],
        searchBar: true,
        loginContainer: true,
        user: req.session ? req.session.user : null
    }

    res.render('index.hbs', renderData )
})

app.get('/establishments', async (req, res) => {
    // Pagination logic
    const limit = 10;
    let page = parseInt(req.query.page) || 1;
    let offset = (page - 1) * limit;

    // Added offset and count parameters to the API call
    let rstrreq = (await axios.get(API_URL+'establishments', { params: { offset: offset, count: limit } }));
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
        page: page,
        nextPage: page + 1,
        prevPage: page > 1 ? page - 1 : null,
        css: [
            '/css/style.css',
            '/css/establishments.css' // Changed from home.css to establishments.css
        ],
        js: [
            '/js/script.js'
        ],
        searchBar: true,
        loginContainer: true,
        user: req.session ? req.session.user : null
    }

    res.render('establishments.hbs', renderData )
});

app.get('/establishment/:id', async (req, res) => {
    const estId = req.params.id;
    try {
        const estReq = await axios.get(`${API_URL}establishments/${estId}`, { validateStatus: () => true });
        const revReq = await axios.get(`${API_URL}establishments/reviews/${estId}`, { validateStatus: () => true });

        if (estReq.status != 200) return res.status(404).send("Establishment not found");

        const establishmentData = estReq.data.data[0];
        let reviewsData = revReq.data.data;

        let userReview;
        
        if (req.session.user) {
            userReview = reviewsData.filter(obj => {return obj.userId._id == req.session.user._id})[0] || undefined;
            reviewsData = reviewsData.filter(obj => {return obj.userId._id != req.session.user._id});
        }

        let isOwner = false;
        if (req.session && req.session.user && req.session.user._id === establishmentData.ownerId) {
            isOwner = true;
        }

        const template = isOwner ? 'establishment-owner.hbs' : 'establishment.hbs';

        res.render(template, {
            title: establishmentData.name,
            establishment: establishmentData,
            userReview: userReview, //*specifically* if the user has a review of this establishment
            reviews: reviewsData, // List of all reviews, separate from user
            user: req.session.user || null,
            css: ['/css/style.css', '/css/establishment.css'],
            js: ['/js/script.js'],
            searchBar: true
        });
    } catch (error) {
        res.status(500).send("Internal Server Error" + error);
    }
});

app.post('/postreview/:userId/:rstrId', upload.array('media'), async (req, res) => {
    const usrsURL = API_URL+'users/'
    const form = new FormData();
    const uplTime = Date.now();

    for (let file of req.files) {
        const bytes = crypto.getRandomValues(new Uint8Array(16));
        const fileId = btoa(String.fromCharCode(...bytes))
            .replace(/\+/g, 'a')
            .replace(/\//g, 'A')
            .replace(/=+$/, '');
        const fileExt = path.extname(file.originalname);
        const filename = `${fileId}_${uplTime}${fileExt}`

        form.append('media', file.buffer, {
            filename: filename,
            contentType: file.mimetype,
        }) 
    }

    if (req.body['rating'] && req.body['rating'] >= 0 && req.body['rating'] <= 5)
        form.append('rating', req.body['rating'])
    if (req.body['comment'] && req.body['comment'] != "")
        form.append('comment', req.body['comment'])

    try {
        const reviewRes = await axios.post(`${usrsURL}reviews/${req.params.userId}/${req.params.rstrId}`, form, {
            headers: { ...form.getHeaders() },
            validateStatus: () => true
        });

        if (reviewRes.status == 201)
            res.redirect('/establishment/'+req.params.rstrId)
    }
    catch (err) {
        res.status(500).send(err);
    }
})

app.post('/editreview/:userId/:rstrId', async (req, res) => {
    const usrsURL = API_URL+'users/'
    const userId = req.params.userId;
    const rstrId = req.params.rstrId;

    let rating = req.body.rating || undefined;
    let comment = req.body.comment || undefined;

    let updatedReview = {}
    if (rating) updatedReview['rating'] = rating;
    if (comment) updatedReview['comment'] = comment;

    try {
        const reviewRes = await axios.put(`${usrsURL}reviews/${userId}/${rstrId}`,
            updatedReview, 
            {validateStatus: () => true }
        );

        res.status(200).json(reviewRes.data);
    }
    catch (err) {
        res.status(500).send(err);
    }
});

app.delete('/deletereview/:userId/:rstrId', async (req, res) => {
    const usrsURL = API_URL+'users/'

    try {
        const reviewRes = await axios.delete(`${usrsURL}reviews/${req.params.userId}/${req.params.rstrId}`,
            {validateStatus: () => true }
        );

        res.status(200).json(reviewRes.data);
    }
    catch (err) {
        res.status(500).send(err);
    }
})

app.get('/search', async (req, res) => {
    const searchTerm = req.query.query || ''; 

    try {
        let searchReq = await axios.get(`${API_URL}establishments`, {
            params: { 
                search: searchTerm 
            },
            validateStatus: () => true
        });

        let results = [];
        if (searchReq.status === 200 && searchReq.data.status === 200) {
            results = searchReq.data.data;
        }

        res.render('search.hbs', {
            title: '6-7-ate-9 | Search Results',
            query: searchTerm, 
            results: results,
            user: req.session ? req.session.user : null,
            css: [
                '/css/style.css', 
                '/css/search.css'
            ],
            js: [
                '/js/script.js'
            ],
            searchBar: true,
            loginContainer: req.session.user ? false : true
        });
    } catch (error) {
        console.error("Search Error:", error);
        res.status(500).send("An error occurred during search.");
    }
});

app.get('/signup', async (req, res) => {
    res.render('signup.hbs', 
        { 
            title: 'Sign Up', 
            css: ['/css/style.css', '/css/signlog.css'] 
        });
});

app.post('/signup', async (req, res) => {
    try {
        const signupRoute = `${API_URL}users/`

        const signupRes = await axios.post(signupRoute, {
            username: req.body.username,
            password: req.body.password
        }, { validateStatus: () => true });

        const signupData = signupRes.data;
       
        // TODO: CHANGE THIS TO ONLY CHECK FOR 201 WHEN API ROUTES ARE FIXED
        if (signupRes.status != 200 && signupRes.status != 201) {
            return res.render('signup.hbs', { 
                title: 'Sign Up', 
                css: ['/css/style.css', '/css/signlog.css'],
                error: signupData.message
            });
        }

        // Attempt to login on success
        // Using same params from req body since it's assumed nothing changed anw
        // Yes it's necessary to make the api calls again bc later we'll have JWT tokens (hopefully)
        const loginRes = await axios.post(`${API_URL}users/login`, {
            username: req.body.username,
            password: req.body.password
        }, { validateStatus: () => true });

        if (loginRes.status == 200) {
            const userReq = await axios.get(`${API_URL}users`, { params: { search: req.body.username }, validateStatus: () => true });
            if (userReq.status === 200 && userReq.data.data.length > 0) {
                req.session.user = userReq.data.data[0]; 
            } else {
                req.session.user = { username: req.body.username }; 
            }            
            res.redirect('/'); 
        } else {
            res.render({ 
                title: 'Sign Up', 
                css: ['/css/style.css', '/css/signlog.css'],
                error: "Signup successful, but login failed. Please login manually." 
            });
        }

    } catch (err) {
        res.render({ 
            title: 'Sign Up', 
            css: ['/css/style.css', '/css/signlog.css'],
            error: "Error encountered signing in. Please try again" 
        });
    }
})

app.get('/login', async (req, res) => {
    res.render('login.hbs', 
        { 
            title: 'Log In', 
            css: ['/css/style.css', '/css/signlog.css'] 
        });
})

app.post('/login', async (req, res) => {
    try {
        const loginRes = await axios.post(`${API_URL}users/login`, {
            username: req.body.username,
            password: req.body.password
        }, { validateStatus: () => true });

        if (loginRes.status == 200) {
            const userReq = await axios.get(`${API_URL}users`, { params: { search: req.body.username }, validateStatus: () => true });
            if (userReq.status === 200 && userReq.data.data.length > 0) {
                req.session.user = userReq.data.data[0]; 
            } else {
                req.session.user = { username: req.body.username }; 
            }            
            res.redirect('/'); 
        } else {
            res.render('login.hbs', 
                { 
                    title: 'Log In', 
                    css: ['/css/style.css', '/css/signlog.css'],
                    error: loginRes.data.message || "Login failed"
                });
        }
    } catch (error) {
        res.render('login.hbs', 
            { 
                title: 'Log In', 
                css: ['/css/style.css', '/css/signlog.css'],
                error: "Encountered an error logging in. Please try again."
            });
    }
});

app.post('/logout', async (req, res) => {
    req.session.user = undefined;
    res.redirect('/');
})

app.get('/profile', async (req, res) => {
    if (!req.session || !req.session.user) return res.redirect('/login'); 
    try {
        const userReq = await axios.get(`${API_URL}users/${req.session.user._id}`, { validateStatus: () => true });
        if (userReq.status !== 200) return res.status(404).send("User not found");

        const reviewsReq = await axios.get(`${API_URL}users/reviews/${req.session.user._id}`, { validateStatus: () => true });
        const reviews = reviewsReq.status == 200 ? reviewsReq.data.data : []

        res.render('profile.hbs', {
            title: 'My Profile',
            reviews: reviews,
            user: userReq.data.data,
            css: ['/css/style.css', '/css/profile.css'],
            js: ['/js/script.js'],
            searchBar: true
        });
    } catch (err) {
        res.status(500).send("Something went wrong..." + err);
    }

})

app.get('/profile/edit', async (req, res) => {
    if (!req.session || !req.session.user) 
        return res.redirect('/login'); 
    res.render('profile-edit.hbs', {
        title: 'Edit Profile',
        user: req.session.user,
        css: ['/css/style.css', '/css/profile-edit.css'],
        js: ['/js/script.js']
    });
})

app.post('/profile/edit', upload.single('avatar'), async (req, res) => {
    if (!req.session || !req.session.user)
        return res.redirect('/login')

    const usrsURL = API_URL+'users/';
    const userId = req.session.user._id;
    const form = new FormData();

    if (req.file)
        form.append('avatar', req.file.buffer, {
            filename: userId+path.extname(req.file.originalname),
            contentType: req.file.mimetype,
        });

    if (req.body['description'] && req.body['description'] != '')
        form.append('desc', req.body['description'])

    const editRes = await axios.patch(usrsURL + userId, form, {
        headers: { ...form.getHeaders() },
        validateStatus: () => true
    });

    if (editRes.status == 202)
        return res.redirect('/profile');

    return res.json(editRes.data)

    res.render('profile-edit.hbs', {
        title: 'Edit Profile',
        user: req.session.user,
        css: ['/css/style.css', '/css/profile-edit.css'],
        js: ['/js/script.js'],
        message: editRes.data.message
    });

})

app.get('/profile/:id', async (req, res) => {
    const profileId = req.params.id;
    try {
        const userReq = await axios.get(`${API_URL}users/${profileId}`, { validateStatus: () => true });
        if (userReq.status !== 200) return res.status(404).send("User not found");

        const reviewsReq = await axios.get(`${API_URL}users/reviews/${profileId}`, { validateStatus: () => true });
        const reviews = reviewsReq.status == 200 ? reviewsReq.data.data : []


        res.render('profile-other.hbs', {
            title: 'User Profile',
            profileData: userReq.data.data,
            reviews: reviews,
            user: req.session ? req.session.user : null,
            css: ['/css/style.css', '/css/profile.css'],
            js: ['/js/script.js'],
            searchBar: true
        });
    } catch (error) {
        res.status(500).send("Error loading profile.");
    }
})

app.post('/review/:markop/:reviewId', async (req, res) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({
            status: 401,
            message: "You must be logged in to vote on reviews."
        });
    }

    const validOperations = ['helpful', 'unhelpful', 'unmark'];
    const markop = req.params.markop;

    if (!validOperations.includes(markop)) {
        return res.status(400).json({
            status: 400,
            message: "Invalid review operation."
        });
    }

    const reviewId = req.params.reviewId;
    const userId = req.session.user._id;

    try {
        const apiRes = await axios.post(`${API_URL}users/${userId}/${markop}/${reviewId}`, {}, {
            validateStatus: () => true 
        });

        res.status(apiRes.status).json(apiRes.data);
    } catch (error) {
        console.error("Error marking review:", error);
        res.status(500).send("error marking review helpful/unhelpful.");
    }
});

app.post('/respond/:userId', async (req, res) => {
    if (!req.session || !req.session.user)
        return res.redirect('/login')
    if (req.session.user.role != "owner")
        return res.status(403).json({message: "Only an owner can create a response to reviews in an establishment."})
    if (!req.body.comment || req.body.comment.trim() == "")
        return res.status(400).json({message: "No comment/empty comment."})
    
    const ownerId = req.session.user._id;
    const userId = req.params.userId;

    const apiEndpoint = API_URL+`users/reviews/owner_response/${ownerId}/${userId}`;

    try {
        const postRes = await axios.post(apiEndpoint, {
            comment: req.body.comment
        }, {
            validateStatus: () => true
        });

        if (postRes.status == 200)
            res.status(200).json(postRes.data)
        else 
            res.status(postRes.status).json(postRes.data)
    } catch (error) {
        res.status(500).json({message: "Error. " + error.stack});
    }
})

app.put('/respond/:userId', async (req, res) => {
    if (!req.session || !req.session.user)
        return res.redirect('/login')
    if (req.session.user.role != "owner")
        return res.status(403).json({message: "Only an owner can create a response to reviews in an establishment."})
    if (!req.body.comment || req.body.comment.trim() == "")
        return res.status(400).json({message: "No comment/empty comment."})
    
    const ownerId = req.session.user._id;
    const userId = req.params.userId;

    const apiEndpoint = API_URL+`users/reviews/owner_response/${ownerId}/${userId}`;

    try {
        const postRes = await axios.put(apiEndpoint, {
            comment: req.body.comment
        }, {
            validateStatus: () => true
        });

        if (postRes.status == 200)
            res.status(200).json(postRes.data)
        else 
            res.status(postRes.status).json(postRes.data)
    } catch (error) {
        res.status(500).json({message: "Error. " + error.stack});
    }
})

app.delete('/respond/:userId', async (req, res) => {
    if (!req.session || !req.session.user)
        return res.redirect('/login')
    if (req.session.user.role != "owner")
        return res.status(403).json({message: "Only an owner can create a response to reviews in an establishment."})
    
    const ownerId = req.session.user._id;
    const userId = req.params.userId;

    const apiEndpoint = API_URL+`users/reviews/owner_response/${ownerId}/${userId}`;

    try {
        const delRes = await axios.delete(apiEndpoint, {}, {
            validateStatus: () => true
        });

        if (delRes.status == 200)
            res.status(200).json(delRes.data)
        else 
            res.status(delRes.status).json(delRes.data)
    } catch (error) {
        res.status(500).json({message: "Error. " + error.stack});
    }
})







// ONLY FOR TESTING. NOT TO BE INCLUDED LATER ON
app.get('/test', async (req,res) => {
    res.render('test.hbs')
})

// THIS IS WHAT LETS US UPLOAD THE FILE IT TOOK ME 2 HOURS BRUH T_T

app.post('/testprofileedit', upload.single('file'), async (req, res) => {
    let usrsURL = API_URL+'users/'
    const testUserId = '69b9867133850b1e8b2c1fd3'

    const form = new FormData();

    if (req.file)
        form.append('avatar', req.file.buffer, {
            filename: testUserId+path.extname(req.file.originalname),
            contentType: req.file.mimetype,
        });

    if (req.body['profile-desc'] && req.body['profile-desc'] != '')
        form.append('desc', req.body['profile-desc'])

    const editRes = await axios.patch(usrsURL + testUserId, form, {
        headers: { ...form.getHeaders() }
    });

    res.status(200).json(editRes.data)

})

app.post('/testreviewpost', upload.array('media'), async (req, res) => {
    let usrsURL = API_URL+'users'
    const testUserId = '69ad961e4a1d38f3c1569a3f'
    const testRstrId = '69ad961e4a1d38f3c1569a80'

    const form = new FormData();
    const uplTime = Date.now();

    for (let file of req.files) {
        const bytes = crypto.getRandomValues(new Uint8Array(16));
        const fileId = btoa(String.fromCharCode(...bytes))
            .replace(/\+/g, 'a')
            .replace(/\//g, 'A')
            .replace(/=+$/, '');
        const fileExt = path.extname(file.originalname);
        const filename = `${fileId}_${uplTime}${fileExt}`

        form.append('media', file.buffer, {
            filename: filename,
            contentType: file.mimetype,
        }) 
    }

    if (req.body['rating'] && req.body['rating'] >= 0 && req.body['rating'] <= 5)
        form.append('rating', req.body['rating'])
    if (req.body['comment'] && req.body['comment'] != "")
        form.append('comment', req.body['comment'])

    try {
        const reviewRes = await axios.post(`${usrsURL}/reviews/${testUserId}/${testRstrId}`, form, {
            headers: { ...form.getHeaders() },
            validateStatus: () => true
        });

        res.status(200).json(reviewRes.data);
    }
    catch (err) {
        res.send(err);
    }

});

app.post('/testreviewedit', async (req, res) => {
    let usrsURL = API_URL+'users'
    const testUserId = '69ad961e4a1d38f3c1569a3f'
    const testRstrId = '69ad961e4a1d38f3c1569a80'

    let rating = req.body.rating || undefined;
    let comment = req.body.comment || undefined;

    try {
        const reviewRes = await axios.put(`${usrsURL}/reviews/${testUserId}/${testRstrId}`,
            {rating: rating, comment: comment}, 
            {validateStatus: () => true }
        );

        res.status(200).json(reviewRes.data);
    }
    catch (err) {
        res.send(err);
    }

});

app.post('/testreviewdelete', async (req, res) => { 
    let usrsURL = API_URL+'users';
    const testUserId = '69ad961e4a1d38f3c1569a3f';
    const testRstrId = '69ad961e4a1d38f3c1569a80';

    try {
        const reviewRes = await axios.delete(`${usrsURL}/reviews/${testUserId}/${testRstrId}`,
            {validateStatus: () => true }
        );

        res.status(200).json(reviewRes.data);
    }
    catch (err) {
        res.send(err);
    }

});

app.post('/testreviewresponse', async (req, res) => {
    let usrsURL = API_URL+'users'
    const testUserId = '69ad961e4a1d38f3c1569a3f'
    const testOwnerId = '69ad961e4a1d38f3c1569a73' // took this from my testdata

    let comment = req.body.comment || undefined;

    try {
        const reviewRes = await axios.post(`${usrsURL}/reviews/owner_response/${testOwnerId}/${testUserId}`,
            {comment: comment}, 
            {validateStatus: () => true }
        );

        res.status(200).json(reviewRes.data);
    }
    catch (err) {
        res.send(err);
    }
});

app.post('/testmarkhelpful', async (req, res) => {
    let usrsURL = API_URL+'users'
    const testUserId = '69ad961e4a1d38f3c1569a3f';
    const testReviewId = '69ad961f4a1d38f3c1569a8d';

    try {
        const reviewRes = await axios.post(`${usrsURL}/${testUserId}/helpful/${testReviewId}`,
            {},
            { validateStatus: () => true }
        );
        res.status(200).json(reviewRes.data);
    }
    catch (err) {
        res.send(err);
    }
});

app.post('/testmarkunhelpful', async (req, res) => {
    let usrsURL = API_URL+'users'
    const testUserId = '69ad961e4a1d38f3c1569a3f';
    const testReviewId = '69ad961f4a1d38f3c1569a8d';

    try {
        const reviewRes = await axios.post(`${usrsURL}/${testUserId}/unhelpful/${testReviewId}`,
            {},
            { validateStatus: () => true }
        );
        res.status(200).json(reviewRes.data);
    }
    catch (err) {
        res.send(err);
    }
});

app.post('/testunmark', async (req, res) => {
    let usrsURL = API_URL+'users'
    const testUserId = '69ad961e4a1d38f3c1569a3f';
    const testReviewId = '69ad961f4a1d38f3c1569a8d';

    try {
        const reviewRes = await axios.post(`${usrsURL}/${testUserId}/unmark/${testReviewId}`,
            {},
            { validateStatus: () => true }
        );
        res.status(200).json(reviewRes.data);
    }
    catch (err) {
        res.send(err);
    }
});

app.post('/testlogin', async (req, res) => {
    let usrsURL = API_URL+'users'

    try {
        const reviewRes = await axios.post(`${usrsURL}/login`,
            {username: req.body.username, password: req.body.password},
            { validateStatus: () => true }
        );
        res.status(200).json(reviewRes.data);
    }
    catch (err) {
        res.send(err);
    }
})

app.use( (req, res, next) => {
    // Replace with 404 page
    res.status(404).send('Error 404 Not Found!')
});

app.listen(APP_PORT)
