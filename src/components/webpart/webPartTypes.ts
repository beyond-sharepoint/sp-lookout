import { ChartWebPart } from './ChartWebPart';
import { ClockWebPart } from './ClockWebPart';
import { ImageWebPart } from './ImageWebPart';
import { NoteWebPart } from './NoteWebPart';
import { ScriptEditorWebPart } from './ScriptEditorWebPart';
import { TextWebPart } from './TextWebPart';

export const webPartTypes: { [key: string]: { name: string, type: any } } = {
    'chart': {
        name: 'Chart',
        type: ChartWebPart
    },
    'clock': {
        name: 'Clock',
        type: ClockWebPart
    },
    'image': {
        name: 'Image',
        type: ImageWebPart
    },
    'note': {
        name: 'Note',
        type: NoteWebPart
    },
    'scriptEditor': {
        name: 'Script Editor',
        type: ScriptEditorWebPart
    },
    'text': {
        name: 'Text',
        type: TextWebPart
    }
};