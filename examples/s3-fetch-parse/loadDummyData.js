const AWS = require('aws-sdk');
const faker = require('faker');

// Get any arguments passed into the script
const [ ,, bucketName = faker.lorem.slug(), quantity = 1000 ] = process.argv || [];

// Initiate our S3 client configuration
const s3 = new AWS.S3({
  endpoint: 'http://localhost:4572', // localstack
  /*
    `s3ForcePathStyle: false` = http://my-bucket.localhost:4572
    `s3ForcePathStyle: true` = http://localhost:4572/my-bucket
  */
  s3ForcePathStyle: true,
});

function doNicerExit(error) {
  console.log(error);
  process.exit(1);
}

// Start with creating the bucket
console.log(`CREATING BUCKET ${bucketName}`);
s3.createBucket({ Bucket: bucketName }, async (err) => {
  if (err) {
    return doNicerExit(`Something went wrong creating the bucket: ${err.message}`);
  }

  console.log(`CREATED BUCKET ${bucketName}`);
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
      setTimeout(() => {
        s3.putObject(params, err => {
          if (err) {
            console.log(err);
            reject();
          } else {
            if (i % 50 === 0 && i > 0) {
              console.log(
                `${i} FILES CREATED, ${quantity - i} TO GO - ${new Date()}`,
              );
            }
            resolve();
          }
        });
      }, 10);
    });
  }

  console.log(`BUCKET ${bucketName} READY WITH ${quantity} FILES`);
});


