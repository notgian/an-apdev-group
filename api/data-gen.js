const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const bcrpyt = require('bcrypt')

const connectDB = require('./dbconnect')
const User = require('./schema_models/userSchema.js');
const Restaurant = require('./schema_models/restaurantSchema.js');
const Reviews = require('./schema_models/reviewSchema.js');
const Categories = require('./schema_models/categorySchema.js')

const RESTAURANT_CATEGORIES = [
  "Filipino", "Italian", "Japanese", "Mexican",
  "Indian", "Chinese", "Thai", "French",
  "Mediterranean", "American", "Middle Eastern", "Vietnamese",
  "Korean", "Greek", "Brazilian", "Spanish",
  "Steakhouse", "Seafood", "Sushi", "Pizza",
  "Burgers", "BBQ", "Vegan", "Vegetarian",
  "Bakery", "Cafe", "Fast Food", "Fine Dining",
  "Casual Dining", "Diner", "Pub", "Bistro",
  "Tapas", "Food Truck", "Breakfast & Brunch", "Dessert"
];

const STATIC_RESTAURANTS = [
    { 
        name: "Mendokoro Ramba", 
        description: "Known for its authentic tonkotsu broth, this ramen bar offers a minimalist counter-style dining experience. Guests enjoy watching chefs prepare steaming bowls right in front of them, creating a lively and immersive atmosphere. The bold flavors and unique setup make it a favorite among ramen enthusiasts.",
        category: "Japanese", 
        location: {
            street: "10th Ave",
            city: "Makati",
            province: "NCR",
        },
        priceRange: {
            min: 500,
            max: 700, 
        },
        imageSrc: "http://localhost:4200/cdn/resto_mendokoro_ramba.jpg",
    },
    { 
        name: "Manam Comfort Food", 
        description: "This spot is famous for serving Filipino classics with a modern twist, offering both small and big portions to suit every appetite. Diners can enjoy beloved dishes like sisig and kare-kare, reimagined with creative flair. The cozy yet contemporary vibe makes it perfect for groups and family gatherings.",
        category: "Filipino", 
        location: {
            street: "21st Ave",
            city: "Makati",
            province: "NCR",
        },
        priceRange: {
            min: 300,
            max: 600, 
        },
        imageSrc: "http://localhost:4200/cdn/resto_manam_comfort_food.jpg",
    },
    { 
        name: "Wildflour Cafe", 
        description: "A trendy bakery and cafe offering artisanal breads, pastries, and international comfort food. The stylish atmosphere makes it a popular spot for brunch, coffee dates, and casual meetings. With a menu that blends global flavors and local favorites, it has become a staple in the city’s dining scene.",
        category: "Cafe", 
        location: {
            street: "Sta. Lucia",
            city: "Pasig",
            province: "NCR",
        },
        priceRange: {
            min: 700,
            max: 1000, 
        },
        imageSrc: "http://localhost:4200/cdn/resto_wildflour_cafe.jpg",
    },
    { 
        name: "Din Tai Fung", 
        description: "World-renowned for its xiao long bao, this Taiwanese restaurant is celebrated for hand-crafted dumplings and meticulous preparation. Each dish reflects a dedication to consistency and quality, making every visit memorable. Families and foodies alike enjoy the welcoming environment and authentic flavors.",
        category: "Chinese", 
        location: {
            street: "Shaw Boulevard",
            city: "Mandaluyong",
            province: "NCR",
        },
        priceRange: {
            min: 400,
            max: 700, 
        },
        imageSrc: "http://localhost:4200/cdn/resto_din_tai_fung.jpg",
    },
    { 
        name: "Gino's Brick Oven Pizza", 
        description: "A casual Italian spot known for its brick oven pizzas and homemade burrata. Fresh ingredients and traditional techniques deliver rustic, flavorful dishes that keep guests coming back. With its laid-back vibe and hearty menu, it’s a favorite hangout for students and families in the area.",
        category: "Italian", 
        location: {
            street: "Katipunan",
            city: "Quezon City",
            province: "NCR",
        },
        priceRange: {
            min: 500,
            max: 800, 
        },
        imageSrc: "http://localhost:4200/cdn/resto_ginos_brick_oven_pizza.jpg",
    },
    { 
        name: "Mary Grace Cafe", 
        description: "A beloved local chain known for its home-cooked meals and signature ensaymadas. The cafe's warm, quaint interiors, complete with handwritten notes under the glass tables, offer a nostalgic and cozy atmosphere perfect for afternoon tea and long conversations.",
        category: "Cafe", 
        location: {
            street: "Greenbelt 2",
            city: "Makati",
            province: "NCR",
        },
        priceRange: {
            min: 400,
            max: 800, 
        },
        imageSrc: "http://localhost:4200/cdn/resto_mary_grace_cafe.jpg",
    },
    { 
        name: "Locavore Kitchen", 
        description: "Redefining Filipino cuisine, this restaurant focuses on locally grown ingredients and innovative flavor profiles. Famous for its Sizzling Sinigang, it offers a rustic and modern dining space that celebrates the richness of homegrown produce and creative culinary techniques.",
        category: "Filipino", 
        location: {
            street: "Brixton St",
            city: "Pasig",
            province: "NCR",
        },
        priceRange: {
            min: 500,
            max: 900, 
        },
        imageSrc: "http://localhost:4200/cdn/resto_locavore_kitchen.jpg",
    },
    { 
        name: "Nikkei", 
        description: "An elegant fusion restaurant that explores the intersection of Japanese and Peruvian culinary traditions. Guests can enjoy fresh ceviche and artistic sushi rolls in a sophisticated, minimalist setting that emphasizes high-quality ingredients and delicate plating.",
        category: "Japanese", 
        location: {
            street: "Rada St",
            city: "Makati",
            province: "NCR",
        },
        priceRange: {
            min: 800,
            max: 1500, 
        },
        imageSrc: "http://localhost:4200/cdn/resto_nikkei.jpg",
    },
    { 
        name: "Ooma", 
        description: "A bold and unconventional Japanese rice bar that puts a contemporary spin on traditional favorites. Known for its creative maki and taco-sushi, the restaurant features an edgy, industrial interior inspired by the Tsukiji fish market, offering a high-energy dining experience.",
        category: "Japanese", 
        location: {
            street: "High Street Central",
            city: "Taguig",
            province: "NCR",
        },
        priceRange: {
            min: 450,
            max: 750, 
        },
        imageSrc: "http://localhost:4200/cdn/resto_ooma.jpg",
    },
    { 
        name: "The Wholesome Table", 
        description: "Dedicated to serving organic and mindfully sourced food, this establishment offers a menu free of processed ingredients and artificial flavors. The airy, garden-inspired interiors provide a refreshing backdrop for health-conscious diners looking for hearty, wholesome meals.",
        category: "Healthy", 
        location: {
            street: "Salcedo Village",
            city: "Makati",
            province: "NCR",
        },
        priceRange: {
            min: 600,
            max: 1100, 
        },
        imageSrc: "http://localhost:4200/cdn/resto_the_wholesome_table.jpg",
    },
];

