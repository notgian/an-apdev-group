#!/bin/bash

set -e # exit on error

echo "Waiting for MongoDB to start..."
until mongosh --host mongodb --port 27017 --eval "db.adminCommand('ping')" > /dev/null 2>&1; do
  sleep 2
done
echo "MongoDB is ready!"
 
# --------------------------
# Create app user
# --------------------------
echo "Creating app user: $APP_USER"
echo "$MONGO_ROOT_USER, $MONGO_ROOT_PASS"
mongosh --host mongodb --port 27017 -u "$MONGO_ROOT_USER" -p "$MONGO_ROOT_PASS" <<EOF
  use $APP_DB;
  db.createUser({
    user: "$APP_USER",
    pwd: "$APP_PASS",
    roles: [
      { role: "readWrite", db: "$APP_DB" }
    ]
  });
 
  db.getUser("$APP_USER");
EOF
 
echo "User setup completed successfully!"


