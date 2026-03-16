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

    await generateRestaurants(owners, STATIC_RESTAURANTS);
    const rstqry = Restaurant.find({});
    const restaurants = await rstqry.exec();

    await generateReviews(users, restaurants, reviewCount);

    process.exit(0)
}

generateData();
