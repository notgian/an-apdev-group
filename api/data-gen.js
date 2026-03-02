const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');

const connectDB = require('./dbconnect')
const User = require('./schema_models/userSchema.js');

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

const generateData = async () => {
    console.log('Connecting to database...')
    await connectDB()
    await generateUsers(50) 

    process.exit(0)
}

generateData();
