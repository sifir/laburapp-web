Vue.component('node-select', {
    data: function () {
        return {
            selected: null,
            options: []
        };
    },
    template: `
    <div>
        <label>Mis Nodos</label>
        <select @change="change" v-model="selected" class="browser-default">
            <option value="" disabled selected>Elegir nodo</option>
            <option v-for="option in options" :value="option">{{option.name}}</option>
        </select>
    </div>`,
    methods: {
        change: function () {
            this.$emit('input', this.selected);
        }
    },
    created: function () {
        fetch('/nodes').then(res => res.json())
            .then(nodes => this.options = nodes);
    }
});

Vue.component('user-select', {
    props: ['node'],
    data: function () {
        return {
            selected: null,
            options: []
        };
    },
    template: `
    <div>
        <label>Usuario del nodo</label>
        <select @change="change" v-model="selected" class="browser-default">
            <option value="" disabled selected>Elegir usuario</option>
            <option v-for="option in options" :value="option">{{option.firstName}} {{option.lastName}}</option>
        </select>
    </div>`,
    watch: {
        node: function () {
            this.refreshUsers();
        }
    },
    methods: {
        change: function () {
            this.$emit('input', this.selected);
        },
        refreshUsers: function () {
            fetch(`/nodes/${this.node.id}/users`).then(res => res.json())
                .then(nodes => this.options = nodes);
        }
    },
    created: function () {
        this.refreshUsers();
    }
});

Vue.component('assistance-chart', {
    props: ['node', 'search'],
    template: `
    <div>
        <div class="card">
            <div class="card-content">
                <h4 class="card-title">Asistencia</h4>
                <div ref="chart"></div>
            </div>
        </div>
    </div>`,
    watch: {
        node: function () {
            this.searchShifts(this.search.dateFrom, this.search.dateTo);
        }
    },
    mounted: function () {
        this.$nextTick(function () {
            const options = {
                toolbar: {
                    show: true,
                    tools: {
                        download: true,
                        selection: true,
                        zoom: true,
                        zoomin: true,
                        zoomout: true,
                        pan: true,
                        reset: true,
                        customIcons: []
                    },
                    autoSelected: 'zoom'
                },
                chart: {
                    height: 350,
                    type: 'heatmap'
                },
                stroke: {
                    width: 0
                },
                states: {
                    active: {
                        filter: 'none'
                    }
                },
                tooltip: {
                    enabled: true,
                    y: {
                        formatter: function (value, { series, seriesIndex, dataPointIndex, w }) {
                            return value != -1 ? 'Horas trabajadas: ' + value : 'no laboral';
                        }
                    }
                },
                plotOptions: {
                    heatmap: {
                        radius: 2,
                        enableShades: false,
                        colorScale: {
                            ranges: [
                                {
                                    from: -2,
                                    to: -1,
                                    color: 'rgba(255,255,255,0)'
                                },
                                {
                                    from: 0,
                                    to: 4,
                                    color: '#f44336'
                                },
                                {
                                    from: 5,
                                    to: 24,
                                    color: '#32940a'
                                }
                            ]
                        }

                    }
                },
                dataLabels: {
                    enabled: true,
                    style: {
                        colors: ['#fff']
                    }
                },

                series: [],

                xaxis: {
                    type: 'datetime'
                },
                legend: {
                    show: false
                },
                title: {
                    text: undefined
                },
                events: {
                    click: function (event, ctx, config) {
                        console.log(event, ctx, config);
                    }
                }
            };

            this.chart = new ApexCharts(
                this.$refs.chart,
                options
            );

            this.chart.render();
            this.searchShifts(this.search.dateFrom, this.search.dateTo);
        });
    },
    methods: {
        searchShifts: function (from, to) {
            to.setDate(to.getDate() + 1);
            const toQuery = date => date.toISOString().split('T')[0];
            fetch(`/shifts?populate=node,user&where={"node":"${this.node.id}","started":{">=":"${toQuery(from)}","<=":"${toQuery(to)}"}}`)
                .then(res => res.json())
                .then(this.updateChart);
        },

        updateChart: function (shifts) {
            this.chart.updateSeries(
                Object.values(this.groupShiftsByUserId(shifts))
                    .map(shifts => this.shiftsToSeries(shifts, this.search))
            );
        },

        groupShiftsByUserId: function (shifts) {
            return shifts.reduce((grouped, each) => {
                grouped[each.user.id] = grouped[each.user.id] || [];
                grouped[each.user.id].push(each);
                return grouped;
            }, {});
        },

        shiftsToSeries: function (shifts, options) {
            const empty = this.initialEmptyRange(options.year, options.month);
            return {
                data: Object.values(Object.assign(empty,
                    shifts.reduce((acc, each) => {
                        acc[new Date(each.started).toLocaleDateString()] = {
                            x: new Date(each.started).getTime(),
                            y: this.withExtraDay(each, new Date(each.ended).getHours()) - new Date(each.started).getHours()
                        };
                        return acc;
                    }, {}))
                ),
                name: shifts[0].user.firstName + ' ' + shifts[0].user.lastName
            };
        },

        initialEmptyRange: function (year, month) {
            return [...new Array(this.daysInMonth(year, month)).keys()]
                .reduce((acc, cur) => {
                    const d = new Date(year, month, cur + 1);
                    acc[d.toLocaleDateString()] = {
                        x: d.getTime(),
                        y: -1
                    };
                    return acc;
                }, {});
        },

        withExtraDay(shift, workedHours) {
            let s = new Date(shift.started).getDate(),
                e = new Date(shift.ended).getDate()
            return e > s ? workedHours + 24 : workedHours
        },

        daysInMonth: function (month, year) {
            return new Date(year, month, 0).getDate();
        }
    }
});

