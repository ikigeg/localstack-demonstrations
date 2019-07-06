const S3Factory = require('../../shared/s3');
const faker = require('faker');

// Get any arguments passed into the script
const [, scriptName, bucketName = faker.lorem.slug()] = process.argv || [];

const {
  ASSUMED_AWS_ACCESS_KEY_ID,
  ASSUMED_AWS_SECRET_ACCESS_KEY,
  ASSUMED_AWS_SESSION_TOKEN
} = process.env || {};

if (!ASSUMED_AWS_ACCESS_KEY_ID || !ASSUMED_AWS_SECRET_ACCESS_KEY || !ASSUMED_AWS_SESSION_TOKEN) {
  throw new Error('Missing assumed credential environment variables');
}

// setup our S3 instance with our assumed credentials
const s3 = new S3Factory({
  AccessKeyId: ASSUMED_AWS_ACCESS_KEY_ID,
  SecretAccessKey: ASSUMED_AWS_SECRET_ACCESS_KEY,
  SessionToken: ASSUMED_AWS_SESSION_TOKEN,
});

async function uploadGetParse() {
  console.log(`\n************ STARTING ${__filename} ************\n`);

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

uploadGetParse();
