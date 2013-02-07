
var fs = require("fs");

var targets = {};
exports.run = function(args) {
  if (args.length !== 1) throw new Error("expected 1 arg. got: " + JSON.stringify(args));
  var root_target = targets[args[0]];
  if (root_target == null) throw new Error("target not defined: " + JSON.stringify(args[0]));
  new root_target.recipe;
};
exports.file = function(outputs, dependencies, recipe) {
  if (recipe == null && typeof dependencies === 'function') {
    recipe = dependencies;
    dependencies = [];
  }
  if (typeof outputs === 'string') outputs = [outputs];
  if (typeof dependencies === 'string') dependencies = [dependencies];
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
    check_for_circles(output, [], {});
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

function check_for_circles(name, stack, already_checked) {
  if (already_checked[name] != null) return;
  if (name === stack[0])
    throw new Error("circular dependency: " + JSON.stringify(stack));
  var target = targets[name];
  if (target != null) {
    stack.push(name);
    for (var child in target.dependency_set)
      check_for_circles(child, stack, already_checked);
    stack.pop();
  }
  already_checked[name] = true;
}
