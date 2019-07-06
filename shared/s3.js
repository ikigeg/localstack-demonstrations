const AWS = require('aws-sdk');

/*
  Quick helper to create an S3 instance:
  - We define localstack with the endpoint property
  - We force the cli to use url style `http://localhost:4572/my-bucket` by setting s3ForcePathStyle
*/
class S3Factory {
  constructor(options = {}) {
    this.s3 = new AWS.S3({
      endpoint: 'http://localhost:4572', // localstack
      s3ForcePathStyle: true, // force url style `http://localhost:4572/my-bucket
      region: 'eu-west-1',
      ...options
    });
  }

  createBucket(Bucket) {
    if (!Bucket) {
      throw new Error('CreateBucket failed as no bucket name was specified');
    }

    return new Promise((resolve, reject) => {
      this.s3.createBucket({ Bucket }, async err => {
        if (err) {
          return reject(err);
        }
        return resolve();
      });
    });
  }

  listObjects({
    bucket,
    basePath,
    quantityPerPage,
    startAfter,
    nextPageToken,
  } = {}) {
    return new Promise((resolve, reject) => {
      if (!bucket) {
        throw new Error('Missing required parameters for listObjects');
      }
  
      this.s3.listObjectsV2(
        {
          Bucket: bucket,
          Prefix: basePath,
          ...(quantityPerPage && { MaxKeys: quantityPerPage }),
          ...(startAfter && { StartAfter: startAfter }),
          ...(nextPageToken && { ContinuationToken: nextPageToken }),
        },
        (err, data) => {
          if (err) {
            return reject(err);
          }
  
          return resolve(data);
        },
      );
    });
  }

  getObject({ bucket, key }) {
    return new Promise((resolve, reject) => {
      if (!bucket || !key) {
        throw new Error('Missing required parameters for getObject');
      }
  
      this.s3.getObject({ Bucket: bucket, Key: key }, (err, data) => {
        if (err) {
          return reject(err);
        }
        return resolve(data);
      });
    });
  }

  putObject(params) {
    return new Promise((resolve, reject) => {
      if (!params) {
        throw new Error('Missing required parameters for putObject');
      }
  
      this.s3.putObject(params, (err, data) => {
        if (err) {
          return reject(err);
        }
        return resolve(data);
      });
    });
  }
};

module.exports = S3Factory;
