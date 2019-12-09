import Vue from 'vue'
import Chart from 'chart.js'
import axios from 'axios'
import VueAxios from 'vue-axios'
import { rejects } from 'assert';
import { callbackify } from 'util';

const { getCode, getName } = require('country-list');
Vue.use(VueAxios, axios);
var myChart;
var map;
var demo = new Vue({
    el: '#vuePlace',
    data: {
        chartType: "bar",
        tempForCity: "",
        worldData: [],
        countries: [],
        cities: [],
        choosenCountry: "",
        choosenCity: "",
        show: false,
        showCities: false,
        loading: false,
        showChart: false,
        chartsInfo: [],
        description: ""
    },
    mounted: function () {
        this.worldData = require('./countries.min.json');
        Object.keys(this.worldData).forEach(element => {
            this.countries.push(element);
        });

    },
    methods: {
        change: function () {
            this.show = false;
            this.loading = false;
            this.showCities = false;
        },
        addCountrie: function () {
            this.cities = [];
            this.show = true;
            this.loading = true;
            var index = 0;
            var tempCities = this.worldData[this.choosenCountry];
            console.log(tempCities);
            tempCities.forEach(el => {
                Vue.axios.get('http://api.waqi.info/feed/' + el.toLowerCase() + '/?token=0029e5bed69db3ad231fc59e7178ed29b1518cad').then((response) => {
                    if (response.data.status == "ok" && (response.data.data.city.name.indexOf(this.choosenCountry) != -1)) {
                        this.cities.push(el);
                    }
                    else console.log((index + 1) + ") " + tempCities[index] + ": No data");
                    index++;
                    if (index >= this.worldData[this.choosenCountry].length - 1) {
                        this.loading = false;
                        this.showCities = true;
                    }
                });
            });
        },
        redraw: function () {
            if (this.chartsInfo.length >= 1) {
                if (myChart) myChart.destroy();
                this.getChart;
            }
        },
        addCity: function () {
            var cityObj = {
                'aqi': 0,
                'cityName': '',
                'z': 0.0,
                'x': 0.0,
                'rgb': ''
            }
            Vue.axios.get('http://api.waqi.info/feed/' + this.choosenCity.toLowerCase() + '/?token=0029e5bed69db3ad231fc59e7178ed29b1518cad').then((response) => {
                cityObj.aqi = response.data.data.aqi;
                cityObj.cityName = this.choosenCity;
                cityObj.z = response.data.data.city.geo[0];
                cityObj.x = response.data.data.city.geo[1];
                if (response.data.data.aqi >= 0 && response.data.data.aqi <= 50) cityObj.rgb = 'rgba(0,255,0,0.2)';// this.description="Якість повітря вважається нормальним";}
                else if (response.data.data.aqi >= 51 && response.data.data.aqi <= 100) cityObj.rgb = 'rgba(240,255,0,0.2)'; //this.description="Якість повітря прийнятно; проте деякі забруднювачі створюють помірний ризик для здоров'я незначного числа людей, які надчутливі до забруднення повітря.";}
                else if (response.data.data.aqi >= 101 && response.data.data.aqi <= 150) cityObj.rgb = 'rgba(255,180,0,0.2)';// this.description="Нездоровий - для чутливих груп. Представники груп ризику можуть випробувати проблеми зі здоров'ям. Широке населення навряд чи постраждає.";}
                else if (response.data.data.aqi >= 151 && response.data.data.aqi <= 200) cityObj.rgb = 'rgba(255,90,0,0.2)';// this.description="Шкідливий. Кожен може почати відчувати наслідки для здоров'я; члени чутливих груп можуть відчувати більш серйозні наслідки для здоров'я";}
                else if (response.data.data.aqi >= 201 && response.data.data.aqi <= 300) cityObj.rgb = 'rgba(255,0,0,0.2)'; //this.description="Жуже шкідливий. Попередження небезпеки для здоров'я в надзвичайних ситуаціях. Всі громадяни в зоні ризику."}
                else if (response.data.data.aqi >= 301) cityObj.rgb = 'rgba(90,0,255,0.2)'; //this.description="Небезпечний. Попередження: можливі серйозні негативні наслідки для здоров'я";}
                this.chartsInfo.push(cityObj);
                this.redraw();
                if (this.chartsInfo.length >= 1) {
                    this.showChart = true;
                }
            })
        },
        showInfo: function () {
            console.log(this.choosenCountry);
        }
    },
    computed: {
        getChart: function () {

            let na = [];
            let AQIdata = [];
            let colors = [];
            let colorsFull = [];
            let x = [];
            let z = [];
            this.chartsInfo.forEach((element) => {
                na.push(element.cityName);
                AQIdata.push(element.aqi);
                colors.push(element.rgb);
                colorsFull.push(element.rgb.replace('0.2', '1'));
                x.push(element.x);
                z.push(element.z);
            });

            var ctx = document.getElementById("myChart").getContext('2d');
            myChart = new Chart(ctx, {
                type: this.chartType,
                data: {
                    labels: na,
                    datasets: [{
                        label: 'Загрязнения в городу',
                        data: AQIdata,
                        backgroundColor: colors,
                        borderColor: colorsFull,
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        yAxes: [{
                            ticks: {
                                beginAtZero: true
                            }
                        }]
                    },
                    onClick: function (evt) {
                        var activePoints = myChart.getElementAtEvent(evt)[0];
                        console.log(activePoints);
                        let X; let Z; let descr;

                        X = z[activePoints._index];
                        Z = x[activePoints._index];
                        if (AQIdata[activePoints._index] >= 0 && AQIdata[activePoints._index] <= 50) descr = "Якість повітря вважається нормальним";
                        else if (AQIdata[activePoints._index] >= 51 && AQIdata[activePoints._index] <= 100) descr = "Якість повітря прийнятно; проте деякі забруднювачі створюють помірний ризик для здоров'я незначного числа людей, які надчутливі до забруднення повітря.";
                        else if (AQIdata[activePoints._index] >= 101 && AQIdata[activePoints._index] <= 150) descr = "Нездоровий - для чутливих груп. Представники груп ризику можуть випробувати проблеми зі здоров'ям. Широке населення навряд чи постраждає.";
                        else if (AQIdata[activePoints._index] >= 151 && AQIdata[activePoints._index] <= 200) descr = "Шкідливий. Кожен може почати відчувати наслідки для здоров'я; члени чутливих груп можуть відчувати більш серйозні наслідки для здоров'я";
                        else if (AQIdata[activePoints._index] >= 201 && AQIdata[activePoints._index] <= 300) descr = "Жуже шкідливий. Попередження небезпеки для здоров'я в надзвичайних ситуаціях. Всі громадяни в зоні ризику."
                        else if (AQIdata[activePoints._index] >= 301) descr = "Небезпечний. Попередження: можливі серйозні негативні наслідки для здоров'я";



                        var OSM_URL = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
                        var OSM_ATTRIB = '&copy;  <a  href="http://openstreetmap.org/copyright">OpenStreetMap</a>  contributors';
                        var osmLayer = L.tileLayer(OSM_URL, { attribution: OSM_ATTRIB });

                        if (map != null) map.remove();

                        map = L.map('map').setView([X, Z], 11);

                        map.addLayer(osmLayer);
                        document.getElementById("nameLabel").textContent = activePoints._model.label;
                        document.getElementById("descriptionLabel").textContent = descr;

                    }

                }
            });
            return myChart;
        }
    },
});

