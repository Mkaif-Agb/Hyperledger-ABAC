# rm -rf ../test-application/wallet

# mongo hlf --eval "db.users.drop()"

# ./network.sh down

# ./network.sh up createChannel -ca -s couchdb

# ./network.sh deployCC -ccn basic -ccp ../test-application/chaincode-javascript/ -ccl javascript

cd ../test-application

npm install 

npm start

