db = db.getSiblingDB('admin');
db.auth(process.env.MONGO_ROOT_USER, process.env.MONGO_ROOT_PASS);

db = db.getSiblingDB(process.env.APP_DB);
db.createUser({
  user: process.env.APP_USER,
  pwd: process.env.APP_PASS,
  roles: [
    { role: 'readWrite', db: process.env.APP_DB }
  ]
});

// Only to create the database
db.init.insertOne({ message: "empty collection used for initializing the database." });

console.log(`Created DB: ${process.env.APP_DB} and User: ${process.env.APP_USER}`);