const REVIEW_BODIES = [
    { text: "Absolutely incredible experience from start to finish!", rating: 5 },
    { text: "The food was okay, but the service was a bit slow today.", rating: 3 },
    { text: "I wouldn't recommend this place. Very disappointing quality.", rating: 1 },
    { text: "A solid choice for a quick meal. Consistently good.", rating: 4 },
    { text: "Best I've had in a long time! Will definitely be back.", rating: 5 },
    { text: "Waited 40 minutes for our order and it arrived cold.", rating: 1 },
    { text: "Friendly staff and a very cozy atmosphere.", rating: 4 },
    { text: "Decent prices for the portion size, but nothing special.", rating: 3 },
    { text: "Complete waste of money. Rude staff and bland food.", rating: 0 },
    { text: "Everything was seasoned to perfection. Highly impressed!", rating: 5 },
    { text: "The flavors were interesting, but the texture was a bit off.", rating: 3 },
    { text: "Hidden gem! So glad we stumbled upon this spot.", rating: 5 },
    { text: "The ambiance is great, but the food is overpriced for what it is.", rating: 2 },
    { text: "Quick service and fresh ingredients. Exactly what I needed.", rating: 4 },
    { text: "I've had better elsewhere. It was just mediocre.", rating: 2 },
    { text: "Superb attention to detail and lovely presentation.", rating: 5 },
    { text: "They forgot half of our order. Unacceptable.", rating: 1 },
    { text: "Great place to bring the family. Something for everyone.", rating: 4 },
    { text: "The interior was a bit dirty, which ruined the mood.", rating: 2 },
    { text: "Fantastic variety on the menu. Hard to choose just one thing!", rating: 5 },
    { text: "A bit too salty for my taste, but others might like it.", rating: 3 },
    { text: "Prompt service even though the place was packed.", rating: 4 },
    { text: "I found a hair in my food. Never coming back.", rating: 0 },
    { text: "Delicious and worth every penny.", rating: 5 },
    { text: "Standard fare. Good for a one-time visit.", rating: 3 },
    { text: "The staff went above and beyond to make us feel welcome.", rating: 5 },
    { text: "Portions were way too small for the price they charge.", rating: 2 },
    { text: "Incredibly fresh and authentic. A must-try.", rating: 5 },
    { text: "It was fine, just felt like it lacked any real character.", rating: 3 },
    { text: "The wait time was ridiculous. Management needs to do better.", rating: 1 },
    { text: "Perfectly executed. No complaints at all.", rating: 5 },
    { text: "Good vibes and even better food.", rating: 4 },
    { text: "The music was way too loud, couldn't even have a conversation.", rating: 2 },
    { text: "Always a reliable spot for a high-quality meal.", rating: 5 },
    { text: "The server seemed like they didn't want to be there.", rating: 1 },
    { text: "Unexpectedly great! Exceeded all my expectations.", rating: 5 },
    { text: "A bit greasy, but still tasted pretty good.", rating: 3 },
    { text: "Very accommodating for dietary restrictions.", rating: 4 },
    { text: "Terrible experience. The order was completely wrong.", rating: 1 },
    { text: "Top-notch quality. You can tell they care about their craft.", rating: 5 },
    { text: "Average at best. I don't get the hype.", rating: 2 },
    { text: "Clean, efficient, and tasty. Can't ask for much more.", rating: 4 },
    { text: "Simply divine. One of my new favorites.", rating: 5 },
    { text: "The table was sticky and the floor needed a sweep.", rating: 2 },
    { text: "Amazing presentation and even better taste.", rating: 5 },
    { text: "Too expensive for the quality of food provided.", rating: 2 },
    { text: "Quick, easy, and satisfying.", rating: 4 },
    { text: "The food came out way too fast, felt like it was microwaved.", rating: 2 },
    { text: "Loved every bite! Highly recommend the specials.", rating: 5 },
    { text: "It was okay, but I probably won't go out of my way for it.", rating: 3 },
    { text: "Horrible service. We were ignored for twenty minutes.", rating: 0 },
    { text: "Light, fresh, and flavorful. Perfect for lunch.", rating: 4 },
    { text: "The portions are huge! Definitely bring an appetite.", rating: 5 },
    { text: "A little underwhelming based on the reviews I read.", rating: 2 },
    { text: "Beautifully decorated and the food matches the vibe.", rating: 5 },
    { text: "The menu is a bit confusing, but the food is decent.", rating: 3 },
    { text: "Will be a regular here from now on.", rating: 5 },
    { text: "Everything was way too spicy, couldn't finish it.", rating: 1 },
    { text: "Great value for money. Hard to beat these prices.", rating: 4 },
    { text: "They ran out of almost everything on the menu.", rating: 1 },
    { text: "An absolute delight for the senses.", rating: 5 },
    { text: "Service was fast, but the food was quite bland.", rating: 3 },
    { text: "Lovely atmosphere for a date night.", rating: 4 },
    { text: "The bathroom was disgusting. Really turned me off.", rating: 0 },
    { text: "Consistently excellent. They never miss.", rating: 5 },
    { text: "A bit hit or miss depending on what you order.", rating: 3 },
    { text: "Very friendly owners and great service.", rating: 5 },
    { text: "The food was drowning in sauce. Way too much.", rating: 2 },
    { text: "Solid 4 stars. Good food and good prices.", rating: 4 },
    { text: "Waited an hour for a table and then the service was slow.", rating: 1 },
    { text: "My go-to spot for comfort food.", rating: 5 },
    { text: "The ingredients felt a bit cheap/low quality.", rating: 2 },
    { text: "Pleasantly surprised by the variety of options.", rating: 4 },
    { text: "The smell inside was a bit off-putting.", rating: 1 },
    { text: "Five stars all around! Outstanding.", rating: 5 },
    { text: "Not bad, but there are better options on the same street.", rating: 3 },
    { text: "The appetizer was great, but the main dish was lacking.", rating: 3 },
    { text: "Exceptional service. They really made us feel special.", rating: 5 },
    { text: "Avoid this place if you're in a hurry.", rating: 1 },
    { text: "Fresh, healthy, and delicious.", rating: 5 },
    { text: "The seating was very cramped and uncomfortable.", rating: 2 },
    { text: "The perfect spot for a weekend treat.", rating: 5 },
    { text: "Standard quality. Nothing to write home about.", rating: 3 },
    { text: "The staff was incredibly rude when we asked for a refill.", rating: 1 },
    { text: "Great energy in this place. Loved it!", rating: 4 },
    { text: "Perfect balance of flavors.", rating: 5 },
    { text: "Way too much oil in the food. Felt sick after.", rating: 1 },
    { text: "A bit loud, but the food makes up for it.", rating: 4 },
    { text: "I've been here three times and it's always great.", rating: 5 },
    { text: "Just your typical establishment. Nothing stands out.", rating: 3 },
    { text: "Gross. Just gross. Don't eat here.", rating: 0 },
    { text: "Super kid-friendly and the staff was very patient.", rating: 4 },
    { text: "A culinary masterpiece in every dish.", rating: 5 },
    { text: "The waitstaff was confused and brought us the wrong bill.", rating: 2 },
    { text: "Wonderful experience. Worth the price.", rating: 5 },
    { text: "Everything was lukewarm when it reached the table.", rating: 2 },
    { text: "Simple food done right.", rating: 4 },
    { text: "The texture of the meat was very rubbery.", rating: 1 },
    { text: "Exactly what I was craving. Perfection.", rating: 5 },
    { text: "Nice place, but the parking is a nightmare.", rating: 3 }
];

