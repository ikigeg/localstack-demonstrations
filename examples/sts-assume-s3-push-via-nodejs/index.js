const STSFactory = require('../../shared/sts');
const S3Factory = require('../../shared/s3');
const faker = require('faker');

// Get any arguments passed into the script
const [, scriptName, bucketName = faker.lorem.slug(), role = 'arn:aws:iam::123456789012:role/demo'] = process.argv || [];

// Setup our STS instance for assuming the role
const sts = new STSFactory()

async function assumeRoleUploadGetParse() {
  console.log(`\n************ STARTING ${__filename} ************\n`);

  // Assume the role
  let assumedRoleResponse;
  try {
    assumedRoleResponse = await sts.assumeRole(role);
  } catch (err) {
    console.log(`Something went wrong assuming the role: ${err.message}`);
  }
  console.log('Assumed credentials', assumedRoleResponse.Credentials);
  const {
    AccessKeyId,
    SecretAccessKey,
    SessionToken,
  } = assumedRoleResponse.Credentials;

  // setup our S3 instance with our assumed credentials
  const s3 = new S3Factory({
    AccessKeyId,
    SecretAccessKey,
    SessionToken,
  });

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
    Key: `FilesUploadedByAssumedRoleViaNode/${faker.lorem.slug()}-${new Date().getTime()}.txt`,
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

assumeRoleUploadGetParse();
