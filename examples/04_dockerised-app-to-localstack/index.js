const S3Factory = require('../../shared/s3');
const faker = require('faker');

// Get any arguments passed into the script
const [, scriptName, bucketName = faker.lorem.slug()] = process.argv || [];

const {
  DOCKER_INSTANCE = false
} = process.env || {};

if (!DOCKER_INSTANCE) {
  throw new Error('This script is designed to run in docker');
}

// setup our S3 instance pointed at the localstack container
// different port to avoid conflicting other running localstacks
const s3 = new S3Factory({
  endpoint: 'http://localstack-app-demo:4572',
});

async function uploadGetParse() {
  // Create a bucket
  try {
    await s3.createBucket(bucketName);
  } catch (err) {
    console.error('Something went wrong creating the bucket');
    throw new Error(err);
  }

  // Put a file in a new S3 bucket, then return the file key and s3 instance (to save reinstantiating)
  const params = {
    Bucket: bucketName,
    Key: `FilesUploadedByAssumedRoleViaBash/${faker.lorem.slug()}-${new Date().getTime()}.txt`,
    Body: [faker.hacker.phrase(), faker.hacker.phrase(), faker.hacker.phrase()].join('\n'),
  };
  try {
    await s3.putObject(params);
    console.log('Upload as assumed user successful', { key: params.Key, bucketName });
  } catch (err) {
    console.error(err);
    throw new Error(err);
  }

  // Now we will get the object from S3
  try {
    const data = await s3.getObject({ bucket: bucketName, key: params.Key });
    console.log('\nDownloaded file object', data);
    const fileData = Buffer.from(data.Body).toString('utf8');
    console.log('\n**** Actual file content ****');
    console.log(fileData);
  } catch (err) {
    console.error(err);
    throw new Error(err);
  }

  console.log(`\n************ FINISHED ${__filename} ************\n`);
}

// Give localstack some time to spin up
const timeout = 6000;
console.log(`\n************ STARTING ${__filename} in ${timeout}ms ************\n`);
setTimeout(() => {
  uploadGetParse();
}, timeout);

