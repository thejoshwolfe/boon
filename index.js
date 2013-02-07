
var fs = require("fs");

var targets = {};
exports.run = function(args) {
  if (args.length !== 1) throw new Error("expected 1 arg. got: " + JSON.stringify(args));
  var target = targets[args[0]];
  if (target == null) throw new Error("target not defined: " + JSON.stringify(args[0]));
  new target.recipe;
};
exports.file = function(outputs, dependencies, recipe) {
  if (recipe == null && typeof dependencies === 'function') {
    recipe = dependencies;
    dependencies = [];
  }
  if (typeof outputs === 'string') {
    outputs = [outputs];
  }
  for (var i = 0; i < outputs.length; i++) {
    var output = outputs[i];
    var target = targets[output] = targets[output] || {
      output: output,
      dependency_set: {},
    };
    for (var j = 0; j < dependencies.length; j++)
      target.dependency_set[dependencies[j]] = true;
    if (recipe != null && target.recipe != null)
      throw new Error("duplicate recipes for " + JSON.stringify(output));
    target.recipe = recipe;
    recipe.prototype = {
      output: output,
      log: function() {
        var args = Array.prototype.slice.call(arguments);
        args.unshift(output + ":");
        console.log.apply(null, args);
      },
      done: function(err) {
        console.log("it is done");
      },
    };
  }
};
