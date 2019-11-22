var through = require('through2');
var log = console.log;
var debug = true;

module.exports = function (variablesPool, variablesNames) {
    var transform = function (file, encoding, callback) {

        Object.keys(variablesNames).forEach(function (varName) {
            
            var value = variablesNames[varName];
            
            // no deep looping
            if (!Array.isArray(value) && typeof value !== "object") {

                // find variable names in values
                if (value.startsWith("$")) {

                    // get final value from the pool provided
                    value = variablesPool[value.substr(1)];
                }

                debug ? log("----- variable '" + varName + "' => " + value) : null;

                // generate pattern from variable name
                var pattern = "@@" + varName + "##";
                var regex = new RegExp(pattern, "g");

                // search and replace it in file
                file.contents = new Buffer(String(file.contents).replace(regex, value));

            }

        });

        //-- ending ---//
        this.push(file);

        callback();
    };

    return through.obj(transform);
}
