const AWS = require('aws-sdk');

/*
  Quick helper to create an S3 instance:
  - We define localstack with the endpoint property
  - We force the cli to use url style `http://localhost:4572/my-bucket` by setting s3ForcePathStyle
*/
class STSFactory {
  constructor(options = {}) {
    this.sts = new AWS.STS({
      endpoint: 'http://localhost:4592', // localstack
      s3ForcePathStyle: true, // force url style `http://localhost:4592/my-bucket
      region: 'eu-west-1',
      ...options
    });
  }

  assumeRole(arn, sessionName = 'assumed-role-session', options = {}) {
    if (!arn) {
      throw new Error('Missing ARN of the role to assume');
    }
  
    const params = {
      RoleArn: arn,
      RoleSessionName: sessionName,
      ...options
    };
  
    return new Promise((resolve, reject) => {
      this.sts.assumeRole(params, (err, data) => {
        if (err) {
          return reject(err);
        }
        return resolve(data);
      });
    });
  }
};

module.exports = STSFactory;