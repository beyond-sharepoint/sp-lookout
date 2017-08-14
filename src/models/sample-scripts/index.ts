import { ScriptFolder } from '../ScriptFolder';
import { ScriptFile } from '../ScriptFile';

const defaultScriptFolder = () => {
    return new ScriptFolder();
};

const defaultScriptSettings = () => {
    return new ScriptFile();
};

export const defaultScriptRootFolder: ScriptFolder = {
    ...defaultScriptFolder(),
    name: 'SPFiddle',
    description: '',
    iconClassName: 'fa fa-code',
    folders: [
        {
            ...defaultScriptFolder(),
            name: 'built-in',
            description: 'Scripts that provide data to built-in webparts. Changes made will be reverted on next app reload.',
            collapsed: true,
            locked: true,
            files: [
                {
                    ...defaultScriptSettings(),
                    name: 'infopathLiberator.ts',
                    code: require('./built-ins/infopathLiberator.tsc')
                }
            ]
        },
        {
            ...defaultScriptFolder(),
            name: 'examples',
            description: 'Contains examples of common usages.',
            locked: true,
            starred: true,
            files: [
                {
                    ...defaultScriptSettings(),
                    name: '01-helloWorld.ts',
                    code: require('./examples/01-helloWorld.tsc')
                },
                {
                    ...defaultScriptSettings(),
                    name: '02-importLodash.ts',
                    code: require('./examples/02-importLodash.tsc')
                },
                {
                    ...defaultScriptSettings(),
                    name: '03-getRootWeb-fetch.ts',
                    code: require('./examples/03-getRootWeb-fetch.tsc'),
                },
                {
                    ...defaultScriptSettings(),
                    name: '04-getRootWeb-sp-pnp.ts',
                    code: require('./examples/04-getRootWeb-sp-pnp.tsc')
                },
                {
                    ...defaultScriptSettings(),
                    name: '05-spLookout-reportProgress.ts',
                    code: require('./examples/05-spLookout-reportProgress.tsc'),
                    brewTimeout: 0
                },
                {
                    ...defaultScriptSettings(),
                    name: '06-spLookout-localStorage.ts',
                    code: require('./examples/06-spLookout-localStorage.tsc')
                },
                {
                    ...defaultScriptSettings(),
                    name: '07-spLookout-parameters.ts',
                    code: require('./examples/07-spLookout-parameters.tsc'),
                    defaultScriptProps: {
                        foo: 'bar'
                    }
                },
                {
                    ...defaultScriptSettings(),
                    name: '08-zipGeneration.ts',
                    code: require('./examples/08-zipGeneration.tsc')
                },
                {
                    ...defaultScriptSettings(),
                    name: '09-spreadsheetGeneration.ts',
                    code: require('./examples/09-spreadsheetGeneration.tsc')
                },
                {
                    ...defaultScriptSettings(),
                    name: '10-debugging.ts',
                    code: require('./examples/10-debugging.tsc')
                },
                {
                    ...defaultScriptSettings(),
                    name: '11-relativeImports.ts',
                    code: require('./examples/11-relativeImports.tsc')
                },
                {
                    ...defaultScriptSettings(),
                    name: '12-customComponents.tsx',
                    code: require('./examples/12-customComponents.tsxc')
                }
            ]
        }
    ],
};