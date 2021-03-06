import { PageSettings } from '../PageSettings';

export const dashboard: PageSettings = {
    'id': 'dashboard',
    'name': 'Dashboard',
    'iconClassName': 'PanoIndicator',
    'isExpanded': true,
    'locked': false,
    'backgroundColor': '#eee',
    'backgroundImage': '',
    'backgroundImageSize': 'cover',
    'backgroundImageRepeat': 'no-repeat',
    'breakpoints': {
        'lg': 1200,
        'md': 996,
        'sm': 768,
        'xs': 480,
        'xxs': 0
    },
    'columns': {
        'lg': 12,
        'md': 10,
        'sm': 6,
        'xs': 4,
        'xxs': 2
    },
    'layouts': {
        'lg': {
            '0': {
                'x': 0,
                'y': 0,
                'w': 4,
                'h': 11
            },
            'YUPghotc': {
                'x': 8,
                'y': 0,
                'w': 3,
                'h': 3
            },
            'cjNrnGO1': {
                'x': 4,
                'y': 0,
                'w': 3,
                'h': 11
            },
            'rymjO6AR': {
                'x': 0,
                'y': 11,
                'w': 7,
                'h': 9
            }
        },
        'md': {
            '0': {
                'x': 0,
                'y': 0,
                'w': 4,
                'h': 8
            },
            'YUPghotc': {
                'x': 7,
                'y': 0,
                'w': 3,
                'h': 2
            },
            'cjNrnGO1': {
                'x': 4,
                'y': 0,
                'w': 3,
                'h': 8
            },
            'rymjO6AR': {
                'x': 0,
                'y': 8,
                'w': 7,
                'h': 3
            }
        },
        'sm': {
            '0': {
                'x': 0,
                'y': 0,
                'w': 2,
                'h': 7
            },
            'YUPghotc': {
                'x': 4,
                'y': 0,
                'w': 2,
                'h': 2
            },
            'cjNrnGO1': {
                'x': 2,
                'y': 0,
                'w': 2,
                'h': 7
            },
            'rymjO6AR': {
                'x': 0,
                'y': 7,
                'w': 4,
                'h': 3
            }
        },
        'xs': {
            '0': {
                'x': 0,
                'y': 0,
                'w': 2,
                'h': 8
            },
            'YUPghotc': {
                'x': 2,
                'y': 0,
                'w': 2,
                'h': 2
            },
            'cjNrnGO1': {
                'x': 2,
                'y': 2,
                'w': 2,
                'h': 6
            },
            'rymjO6AR': {
                'x': 0,
                'y': 8,
                'w': 4,
                'h': 3
            }
        },
        'xxs': {
            '0': {
                'x': 0,
                'y': 2,
                'w': 2,
                'h': 6
            },
            'YUPghotc': {
                'x': 0,
                'y': 0,
                'w': 2,
                'h': 2
            },
            'cjNrnGO1': {
                'x': 0,
                'y': 8,
                'w': 2,
                'h': 8
            },
            'rymjO6AR': {
                'x': 0,
                'y': 16,
                'w': 2,
                'h': 3
            }
        }
    },
    'rowHeight': 30,
    'compactVertical': false,
    'subPages': [],
    'webParts': {
        '0': {
            'title': 'SP Lookout!',
            'type': 'chart',
            'attributes': [],
            'locked': true,
            'backgroundColor': '#ccc',
            'chromeStyle': 'default',
            'props': {
                'chartType': 'line',
                'chartOptions': {
                    'maintainAspectRatio': false
                },
                'chartData': {
                    'labels': [
                        'Red',
                        'Blue',
                        'Yellow',
                        'Green',
                        'Purple',
                        'Orange'
                    ],
                    'datasets': [{
                        'label': '# of Votes',
                        'data': [
                            12,
                            19,
                            3,
                            5,
                            2,
                            3
                        ],
                        'backgroundColor': [
                            'rgba(255, 99, 132, 0.2)',
                            'rgba(54, 162, 235, 0.2)',
                            'rgba(255, 206, 86, 0.2)',
                            'rgba(75, 192, 192, 0.2)',
                            'rgba(153, 102, 255, 0.2)',
                            'rgba(255, 159, 64, 0.2)'
                        ],
                        'borderColor': [
                            'rgba(255,99,132,1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 206, 86, 1)',
                            'rgba(75, 192, 192, 1)',
                            'rgba(153, 102, 255, 1)',
                            'rgba(255, 159, 64, 1)'
                        ],
                        'borderWidth': 1
                    }]
                }
            }
        },
        'YUPghotc': {
            'title': 'Current Time',
            'type': 'clock',
            'attributes': [],
            'locked': true,
            'backgroundColor': '#ccc',
            'chromeStyle': 'hiddenOnPageLocked',
            'props': {
                'format': 'MMMM Do YYYY, h:mm:ss a'
            }
        },
        'cjNrnGO1': {
            'title': 'Notes',
            'type': 'note',
            'attributes': [],
            'locked': true,
            'backgroundColor': '#fff',
            'chromeStyle': 'default',
            'props': {
                'text': 'When the graph to the left goes over 10,000 microbars, run!\n\n12/2/2017: Got really close - 9,723.. I put on my running shoes.\n\n'
            }
        },
        'rymjO6AR': {
            'title': 'New WebPart',
            'type': 'text',
            'attributes': [],
            'locked': true,
            'backgroundColor': '#ccc',
            'chromeStyle': 'default',
            'props': {
                'text': ''
            }
        }
    }
};