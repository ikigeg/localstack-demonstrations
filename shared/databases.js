const Nedb = require('nedb');
const promisifyNeDB = require('./promisify-nedb');

module.exports = (bucketName, databaseNames = []) => {
  if (!bucketName) {
    throw new Error('No bucketName provided');
  }
  
  if (!Array.isArray(databaseNames) || !databaseNames.length) {
    return promisifyNeDB(new Nedb({ filename: `.db/${bucketName}`, autoload: true }));
  }

  let databases = {};
  for (let i = 0; i < databaseNames.length; i += 1) {
    databases[databaseNames[i]] = promisifyNeDB(new Nedb({ filename: `.db/${bucketName}-${databaseNames[i]}`, autoload: true }));
  }
  return databases;
};
