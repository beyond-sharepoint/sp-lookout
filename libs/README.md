This folder includes modules and definition files that are dynamically loaded at runtime.

Modules (.ts)
---
For modules, these may be libraries that cannot be found on a public CDN, or for perf reasons might want to be hosted along with the app.


Definitions (.d.ts)
---
For definition files this may include local definitions or definitions that need to be hacked up.

To hack definitions up, what has to happen is that the .d.ts file must contain a module that matches the moduleid from the import statement.

For instance, sp-pnp-js normally exports itself as 'pnp', as this doesn't match the module named 'sp-pnp-js', monaco can't find it. Thus the file is copied and edited to match what we want.

Of course, then comes the issue of loading, and without a raw loader we have to piggy back on what's in create-react-app's webpack config, so we rename the file to .html so that it loads as a file.