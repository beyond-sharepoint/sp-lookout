import { ChartWebPart } from './ChartWebPart';
import { ClockWebPart } from './ClockWebPart';
import { NoteWebPart } from './NoteWebPart';
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
    'note': {
        name: 'Note',
        type: NoteWebPart
    },
    'text': {
        name: 'Text',
        type: TextWebPart
    }
};