import * as React from 'react';
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import { observer } from 'mobx-react';
import { autobind } from 'office-ui-fabric-react/lib';
import { Folder } from './Folder';
import { File } from './File';

import './FolderView.css';

@DragDropContext(HTML5Backend)
@observer
export class FolderView extends React.Component<FolderViewProps, FolderViewState> {
    public render() {
        const { folder, onCollapseChange, onMovedToFolder, onFileClicked } = this.props;

        return (
            <div className="folder-view ms-fontColor-themePrimary" style={{ display: 'flex' }}>
                <Folder 
                    folder={folder}
                    parentFolder={null}
                    depth={0}
                    onCollapseChange={onCollapseChange}
                    onMovedToFolder={onMovedToFolder}
                    onFileClicked={onFileClicked}
                />
            </div>
        );
    }
}

export interface FolderViewState {
}

export interface FolderViewProps {
    folder: any;
    onCollapseChange?: (folder: any, parentFolder: any) => void;
    onMovedToFolder?: (sourceItem: any, targetFolder: any) => void;
    onFileClicked?: (file: any) => void;
}