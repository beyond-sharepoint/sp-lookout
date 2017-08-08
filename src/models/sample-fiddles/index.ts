import { FiddleFolder } from '../FiddleFolder';
import { FiddleSettings } from '../FiddleSettings';

const defaultFiddleFolder = () => {
    return new FiddleFolder();
};

const defaultFiddleSettings = () => {
    return new FiddleSettings();
};

export const defaultFiddleRootFolder: FiddleFolder = {
    ...defaultFiddleFolder(),
    name: 'SPFiddle',
    description: '',
    iconClassName: 'fa fa-code',
    folders: [
        {
            ...defaultFiddleFolder(),
            name: 'built-in',
            description: 'Scripts that provide data to built-in webparts. Changes made will be reverted on next app reload.',
            collapsed: true,
            locked: true,
            files: [
                {
                    ...defaultFiddleSettings(),
                    name: 'infopathLiberator.ts',
                    code: require('./built-ins/infopathLiberator.tsc')
                }
            ]
        },
        {
            ...defaultFiddleFolder(),
            name: 'examples',
            description: 'Contains examples of common usages.',
            locked: true,
            starred: true,
            files: [
                {
                    ...defaultFiddleSettings(),
                    name: '01-helloWorld.ts',
                    code: require('./examples/01-helloWorld.tsc')
                },
                {
                    ...defaultFiddleSettings(),
                    name: '02-importLodash.ts',
                    code: require('./examples/02-importLodash.tsc')
                },
                {
                    ...defaultFiddleSettings(),
                    name: '03-getRootWeb-fetch.ts',
                    code: require('./examples/03-getRootWeb-fetch.tsc'),
                },
                {
                    ...defaultFiddleSettings(),
                    name: '04-getRootWeb-sp-pnp.ts',
                    code: require('./examples/04-getRootWeb-sp-pnp.tsc')
                },
                {
                    ...defaultFiddleSettings(),
                    name: '05-spLookout-reportProgress.ts',
                    code: require('./examples/05-spLookout-reportProgress.tsc'),
                    brewTimeout: 0
                },
                {
                    ...defaultFiddleSettings(),
                    name: '06-spLookout-localStorage.ts',
                    code: require('./examples/06-spLookout-localStorage.tsc')
                },
                {
                    ...defaultFiddleSettings(),
                    name: '07-spLookout-parameters.ts',
                    code: require('./examples/07-spLookout-parameters.tsc')
                },
                {
                    ...defaultFiddleSettings(),
                    name: '08-zipGeneration.ts',
                    code: require('./examples/08-zipGeneration.tsc')
                },
                {
                    ...defaultFiddleSettings(),
                    name: '09-spreadsheetGeneration.ts',
                    code: require('./examples/09-spreadsheetGeneration.tsc')
                },
                {
                    ...defaultFiddleSettings(),
                    name: '10-debugging.ts',
                    code: require('./examples/10-debugging.tsc')
                },
                {
                    ...defaultFiddleSettings(),
                    name: '11-relativeImports.ts',
                    code: require('./examples/11-relativeImports.tsc')
                },
                {
                    ...defaultFiddleSettings(),
                    name: '12-customComponents.tsx',
                    code: require('./examples/12-customComponents.tsxc')
                }
            ]
        }
    ],
};