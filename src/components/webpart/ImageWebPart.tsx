import * as React from 'react';
import { action, observable, isObservable, extendObservable, toJS } from 'mobx';
import { observer } from 'mobx-react';
import { autobind } from 'office-ui-fabric-react/lib';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { Toggle } from 'office-ui-fabric-react/lib/Toggle';

import { BaseWebPart } from './BaseWebPart';
import { Util } from '../../models';

@observer
export class ImageWebPart extends BaseWebPart<ImageWebPartProps, any> {

    getDefaultWebPartProps() {
        return defaultImageWebPartProps;
    }

    public getWebPartContainerStyle(): React.CSSProperties | undefined {
        return {
            alignItems: 'center'
        };
    }

    renderWebPartContent(props: ImageWebPartProps) {
        const { imageUrl, fitWidth, fitHeight, width, height } = props;

        const imgStyle: React.CSSProperties = {
            width: width,
            height: height,
            maxWidth: fitWidth ? '100%' : null,
            maxHeight: fitHeight ? '100%' : null
        }

        if (props.linkUrl) {
            imgStyle.cursor = 'pointer';
        }

        return (
            <img src={imageUrl} style={imgStyle} onClick={this.onImageClicked} />
        );
    }

    public renderWebPartSettings() {
        return (
            <div>
                <TextField label="Image Url" value={this.webPartProps.imageUrl} onChanged={this.onImageUrlChanged} />
                <TextField label="Link Url" value={this.webPartProps.linkUrl} onChanged={this.onImageClickUrlChanged} />
                <Toggle label="Resize To Fit Width" checked={this.webPartProps.fitWidth} onChanged={this.onResizeToFitWidthChanged} />
                <Toggle label="Resize to Fit Height" checked={this.webPartProps.fitHeight} onChanged={this.onResizeToFitHeightChanged} />
            </div>
        );
    }

    @action.bound
    private onImageUrlChanged(newValue: any) {
        this.webPartProps.imageUrl = newValue;
        super.onWebPartSettingsChanged();
    }

    @action.bound
    private onImageClickUrlChanged(newValue: any) {
        this.webPartProps.linkUrl = newValue;
        super.onWebPartSettingsChanged();
    }

    @action.bound
    private onResizeToFitWidthChanged(newValue) {
        this.webPartProps.fitWidth = newValue;
        super.onWebPartSettingsChanged();
    }

    @action.bound
    private onResizeToFitHeightChanged(newValue) {
        this.webPartProps.fitHeight = newValue;
        super.onWebPartSettingsChanged();
    }

    @action.bound
    private onImageClicked() {
        if (!this.webPartProps.linkUrl) {
            return;
        }

        window.open(this.webPartProps.linkUrl, '_blank');
    }
}

export interface ImageWebPartProps {
    imageUrl: string;
    linkUrl: string;
    fitWidth: boolean;
    fitHeight: boolean;
    width: string;
    height: string;
}

export const defaultImageWebPartProps: ImageWebPartProps = {
    imageUrl: '',
    linkUrl: '',
    fitWidth: true,
    fitHeight: true,
    width: '',
    height: '',
};