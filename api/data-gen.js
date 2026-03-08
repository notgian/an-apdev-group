const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const bcrpyt = require('bcrypt')

const connectDB = require('./dbconnect')
const User = require('./schema_models/userSchema.js');
const Restaurant = require('./schema_models/restaurantSchema.js');

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

            const qry = User.find({username: ownerList[i].username })
                .select('_id')
                .lean();
            
            const ownerId = await qry.exec();
            // console.log(ownerId[0]._id);

            restaurants.push({
                name: `${faker.company.name()} ${faker.helpers.arrayElement(['Kitchen', 'Bistro', 'Grill', 'Cafe', 'Diner'])}`,
                description: faker.lorem.sentences(2),
                location: {
                    street: faker.location.streetAddress(),
                    city: faker.location.city(),
                    province: faker.location.state(),
                    zipCode: faker.location.zipCode()
                },
                ownerId: ownerId[0]._id,
                priceRange: {
                    min: minPrice,
                    max: maxPrice
                },
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
    const userCount = 50;
    const rstCount = 10;

    await connectDB()
    await generateUsers(userCount) 
    const owners = await generateOwners(rstCount)
    await generateRestaurants(owners, rstCount)

    process.exit(0)
}

generateData();
