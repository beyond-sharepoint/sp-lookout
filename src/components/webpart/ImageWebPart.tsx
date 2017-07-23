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
        const { imageUrl, resizeToFit, maintainAspectRatio, width, height } = props;

        const imgStyle: React.CSSProperties = {
            width: resizeToFit ? '100%' : width,
            height: resizeToFit ? maintainAspectRatio ? null : '100%' : height
        }

        if (props.imageClickUrl) {
            imgStyle.cursor = 'pointer';
        }

        return (
            <img src={imageUrl} style={imgStyle} onClick={this.onImageClicked}/>
        );
    }

    public renderWebPartSettings() {
        return (
            <div>
                <TextField label="Image Url" value={this.webPartProps.imageUrl} onChanged={this.onImageUrlChanged} />
                <TextField label="Image Click Url" value={this.webPartProps.imageClickUrl} onChanged={this.onImageClickUrlChanged} />
                <Toggle label="Resize To Fit" checked={this.webPartProps.resizeToFit} onChanged={this.onResizeToFitChanged} />
                <Toggle label="Maintain Aspect Ratio" checked={this.webPartProps.maintainAspectRatio} onChanged={this.onMaintainAspectRatioChanged} />
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
        this.webPartProps.imageClickUrl = newValue;
        super.onWebPartSettingsChanged();
    }

    @action.bound
    private onResizeToFitChanged(newValue) {
        this.webPartProps.resizeToFit = newValue;
        super.onWebPartSettingsChanged();
    }

    @action.bound
    private onMaintainAspectRatioChanged(newValue) {
        this.webPartProps.maintainAspectRatio = newValue;
        super.onWebPartSettingsChanged();
    }

    @action.bound
    private onImageClicked() {
        if (!this.webPartProps.imageClickUrl) {
            return;
        }

        window.open(this.webPartProps.imageClickUrl, '_blank');
    }
}

export interface ImageWebPartProps {
    imageUrl: string;
    imageClickUrl: string;
    resizeToFit: boolean;
    maintainAspectRatio: boolean;
    width?: string | number;
    height?: string | number;
}

export const defaultImageWebPartProps: ImageWebPartProps = {
    imageUrl: '',
    imageClickUrl: '',
    resizeToFit: true,
    maintainAspectRatio: true
};