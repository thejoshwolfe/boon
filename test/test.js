(function(){
  var boon, fs;
  boon = require('..');
  fs = require('fs');
  boon.file('test/output.txt', 'test/output.txt', function(){});
  boon.file('test/output.txt', 'test/input.txt', function(){
    var out_stream;
    this.log("recipeing");
    out_stream = fs.createWriteStream(this.output);
    out_stream.on('close', bind$(this, 'done'));
    fs.createReadStream('test/input.txt').pipe(out_stream);
  });
  boon.run(process.argv.slice(2));
  function bind$(obj, key){
    return function(){ return obj[key].apply(obj, arguments) };
  }
}).call(this);
