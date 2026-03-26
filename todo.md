## Frontend 
home page
- [ ] fix location rendering

/establishments
- [ ] add buttons for pagination. (For simplicity, you just make it next and prev page.)

/establishment/:id (establihsment reviews) [USER & OWNER]
- [ ] render media included in review (thumbnail view) (for nested reviews, refer to [this](https://github.com/handlebars-lang/handlebars.js/discussions/2079#discussioncomment-13665762) if it doesn't work)
- [ ] add a way to view media in a review by expanding/opening it in a pop-up menu
- [ ] have a way to truncate reviews
- [ ] perform validation before submitting a review (ensure a star rating is provided, since this isn't a normal form element) (idea for this: onsubmit event, use event.preventDefault, then event.submit)
- [ ] unify layout, styles, scripts, and functionality of both normal user and owner views
- [ ] PREFERRED: transfer the big ahh scripts into an external JS file
- [ ] OPTIONAL improve styling by adding cursor rules for the review stars selection thing and other potential styling imporvements
- [ ] OPTIONAL: add a custom styling for reviews marked helpful/unhelpful by the user. Assume that for this, each review object will have an attribute called 'marked' that can either be null, helpful, or unhelpful NOTE: ako na bahala sa view button functionality - gian

/search
- [ ] add search filters (see API's GET establishment route for the 
- [ ] PREFERRED: unify styles with establishments page.

/profile
- [ ] actually render the other foodies to follow thingy (this shall be passed through the web routes as 'foodies', if this will end up really being added)
- [ ] PREFERRED: add follower_count and following_count

/signup
- [ ] perform password validation to make sure the password is up to standard (i.e. at minimum 8 characters)

## Backend (Web routes)
- [ ] Put the sessions secret key in the .env and load it from there as well
- [ ] Use JWT keys (ako na rin dito -gian)

/profile
- [ ] send foodies to follow in profiles (will create a get endpoint for this
- [ ] PREFERRED: send follower_count, and following_count

/search
- [ ] apply other search filters from search form (use req.query.[parameter name from the form in the hbs file])

/reviews
- [ ] PREFERRED: for each review, before sending to frontend, add an attribute **marked** which is set to 'helpful' if the user id is in the review's list of helpful markings, 'unhelpful' if the user id is in the review's list of unhelpful markings, and null/some falsy value otherwise

## API
- [x] Make review posting/editing update establishment overall rating
- [x] Add follow/unfollow endpoints
- [x] jwt keys

## Other
- [x] fix data gen. Reviews are clamped to 1-5 inclusive
- [ ] Fix docker compose prod file
- [ ] setup render.com/vercel for deployment
- [ ] fix cdn because 127.0.0.1 ain't gonna cut it for deployment buddy. (this will make it so data generated will be dependent on dev or prod servers. Dev server is local, thus localhost is fine. For prod, we'll have it dependent on the address of our application-to-be)
