import { ISelectableOption, SelectableOptionMenuItemType } from 'office-ui-fabric-react/lib/utilities/selectableOption/SelectableOption.Props';

import Barista from '../../services/barista/';
import { FiddlesStore, Util } from '../../models';

export const baristaScriptStoreUtils = {
    getFileFolderOptions(barista: Barista | undefined): Array<ISelectableOption> {
        if (!barista) {
            return [];
        }

        const fileFolders = FiddlesStore.getFileFolderMap(barista.fiddlesStore.fiddleRootFolder);
        const fileOptions: Array<any> = [];
        const paths = Object.keys(fileFolders).sort();
        for (const path of paths) {
            const fileFolder = fileFolders[path];
            if (fileFolder.type === 'folder') {
                fileOptions.push({
                    key: path,
                    text: path,
                    data: fileFolder,
                    itemType: SelectableOptionMenuItemType.Header
                });
            } else {
                fileOptions.push({
                    key: path,
                    text: path,
                    data: fileFolder
                });
            }
        }
        return fileOptions;
    },
    async performBaristaCall(barista: Barista | undefined, setState: Function, scriptPath: string, scriptTimeout: number) {
        setState({
            isBrewing: true
        });

        if (!barista) {
            setState({
                isBrewing: false,
                lastResultWasError: true,
                lastResult: 'Could not establish connection with SharePoint. Ensure that a tenant url has been specified.'
            });

            return;
        }

        try {
            const result = await barista.brew(
                {
                    fullPath: scriptPath,
                    allowDebuggerStatement: false,
                    timeout: scriptTimeout
                },
                (progress: any) => setState({ lastProgress: progress })
            );
            setState({
                lastResultWasError: false,
                lastResult: result.data
            });

            return result;
        } catch (ex) {
            setState({
                lastResultWasError: true,
                lastResult: ex.message
            });
        } finally {
            setState({
                isBrewing: false
            });
        }
    }
};