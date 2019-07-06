const faker = require('faker');
const S3Factory = require('../../shared/s3');

// Get any arguments passed into the script
const [ ,, bucketName = faker.lorem.slug(), quantity = 1100 ] = process.argv || [];

// Setup our S3 connection
const s3 = new S3Factory();

async function loadDummyData() {
  console.log(`\n************ STARTING ${__filename} ************\n`);

  try {
    console.log(`CREATING BUCKET ${bucketName}`);
    await s3.createBucket(bucketName);
    console.log(`CREATED BUCKET ${bucketName}`);
  } catch (err) {
    throw new Error(`Something went wrong creating the bucket: ${err.message}`);
  }

  let month = 0;
  let day = 0;

  // Upload some random files in a fake YYYY/MM/DD/filename structure
  console.log(`CREATING ${quantity} FILES IN ${bucketName}...`);
  for (let i = 0; i < quantity; i += 1) {
    if (i % 50 === 0) {
      month += 1;
    }
    if (i % 20 === 0) {
      day += 1;
    }

    const BodyLines = [
      { id: faker.random.uuid(), something: faker.random.words() },
      { id: faker.random.uuid(), everything: faker.random.words() },
    ].map(line => JSON.stringify(line)).join('\n');

    const params = {
      Bucket: bucketName,
      Key: `DummyThings/2019/${month}/${day}/hello_world-${i}.txt`,
      Body: BodyLines,
    };

    await new Promise((resolve, reject) => {
      setTimeout(async () => {
        try {
          await s3.putObject(params);

          if (i % 50 === 0 && i > 0) {
            console.log(
              `${i} FILES CREATED, ${quantity - i} TO GO - ${new Date()}`,
            );
          }
          resolve();
        } catch (err) {
          console.log(err);
          reject();
        }
      }, 10);
    });
  }

  console.log(`BUCKET ${bucketName} READY WITH ${quantity} FILES`);
  
  console.log(`\n************ FINISHED ${__filename} ************\n`);
}

loadDummyData();