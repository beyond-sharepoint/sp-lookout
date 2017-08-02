import { ButtonWebPart } from './ButtonWebPart';
import { DownloadButtonWebPart } from './DownloadButtonWebPart';
import { ChartWebPart } from './ChartWebPart';
import { ClockWebPart } from './ClockWebPart';
import { ImageWebPart } from './ImageWebPart';
import { NoteWebPart } from './NoteWebPart';
import { ScriptEditorWebPart } from './ScriptEditorWebPart';
import { TextWebPart } from './TextWebPart';

import { IDropdownOption, DropdownMenuItemType } from 'office-ui-fabric-react/lib/Dropdown';

export const webPartTypeOptions: Array<IDropdownOption> = [
    { key: 'ActionsHeader', text: 'Actions', itemType: DropdownMenuItemType.Header },
    { key: 'button', text: 'Button', data: ButtonWebPart },
    { key: 'downloadButton', text: 'Download Button', data: DownloadButtonWebPart },
    { key: 'BusinessDataHeader', text: 'Business Data', itemType: DropdownMenuItemType.Header },
    { key: 'chart', text: 'Chart', data: ChartWebPart },
    { key: 'MediaAndContentHeader', text: 'Media and Content', itemType: DropdownMenuItemType.Header },
    { key: 'clock', text: 'Clock', data: ClockWebPart },
    { key: 'image', text: 'Image', data: ImageWebPart },
    { key: 'note', text: 'Note', data: NoteWebPart },
    { key: 'scriptEditor', text: 'Script Editor', data: ScriptEditorWebPart },
    { key: 'text', text: 'Text', data: TextWebPart }
];