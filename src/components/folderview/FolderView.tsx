import * as React from 'react';
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import { autobind } from 'office-ui-fabric-react/lib';
import { Folder } from './Folder';
import { File } from './File';

@DragDropContext(HTML5Backend)
export class FolderView extends React.Component<FolderViewProps, FolderViewState> {
    public render() {
        const { depth, folder } = this.props;
        const innerDepth = (depth || 0) + 1;
        
        return (
            <div style={{ display: 'flex' }}>
                <Folder folder={folder} depth={depth} />
            </div>
        )
    }
}

export interface FolderViewState {
}

export interface FolderViewProps {
    folder: any;
    depth?: number;
    onChange?: Function;
}