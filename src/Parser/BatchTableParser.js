import utf8Decoder from '../utils/Utf8Decoder';

function BatchTable(json, binary) {
    if (binary !== undefined) {
        console.warn('Binary batch table content not supported yet.');
    }
    if (json.HIERARCHY) {
        this.hasHierarcy = true;

        this.hierarchy = {};
        this.inverseHierarchy = {};
        this.objects = [];
        this.classes = json.HIERARCHY.classes;
        let k = 0;
        const classCounter = {};
        for (let i = 0; i < json.HIERARCHY.instancesLength; i++) {
            for (let j = 0; j < json.HIERARCHY.parentCounts[i]; j++) {
                if (this.hierarchy[json.HIERARCHY.parentIds[k]] === undefined) {
                    this.hierarchy[json.HIERARCHY.parentIds[k]] = [];
                }
                this.hierarchy[json.HIERARCHY.parentIds[k]].push(i);
                if (this.inverseHierarchy[i] === undefined) {
                    this.inverseHierarchy[i] = [];
                }
                this.inverseHierarchy[i].push(json.HIERARCHY.parentIds[k]);
                k++;
            }
            const classId = json.HIERARCHY.classIds[i];
            if (classCounter[classId] === undefined) {
                classCounter[classId] = 0;
            }
            this.objects[i] = { classId, classBatchId: classCounter[classId] };
            classCounter[classId]++;
        }

        this.content = json;
        this.content.HIERARCHY = undefined;
    } else {
        this.content = json;
    }
    // TODO: parse binary part
}

BatchTable.prototype.constructor = BatchTable;

BatchTable.prototype.getAttributes = function getAttributes() {
    const attributes = [];
    for (const i of Object.keys(this.content)) {
        attributes.push(i);
    }
    return attributes;
};

BatchTable.prototype.getAttribute = function getAttribute(attribute, batchId) {
    return this.content[attribute][batchId];
};

BatchTable.prototype.getClassAttributes = function getClassAttributes(className) {
    const attributes = [];
    for (const i of Object.keys(this.classes.find(o => o.name === className).instances)) {
        attributes.push(i);
    }
    return attributes;
};

BatchTable.prototype.getClassAttribute = function getClassAttribute(attribute, batchId) {
    const instance = this.objects[batchId];
    return this.classes[instance.classId].instances[attribute][instance.classBatchId];
};

BatchTable.prototype.getClasses = function getClasses() {
    const classes = [];
    for (const i of Object.keys(this.classes)) {
        classes.push(i);
    }
    return classes;
};

BatchTable.prototype.getClass = function getClass(batchId) {
    return this.classes[this.objects[batchId].classId].name;
};

BatchTable.prototype.getParents = function getParent(batchId) {
    return this.inverseHierarchy[batchId];
};

BatchTable.prototype.getChildren = function getChildren(batchId) {
    return this.hierarchy[batchId];
};

export default {
    /** @module BatchTableParser */
    /** Parse batch table buffer and convert to JSON
     * @function parse
     * @param {ArrayBuffer} buffer - the batch table buffer.
     * @param {object} options - options controlling the parsing.
     * @param {integer=} [options.binaryLength=0] - the length of the binary part of the batch table.
     * @return {Promise} - a promise that resolves with a JSON object.
     *
     */
    parse(buffer, options) {
        let binary;
        let jsonBuffer = buffer;
        if (options && options.binaryLength > 0) {
            binary = buffer.slice(buffer.byteLength - options.binaryLength);
            jsonBuffer = buffer.slice(0, buffer.byteLength - options.binaryLength);
        }
        const content = utf8Decoder.decode(new Uint8Array(jsonBuffer));
        const json = JSON.parse(content);
        return Promise.resolve(new BatchTable(json, binary));
    },
};
