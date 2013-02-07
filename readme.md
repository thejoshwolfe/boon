boon
====

build tool for node.js projects.

The primary motivation for this project is to watch a dependency graph of file timestamps,
and react to updates automatically. The usecase is editing the code of a long-running application,
such as a server, and having the code automatically rebuilt, and the server restarted.


boon vs Jake
------------

[Jake](https://github.com/mde/jake) is synchronous by default. boon runs everything in parallel when possible.

`require('jake')` pollutes the global namespace. boon does not touch the global namespace.

A Jakefile must be JavaScript. boon has no magic file names, so the build script can be run with any interpreter.


boon vs `coffee -w`?
--------------------

`coffee -w` gives no clear indication that it is done with everything it sees to do.
boon supports callbacks when files are built, which allows an application to wait to start
until after everything has had a chance to build once.

Race conditions when saving files with vim causes `coffee -w` to start ignoring the file.
boon supports runtime file discovery and dependency graph modification, which will not only
reacknowledge files when they come back into existence, but discover new files in a directory
without having to restart boon.
