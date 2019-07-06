const AWS = require('aws-sdk');
const faker = require('faker');

// Get any arguments passed into the script
const [, , bucketName = faker.lorem.slug(), role = 'arn:aws:iam::123456789012:role/demo'] = process.argv || [];

/*
  Quick helper to create an STS instance:
  - We define localstack with the endpoint property
  - We force the cli to use url style `http://localhost:4572/my-bucket` by setting s3ForcePathStyle
*/
const STS = (options = {}) => new AWS.STS({
  endpoint: 'http://localhost:4592', // localstack
  s3ForcePathStyle: true,
  region: 'eu-west-1',
  ...options
});
/*
  Quick helper to create an S3 instance:
  - We define localstack with the endpoint property
  - We force the cli to use url style `http://localhost:4572/my-bucket` by setting s3ForcePathStyle
*/
const S3 = (options = {}) => new AWS.S3({
  endpoint: 'http://localhost:4572', // localstack
  s3ForcePathStyle: true,
  region: 'eu-west-1',
  ...options
});

function assumeRole(arn, sessionName = 'assumed-role-session', options = {}) {
  if (!arn) {
    throw new Error('Missing ARN of the role to assume');
  }

  const params = {
    RoleArn: arn,
    RoleSessionName: sessionName,
    ...options
  };

  return new Promise((resolve, reject) => {
    STS().assumeRole(params, (err, data) => {
      if (err) {
        return reject(err);
      }
      return resolve(data);
    });
  });
}

function pushToS3({ AccessKeyId, SecretAccessKey, SessionToken } = {}) {
  if (!AccessKeyId || !SecretAccessKey || !SessionToken){
    throw new Error('Missing required arguments');
  }

  const s3 = S3({
    AccessKeyId,
    SecretAccessKey,
    SessionToken,
  });

  return new Promise((resolve, reject) => {
    s3.createBucket({ Bucket: bucketName }, async (createError) => {
      if (createError) {
        return reject(createError);
      }
  
      const params = {
        Bucket: bucketName,
        Key: `FilesUploadedByAssumedRoleViaNode/${faker.lorem.slug()}-${new Date().getTime()}.txt`,
        Body: [faker.hacker.phrase(), faker.hacker.phrase(), faker.hacker.phrase()].join('\n'),
      };
  
      s3.putObject(params, (putError) => {
        if (putError) {
          return reject(putError);
        }
        
        console.log('Upload as assumed user successful', { key: params.Key, bucketName });
        return resolve({ s3, key: params.Key });
      });
    });
  });
}

async function doTheStuff() {
  // Assume the role
  let assumedRoleResponse;
  try {
    assumedRoleResponse = await assumeRole(role);
  } catch (err) {
    console.log(`Something went wrong assuming the role: ${err.message}`);
  }
  console.log('Assumed credentials', assumedRoleResponse.Credentials);

  // Put a file in a new S3 bucket, then return the file key and s3 instance (to save reinstantiating)
  let result;
  try {
    result = await pushToS3(assumedRoleResponse.Credentials);
  } catch (err) {
    console.error(err);
  }

  // Now we will get the object from S3
  result.s3.getObject({ Bucket: bucketName, Key: result.key }, (err, data) => {
    if (err) {
      return console.error(err);
    }
    console.log('\nDownloaded file object', data);
    const fileData = Buffer.from(data.Body).toString('utf8');
    console.log('\n**** Actual file content ****');
    console.log(fileData);
  });
}

doTheStuff();
