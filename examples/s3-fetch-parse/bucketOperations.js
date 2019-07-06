const AWS = require('aws-sdk');

function s3() {
  return new AWS.S3({
    endpoint: 'http://localhost:4572', // localstack
    /*
      `s3ForcePathStyle: false` = http://my-bucket.localhost:4572
      `s3ForcePathStyle: true` = http://localhost:4572/my-bucket
    */
    s3ForcePathStyle: true,
  });
}

function listObjects({
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

    s3().listObjectsV2(
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

function getObject({ bucket, key }) {
  return new Promise((resolve, reject) => {
    if (!bucket || !key) {
      throw new Error('Missing required parameters for getObject');
    }

    s3().getObject({ Bucket: bucket, Key: key }, (err, data) => {
      if (err) {
        return reject(err);
      }
      return resolve(data);
    });
  });
}

module.exports = {
  s3,
  listObjects,
  getObject
};
