function promisifyNeDB(db) {

  const wrapCursor = cursor => ({
    sort: sort => cursor.sort(sort) && wrapCursor(cursor),
    skip: skip => cursor.skip(skip) && wrapCursor(cursor),
    limit: limit => cursor.limit(limit) && wrapCursor(cursor),
    then: (onFulfilled, onRejected) => {
      let promise = new Promise((resolve, reject) => {
        cursor.exec((err, ...results) => err ? reject(err) : resolve(results))
      })
      promise = promise.then(results => onFulfilled(results))
      if (onRejected) promise = promise.catch(onRejected)

      return promise;
    }
  })

  const wrapDataStore = dataStore => ({
    insert: doc => new Promise((resolve, reject) => {
      db.insert(doc, (err, ...results) => err ? reject(err) : resolve(results))
    }),
    update: (query, update, options = {}) => new Promise((resolve, reject) => {
      db.update(query, update, options, (err, ...results) => err ? reject(err) : resolve(results))
    }),
    remove: (query, options) => new Promise((resolve, reject) => {
      db.remove(query, options = {}, (err, ...results) => err ? reject(err) : resolve(results))
    }),
    find: (query, projection = {}) => wrapCursor(db.find(query, projection)),
    findOne: (query, projection = {}) => wrapCursor(db.findOne(query, projection)),
    count: (query, projection = {}) => wrapCursor(db.count(query, projection))
  })

  return wrapDataStore(db);
}

module.exports = promisifyNeDB;