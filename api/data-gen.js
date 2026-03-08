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

const generateRestaurants = async (ownerList, count = 10) => {
    if (ownerList.length < count) {
        console.log(`Provided owner list is too short ${ownerList.length} to generate ${count} restaurants`)
        return
    }

    try {
        await Restaurant.deleteMany({});
        console.log('Old restaurants cleared');


        const restaurants = [];
        for (let i=0; i<count; i++) {
            const minPrice = parseFloat(faker.commerce.price({ min: 80, max: 400 }));
            const maxPrice = parseFloat(faker.commerce.price({ min: Math.floor(minPrice * 1.5), max: 900 }));

            restaurants.push({
                name: `${faker.company.name()} ${faker.helpers.arrayElement(['Kitchen', 'Bistro', 'Grill', 'Cafe', 'Diner'])}`,
                description: faker.lorem.sentences(2),
                imageSrc: 'http://127.0.0.1:4200/cdn/shaw.png',
                location: {
                    street: faker.location.streetAddress(),
                    city: faker.location.city(),
                    province: faker.location.state(),
                    zipCode: faker.location.zipCode()
                },
                ownerId: ownerList[i]._id,
                priceRange: {
                    min: minPrice,
                    max: maxPrice
                },
            });
        }

        await Restaurant.insertMany(restaurants);
        console.log(`Successfully created ${count} restaurants!`);

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

            const review = {
                userId: randomUser._id || randomUser,
                restaurantId: randomRestaurant._id || randomRestaurant,
                rating: faker.number.int({ min: 1, max: 5 }),
                comment: faker.lorem.paragraph(),
                media: Array.from({ length: faker.number.int({ min: 0, max: 3 }) }, 
                    () => faker.image.url({ category: 'food' })),

                updatedAt: reviewDate,
                edited: faker.datatype.boolean(0.1),

                helpfulVotes: helpful,
                unhelpfulVotes: unhelpful, 

                helpfulCount: helpfulCount,
                unhelpfulCount: unhelpfulCount,

                ownerResponse: hasResponse ? {
                    ownerId: randomRestaurant.ownerId || faker.database.mongodbObjectId(),
                    comment: faker.lorem.sentences(2),
                    respondedAt: faker.date.between({ from: reviewDate, to: new Date() }),
                    updatedAt: new Date()
                } : undefined
            };

            reviews.push(review);

            i++;
        }

        await Reviews.insertMany(reviews);
        console.log(`Successfully created ${count} reviews!`);

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

    await generateRestaurants(owners, rstCount);
    const rstqry = Restaurant.find({});
    const restaurants = await rstqry.exec();

    await generateReviews(users, restaurants, reviewCount);

    process.exit(0)
}

generateData();
