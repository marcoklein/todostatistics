

/**
 * Key-value store.
 */
var PersistentCache = function (name) {
    
    this.store = require("json-fs-store")();
    
};

PersistentCache.prototype.put = function (id, location, value) {
    var self = this;
    self.get(id, null, function (storedValue, error) {
        //if (error) throw error;
        if (!storedValue) {
            // create a new object if there is none
            storedValue = {};
            storedValue.id = "" + id;
        } else {
            self.store.remove("" + id, function (error) {
                if (error)
                    throw error;
            });
        }
        // store value
        storedValue[location] = value;

        console.log("PersistentCache: Storing value " + storedValue);
        self.store.add(storedValue, function (error) {
            if (error)
                throw error;
        });
    });
};

PersistentCache.prototype.get = function (id, location, callback) {
    var self = this;
    if (!callback) console.log("PersistentCache: Callback not defined.");
    self.store.load("" + id, function (error, object) {
        if (error) {
            //throw error;
        }

        if (!object) {
            callback(null, error);
            return;
        }
        if (location) {
            // adjust if location is set
            object = object[location];
        }

        if (callback) {
            callback(object, error);
        }
    });
    
};



module.exports = PersistentCache;