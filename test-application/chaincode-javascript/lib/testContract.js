const stringify  = require('json-stringify-deterministic');
const sortKeysRecursive  = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');
const ClientIdentity = require('fabric-shim').ClientIdentity;

class testContract extends Contract {
    async InitLedger(ctx) {
        const assets = [
            {
                ID: '1',
                agentName: 'John Doe',
                agentCompany: 'IBM',
                agentDOB: "01/01/2001"
            },
            {
                ID: '2',
                userName: 'Joe Doe',
                userCompany: 'Linux',
                userDOB: "02/02/2002"
            }
        ];

        for (const asset of assets) {
            asset.docType = 'asset';
            await ctx.stub.putState(asset.ID, Buffer.from(stringify(sortKeysRecursive(asset))));
        }
    }


    async registerAgent(ctx,agentid,name,company, dob) { 

        // const exists = await this.AssetExists(ctx, agentid);
        // if (!exists) {
        //     throw new Error(`The asset ${id} does not exist`);
        // }

        let cid = new ClientIdentity(ctx.stub);
        if (!cid.assertAttributeValue('role', 'admin')) { 
         throw new Error('Not a valid user');
        }
        const agent={
         agentID:agentid, 
         agentName:name,
         agentCompany:company,
         agentDOB: dob
         }; 
        await ctx.stub.putState(agentid,Buffer.from(JSON.stringify(agent))); 
        console.log('Customers added To the ledger Succesfully..'); 
        return JSON.stringify(agent);
    }

    async registerUser(ctx,userID,name,company, dob) { 

        let cid = new ClientIdentity(ctx.stub);
        if (!cid.assertAttributeValue('role', 'agent')) { 
         throw new Error('Not a valid User');
        }
        const User={
         userID:userID, 
         userName:name,
         userCompany:company,
         userDOB: dob
         }; 
        await ctx.stub.putState(userID,Buffer.from(JSON.stringify(User))); 
        console.log('Customers added To the ledger Succesfully..'); 
        return JSON.stringify(User);
    }

    async getUserDetails(ctx) {
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }



    async DeleteAsset(ctx, id) {
        const exists = await this.InsuranceExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }
        return ctx.stub.deleteState(id);
    }

    async txid(ctx){
        const txid = await ctx.stub.getTxID(); // Transaction Hash 
        console.log(txid)
        return JSON.stringify(txid)
    }


    // ReadAsset returns the asset stored in the world state with given id.
    async ReadAsset(ctx, id) {
        const assetJSON = await ctx.stub.getState(id); // get the asset from chaincode state
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`The asset ${id} does not exist`);
        }
        return assetJSON.toString();
    }

    async AssetExists(ctx, id) {
        const assetJSON = await ctx.stub.getState(id);
        return assetJSON && assetJSON.length > 0;
    }

    
}

module.exports = testContract;