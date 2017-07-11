import { FiddleFolder, defaultFiddleRootFolder } from './FiddleFolder';
import { FiddleSettings } from './FiddleSettings';
import { VisualSettings, defaultVisualSettings } from './VisualSettings';

export interface WorkspaceSettings {
    components: any;
    fiddleRootFolder: FiddleFolder;
    visualSettings: VisualSettings;
}

export const defaultWorkspaceSettings: WorkspaceSettings = {
    components: {},
    fiddleRootFolder: defaultFiddleRootFolder,
    visualSettings: defaultVisualSettings
};