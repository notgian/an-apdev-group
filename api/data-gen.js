const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');

const connectDB = require('./dbconnect')
const User = require('./schema_models/userSchema.js');
const Restaurant = require('./schema_models/restaurantSchema.js');

const generateUsers = async (count = 50) => {
    try {
        await User.deleteMany({});
        console.log('Old users cleared.');

        const users = [];
        for (let i = 0; i < count; i++) {
            users.push({
                username: faker.internet.username(),
                password: 'password',
                avatar: faker.image.avatar(),
                description: faker.person.bio(),
                role: faker.helpers.arrayElement(['user', 'owner']),
            });
        }

        await User.insertMany(users);
        console.log(`Successfully created ${count} users!`);

    } catch (error) {
        console.error('Error generating users: ', error);
    }
};

const generateRestaurants = async (count = 50) => {
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
                location: {
                    street: faker.location.streetAddress(),
                    city: faker.location.city(),
                    province: faker.location.state(),
                    zipCode: faker.location.zipCode()
                },
                priceRange: {
                    min: minPrice,
                    max: maxPrice
                }
            });
        }

        await Restaurant.insertMany(restaurants);
        console.log(`Successfully created ${count} restaurants!`);
    }
    catch (error) {
        console.error('Error generating restaurants: ', error);
    }
}

const generateData = async () => {
    console.log('Connecting to database...')
    await connectDB()
    await generateUsers(50) 
    await generateRestaurants(50)

    process.exit(0)
}

generateData();
