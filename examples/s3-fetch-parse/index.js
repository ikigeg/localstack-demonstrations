const Nedb = require('nedb');
const promisifyNeDB = require('./promisify-nedb');

const { listObjects, getObject } = require('./bucketOperations');

// Process arguments
const [ ,, bucketName, basePath = '' ] = process.argv || [];
if (!bucketName) {
  throw new Error('Missing bucketName argument');
}

// Configure and promisify some persistent db's
const dbs = {
  keys: promisifyNeDB(new Nedb({ filename: `.db/${bucketName}-keys`, autoload: true })),
  contents: promisifyNeDB(new Nedb({ filename: `.db/${bucketName}-contents`, autoload: true })),
};

// function to fetch all the keys from the bucket
async function fetchAllBucketKeys({
  followToken = true,
  nextPageToken,
} = {}) {
  let listObjectsResponse;
  try {
    listObjectsResponse = await listObjects({
      bucket: bucketName,
      basePath,
      quantityPerPage: 100,
      ...(nextPageToken && { nextPageToken }),
    });
  } catch (err) {
    console.error({ err }, 'Error obtaining list of objects from bucket');
    throw new Error(err);
  }

  // list of X objects
  const {
    Contents = [],
    NextContinuationToken,
    IsTruncated,
  } = listObjectsResponse;

  /* Example key object:
  {
    Key: 'DummyThings/2019/7/18/hello_world-346.txt',
    LastModified: 2019-07-06T11:40:55.716Z,
    ETag: '"e27be87ff2f76bf4920c13c4676b4998"',
    Size: 189,
    StorageClass: 'STANDARD'
  }
  */

  // Nicer formatting for our expected keys
  const parsedContents = Contents.map(({ Key: key }) => {
    const pieces = key.split('/').reverse();
    const { 0: file, 1: day, 2: month, 3: year, ...path } = pieces;
    const date = `${year}-${month}-${day}`;

    return {
      key,
      processed: null,
      date,
      file,
      path,
    }
  });

  // Add all keys to the DB
  try {
    await dbs.keys.insert(parsedContents);
  } catch (err) {
    // debatable whether this should kill the service or not
    console.error({ err }, 'Error inserting event keys');
  }

  if (IsTruncated && followToken) {
    console.log(`Inserted ${parsedContents.length} keys`);

    return fetchAllBucketKeys({
      nextPageToken: NextContinuationToken,
    });
  }

  console.log(
    `All filenames listed in the bucket have been stored, good job! Now onto processing!`,
  );

  let totalKeys;
  try {
    totalKeys = await dbs.keys.count();
  } catch (err) {
    // debatable whether this should kill the service or not
    console.error({ err }, 'Error counting event keys');
    throw new Error(err);
  }
}

// Download all objects by their key, parse, and store each contained data object as a new record to the contents db
async function processKeys({
  quantity = 100,
  processAllDataObjects = true,
  totalFilesDownloaded = 0,
  totalDataObjectsProcessed = 0,
} = {}) {
  let keysToBeProcessed;
  try {
    const keysToBeProcessedResponse = await dbs.keys
      .find({ processed: null })
      .sort({ key: 1 })
      .limit(quantity);
    keysToBeProcessed = keysToBeProcessedResponse && keysToBeProcessedResponse.length ? keysToBeProcessedResponse[0] : [];
  } catch (err) {
    console.error({ err }, 'Error obtaining list of outstanding keys from db');
    throw new Error(err);
  }

  // list of X files
  let filesDownloaded = totalFilesDownloaded;
  let dataObjectsProcessed = totalDataObjectsProcessed;

  // We recursively call this function until this is 0
  if (keysToBeProcessed.length) {
    await keysToBeProcessed.reduce(async (promise, { key, _id }) => {
      // This line will wait for the last async function to finish.
      // The first iteration uses an already resolved Promise
      // so, it will immediately continue.
      await promise;

      let fetchedFile;
      try {
        fetchedFile = await getObject({
          bucket: bucketName,
          key,
        });

        filesDownloaded += 1;
      } catch (err) {
        console.error({ err }, 'Error fetching file from bucket');
        throw new Error(err);
      }

      // Parse the file to get all stored data objects
      let dataObjects;
      try {
        const fileData = Buffer.from(fetchedFile.Body).toString('utf8');
        dataObjects = fileData.split('\n');
      } catch (err) {
        console.error({ err }, 'Error parsing data objects in file from bucket');
        throw new Error(err);
      }

      // Now store the dataObjects in the db
      if (dataObjects && dataObjects.length) {
        try {
          const parsedObjects = dataObjects.map(dataObject => JSON.parse(dataObject));
          await dbs.contents.insert(parsedObjects);
        } catch (err) {
          console.error({ err }, 'Error while saving the objects to the db');
          throw new Error(err);
        }
      }

      // Update the key record as processed
      try {
        await dbs.keys.update(
          { _id },
          { $set: { processed: new Date().toISOString() } },
          { upsert: true },
        );//, { $inc: { distance: 38 } }, { upsert: true }
      } catch (err) {
        console.error({ err }, 'Error updating key as processed');
      }

      dataObjectsProcessed += dataObjects.length;
    }, Promise.resolve());

    if (processAllDataObjects) {
      console.log('Processed some data objects', { filesDownloaded, dataObjectsProcessed });

      return processKeys({
        totalFilesDownloaded: filesDownloaded,
        totalDataObjectsProcessed: dataObjectsProcessed,
      });
    }
  }

  console.log('All files downloaded and processed, good job!', { filesDownloaded, dataObjectsProcessed });
  
  let totalDataObjectsInDb;
  try {
    totalDataObjectsInDb = await dbs.contents.count();
    console.log(`Found ${totalDataObjectsInDb} data objects in the db`);
  } catch (err) {
    console.error({ err }, 'Error counting data objects');
    throw new Error(err);
  }
};

async function doTheStuff() {
  await fetchAllBucketKeys();
  await processKeys();
}
doTheStuff();