const REVIEW_RESPONSES = {
    negative: [
        "We are so sorry to hear that your experience wasn't up to our usual standards. We’d love to make it right.",
        "I’m sorry to hear about the delay in service. We’re working hard to speed things up during peak hours.",
        "We apologize for the oversight with your order. Please reach out to us directly so we can compensate you.",
        "We apologize for the cleanliness issues you encountered. This has been addressed with our cleaning staff.",
        "We're sorry to hear the portions weren't to your satisfaction. We try to balance quality and value for all our guests.",
        "Thank you for the constructive criticism. We are committed to getting better every single day.",
        "We appreciate your honesty. We'll look into the issues you mentioned regarding the quality immediately."
    ],
    neutral: [
        "We appreciate the feedback! We're always looking for ways to improve.",
        "We're glad you enjoyed the atmosphere! We'll be sure to share your comments with our team.",
        "Your feedback is vital to us. Thank you for taking the time to share your thoughts.",
        "We’re sorry the noise level was an issue for you. We’ll take this into consideration for future changes.",
        "We appreciate your patience during our busy shift. We hope your next visit is even better!",
        "Thank you for stopping by! We hope to provide a more consistent experience next time."
    ],
    positive: [
        "Thank you so much for your kind words! We’re thrilled you enjoyed your visit.",
        "Thank you for being a loyal customer! We look forward to seeing you again soon.",
        "Thank you for the 5-star review! It means the world to our small team.",
        "It’s great to know you enjoyed the flavors! We hope to serve you again very soon.",
        "Thank you for the recommendation! Word of mouth is the best compliment we can receive.",
        "We’re delighted you loved the specials! Our chefs work hard to keep the menu exciting.",
        "It’s wonderful to hear our staff made you feel welcome. We’ll pass the praise along!"
    ]
};

