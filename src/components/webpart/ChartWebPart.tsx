import * as React from 'react';
import { action, observable, isObservable, extendObservable, toJS } from 'mobx';
import { observer } from 'mobx-react';
import { autobind } from 'office-ui-fabric-react/lib';
import { Dropdown, IDropdownOption } from 'office-ui-fabric-react/lib/Dropdown';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { Toggle } from 'office-ui-fabric-react/lib/Toggle';

import * as ChartJS from 'react-chartjs-2';
import { cloneDeep } from 'lodash';

import { BaseWebPart } from './BaseWebPart';
import { Util } from '../../models';

@observer
export class ChartWebPart extends BaseWebPart<ChartWebPartProps, any> {

    getDefaultWebPartProps() {
        return defaultChartWebPartProps;
    }

    renderWebPartContent(props: ChartWebPartProps) {

        const chartProps: any = {
            data: cloneDeep(toJS(props.chartData)),
            options: props.chartOptions
        };

        let ChartElement: any;
        switch (props.chartType) {
            case 'bar':
                ChartElement = ChartJS.Bar;
                break;
            case 'doughnut':
                ChartElement = ChartJS.Doughnut;
                break;
            case 'horizontalBar':
                ChartElement = ChartJS.HorizontalBar;
                break;
            case 'line':
                ChartElement = ChartJS.Line;
                break;
            case 'pie':
                ChartElement = ChartJS.Pie;
                break;
            case 'polar':
                ChartElement = ChartJS.Polar;
                break;
            case 'radar':
                ChartElement = ChartJS.Radar;
                break;
            default:
                ChartElement = ChartJS.Line;
                break;
        }

        return (
            <ChartElement
                {...chartProps}
            />
        );
    }

    public renderWebPartSettings() {
        return (
            <div>
                <Dropdown
                    label="Chart Type"
                    selectedKey={this.webPartProps.chartType}
                    onChanged={this.onChartTypeChanged}
                    options={[
                        { key: 'bar', text: 'Bar Chart' },
                        { key: 'doughnut', text: 'Doughnut Chart' },
                        { key: 'line', text: 'Line Chart' },
                        { key: 'pie', text: 'Pie Chart' },
                        { key: 'polar', text: 'Polar Chart' },
                        { key: 'radar', text: 'Radar Chart' },
                    ]}
                />
                <Toggle label="Maintain Aspect Ratio" checked={this.webPartProps.chartOptions.maintainAspectRatio} onChanged={this.onMaintainAspectRatioChanged} />
                <TextField label="Chart Data" multiline={true} value={JSON.stringify(toJS(this.webPartProps.chartData), null, 4)} onChanged={this.onChartDataChanged} />
            </div>
        );
    }

    @action.bound
    private onChartTypeChanged(dropDownOption: IDropdownOption) {
        (this.webPartProps.chartType as any) = dropDownOption.key;
    }

    @action.bound
    private onMaintainAspectRatioChanged(newValue: boolean) {
        this.webPartProps.chartOptions.maintainAspectRatio = newValue;
        super.onWebPartPropertiesChanged();
    }

    @action.bound
    private onChartDataChanged(newValue: string) {
        try {
            this.webPartProps.chartData = observable(JSON.parse(newValue));
            super.onWebPartPropertiesChanged();
        } catch (ex) {
            //Write an error...
        }
    }
}

export interface ChartWebPartProps {
    chartType: 'bar' | 'doughnut' | 'horizontalBar' | 'line' | 'pie' | 'polar' | 'radar';
    chartOptions: {
        maintainAspectRatio: boolean
    };
    chartData: any;
}

export const defaultChartWebPartProps: ChartWebPartProps = {
    chartType: 'line',
    chartOptions: {
        maintainAspectRatio: false
    },
    chartData: {
        labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
        datasets: [{
            label: '# of Votes',
            data: [12, 19, 3, 5, 2, 3],
            backgroundColor: [
                'rgba(255, 99, 132, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)',
                'rgba(75, 192, 192, 0.2)',
                'rgba(153, 102, 255, 0.2)',
                'rgba(255, 159, 64, 0.2)'
            ],
            borderColor: [
                'rgba(255,99,132,1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)'
            ],
            borderWidth: 1
        }]
    }
};