Vue.component('user-assistance-chart', {
    props: ['node', 'user', 'search'],
    template: `
    <div>
        <div class="card">
            <div class="card-content">
                <h4 class="card-title">Asistencia de {{user.firstName}} {{user.lastName}}</h4>
                <div ref="chart"></div>
            </div>
        </div>
    </div>`,
    watch: {
        node: function () {
            this.chart.updateSeries([]);
        },
        user: function () {
            this.searchShifts(this.search.dateFrom, this.search.dateTo);
        }
    },
    mounted: function () {
        this.$nextTick(function () {
            const options = {
                chart: {
                    height: 350,
                    type: 'candlestick'
                },
                plotOptions: {
                    candlestick: {
                        colors: {
                            upward: '#00B746',
                            downward: '#EF403C'
                        },
                        wick: {
                            useFillColor: false
                        }
                    }
                },
                series: [],
                xaxis: {
                    type: 'datetime',
                    labels: {
                        hideOverlappingLabels: false
                    }
                },
                yaxis: {
                    min: 0,
                    tooltip: {
                        enabled: true
                    },
                },
                legend: {
                    show: false
                },
                title: {
                    text: undefined
                }
            };

            this.chart = new ApexCharts(
                this.$refs.chart,
                options
            );

            this.chart.render();
            this.searchShifts(this.search.dateFrom, this.search.dateTo);
        });
    },
    methods: {
        searchShifts: function (from, to) {
            const toQuery = date => date.toISOString().split('T')[0];
            to.setDate(to.getDate() + 1);
            fetch(`/nodes/${this.node.id}/shifts?where={"user":"${this.user.id}","started":{">=":"${toQuery(from)}","<=":"${toQuery(to)}"}}`)
                .then(res => res.json())
                .then(this.updateChart);
        },
        updateChart: function (shifts) {
            let asdf = this.shiftsToSeries(shifts, this.search);
            this.chart.updateSeries(asdf);
        },
        shiftsToSeries: function (shifts, options) {
            const empty = this.initialEmptyRange(options.year, options.month);
            console.log('empty', empty);
            return [
                {
                    data: Object.values(Object.assign(empty,
                        shifts.reduce((acc, each) => {
                            acc[new Date(each.started).toLocaleDateString()] = {
                                x: new Date(each.started).getTime(),
                                y: [
                                    this.toMilitaryFormat(new Date(each.started)),
                                    Number(this.node.shift_ends),
                                    Number(this.node.shift_starts),
                                    this.withExtraDay(each, this.toMilitaryFormat(new Date(each.ended)))
                                ]
                            };
                            return acc;
                        }, {}))
                    ),
                    name: shifts[0].user.firstName + ' ' + shifts[0].user.lastName
                }
            ];
        },

        initialEmptyRange: function (year, month) {
            return [...new Array(this.daysInMonth(year, month)).keys()]
                .reduce((acc, cur) => {
                    const d = new Date(year, month, cur + 1);
                    acc[d.toLocaleDateString()] = {
                        x: d.getTime(),
                        y: [
                            null,
                            Number(this.node.shift_ends),
                            Number(this.node.shift_starts),
                            null
                        ]
                    };
                    return acc;
                }, {});
        },

        toMilitaryFormat(date) {
            return Number(date.toLocaleString('es', { hour: '2-digit', minute: '2-digit' }).replace(':', ''));
        },
        
        withExtraDay(shift, workedHours) {
            let s = new Date(shift.started).getDate(),
                e = new Date(shift.ended).getDate()
            return e > s ? workedHours + 2400 : workedHours
        },

        daysInMonth: function (month, year) {
            return new Date(year, month, 0).getDate();
        }
    }
});

const app = new Vue({
    el: '#app',
    data: function () {
        const date = new Date();
        const y = date.getFullYear(),
            m = date.getMonth();
        return {
            node: null,
            user: null,
            searchOptions: {
                year: y,
                month: m,
                dateFrom: new Date(y, m, 1),
                dateTo: new Date(y, m + 1, 0)
            }
        };
    }
});
