
var fs = require("fs");

function verbose() {
  if (false)
    console.log.apply(null, arguments);
}

var targets = {};
exports.run = function(args, cb) {
  if (args.length !== 1) throw new Error("expected 1 arg. got: " + JSON.stringify(args));
  if (cb == null) {
    cb = function(err) {
      if (err) return console.error("Error: " + err.message);
      verbose("it is done");
    };
  }

  var active_names = {};
  var still_waiting_for = {};
  activate_target(args[0]);
  function activate_target(name) {
    if (active_names[name] != null) return;
    active_names[name] = true;
    var target = targets[name];
    if (target != null) {
      for (var child in target.dependency_set)
        activate_target(child);
    } else {
      target = targets[name] = new Target(name);
      target.done = true;
      still_waiting_for[name] = true;
      verbose(name, "should be a file");
      fs.stat(name, function(err) {
        verbose(name, "has been statted");
        if (err)
          return cb(new Error("target not defined: " + JSON.stringify(name)));
        delete still_waiting_for[name];
        are_we_ready();
      });
    }
  }
  are_we_ready();
  function are_we_ready() {
    for (var we_are_not_ready in still_waiting_for)
      return verbose("still waiting for stat from", we_are_not_ready);
    verbose("we are ready");
    start_ready_targets();
  }
  function start_ready_targets() {
    var all_done = true;
    for (var name in active_names) {
      start_if_ready(name);
      if (!targets[name].done)
        all_done = false;
    }
    if (all_done)
      cb();
  }
  function start_if_ready(name) {
    var target = targets[name];
    if (target.done || target.running) return;
    for (var child in target.dependency_set)
      if (!targets[child].done)
        return verbose(name, "is still waiting for", child);
    verbose(name, "is ready");
    target.running = true;
    target.recipe.apply({
      output: name,
      log: function() {
        var args = Array.prototype.slice.call(arguments);
        args.unshift(name + ":");
        console.log.apply(null, args);
      },
      done: function(err) {
        if (err) return cb(err);
        target.running = false;
        target.done = true;
        start_ready_targets();
      },
    });
  }
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
    var target = targets[output] = targets[output] || new Target(output);
    for (var j = 0; j < dependencies.length; j++)
      target.dependency_set[dependencies[j]] = true;
    if (recipe != null && target.recipe != null)
      throw new Error("duplicate recipes for " + JSON.stringify(output));
    check_for_circles(output, [], {});
    target.recipe = recipe;
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

function Target(output) {
  this.output = output;
  this.dependency_set = {};
}