const generateUsers = async (count = 50) => {
    console.log('Generating new users')
    try {
        await User.deleteMany({});
        console.log('Old users cleared.');

        let password = 'password'
        let saltRounds = 10;

        const users = [];
        for (let i = 0; i < count; i++) {
            let hashedPass = bcrpyt.hashSync(password, saltRounds)
            users.push({
                username: faker.internet.username(),
                password: hashedPass,
                avatar: faker.image.avatar(),
                description: faker.person.bio(),
                role: 'user',
            });
        }

        await User.insertMany(users);
        console.log(`Successfully created ${count} users!`);

        return users

    } catch (error) {
        console.error('Error generating users: ', error);
    }
};

const generateOwners = async (count = 10) => {
    console.log('Generating new owner users (note: this must be run AFTER generating users otherwise you will have a bad time)')
    try {
        let password = 'password'
        let saltRounds = 10;

        const users = [];
        for (let i = 0; i < count; i++) {
            let hashedPass = bcrpyt.hashSync(password, saltRounds)
            users.push({
                username: faker.internet.username(),
                password: hashedPass,
                avatar: faker.image.avatar(),
                description: faker.person.bio(),
                role: 'owner',
            });
        }

        await User.insertMany(users);
        console.log(`Successfully created ${count} owner users!`);
        return users;

    } catch (error) {
        console.error('Error generating users: ', error);
    }
};

