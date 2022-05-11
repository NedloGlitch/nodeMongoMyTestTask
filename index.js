const {MongoClient} = require('mongodb');
const fetch = require('node-fetch')
require('dotenv').config();

const uri = process.env.URI;

if(!uri){ throw "NoEnvFound"}

const client = new MongoClient(uri);
main();
async function main() {
  try {
    await client.connect();
    const db = client.db("shinez-temporary");
    const collection = db.collection('articles');
    const findResult = await collection.find({}).toArray();
    console.log('Found articles =>', findResult);

    await Promise.all(
      findResult.map(async (element) => {
      const response = await fetch(element.url);
      const data = await response.text();

      let keyword = "article = ";
      let jsonPosition = data.indexOf(keyword) + keyword.length;
      let parsedThing = JSON.parse(data.slice(jsonPosition, data.length-1));

      console.log(" Article title: " + parsedThing.meta.title);
      console.log(" Article length: " + parsedThing.blocks.length);

      let titleAndBlocks = {title: parsedThing.meta.title, blocks: parsedThing.blocks};

      titleAndBlocks.blocks.sort( (a, b) => JSON.stringify(a.text).length >= JSON.stringify(b.text).length ? -1 : 1 );

      let articleStats = {title :titleAndBlocks.title, relevant: titleAndBlocks.blocks.slice(0, 3)};

      if(!element.stats){
        const updateResult = await collection.updateOne({ _id: element._id }, { $set: { stats: articleStats } });
        console.log('Updated documents =>', updateResult);
      }  
    }));
  } catch (e) {
    console.error(e);
  } finally {
      client.close();
  }
}