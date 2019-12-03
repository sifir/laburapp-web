/**
 * Suma 24 horas laborales si trabajo hasta el dia siguiente
 */
function withExtraDay(shift, workedHours, increment) {
    let s = new Date(shift.started).getDate(),
        e = new Date(shift.ended).getDate();
    return e > s ? workedHours + increment : workedHours;
}

/**
 * Devuelve array con dias del mes:
 * ej.
 * [1,2,3,4,5,6,7...]
 */
function daysInMonth(month, year) {
    return [...new Array(new Date(year, month, 0).getDate()).keys()];
}

Vue.component('month-select', {
    props: ['value'],
    data: function () {
        return {
            selected: this.value,
            options: [
                { month: 0, label: 'Enero' },
                { month: 1, label: 'Febrero' },
                { month: 2, label: 'Marzo' },
                { month: 3, label: 'Abril' },
                { month: 4, label: 'Mayo' },
                { month: 5, label: 'Junio' },
                { month: 6, label: 'Julio' },
                { month: 7, label: 'Agosto' },
                { month: 8, label: 'Septiembre' },
                { month: 9, label: 'Octubre' },
                { month: 10, label: 'Noviembre' },
                { month: 11, label: 'Diciembre' }
            ]
        };
    },
    template: `
    <div>
        <label>Mes</label>
        <select @change="change" v-model="selected" class="browser-default">
            <option value="" disabled selected>Elegir mes</option>
            <option v-for="option in options" :value="option.month">{{option.label}}</option>
        </select>
    </div>`,
    methods: {
        change: function () {
            this.$emit('input', this.selected);
        }
    }
});

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
        },
        search: function () {
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
                .then(shifts => this.updateChart(shifts));
        },

        /**
         * Recibe listado de shifts del servidor para actualizar grafico
         */
        updateChart: function (shifts) {
            this.chart.updateSeries(
                // Object.values devuelve un array con los valores de las propiedades del objeto
                Object.values(this.groupShiftsByUserId(shifts))
                    .map(shifts => this.shiftsToSeries(shifts, this.search))
            );
        },

        /**
         * Agrupa shifts por id de usuario
         * 
         * [ {shift1}, {shift2}, {shift3} ] => { user1: [ {shift1}, {shift2} ], user2: [ {shift3} ] }
         */
        groupShiftsByUserId: function (shifts) {
            return shifts.reduce((grouped, each) => {
                grouped[each.user.id] = grouped[each.user.id] || [];
                grouped[each.user.id].push(each);
                return grouped;
            }, {});
        },

        /**
         * Transforma array de shifts en objeto con:
         *  - data: Array de x, y
         *  - name: nombre y apellido de usuario
         */
        shiftsToSeries: function (shifts, options) {
            // genera dias sin horarios para cada dia del mes
            const empty = this.initialEmptyRange(options.year, options.month);
            return {
                data: Object.values(Object.assign(empty, this.workedDays(shifts))),
                name: shifts[0].user.firstName + ' ' + shifts[0].user.lastName
            };
        },

        /**
         * Genero dias placeholder para todo el mes
         * {
         *  x: fecha,
         *  y: -1
         * }
         */
        initialEmptyRange: function (year, month) {
            return daysInMonth(year, month).reduce(
                (accumulator, day) => {
                    const d = new Date(year, month, day + 1);

                    accumulator[d.toLocaleDateString()] = {
                        x: d.getTime(),
                        y: -1
                    };
                    return accumulator;
                },
                {} // valor inicial del acumulador
            );
        },

        /**
         * Convierto shift a formato valido para el grafico
         * formato:
         * {
         *  x: fecha,
         *  y: numero (horas trabajadas)
         * }
         */
        workedDays: function (shifts) {
            return shifts.reduce(
                (accumulator, shift) => {
                    let started = new Date(shift.started),
                        ended = new Date(shift.ended);

                    accumulator[started.toLocaleDateString()] = {
                        x: started.getTime(),
                        y: withExtraDay(shift, ended.getHours(), 24) - started.getHours()
                    };
                    return accumulator;
                },
                {} // valor inicial del acumulador
            );
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
        },
        search: function () {
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
            return shifts.length ? [
                {
                    data: Object.values(Object.assign(empty, this.workedDays(shifts))),
                    name: shifts[0].user.firstName + ' ' + shifts[0].user.lastName
                }
            ] : [];
        },

        initialEmptyRange: function (year, month) {
            return daysInMonth(year, month).reduce(
                (acc, cur) => {
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
                },
                {} // valor inicial del acumulador
            );
        },

        workedDays: function (shifts) {
            return shifts.reduce(
                (acc, each) => {
                    let started = new Date(each.started),
                        ended = new Date(each.ended);

                    acc[started.toLocaleDateString()] = {
                        x: started.getTime(),
                        y: [
                            this.toMilitaryFormat(started),
                            Number(this.node.shift_ends),
                            Number(this.node.shift_starts),
                            withExtraDay(each, this.toMilitaryFormat(ended), 2400)
                        ]
                    };
                    return acc;
                },
                {} // valor inicial del acumulador
            );
        },

        toMilitaryFormat(date) {
            return Number(date.toLocaleString('es', { hour: '2-digit', minute: '2-digit' }).replace(':', ''));
        }
    }
});

const app = new Vue({
    el: '#app',
    data: function () {
        const date = new Date();
        // inicializa la data
        return {
            node: null,
            user: null,
            searchOptions: {
                year: date.getFullYear(),
                month: date.getMonth()
            }
        };
    },
    computed: {
        search: function () {
            return {
                year: this.searchOptions.year,
                month: this.searchOptions.month,
                dateFrom: new Date(this.searchOptions.year, this.searchOptions.month, 1),
                dateTo: new Date(this.searchOptions.year, this.searchOptions.month + 1, 0)
            };
        }
    },
    template: `
    <div class="container">
        <div class="row">
            <div class="col s12">
                <month-select v-model="searchOptions.month"></month-select>
                <node-select v-model="node"></node-select>
                <aside v-if="node">

                    <h2 class="header">Nodo: {{node.name}}</h2>
                    <p>Tag NFC: {{node.tag}}</p>
                    <p>Horario de entrada: {{node.shift_starts}}</p>
                    <p>Horario de salida: {{node.shift_ends}}</p>
                    <assistance-chart :node="node" :search="search"></assistance-chart>

                    <h3>Usuarios</h3>
                    <user-select :node="node" v-model="user"></user-select>
                    <aside v-if="user">
                        <p>{{user.id}}</p>

                        <user-assistance-chart :node="node" :user="user" :search="search"></user-assistance-chart>
                    
                    </aside>
                </aside>
                <h3 class="placeholder" v-else>Selecciona un nodo</h3>
            </div>
        </div>
    </div>
    `
});