const generateRestaurants = async (ownerList, restaurantList) => {
    if (restaurantList.length > ownerList.length) {
        console.log(`Provided owner list is too short ${ownerList.length} to generate ${restaurantList.length} restaurants. Some restaurants will not be generated.`)
    }

    try {
        await Restaurant.deleteMany({});
        console.log('Old restaurants cleared');

        const restaurants = [];
        for (let i=0; i<ownerList.length; i++) {
            let resto = restaurantList[i]
            restaurants.push({
                name: resto.name,
                description: resto.description,
                imageSrc: resto.imageSrc,
                location: resto.location,
                ownerId: ownerList[i]._id,
                priceRange: resto.priceRange
            });
        }

        await Restaurant.insertMany(restaurants);
        console.log(`Successfully created ${restaurants.length} restaurants!`);

        return restaurants
    }
    catch (error) {
        console.error('Error generating restaurants: ', error);
    }
}

// Must be run ONLY once users, owners, and restaurants are created
const generateReviews = async (users, restaurants, count = 10) => {
    console.log(`Generating ${count} reviews`)
    try { 
        await Reviews.deleteMany({});
        console.log('Deleted old reviews')

        const reviews = [];

        let i = 0;
        while (i < count) {
            const randomUser = faker.helpers.arrayElement(users);
            const randomRestaurant = faker.helpers.arrayElement(restaurants);

            const isDuplicate = reviews.some(review =>
                review.userId.toString() === randomUser._id.toString() && 
                review.restaurantId.toString() === randomRestaurant._id.toString()
            );
            if (isDuplicate) 
                continue; 

            const hasResponse = Math.random() < 0.3;
            const reviewDate = faker.date.past();

            const helpfulCount = Math.round(Math.random() * users.length);
            const unhelpfulCount = Math.round(Math.random() * (users.length - helpfulCount));

            let helpful = []
            let unhelpful = []

            let x = 0;
            while (x < helpfulCount) {
                let usr = users[Math.floor(Math.random()*users.length)];
                if (usr._id in helpful)
                    continue;
                helpful.push(usr._id);
                x++
            }

            x = 0;
            while (x < unhelpfulCount) {
                let usr = users[Math.floor(Math.random()*users.length)];
                if (usr._id in helpful || usr._id in unhelpful)
                    continue;
                unhelpful.push(usr._id);
                x++
            }

            var randomReview = REVIEW_BODIES[Math.floor(Math.random() * REVIEW_BODIES.length)];
            var randomResponse = '';
            if (randomReview.rating < 2)
                randomResponse = REVIEW_RESPONSES.negative[Math.floor(Math.random() * REVIEW_RESPONSES.negative.length)];
            else if (randomReview.rating < 4)
                randomResponse = REVIEW_RESPONSES.neutral[Math.floor(Math.random() * REVIEW_RESPONSES.neutral.length)];
            else
                randomResponse = REVIEW_RESPONSES.positive[Math.floor(Math.random() * REVIEW_RESPONSES.positive.length)];

            const review = {
                userId: randomUser._id,
                restaurantId: randomRestaurant._id,
                rating: randomReview.rating,
                comment: randomReview.text,
                media: Array.from({ length: faker.number.int({ min: 0, max: 3 }) }, 
                    () => faker.image.url({ category: 'food' })),

                updatedAt: reviewDate,
                edited: faker.datatype.boolean(0.1),

                helpfulVotes: helpful,
                unhelpfulVotes: unhelpful, 

                helpfulCount: helpfulCount,
                unhelpfulCount: unhelpfulCount,

                ownerResponse: hasResponse ? {
                    ownerId: randomRestaurant.ownerId,
                    comment: randomResponse,
                    respondedAt: faker.date.between({ from: reviewDate, to: new Date() }),
                    updatedAt: new Date()
                } : undefined
            };

            reviews.push(review);

            i++;
        }

        await Reviews.insertMany(reviews);
        console.log(`Successfully created ${count} reviews!`);

        const review_means = reviews.reduce((acc, review) => {
            const restId = review.restaurantId.toString();
            
            if (!acc[restId]) {
                acc[restId] = { totalRating: 0, count: 0 };
            }
            
            acc[restId].totalRating += review.rating;
            acc[restId].count += 1;
            
            return acc;
        }, {});

        Object.keys(review_means).forEach(id => {
            const data = review_means[id];
            review_means[id] = { 
                avgRating: Number((data.totalRating / data.count).toFixed(2)) 
            };
        });

        console.log("Updating restaurant average ratings...");

        for (let resto_id in review_means) {
            await Restaurant.findByIdAndUpdate(resto_id, review_means[resto_id]);
        }


        return reviews;

    }

    catch (error) {
        console.error('Error generating reviews: ', error);
    }

};

const createCategories = async (categoryList) => {
    console.log('Creating categories for establishments...');
    try {
        await Categories.deleteMany({});
        console.log('Cleared old categories.');

        let categories = [];

        for (let category of categoryList)
            categories.push({name:category})

        await Categories.insertMany(categories);
        console.log(`Successfully created ${categories.length} categories!`);

        return categories;
    }

    catch (error) {
        console.log('Error creating categories: ', error)
    }
}

const generateData = async () => {
    console.log('Connecting to database...')
    const userCount = 50;
    const rstCount = 10;
    const reviewCount = Math.round(userCount*rstCount / 2);
    await connectDB();

    await createCategories(RESTAURANT_CATEGORIES);

    await generateUsers(userCount);
    const usrqry = User.find({})
        .limit(userCount);
    const users = await usrqry.exec();

    await generateOwners(rstCount);
    const ownqry = User.find({})
        .skip(userCount)
        .limit(rstCount);
    const owners = await ownqry.exec();

    await generateRestaurants(owners, STATIC_RESTAURANTS);
    const rstqry = Restaurant.find({});
    const restaurants = await rstqry.exec();

    await generateReviews(users, restaurants, reviewCount);

    process.exit(0)
}

generateData();
