const User = require('./model');
const bcrypt = require('bcryptjs')
const Verify = require('./authentication');
const {registerAdmin, registerUser, userExist} = require('./registerUser');
const {buildCCPOrg1, buildCCPOrg2, buildCCPOrg3, buildWallet} = require('./AppUtil');
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
global.atob = require('atob')
require('dotenv').config()



const channelName = 'mychannel';
const chaincodeName = 'basic';
const mspOrg = 'Org1MSP';

parseJwt = function(token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace('-', '+').replace('_', '/');
    return JSON.parse(atob(base64));
  }


function prettyJSONString(inputString) {
	return JSON.stringify(JSON.parse(inputString), null, 2);
}



exports.registeradmin = async (req, res)=>{

    // Extract the required Fields
    // const {userName ,email, password} = req.body;
    const userName = 'admin';
    const email = 'admin@gmail.com';
    const password = 'adminpw';
    const role = "admin"

    var user = await User.findOne({email});
    var enc_password = await bcrypt.hash(password, 10);
     // If User found, following error would be provided
    if(user){
        return res.json({status:'error', error:'Admin Already Exists'});
      }


    // If all correct Insert the user into our Database
    try {
        const response = await User.create({
            userName, 
            email,
            password: enc_password,
            org:mspOrg, 
            isAdmin: true,
            approved: true
        });
        const userId = response._id.toString()
        result = await registerAdmin({ OrgMSP: mspOrg, userId: userId })
    } catch (error) {
        console.log(error);
        // alert("An error has been Occured");
        return res.json({status:'error'});
    }
    
    // Response Provided
    res.json({message:`${userName} with Email: ${email} and organisation: ${mspOrg} as an Admin registered with our database.`});
};

exports.register = async (req, res)=>{

    // Extract the required Fields
    const {userName ,email, password, role} = req.body;
    var user = await User.findOne({email});
    var enc_password = await bcrypt.hash(password, 10);
     // If User found, following error would be provided
    if(user){
        return res.json({status:'error', error:'Email already exists'});
      }


    // If all correct Insert the user into our Database
    try {
        const response = await User.create({
            userName, 
            email,
            password: enc_password,
            org:mspOrg, 
        });
        const userId = response._id.toString()
        result = await registerUser({ OrgMSP: mspOrg, userId: userId , role:role})
    } catch (error) {
        console.log(error);
        // alert("An error has been Occured");
        return res.json({status:'error'});
    }
    
    // Response Provided
    res.json({message:`${userName} with Email: ${email} and organisation: ${mspOrg} registered with our database.`});
};

exports.login = async(req, res)=>{

    // Getting Required Fields from the user
    const {email, password} = req.body;

    var user = await User.findOne({email});

    // If no User found, following error would be provided
    if(!user){
      return res.json({status:'error', error:'Invalid Email/Password'});
    }
    
    // If Found then compare the user provided password || database password
    if (await bcrypt.compare(password, user.password)){

      token = await Verify.createtoken(user)  // Generate JWT token from authentication middleware
      res.cookie('jwt', token); // Save the JWT in cookies for futher use
      console.log("Logged in");
      return res.json({status:'ok', data:{user, 
        token
      }});
    };
  
    res.json({status:'error', error:'Invalid Username/Password'});
  }


exports.transaction = async (req, res) =>{
    data = parseJwt(req.cookies.jwt);
    console.log(data.email);
    const db =  await User.find({email: data.email});
    const orgmsp = db[0].org;
    let userid;
    if (db[0].userName === 'admin') {
        userid = 'admin'
    } else {
        userid = db[0]._id.toString()        
    }
    let ccp;
    if (orgmsp === 'Org1MSP'){
        ccp = buildCCPOrg1();
        console.log("built using Org1MSP");
    }
    else if (orgmsp === "Org2MSP"){
        ccp = buildCCPOrg2();
        console.log('built using Org2MSP');
    }
    else if(orgmsp === "Org3MSP"){
        ccp = buildCCPOrg3();
        console.log("built using Org3MSP");
    }
    const gateway = new Gateway();
    const walletPath = path.join(__dirname, 'wallet');
    const wallet = await buildWallet(Wallets, walletPath);
    try{

        await gateway.connect(ccp, {
            wallet,
            identity: userid,
            discovery: {enabled: true, asLocalhost: true}
        });

        const network = await gateway.getNetwork(channelName);
        const contract = network.getContract(chaincodeName);

        console.log('\n--> Submit Transaction: InitLedger, function creates the initial set of assets on the ledger');
        await contract.submitTransaction('InitLedger');
        console.log('*** Result: committed');

        console.log('\n--> Submit Transaction: AddCustomer, creates new asset with Id, Role and Name');
        let result = await contract.submitTransaction('addCustomer', "7","Customer", "xxxx");
        console.log('*** Result: committed');
        if (`${result}` !== '') {
            console.log(`*** Result: ${prettyJSONString(result.toString())}`);
        }

        console.log('\n--> Evaluate Transaction: GetAllAssets, function returns all the current assets on the ledger');
        result = await contract.evaluateTransaction('GetAllAssets');
        console.log(`*** Result: ${prettyJSONString(result.toString())}`);
        return res.json({status:'ok', data:result.toString()});

    }catch{
        
        res.json({status: "Error"});
    }
    finally{
        gateway.disconnect();
    }

    // return res.json("ok");
}


