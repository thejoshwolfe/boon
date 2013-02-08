
var fs = require("fs");

function verbose() {
  if (false)
    console.log.apply(null, arguments);
}

var targets = {};
exports.run = function(args) {
  if (args.length !== 1) throw new Error("expected 1 arg. got: " + JSON.stringify(args));
  run_target(args[0], function(err) {
    if (err) return console.error("Error: " + err.message);
    verbose("it is done");
  });
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
  }
};

function run_target(name, cb) {
  var target = targets[name];
  if (target == null) {
    verbose(name + " should be a file");
    return fs.stat(name, function(err) {
      verbose(name + " has been statted");
      if (err) return cb(new Error("target not defined: " + JSON.stringify(name)));
      cb();
    });
  }
  var pending = {};
  for (var child in target.dependency_set) {
    (function(child) {
      verbose(name + " is now waiting for " + child);
      pending[child] = true;
      run_target(child, function(err) {
        verbose(name + " is no longer waiting for " + child);
        if (err) return cb(err);
        delete pending[child];
        are_we_done();
      });
    })(child);
  }
  are_we_done();
  function are_we_done() {
    for (var we_are_not_done in pending) {
      verbose(name + " is still waiting for " + we_are_not_done);
      return;
    }
    verbose(name + " is ready");
    var context = {
      output: name,
      log: function() {
        var args = Array.prototype.slice.call(arguments);
        args.unshift(name + ":");
        console.log.apply(null, args);
      },
      done: cb,
    };
    target.recipe.apply(context);
  }
}

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
