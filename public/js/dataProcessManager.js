
var DataProcessManager = function () {
    this.dataProcessors = [];
};

/**
 * Adds the given data processor.
 * 
 * The data processor has to implement the method process(data): object.
 * And the attribute name has to be defined.
 * 
 * @param {type} dataProcessor
 * @returns {undefined}
 */
DataProcessManager.prototype.add = function (dataProcessor) {
    if (!dataProcessor.name) {
        throw "No name for data processor defined.";
    }
    this.dataProcessors[dataProcessor.name] = dataProcessor;
};

/**
 * Adds given array of data processors.
 * 
 * @param {type} dataProcessors
 * @returns {undefined}
 */
DataProcessManager.prototype.addAll = function (dataProcessors) {
    for (var i = 0; i < dataProcessors.length; i++) {
        this.add(dataProcessors[i]);
    }
};

DataProcessManager.prototype.process = function (name, data) {
    return this.dataProcessors[name].process(data);
};