exports.registerAgent = async (req, res) =>{
    data = parseJwt(req.cookies.jwt);
    const {agentid, name, company, dob} = req.body
    console.log(data.email);
    const db =  await User.find({email: data.email});
    const orgmsp = db[0].org;
    let userid = db[0]._id.toString()        
    let ccp;
    ccp = buildCCPOrg1();
    console.log("built using Org1MSP");

    const gateway = new Gateway();
    const walletPath = path.join(__dirname, 'wallet');
    const wallet = await buildWallet(Wallets, walletPath);
    try{

        await gateway.connect(ccp, {
            wallet,
            identity: userid,
            discovery: {enabled: true, asLocalhost: true}
        });

        const network = await gateway.getNetwork(channelName);
        const contract = network.getContract(chaincodeName);

        console.log('\n--> Submit Transaction: InitLedger, function creates the initial set of assets on the ledger');
        await contract.submitTransaction('InitLedger');
        console.log('*** Result: committed');

        console.log('\n--> Submit Transaction: Register Agent, creates new asset with Id, Company, DOB and Name');
        let result = await contract.submitTransaction('registerAgent',agentid,name,company,dob);
        console.log('*** Result: committed');
        if (`${result}` !== '') {
            console.log(`*** Result: ${prettyJSONString(result.toString())}`);
        }
        res.json({status: "Success", data: prettyJSONString(result.toString())})
    }catch{
        res.json({status: "Error", data:"Invalid User/Transaction"});
    }
    finally{
        gateway.disconnect();
    }

    // return res.json("ok");
}


exports.registerUser = async (req, res) =>{
    data = parseJwt(req.cookies.jwt);
    const {userID, name, company, dob} = req.body
    console.log(data.email);
    const db =  await User.find({email: data.email});
    let userid = db[0]._id.toString()        
    let ccp;
    ccp = buildCCPOrg1();
    console.log("built using Org1MSP");

    const gateway = new Gateway();
    const walletPath = path.join(__dirname, 'wallet');
    const wallet = await buildWallet(Wallets, walletPath);
    try{

        await gateway.connect(ccp, {
            wallet,
            identity: userid,
            discovery: {enabled: true, asLocalhost: true}
        });

        const network = await gateway.getNetwork(channelName);
        const contract = network.getContract(chaincodeName);

        // console.log('\n--> Submit Transaction: InitLedger, function creates the initial set of assets on the ledger');
        // await contract.submitTransaction('InitLedger');
        // console.log('*** Result: committed');

        console.log('\n--> Submit Transaction: Register User, creates new asset with Id, Company, DOB, and Name');
        let result = await contract.submitTransaction('registerUser',userID,name,company,dob);
        console.log('*** Result: committed');
        if (`${result}` !== '') {
            console.log(`*** Result: ${prettyJSONString(result.toString())}`);
        }
        res.json({status: "Success", data: prettyJSONString(result.toString())})
    }catch{
        res.json({status: "Error", data:"Invalid User/Transaction"});
    }
    finally{
        gateway.disconnect();
    }

    // return res.json("ok");
}

exports.getUserDetails = async (req, res) =>{
    data = parseJwt(req.cookies.jwt);
    const {userID, name, company, dob} = req.body
    console.log(data.email);
    const db =  await User.find({email: data.email});
    let userid = db[0]._id.toString()        
    let ccp;
    ccp = buildCCPOrg1();
    console.log("built using Org1MSP");

    const gateway = new Gateway();
    const walletPath = path.join(__dirname, 'wallet');
    const wallet = await buildWallet(Wallets, walletPath);
    try{

        await gateway.connect(ccp, {
            wallet,
            identity: userid,
            discovery: {enabled: true, asLocalhost: true}
        });

        const network = await gateway.getNetwork(channelName);
        const contract = network.getContract(chaincodeName);

        // console.log('\n--> Submit Transaction: InitLedger, function creates the initial set of assets on the ledger');
        // await contract.submitTransaction('InitLedger');
        // console.log('*** Result: committed');

        console.log('\n--> Submit Transaction: Get all user Details');
        let result = await contract.evaluateTransaction('getUserDetails');
        console.log('*** Result: committed');
        if (`${result}` !== '') {
            console.log(`*** Result: ${prettyJSONString(result.toString())}`);
        }
        res.json({status: "Success", data: prettyJSONString(result.toString())})
    }catch{
        res.json({status: "Error"});
    }
    finally{
        gateway.disconnect();
    }

    // return res.json("ok");
}

