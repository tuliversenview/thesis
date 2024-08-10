

window.addEventListener('load', function () {
    Init()
 })
function Init() {
    db = new Dashboard();
    markeradd = []
}
function getQueryParamValue(parameter) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(parameter);
}

function showDialog(title, content, onConfirm, object) {
    // Get the modal HTML template
    var modalTemplate = $.template('modalTemplate', $('#modal-template').html());

    // Render the template with the provided title and content
    var modalHTML = $.tmpl('modalTemplate', { title: title, content: content });

    // Append the modal to the body
    $('body').append(modalHTML);

    // Show the modal
    $('.modal').modal('show');

    // Add a click event listener to the "Save changes" button
    $('.btn-confirm').click(function () {
        // Close the modal
        $('.modal').modal('hide');

        // Call the onConfirm callback function, if provided
        if (typeof onConfirm === 'function') {
            onConfirm(object);
        }

        // Return true to indicate the user confirmed the dialog
        return true;
    });

    // Add a click event listener to the "Close" button or the backdrop
    $('.modal, .btn-purple').click(function () {
        // Close the modal
        $('.modal').modal('hide');

        // Return false to indicate the user closed the dialog
        return false;
    });
}
let globalDomClass = {

    ['mapview--total']: {
        dom: $(".mapview--total"),
        name: 'mapview--total'
    },
    ['containner--markertable']: {
        dom: $(".containner--markertable"),
        name: 'containner--markertable'
    },
    ['mapview--cluster']: {
        dom: $(".mapview--cluster"),
        name: 'mapview--cluster'
    },
    ['mapview--cluster']: {
        dom: $(".mapview--cluster"),
        name: 'mapview--cluster'
    },
    ['box--green']: {
        dom: $(".box--green"),
        name: 'box--green'
    },
    ['box--orange']: {
        dom: $(".box--orange"),
        name: 'box--orange'
    },
    ['box--red']: {
        dom: $(".box--red"),
        name: 'box--red'
    },
}
let globalDomId = {
    ['map']: {
        dom: $("#map"),
        name: 'map'
    },
}
let globalJqueryTemplate = {
    ['mapview-template']: {
        dom: $("#mapview-template"),
        name: 'mapview-template'
    },
    ['card-Template']: {
        dom: $("#cardTemplate"),
        name: 'cardTemplate'
    },
    ['cluster-template']: {
        dom: $("#cluster-template"),
        name: 'cluster-template'
    }

}

class SignalRHub {
    constructor(hubUrl, receiveMessageCallback, key, data, isSendMessagePeriodically=true) {
        this.hubUrl = hubUrl;
        this.receiveMessageCallback = receiveMessageCallback;
        this.connection = null;
        this.isStopped = false
        this.key = key;
        this.data = data
        this.isSendMessagePeriodically = isSendMessagePeriodically
    }

    async start() {
        try {
            const token = localStorage.getItem('JWTToken');
            this.connection = new signalR.HubConnectionBuilder()
                .withUrl(this.hubUrl, { accessTokenFactory: () => token })
                .build();

            this.connection.on("ReceiveMessage", (data) => {
                var self=this
                this.receiveMessageCallback(data,self);
            });

            await this.connection.start();
            if (this.isSendMessagePeriodically) {
                this.sendMessagePeriodically();
            }

        } catch (err) {
            console.error(err.toString());
        }
    }
    sendMessagePeriodically() {
        this.intervalId = setInterval(async () => {
            if (this.isStopped) {
                this.stop();
                return;
            }
            try {
                console.log(this.intervalId)
                await this.connection.invoke("SendMessage", this.key,this.data);
            } catch (err) {
                console.error(err.toString());
            }
        }, 1000);
    }
    Stop(){
        clearInterval(this.intervalId);
    }
    }
class Dashboard {

    // Private fields
    #GoogleMapInstance;
    #DictPolygon = {};
    #listMarker;
    #listStartPoint;
    #markersForRouting;
    #dicMarkerOnMap = {}
    static dicPolylineOnMap = {}
    constructor() {
        this.init();
    }
    async init() {
         this.tabsManager = new TabsManager('.nav-tabs', '.nav-contents');
        //Khởi tạo Map , set Control Polygon
        this.#GoogleMapInstance = new GoogleMapInstance_v2();
        //Lấy Danh sách Markers
        const category = getQueryParamValue('category');
        if (!category) {
            window.location.href = window.location.origin + '/Dashboard?category=' + 2;
        }
        this.#listMarker = await MarkerInstance.fetchMarker('/api/GarbagePoint?offset=0&limit=200&category=' + category);
        this.#listStartPoint = await MarkerInstance.fetchMarker('/api/StartPoint?offset=0&limit=200&category=' + category);
        if (this.#listMarker && this.#listStartPoint) {
            MarkerInstance.setStartPoint(this.#GoogleMapInstance.map, this.#listStartPoint)
            // Lấy danh sách thùng rác từ 33% rác trở lên
            this.markersForRouting = MarkerInstance.getMarkersForRouting(this.#listMarker);
            //đưa danh sách trên vào Map
            this.addMarkersToMap(this.#GoogleMapInstance.map, this.#listMarker);
            //Hiển thị số lượng rác lên các Box
            this.setBoxTrash(this.#listMarker);
            // Lấy tọa độ các Polygon và các marker trong nó khi thao tác với polygon trên map
            // Tạo box Cluster trên View google map
            // Routing cho các point trong Cluster
            // Hiển thị Chi tiết lộ trình sau khi Routing xong
            this.handlePolygonInsertUpdate();
            // thử nghiệm tạo dropdown

            $('.btn--mapfunction.drawpolygon').on('click', function (event) {
                /* this.#GoogleMapInstance.drawingManager.setOptions({
                     polygonOptions: {
                         strokeColor: '#FF0000', // Set the stroke color to red
                         strokeOpacity: 0.8,
                         strokeWeight: 2,
                         fillColor: '#FF0000', // Set the fill color to red
                         fillOpacity: 0.35
                     }
                 });*/
                this.#GoogleMapInstance.drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
            }.bind(this))
            $('.btn--mapfunction.hand').on('click', function (event) {
                this.#GoogleMapInstance.drawingManager.setDrawingMode(null);
            }.bind(this))


            //thử nghiệm lấy cluster
            /* var arrclusters = await Cluster.Clustering(this.#markersForRouting);
             this.drawPolygon(arrclusters)*/

            // tạo Dropdown Cluster cho map 
            const n = 10; // Specify the number of clusters you want
            const data = [{ id: 0, text: 'Auto select' }];

            for (let i = 1; i <= n; i++) {
                data.push({ id: i, text: `${i} Cluster` });
            }
            this.dropdownAutoRouting = new DropdownMenuChoiceCluster({
                data: data,
                isTextbox: false,
                markers: this.markersForRouting,
                drawPolygonFunc: this.drawPolygons.bind(this),
                clearPolygonFunc: this.clearPolygon.bind(this)
            })
            $('.map--autoRouting-cluster').append(this.dropdownAutoRouting.dropdownQuery)

            debugger
            this.dropdownCategory = new DropdownMenu({
                initid: (getQueryParamValue('category') != '' ? getQueryParamValue('category') : 1), data: null, label: null, isTextbox: true, isRow: false, searchCallback: async (key) => {
                    var dataobj = []
                    const response = await fetch(`/api/Category/GetList?table=category&offset=0&limit=0&keyword=${key}`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('JWTToken')}`
                        }
                    });
                    dataobj = await response.json();
                    debugger
                    const mappedData = dataobj.data.map(item => ({
                        id: item.id,
                        text: item.name
                    }));
                    return mappedData;
                }, selectCallback: (itemid) => {
                    debugger
                    window.location.href = window.location.origin + '/Dashboard?category=' + itemid;
                }
            });

            $('.map--autoRouting-category').append(this.dropdownCategory.dropdownQuery)
            this.dropdownDatepicker = new Datepicker({
                callback: function (selecteddate) {
                    for (let key in db.#DictPolygon) {
                        if (db.#DictPolygon.hasOwnProperty(key)) {
                            // Access each key and its corresponding value
                            let obj = db.#DictPolygon[key];
                            console.log(obj)
                            obj.polygonDiv.remove();
                            obj.polygon.setMap(null);
                            for (let key in obj.listpolyline) {
                                if (obj.listpolyline.hasOwnProperty(key)) {
                                    let poly = obj.listpolyline[key];
                                    poly.polyline.setMap(null)
                                }
                            }
                            obj.markers.forEach((e) => {
                                e.polygonID = null;
                            })
                        }
                    }
                    this.getClusterByCurrentDate(selecteddate)
                }.bind(this)
            });
            $('.map--autoRouting-datepicker').append(this.dropdownDatepicker.datetimepickerQuery)
            //Grid marker

            var grid = new GridMarker('markerGrid', 10, '/api/GarbagePoint', this.tabsManager.$tabs["radio-tab-marker"])



            var configDiv = $('#ConfigurationTabContentTemplate').tmpl()
            //Config Button Routing

            //Config Dropdown routing type

            var config_1 = new DropdownMenu({
                data: [
                    { id: 0, text: 'a' },
                    { id: 1, text: 'b' },
                    { id: 2, text: 'c' },
                    { id: 3, text: 'd ' },
                    { id: 4, text: 'e' }], label: 'Cluster Color', isTextbox: true
            })
            var config_2 = new DropdownMenu({
                data: [
                    { id: 0, text: 'a' },
                    { id: 1, text: 'b' },
                    { id: 2, text: 'c' },
                    { id: 3, text: 'd ' },
                    { id: 4, text: 'e' }], label: 'Cluster max size', isTextbox: true
            })
            var config_3 = new DropdownMenu({
                data: [
                    { id: 0, text: 'a' },
                    { id: 1, text: 'b' },
                    { id: 2, text: 'c' },
                    { id: 3, text: 'd ' },
                    { id: 4, text: 'e' }], label: 'Time recheck matrix distance', isTextbox: true
            })
            var config_4 = new DropdownMenu({
                data: [
                    { id: 0, text: 'a' },
                    { id: 1, text: 'b' },
                    { id: 2, text: 'c' },
                    { id: 3, text: 'd ' },
                    { id: 4, text: 'e' }], label: 'Garbage range (empty, medium , red)', isTextbox: true
            })
            var config_5 = new DropdownMenu({
                data: [
                    { id: 0, text: 'a' },
                    { id: 1, text: 'b' },
                    { id: 2, text: 'c' },
                    { id: 3, text: 'd ' },
                    { id: 4, text: 'e' }], label: 'Time IOT request', isTextbox: true
            })
            configDiv
                .append(config_1.dropdownQuery)
                .append(config_2.dropdownQuery)
                .append(config_3.dropdownQuery)
                .append(config_4.dropdownQuery)
                .append(config_5.dropdownQuery)

            this.tabsManager.$tabs["radio-tab-config"].append(configDiv)



            this.getClusterByCurrentDate(new Date());



            this.pointStream = new SignalRHub('/api/hubs/DashBoardHub', function (data, self) {

                var updatedata = JSON.parse(data);
                MarkerInstance.updateMarker(updatedata.Id, updatedata.CurrentFill)

            }.bind(this), "pointstatus", 0, false)
            this.pointStream.start();;
        }
        

    }
    async getClusterByCurrentDate(dateinput) {
        const searchdatetime = dateinput.toISOString();
        var category=getQueryParamValue('category')
        var response = await fetch(`/api/cluster/getClusterByDate/${searchdatetime}?category=` + category, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('JWTToken')}`
            }
        })
        var data = await response.json();
        var arrply = []
        var ids = []
        data.data.forEach((item)=>{
             
            var poly = JSON.parse(item.polygonCoordinates)
            arrply.push(poly)
            ids.push(item.id)
        })
        this.drawPolygons(arrply, data.data);
}
    drawPolygons(polygonCoords,clusters) {
        for (var i = 0; i < polygonCoords.length; i++) {
            var mouseoutcolor = clusters ? "orange" : "red"
            const polygon = new google.maps.Polygon({
                paths: polygonCoords[i],
                strokeColor: mouseoutcolor,
                strokeOpacity: 1,
                strokeWeight: 2,
                fillColor: "white",
                fillOpacity: 0.1,
                editable: (clusters ?false:true),
                draggable: (clusters ? false : true),

            });
            polygon.setMap(this.#GoogleMapInstance.map);
            var event = { overlay: polygon, type: 'polygon' }
            this.handleOverlaycomplete(event, clusters &&clusters[i])
        }
       
        
    }
    clearPolygon() {
        // Iterate through each polygon in the dictionary and remove it from the map
        for (let clusterID in this.#DictPolygon) {
            var polygonInstance = this.#DictPolygon[clusterID];

            // Remove the polygon from the map
            polygonInstance.polygon.setMap(null);

            // Remove the associated div from the DOM
            polygonInstance.polygonDiv.remove();
        }

        // Clear the polygon dictionary
        this.#DictPolygon = {};
    }
    #clusterMarkersToPoligon(polygonchange) {
        
        for (let clusterID in this.#DictPolygon) {
            var polygon = this.#DictPolygon[clusterID];

            polygon.markers = [];
            // cập nhật marker vào div polygon
            for (let marker of this.markersForRouting) {
                if (polygon.checkContainMarker(marker)) {
                    polygon.markers.push(marker);
                    marker.isInPolygon = true;
                }
            }
            polygon.updateclusterinfoDiv()
            // thêm các li marker
            polygon.polygonDiv.find('.list-group.markers').empty();

            //hiện các list trong mỗi Cluster
           /* $.each(polygon.markers, function (index, marker) {
                var litemplate = $('#limarkerincluster-template').tmpl({ polygonIndex: polygon.id, marker }).appendTo(polygon.polygonDiv);
                polygon.polygonDiv.find('.list-group.markers').append(litemplate);
            });*/
        }


    }
    handlePolygonInsertUpdate() {

        google.maps.event.addListener(this.#GoogleMapInstance.drawingManager, "overlaycomplete", this.handleOverlaycomplete.bind(this))

    }
    handleUpdatePolygon(obj1,obj2) {
        
       /* this.#clusterMarkersToPoligon(this);*/
    }
    handleOverlaycomplete(event,cluster) {
        if (event.type === "polygon") {
            //khi đã hoàn thành vẽ polygon
            // chuyển về chế độ view
            this.#GoogleMapInstance.drawingManager.setDrawingMode(null);
            var polygon = event.overlay;
        
            google.maps.event.addListener(polygon, 'click', function () {
                this.selectedPolygon = this;
            });
            //tạo object polygon để quản lý Cluster
            var p = new PolygonInstance(polygon, null, this.#GoogleMapInstance, cluster, this.markersForRouting, this.#listMarker, this.#listStartPoint)
            p.createClusterHTML();
            p.WaitRoutingDetail();
            //add event Routing cho cluster
            p.updateclusterinfoDiv();
            p.addClusterDivHover();
            // Thêm Dropdown của polygon đó lên map
            this.tabsManager.$tabs["radio-tab-cluster"].append(p.polygonDiv);

            // thêm polygon vào danh sách để quản lý
            debugger
            if (p.cluster) {
                this.#DictPolygon[p.cluster.id] = p
                p.clusterId = p.cluster.id;
            } else {
                this.#DictPolygon[p.guid] = p;
            }
           

/*            google.maps.event.addListener(polygon, 'dragend', () => {

                
            });
            google.maps.event.addListener(polygon.getPath(), 'set_at', () => {

                
            });

            // Check các point để lấy các point thuộc cluster*/
            //this.#clusterMarkersToPoligon();
            p.createClusterConfig();
            p.addRoutingHanleClick();
        }
    }


    setBoxTrash(listMarker) {
        const green = listMarker.filter((marker) => marker.FillPercent >= 0 && marker.FillPercent < 34);
        const orange = listMarker.filter((marker) => marker.FillPercent > 33 && marker.FillPercent <= 80);
        const red = listMarker.filter((marker) => marker.FillPercent > 80);

        const boxes = [
            { color: 'green', fromPercent: '0', toPercent: '33', numTrash: green.length },
            { color: 'orange', fromPercent: '33', toPercent: '80', numTrash: orange.length },
            { color: 'red', fromPercent: '80', toPercent: '100', numTrash: red.length },
        ];

        boxes.forEach((box) => {
            const data = {
                frompercent: box.fromPercent,
                to_percent: box.toPercent,
                num_trash: box.numTrash,
                color: box.color,
            };

            globalJqueryTemplate['mapview-template'].dom.tmpl(data).appendTo(globalDomClass[`box--${box.color}`].dom);
        });
    }
    addMarkersToMap(map, markers) {

        this.#dicMarkerOnMap = MarkerInstance.setMarkers(map, markers)
    }

}
class GoogleMapInstance_v2 {

    #map;
    #directionsService;
    #directionsRenderer;
    #routeInfo;
    #rawmarker;
    #drawingManager;

    constructor() {
        this.#map = this.initMap(document.getElementById('map'));
        this.#map.addListener('click', function (event) {
            this.placeMarkerAndPanTo(event.latLng, map);
        }.bind(this));


        this.#directionsService = new google.maps.DirectionsService();
        this.#directionsRenderer = new google.maps.DirectionsRenderer();
        this.#routeInfo = {};
        this.#drawingManager = this.createDrawingManager();
/*        this.#map.addListener('click', this.addMarker.bind(this));
*/     }

    get drawingManager() {
        return this.#drawingManager;
    }

    get map() {
        return this.#map;
    }

    get directionsService() {
        return this.#directionsService;
    }

    get directionsRenderer() {
        return this.#directionsRenderer;
    }

    get routeInfo() {
        return this.#routeInfo;
    }
    setCenter(center) {
        this.#map.setCenter(center);
    }
    async drawRoute(src_marker, des_marker, color = '#4687ff'){

        var src = src_marker.Lat + ',' + src_marker.Lng;
        var des = des_marker.Lat + ',' + des_marker.Lng;
        var url = `./api/googlemap/direction?origin=${src}&destination=${des}`

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('JWTToken')}`
            }
        });
        var data = await response.json();

        const polylinePoints = data.routes[0].overview_polyline.points;
        
        // Decode the polyline points
        const decodedPolyline = google.maps.geometry.encoding.decodePath(polylinePoints);
         
        // Create a new Polyline object to draw the route on the map
        const routePolyline = new google.maps.Polyline({
            path: decodedPolyline,  
            geodesic: true,
            map: this.#map,
            strokeColor: color,
            strokeWeight: 10,
            strokeOpacity: 0.5,
            zIndex: 0,
 
            //editable: true
        });

        var route = data.routes[0];
        var container = document.querySelector('.containner--markertable');
        for (var leg_index = 0; leg_index < route.legs.length; leg_index++) {
            var leg_currentValue = route.legs[leg_index];

            var stepsDiv = document.createElement('div');
            stepsDiv.classList.add('route-steps');
            var data = {
                srcMarker: src_marker,
                desMarker: des_marker,
                h1Text: `${src_marker.ID}-${des_marker.ID}`,
                from: leg_currentValue.start_address,
                to: leg_currentValue.end_address,
                distance: leg_currentValue.distance.text,
                duration: leg_currentValue.duration.text,
                sourceTitle: "Source Title",
                htmlArray: [],
                iconArray: []
            };
            for (var i = 0; i < leg_currentValue.steps.length; i++) {
                data.iconArray.push(leg_currentValue.steps[i].maneuver);
                data.htmlArray.push(leg_currentValue.steps[i].html_instructions);
            }
        }

        return {polyline:routePolyline, polylineInfo: data}

       
    }
    placeMarkerAndPanTo(latLng, map) {
        var marker = new google.maps.Marker({
            position: latLng,
            map: this.#map,
        });
        
        // Get the coordinates of the clicked location
        const marker_new = { CategoryID: 1, Lat: latLng.lat(), Lng: latLng.lng() };
        markeradd.push(marker_new);
        console.log(marker_new)
        
    }
    initMap(dom) {
        // Code to display Google Map on the layout
       var mapOptions = {
          center: { lat: 0, lng: 0 }, // Set the initial center of the map
          zoom: 5,
           mapTypeId: google.maps.MapTypeId.ROADMAP,
           styles:  [{
            "featureType": "administrative",
            "elementType": "geometry",
            "stylers": [
                {
                    "visibility": "off"
                }
            ]
        },
            {
                "featureType": "poi",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "road",
                "elementType": "labels.icon",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "transit",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
            {
                featureType: "administrative.locality",
                elementType: "labels.text.fill",
                stylers: [{ color: "#d59563" }],
            },
            {
                featureType: "poi",
                elementType: "labels.text.fill",
                stylers: [{ color: "#d59563" }],
            },
            {
                featureType: "poi.park",
                elementType: "geometry",
                stylers: [{ color: "#263c3f" }],
            },
            {
                featureType: "poi.park",
                elementType: "labels.text.fill",
                stylers: [{ color: "#6b9a76" }],
            },
            {
                featureType: "road",
                elementType: "geometry",
                stylers: [{ color: "#38414e" }],
            },
            {
                featureType: "road",
                elementType: "geometry.stroke",
                stylers: [{ color: "#212a37" }],
            },
            {
                featureType: "road",
                elementType: "labels.text.fill",
                stylers: [{ color: "#9ca5b3" }],
            },
            {
                featureType: "road.highway",
                elementType: "geometry",
                stylers: [{ color: "#746855" }],
            },
            {
                featureType: "road.highway",
                elementType: "geometry.stroke",
                stylers: [{ color: "#1f2835" }],
            },
            {
                featureType: "road.highway",
                elementType: "labels.text.fill",
                stylers: [{ color: "#f3d19c" }],
            },
            {
                featureType: "transit",
                elementType: "geometry",
                stylers: [{ color: "#2f3948" }],
            },
            {
                featureType: "transit.station",
                elementType: "labels.text.fill",
                stylers: [{ color: "#d59563" }],
            },
            {
                featureType: "water",
                elementType: "geometry",
                stylers: [{ color: "#17263c" }],
            },
            {
                featureType: "water",
                elementType: "labels.text.fill",
                stylers: [{ color: "#515c6d" }],
            },
            {
                featureType: "water",
                elementType: "labels.text.stroke",
                stylers: [{ color: "#17263c" }],
            },
        ]    
        };
        return new google.maps.Map(dom, mapOptions);

    }

    
    createDrawingManager() {
        var color = `red`;
        var drawmanager = new google.maps.drawing.DrawingManager({

            drawingControl: false,
            
            markerOptions: {
                icon: "https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png",
            },
            polygonOptions: {
                fillColor: "white", // Set the fill color of the polygon
                fillOpacity: 0.1,
                strokeColor: color, // Set the stroke color of the polygon
                strokeWeight: 2,
                editable: true,
                draggable: true
            },
        });
        drawmanager.setMap(this.#map);
        return drawmanager;
    }

    setBoxTrash(listMarkers) {
        // Code to set the number of trash bins and display it on the boxes
    }

    setMarkerwithlabel(listMarkers, markersIdSortArray) {
        // Code to set markers with labels on the map
    }

    drawRouteByGoogleApi(listMartkers) {
        // Code to draw the route using Google Maps API
    }
}
class PolygonInstance {
     
    constructor(polygon, polygonDiv, googlemapinstance, cluster, markersForRouting, markersAll, listStartPoint) {
        this.googlemapinstance = googlemapinstance;
        this.guid = this.#generateGUID()
        this.polygon = polygon;
        this.polygonDiv = polygonDiv;
        this.markers = [];
        this.markersAll = markersAll;
        this.markersForRouting = markersForRouting;
        this.start;
        this.end;
        this.listpolyline = {}
        this.workflowStep = 1;
        this.cluster = cluster
        this.mouseoutcolor = cluster ? "white" : "lime"
        this.routingTask;
        this.liststartpoint = listStartPoint;
        this.clusterId=null
        this.HandlePolygonItems();
      
    }
    HandlePolygonItems() {
        //if (this.routingTask != null) {
            this.markersForRouting.forEach((e) => {
                var isinpolygon = this.checkContainMarker(e);
                if (isinpolygon) {
                    e.polygonID = this.guid;
                    this.markers.push(e)
                }
            })
        //}
        
        google.maps.event.addListener(this.polygon, 'dragend', function(){
            
            this.markers.forEach((e) => {
                var isinpolygon = this.checkContainMarker(e);
                if (!isinpolygon) {
                    e.polygonID = null;
                } 
            })
            this.markers = [];
            var getfreepoint = this.markersForRouting.filter(e => e.polygonID == null || e.polygonID == this.guid);
            getfreepoint.forEach((e) => {
                var isinpolygon = this.checkContainMarker(e);
                if (isinpolygon) {
                    e.polygonID = this.guid;
                    this.markers.push(e)
                }
            })
            this.updateclusterinfoDiv();
        }.bind(this));
        google.maps.event.addListener(this.polygon.getPath(), 'set_at', function () {
            
            this.markers.forEach((e) => {
                var isinpolygon = this.checkContainMarker(e);
                if (!isinpolygon) {
                    e.polygonID = null;
                }
            })
            this.markers = [];
            var getfreepoint = this.markersForRouting.filter(e => e.polygonID == null || e.polygonID == this.guid);
            getfreepoint.forEach((e) => {
                var isinpolygon = this.checkContainMarker(e);
                if (isinpolygon) {
                    e.polygonID = this.guid;
                    this.markers.push(e)
                }
            })
            this.updateclusterinfoDiv();
        }.bind(this));

        google.maps.event.addListener(this.polygon, 'mouseover', function () {
            this.polygon.setOptions({
                fillOpacity: 0.3
            });
        }.bind(this));

        google.maps.event.addListener(this.polygon, 'mouseout', function () {
            var mouseoutcolor = this.cluster ? (this.routingTask != null ? "green" : "orange") : "red"
            this.polygon.setOptions({
                fillColor: "white",
                strokeColor: mouseoutcolor,
                fillOpacity: 0.1
            });
        }.bind(this));
        // Check các point để lấy các point thuộc cluster
        //this.#clusterMarkersToPoligon();
    }

    WaitRoutingDetail() {
/*        this.polygon.setOptions({

            strokeColor: 'orange'
        });*/
        debugger
        if (this.cluster) {
              
            this.signalRHub = new SignalRHub('/api/hubs/DashBoardHub', function (data,self) {
                 
                self.Stop();
                data = JSON.parse(data)
                this.routingTask = data
                this.clusterId = data.id
                this.RoutingDetailGenerate(data.WastePointsIDResult.split(','), data.TotalDistance/1000)
                this.polygon.setOptions({strokeColor: "green" })
            }.bind(this), "routingtask", this.cluster.id.toString());
            this.signalRHub.start();
        }
    }
    createClusterHTML() {
        //Create HTML Cluster
        this.polygonDiv = $('#cluster-template').tmpl({ guid: this.guid.slice(0,8) });
        this.clusterinfotemplate = $('#clusterSubInfo').tmpl();
        this.btnDelete =   $('<a>', {
            class: 'btn btn--deleteCluster',
            html: '<i class="fa-solid fa-minus"></i>'
        });
        this.labelTotalKm = $('<h2>', {
           
        });
        this.btnDelete.on('click', function (event) {
            event.stopPropagation();
             
            showDialog('Remove Cluster', 'Do you want to remove the cluster ?',async function (obj) {
                obj.polygonDiv.remove();
                obj.polygon.setMap(null)
                debugger
                for (let key in obj.listpolyline) {
                    if (obj.listpolyline.hasOwnProperty(key)) {
                        let poly  = obj.listpolyline[key];
                        poly.polyline.setMap(null)
                    }
                }
                
                obj.markers.forEach((e) => {
                    e.polygonID = null;
                })
                var response = await fetch(`/api/cluster/delete/${obj.cluster.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('JWTToken')}`
                    }
                })
/*                obj.clusterId = null;*/
                var data = await response.json();
                console.log(data);

            }, this);
        }.bind(this));

        this.polygonDiv.find('.card-header.cluster h5')
            .append(this.clusterinfotemplate)
            .append(this.labelTotalKm)
            .append(this.btnDelete)
      /*      .append(this.btnMerge)*/
        //hover to cluster the polygon on map will change color
        this.polygonDiv.find('.card-header.cluster').hover(
            function () {
                this.markersAll.forEach(e => {
                    e.markerOnMap.setMap(null)
                })
                this.markers.forEach(e => {
                    e.markerOnMap.setMap(this.googlemapinstance.map)
                })
                this.polygon.setOptions({
                    fillOpacity: 0.3
                });
                Object.keys(Dashboard.dicPolylineOnMap).forEach(key => {
                    
                    let value = Dashboard.dicPolylineOnMap[key].polyline;
                    value.setMap(null)
                });
                Object.keys(this.listpolyline).forEach(key => {
                    
                    let value = this.listpolyline[key].polyline;
                    value.setMap(this.googlemapinstance.map)
                });


            }.bind(this),
            function () {
                this.markersAll.forEach(e => {
                    e.markerOnMap.setMap(this.googlemapinstance.map)
                })
                this.polygon.setOptions({
                    fillOpacity: 0.1
                });

                Object.keys(Dashboard.dicPolylineOnMap).forEach(key => {
                    
                    let value = Dashboard.dicPolylineOnMap[key].polyline;
                    value.setMap(this.googlemapinstance.map)
                });
                

            }.bind(this)
        );
    }
    updateclusterinfoDiv() {
         
        const orange = this.markers.filter((marker) => marker.FillPercent > 33 && marker.FillPercent <= 80);
        const red = this.markers.filter((marker) => marker.FillPercent > 80);
        this.clusterinfotemplate.find('.orangeCount').html(orange.length);
        this.clusterinfotemplate.find('.redCount').html(red.length);
    }
 
    createClusterConfig() {
        
        this.clusterConfig = new ClusterConfig(this.polygonDiv, this.markers, this.liststartpoint,this.cluster);
    }
    async addRoutingHanleClick() {
        const self = this;
        this.polygonDiv.find('.routingbtn').click(async (e) => {
            var loading = appendOverlay()
            this.clusterConfig.breadcrumbRouting.tabsList['Result'].contentDiv.append(loading)
            this.#clearRoutingDetail();
            e.preventDefault();
            var respone = await self.routing();
             debugger
            this.cluster = respone.task;
            this.polygon.setOptions({ editable: false, draggable: false, strokeColor :"orange"})
            this.WaitRoutingDetail();
           /* var arrsort = respone.sorted_id;
            var distance = respone.distance_km;
            self.labelTotalKm.html(distance+" KM")
            for (var i = 1; i < arrsort.length; i++) {
                var markerpast = arrsort[i - 1]
                var markercurrent = arrsort[i]
                var from = self.markers.filter((e) => e.ID == markerpast)[0]
                var to = self.markers.filter((e) => e.ID == markercurrent)[0]
                if (to) {
                    self.listpolyline[[from.ID, to.ID]] = await self.googlemapinstance.drawRoute(from, to)
                    // Thêm Chi tiết lộ trình lên HTML
                    this.#generateRoutingDetail(self.listpolyline[[from.ID, to.ID]])
                }

            }*/
            loading.remove();
          
        });
    }
    async RoutingDetailGenerate(arrsort, distance) {
           this.labelTotalKm.html(parseInt(distance,10)+" KM")
           for (var i = 1; i < arrsort.length; i++) {
               var markerpast = arrsort[i - 1]
               var markercurrent = arrsort[i]
               var from = this.markers.filter((e) => e.ID == markerpast)[0]
               if (from == null) {
                   from = this.liststartpoint.filter((e) => e.ID == markerpast)[0]
               }
               var to = this.markers.filter((e) => e.ID == markercurrent)[0]
               if (to == null) {
                   to = this.liststartpoint.filter((e) => e.ID == markercurrent)[0]
               }
               if (to) {
                   this.listpolyline[[from.ID, to.ID]] = await this.googlemapinstance.drawRoute(from, to)
                   
                   Dashboard.dicPolylineOnMap[[from.ID, to.ID]] = this.listpolyline[[from.ID, to.ID]]
                   // Thêm Chi tiết lộ trình lên HTML
                   this.#generateRoutingDetail(this.listpolyline[[from.ID, to.ID]])
               }

           }
    }
    addClusterDivHover() {
        this.polygonDiv.find('.card-header').dblclick(() => {
            var center = this.#getPolygonCenter();
            this.googlemapinstance.setCenter(center);
        })
    }
    
    #getPolygonCenter()
    {
        var polygon = this.getArrayPath();
        // Check if the input is an array and has at least 3 coordinates
        if (!Array.isArray(polygon) || polygon.length < 3) {
            return null;
        }

        let centerLat = 0;
        let centerLng = 0;

        for (let i = 0; i < polygon.length; i++) {
            centerLat += polygon[i].lat;
            centerLng += polygon[i].lng;
        }

        centerLat /= polygon.length;
        centerLng /= polygon.length;

        return { lat: centerLat, lng: centerLng };
    }
    #generateRoutingDetail(data) {
         
        var element = $("#cardTemplate").tmpl(data.polylineInfo).appendTo(this.clusterConfig.breadcrumbRouting.tabsList['Result'].contentDiv);
        var listItems = element.find('.listItems');

        // Set HTML content for each list item within the found #listItems
        for (var j = 0; j < data.polylineInfo.htmlArray.length; j++) {
            listItems.append('<li class="list-group-item leg"><div>' + (data.polylineInfo.iconArray[j] != null ? '<img src="/img/directions/' + data.polylineInfo.iconArray[j] +'.png" alt="My Image">' : '') +'</div><div>' + data.polylineInfo.htmlArray[j] + '</div></li>');
        }
        element.find('.card-header').attr('data-route', data.polylineInfo.srcMarker.ID + ',' + data.polylineInfo.desMarker.ID)
        element.find('.card-header').click(function (e) {
            $(e.currentTarget).parent().find('.route-detail').toggleClass('collapsed')
            $(e.currentTarget).find('.fa-solid').toggleClass('fa-caret-down fa-caret-up');
        });

        element.find('.card-header').hover(
            function (e) {

                var route = $(e.currentTarget).data('route');
                data.polyline.setOptions({ strokeColor: 'Green', strokeOpacity: 1, zIndex: 10 });
            },
            function (e) {

                var route = $(e.currentTarget).data('route');
                data.polyline.setOptions({ strokeColor: '#4687ff', strokeOpacity: 0.5, zIndex: 5 });
            }
        );

    }
    #clearRoutingDetail() {
        for (let key in this.listpolyline) {
            if (this.listpolyline.hasOwnProperty(key)) {
                let poly = this.listpolyline[key];
                poly.polyline.setMap(null)
            }
        }
        this.listpolyline={}
        this.polygonDiv.find('.direction').remove();
    }
    #generateGUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    async routing() {
        var url = '/api/TSPSolve';
        debugger
        var IDs = this.markers.map(item => item.ID);
        debugger
        var oldid = this.cluster?.id;
        var firstValue = this.clusterConfig.dropdownStartPoint.getSelectedItem().id;
        var endValue = this.clusterConfig.dropdownEndPoint.getSelectedItem().id;
        var tspmodelid = this.clusterConfig.dropdownRoutingMethod.getSelectedItem().id;
        var startTime = this.clusterConfig.getDateTimePicker()
        var vehicleid = this.clusterConfig.dropdownVehicle.getSelectedItem().id;
        var driverid = this.clusterConfig.dropdownDriver.getSelectedItem().id;
        debugger
        var requestData = {
            wastepointsid: IDs.join(','),
            srcid: firstValue,
            desid: endValue,
            tspmodelid: tspmodelid,
            starttime: startTime,
            driverid: driverid,
            vehicleid: vehicleid,
            polygoncoordinates: JSON.stringify(this.getArrayPath()),
            usebacksourceoptimize: true,
            categoryid: getQueryParamValue('category'),
            oldid: oldid
 
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('JWTToken')}`
            },
            body: JSON.stringify(requestData)
        });
        debugger
        var data = await response.json();
        return data;
    }
    checkContainMarker = function (marker) {
        const point = new google.maps.LatLng(marker.Lat, marker.Lng);
        return google.maps.geometry.poly.containsLocation(point, this.polygon)
    }
    checkOverlaps(listPoligon) {
        // Implement the logic to check for overlaps between polygons
    }
    // lấy tọa độ polygon
    getArrayPath() {
         return this.polygon.getPath().getArray().map(latLng => ({
                lat: latLng.lat(),
                lng: latLng.lng(),
                }));
    
    }
}
class ClusterConfig {
    #polygonDiv = null;
    constructor(polygonDiv, markers, liststartpoint, cluster) {
        // div polygon
        this.#polygonDiv = polygonDiv;
        this.markers = markers;
        this.cluster = cluster
        this.liststartpoint = liststartpoint
        // khai báo breadcrumb tab cho config , cung cấp 2 hàm go next go previous để chuyển tab
        this.breadcrumbRouting = null;
        this.init();
    }
    init() {
        const tabs = [
            { title: 'Routing config', active: true },
            { title: 'Collecting config', active: false },
            { title: 'Result', active: false }
        ];

        this.breadcrumbRouting = new BreadcrumbRouting(tabs);
        this.#polygonDiv.find('.card-body.content').append(this.breadcrumbRouting.getDiv());
        this.initRoutingConfigTab();
        this.initCollectingConfigTab();
        this.initResultConfigTab();
    }
 
    initRoutingConfigTab() {
        const routingConfigContent = this.breadcrumbRouting.tabsList['Routing config'].contentDiv;
        routingConfigContent.append(this.createDropdownRoutingMethod());
        routingConfigContent.append(this.createDropdownStartPoint());
        routingConfigContent.append(this.createDropdownEndPoint());
        routingConfigContent.append(this.createNavigationButtons(false, true));
    }

    initCollectingConfigTab() {
        const collectingConfigContent = this.breadcrumbRouting.tabsList['Collecting config'].contentDiv;
        collectingConfigContent.append(this.createDropdownVehicleAssign());
        collectingConfigContent.append(this.createDropdownDriverAssign());
        collectingConfigContent.append(this.createDateTimePicker());
        collectingConfigContent.append(this.createNavigationButtons(true, true, 'routingbtn'));
        
    }
    initResultConfigTab() {
        const collectingConfigContent = this.breadcrumbRouting.tabsList['Result'].contentDiv;
        collectingConfigContent.append(this.createNavigationButtons(true, false));
    }

    createNavigationButtons(isNotFirstStep, isNotLastStep,extendclass) {
      
        const navigationDiv = $('<div>', { class: 'navigationDivBtn' });
         
        
        if (isNotLastStep) {
            navigationDiv.append($('<button>', {
                type: 'button',
                css: { height: '40px', width: '100px' },
                class: 'btn next purple ' + (extendclass ? extendclass:''),
                title: 'Next',
                html: '<i class="fa-solid fa-arrow-right"></i>',
                click: () => {
                    this.breadcrumbRouting.goNext()
                }
            }));
        }
        if (isNotFirstStep) {
            navigationDiv.append($('<button>', {
                type: 'button',
                css: { height: '40px', width: '100px', marginRight: '10px' },
                class: 'btn previous purple ',
                title: 'Previous',
                html: '<i class="fa-solid fa-arrow-left"></i>',
                click: () => this.breadcrumbRouting.goPrevious()
            }));
        }

        return navigationDiv;
    }
    createDateTimePicker() {
        var divtime = $('<div>', {
            class: 'dropdown-item-template-row DropdownMenu',
            id: 'id_2'
        })
        var Label = $('<label>');
        Label.text('Start time');

        // Set the style attribute
        Label.css('opacity', '0.5');
        var divElement = $('<div>', {
            class: 'btn-group dropdown',
            style: 'width: fit-content;'
        });
        this.startTime = $('<input>', {
            type: 'text',
            class: 'demo'
        });
        divtime.append(Label).append(divElement.append(this.startTime))
        
        this.startTime.fxtime()
        if (this.cluster?.startTime) {
            var datetime = new Date(this.cluster.startTime);

            var hours = datetime.getHours().toString().padStart(2, '0');;
            var minutes = datetime.getMinutes().toString().padStart(2, '0');;
            var ampm = hours >= 12 ? 'PM' : 'AM';
          /*  hours = hours % 12 || 12; // This line converts 0 to 12*/
            var time = hours + ':' + minutes
            this.startTime.fxtime('val', time);
          /*  this.startTime.fxtime('seg', 2, ampm);*/


        }
        return divtime;
  
    }
    parseTimeToDateTime(timeString) {
        // Match the timeString against the regex pattern
        var timeParts = timeString.match(/^(\d{1,2}):(\d{2}) ([APap][Mm])$/);

        // If no match, throw an error
        if (!timeParts) {
            return null;
        }

        // Extract hours, minutes, and period (AM/PM) from the matched groups
        var hours = parseInt(timeParts[1], 10);
        var minutes = parseInt(timeParts[2], 10);
        var period = timeParts[3].toUpperCase();

        // Adjust hours for AM/PM format
        if (period === 'PM' && hours < 12) {
            hours += 12;
        } else if (period === 'AM' && hours === 12) {
            hours = 0;
        }

        // Create a new Date object with today's date and the parsed time
        var now = new Date();
        var parsedTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);

        return parsedTime;
    }

    getDateTimePicker() {
        // Set the value of the 'end_time' input field
        var time =this.parseTimeToDateTime(this.startTime.val())
        return time
    }
    createRoutingBtn() {
        return $('<div>', { class: 'nextDivBtn' }).append($('<button>', {
            type: 'button',
            css: { height: '40px', width: '100px' },
            class: 'btn routingbtn',
            title: 'Routing items',
            html: '<i class="fa-solid fa-arrow-right"></i>'
        }));
    }

    createDropdownMenu(data, label, isTextbox = true, isRow = true, callback,initid) {
        /*this.initId*/
        
        return new DropdownMenu({ data, label, isTextbox, isRow, searchCallback: callback, initid: initid });
    }

    createDropdownRoutingMethod() {
        const data = [
            { id: 0, text: 'Auto Select' },
            { id: 1, text: 'Genetic' },
            { id: 2, text: 'Ant Colony' },
            { id: 3, text: 'Nearest Neighbor' },
            { id: 4, text: 'Dynamic Program' }
        ];
        debugger
        this.dropdownRoutingMethod = this.createDropdownMenu(data, 'Routing method', true, true, async (key) => {
            var dataobj = []
            const response = await fetch(`/api/Category/GetList?table=tspmodels&offset=0&limit=0&keyword=${key}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('JWTToken')}`
                }
            });
            dataobj = await response.json();
            const mappedData = dataobj.data.map(item => ({
                id: item.id,
                text: item.name
            }));
            return mappedData;

        }, this.cluster?.tspModelId);
        return this.dropdownRoutingMethod.dropdownQuery;
    }

    createDropdownStartPoint() {
         
        const data = this.liststartpoint.map(marker => ({ id: marker.ID, text: `${marker.StreetName.slice(0, 20)}...`, fulltext: `${marker.StreetName}` }));
        this.dropdownStartPoint = this.createDropdownMenu(data, 'Start point', true, true,null,this.cluster?.wasteSRCID)
        return this.dropdownStartPoint.dropdownQuery;
    }
    createDropdownEndPoint() {

        const data = this.liststartpoint.map(marker => ({ id: marker.ID, text: `${marker.StreetName.slice(0, 20)}...`, fulltext: `${marker.StreetName}` }));
        this.dropdownEndPoint = this.createDropdownMenu(data, 'End point', true, true, null, this.cluster?.wasteDESID)
        return this.dropdownEndPoint.dropdownQuery;
    }


    createSaveBtn() {
        return $('<button>', {
            type: 'button',
            css: { height: '40px', 'margin-top': '20px' },
            class: 'btn chooseVehiclebtn',
            title: 'Save',
            html: '<i class="fa-solid fa-route"></i>'
        });
    }

    createDropdownVehicleAssign() {
      
        this.dropdownVehicle=this.createDropdownMenu(null, 'Vehicle Assign', true, true,async (key) => {
            var dataobj = []
            const response = await fetch(`/api/Category/GetList?table=vehicle&offset=0&limit=0&keyword=${key}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('JWTToken')}`
                }
            });
            dataobj = await response.json();
            
            const mappedData = dataobj.data.map(item => ({
                id: item.id,
                text: item.plateNumber
            }));
            return mappedData;
        }, this.cluster?.vehicleID);

        return this.dropdownVehicle.dropdownQuery;
    }
    createDropdownDriverAssign() {

        this.dropdownDriver = this.createDropdownMenu(null, 'Driver Assign', true, true, async (key) => {
            var dataobj = []
            const response = await fetch(`/api/Category/GetList?table=driver&offset=0&limit=0&keyword=${key}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('JWTToken')}`
                }
            });
            dataobj = await response.json();
            const mappedData = dataobj.data.map(item => ({
                id: item.id,
                text: item.fullname
            }));
            return mappedData;
        }, this.cluster?.driverID)
        return this.dropdownDriver.dropdownQuery;
    }
}
class BreadcrumbRouting {
    constructor(breadcrumbItems) {
        this.tabsList = {};
        this.breadcrumbItems = breadcrumbItems;
        this.currentItem = null;
        this.previousItem = null;
        this.nextItem = null;

        this.container = $('<div/>', {
            class: 'breadcrumb-container'
        });
        this.breadcrumb = $('<nav/>', {
            'aria-label': 'breadcrumb'
        });
        this.headers = $('<div/>', {
            class: 'wizard',
        });
        this.contents = $('<div/>', {
            class: 'tab-contents'
        });

        this.ol = $('<ol/>', {
            class: 'breadcrumb'
        });

        this.init();
        return this;
    }

    init() {
        this.createBreadcrumbNavigation();
        this.updateNavigation();
    }

    getDiv() {
        return this.container;
    }

    createBreadcrumbNavigation() {
        this.breadcrumbItems.forEach((item, index) => {
            const $li = $('<a/>', {
                class: item.active ? 'active' : '',
 
            }).click(() => this.handleBreadcrumbClick(item));

            const $link = $('<span/>').text(item.title);
            $li.append($link);

            const $tabContent = $('<div/>', {
                class: 'tabrouting-content',
                for: `${item.title}`,
                style: item.active ? '' : 'display:none;'
            });

            this.tabsList[item.title] = { headerDiv: $li, contentDiv: $tabContent };
            this.headers.append(this.tabsList[item.title].headerDiv);
            this.contents.append(this.tabsList[item.title].contentDiv);

            if (item.active) {
                this.currentItem = item;
            }
        });

        this.container.append(this.headers).append(this.contents);
    }

    handleBreadcrumbClick(item) {
        this.previousItem = this.currentItem;
        this.currentItem = item;

        for (let key in this.tabsList) {
            if (key != item.title) {
                this.tabsList[key].headerDiv.removeClass('active');
                this.tabsList[key].contentDiv.hide();
            } else {
                this.tabsList[key].headerDiv.addClass('active');
                this.tabsList[key].contentDiv.show();
            }
        }

        this.updateNavigation();
    }

    updateNavigation() {
        const currentIndex = this.breadcrumbItems.indexOf(this.currentItem);
        this.previousItem = currentIndex > 0 ? this.breadcrumbItems[currentIndex - 1] : null;
        this.nextItem = currentIndex < this.breadcrumbItems.length - 1 ? this.breadcrumbItems[currentIndex + 1] : null;
    }

    goNext() {
        if (this.nextItem) {
            this.handleBreadcrumbClick(this.nextItem);
        }
    }

    goPrevious() {
        if (this.previousItem) {
            this.handleBreadcrumbClick(this.previousItem);
        }
    }
}
class TabConfigRouting {
    constructor(tabs) {
        this.tabsList = {}
        this.tabs = tabs;
        this.container = $('<div/>', {
            class: 'bd-example'
        });
        this.headers = $('<ul/>', {
            class: 'nav nav-tabs mb-3',
            role: 'tablist'
        });
        this.contents = $('<div/>', {
            class: 'tab-contents'
        });
       
        this.init();
        return this
    }

    init() {
        this.createTabNavigation();
    }
    getDiv() {
        return this.container
    }
    createTabNavigation() {
        this.tabs.forEach((tab, index) => {
            const $headerItem = $('<li/>', {
                class: 'nav-item',
                role: 'presentation'
            });

            const $tabButton = $('<button/>', {
                class: 'nav-link',
                'data-bs-toggle': 'tab',
                'data-bs-target': `#${tab.title}`,
                type: 'button',
                role: 'tab',
                'aria-controls': tab.title,
                'aria-selected': index === 0 ? 'true' : 'false'
            }).text(tab.title)
             .click(() => this.handleTabClick(tab));
            $headerItem.append($tabButton)
      
            const $tabContent = $('<div/>', {
                class: 'tabrouting-content',
                for: `${tab.title}`
            });
            this.tabsList[tab.title] = { headerDiv: $headerItem, contentDiv: $tabContent }
            this.headers.append(this.tabsList[tab.title].headerDiv)
            this.contents.append(this.tabsList[tab.title].contentDiv)
        });
         
        this.container.append(this.headers).append(this.contents)

    }

    
    handleTabClick(tab) {
        this.tabsList[tab.title]
        for (let key in this.tabsList) {
            if (key != tab.title) {
                this.tabsList[key].headerDiv.find('button').removeClass('active')
                this.tabsList[key].contentDiv.hide();
            } else {
                this.tabsList[key].headerDiv.find('button').addClass('active')
                this.tabsList[key].contentDiv.show();
            }
        }
        // Add your custom logic here
        console.log(`Clicked on tab: ${tab.title}`);
    }

}
class TabsManager {
    constructor(navSelector, contentsSelector) {
        this.$navItems = $(navSelector).find('.nav-item');
        this.$contentsContainer = $(contentsSelector);
        this.$tabs = {};

        this.#initTabs();
        this.#setupTabSwitching();
    }

    #initTabs() {
        this.$navItems.each((index, navItem) => {
            const $radioInput = $(navItem).find('input[name="radio-tab"]');

            const $tabContent = $('<div>').addClass('tab-content');
            const isRadioChecked = $radioInput.is(':checked');
            if (isRadioChecked) {
                $tabContent.removeClass('d-none');
            } else {
                $tabContent.addClass('d-none');
            }
            this.$tabs[$radioInput.attr('id')] = $tabContent;
            this.$contentsContainer.append($tabContent);
        });
    }

    #setupTabSwitching() {
        this.$navItems.find('input[name="radio-tab"]').on('change', (event) => {
            this.#switchTab($(event.target).attr('id'));
        });
    }

    #switchTab(selectedTabId) {
        $('.tab-content', this.$contentsContainer).addClass('d-none');
        this.$tabs[selectedTabId].removeClass('d-none');
    }
}
class DropdownMenu {
    constructor(options) {
        this.initId = options.initid,
        this.isInit = false;
        this.label = options.label;
        this.data = options.data || [];
        
        this.selectedItem = this.data[0] || null;
        this.isTextbox = options.isTextbox || false;
        this.isRow = options.isRow || false;
        this.searchCallback = options.searchCallback;
        this.selectCallback = options.selectCallback;
        this.createDropdown();
        this.initData();
    }

    async initData() {
        var filteredData;
        if (this.initId) {
            if (this.searchCallback) {
                filteredData = await this.searchCallback("")
                this.renderItems(filteredData);

                if (this.isInit == false) {
                    filteredData = filteredData.filter(item => item.id == this.initId)[0];
                    this.mainElement.attr('value', filteredData.text)
                    this.selectedItem = filteredData
                    this.isInit = true;
                }
            } else {
                if (this.isInit == false) {
                    filteredData = this.data.filter(item => item.id == this.initId)[0];
                    this.mainElement.attr('value', filteredData.text)
                    this.selectedItem = filteredData
                    this.isInit = true;
                }
            }
        } else {
            if (this.searchCallback) {
                var filteredData = await this.searchCallback("")
                this.renderItems(filteredData);
            }
         
        }
      
     

    }

    createDropdown() {
        // Create the dropdown container
        this.dropdownQuery = $('<div>', {
            class: this.isRow ? 'dropdown-item-template-row DropdownMenu' : 'dropdown-item-template-column'
        });

        // Create the label if provided
        if (this.label) {
            const label = $('<label>', {
                for: 'exampleFormControlInput1',
                css: { opacity: '0.5' },
                text: this.label
            });
            this.dropdownQuery.append(label);
        }

        // Create the dropdown button group
        const dropdownGroup = $('<div>', {
            class: 'btn-group dropdown',
            css: { width: 'fit-content' }
        });
        this.dropdownQuery.append(dropdownGroup);

        this.mainElement;
        if (this.isTextbox) {
            // Create the main text box
            this.mainElement = $('<input>', {
                type: 'text',
                title: this.selectedItem?.fulltext,
                value: this.selectedItem ? this.selectedItem.text : '',
                css: {
                    outline: 'none',
                    border: 'none',
                    background: 'whitesmoke'
                },
                keyup: this.filterItems.bind(this),
                focus: () => this.dropdownMenu.addClass('show'),
                blur: () => setTimeout(() => {
                    if (!this.dropdownMenu.is(":hover")) {
                        this.dropdownMenu.removeClass("show");
                    }
                }, 200)
            });
        } else {
            // Create the main dropdown button
            this.mainElement = $('<button>', {
                type: 'button',
                title: this.selectedItem.fulltext,
                class: 'btn--numClusterChoice',
                text: this.selectedItem ? this.selectedItem.text : 'Select'
            });
        }

        dropdownGroup.append(this.mainElement);

        // Create the dropdown toggle button
        const dropdownToggleButton = $('<button>', {
            type: 'button',
            class: 'btn btn-purple dropdown-toggle dropdown-toggle-split',
            'aria-haspopup': 'true',
            'aria-expanded': 'true',
            click: () => this.dropdownMenu.toggleClass('show')
        });
        const toggleButtonSpan = $('<span>', {
            class: 'sr-only',
            text: 'Toggle Dropdown'
        });
        dropdownToggleButton.append(toggleButtonSpan);
        dropdownGroup.append(dropdownToggleButton);

        // Create the dropdown menu with a maximum height and overflow scroll
        this.dropdownMenu = $('<div>', {
            class: 'dropdown-menu dropdown-menu-right',
            css: {
                width: '100%',
                top: '40px',
                position: 'absolute',
                maxHeight: this.data.length > 10 ? '200px' : 'none',
                overflowY: this.data.length > 10 ? 'scroll' : 'visible'
            }
        });
        dropdownGroup.append(this.dropdownMenu);

        // Add marker options to the dropdown menu
        this.renderItems(this.data);
    }
    //data like text,id
    renderItems(items) {
        this.dropdownMenu.empty();
        items.forEach(item => {
            const dataOption = $('<button>', {
                class: 'dropdown-item',
                type: 'button',
                title:item.fulltext,
                'data-id': item.id,
                text: item.text,
                css: { marginTop: '5px' },
                click: event => {
                    event.stopPropagation();
                    this.selectedItem = item;
                    if (this.isTextbox) {
                        $('input', this.dropdownQuery).val(item.text);
                    } else {
                        $('button.btn--numClusterChoice', this.dropdownQuery).first().text(item.text);
                    }
                    if (this.selectCallback) {
                        this.selectCallback(this.selectedItem.id)
                    }
                    this.dropdownMenu.removeClass('show');
                }
            });
            this.dropdownMenu.append(dataOption);
        });
    }

    async filterItems(event) {
        
        const query = event.target.value.toLowerCase();
        var filteredData;
        if (this.searchCallback != null) {
            this.data = await this.searchCallback(query);
            this.renderItems(this.data);
        } else {
            filteredData = this.data.filter(item => item.text.toLowerCase().includes(query));
            this.renderItems(filteredData);
        }
       
    }

    getSelectedItem() {
        return this.selectedItem;
    }
}
class Datepicker {
    constructor(options) {
        this.selectedDate = options.inputDate ? new Date(options.inputDate) : new Date();
        this.datetimepickerQuery = null;
        this.callback = options.callback || null;
        this.createDatepicker();
    }

    createDatepicker() {
        // Create the datetimepicker container
        this.datetimepickerQuery = $('<div class="dropdown-item-template-column"><div class="btn-group dropdown" style="width: fit-content;"><input type="text" class="btn--numClusterChoice"></div></div>');

        // Append the datetimepicker container to the body or any other desired container
        $('body').append(this.datetimepickerQuery);

        // Initialize Bootstrap Datepicker on the input field
        this.datetimepickerQuery.find('input').datepicker();

        if (this.selectedDate) {
            this.datetimepickerQuery.find('input').datepicker('setDate', this.selectedDate);
        }

        // Add event listener to hide the Datepicker when a date is selected and trigger the callback
        this.datetimepickerQuery.find('input').on('changeDate', () => {
            // Hide the Datepicker widget
            this.datetimepickerQuery.find('input').datepicker('hide');

            // Trigger the callback function if it exists
            if (this.callback && typeof this.callback === 'function') {
                this.callback(this.getSelectedDate());
            }
        });
    }

    getSelectedDate() {
        const selectedDate = this.datetimepickerQuery.find('input').datepicker('getDate');
        return selectedDate;
    }
}

class DropdownMenuChoiceCluster {
    constructor(options) {
        this.markers = options.markers;
        this.drawPolygonFunc = options.drawPolygonFunc
        this.clearPolygonFunc = options.clearPolygonFunc
        this.label = options.label;
        this.data = options.data || [];
        this.selectedItem = null;
        this.dropdownQuery = null;
        this.isTextbox = options.isTextbox || false;
        this.createDropdown();
        this.isRow = options.isRow||false
    }
    async handleClusteringClick() {
         
        //this.clearPolygonFunc();
        var arrclusters = await Cluster.Clustering(this.markers.filter(e => e.polygonID==null), this.selectedItem.id);
        if (arrclusters.length > 0) {
            this.drawPolygonFunc(arrclusters)
        }
    }
    createDropdown() {
        // Create the dropdown container
        if (this.isRow) {
            this.dropdownQuery = $('<div>', {
                class: 'dropdown-item-template-row DropdownMenuChoiceCluster'
            });
        } else {
            this.dropdownQuery = $('<div>', {
                class: 'dropdown-item-template-column'
            });
        }
        
        if (this.label) {
            // Create the label
            const label = $('<label>', {
                for: 'exampleFormControlInput1',
                css: {
                    opacity: '0.5'
                },
                text: this.label
            });
            this.dropdownQuery.append(label);
        }


        // Create the dropdown button group
        const dropdownGroup = $('<div>', {
            class: 'btn-group dropdown',
            css: {
                width: 'fit-content'
            }
        });
        this.dropdownQuery.append(dropdownGroup);

        let mainElement;
        var itemselect = this.data[0] || null;
        this.selectedItem = itemselect;
        if (this.isTextbox) {
            // Create the main text box
            mainElement = $('<input>', {
                type: 'text',
                class: '',
                value: this.selectedItem.text,
                css: {
                    outline: 'none',
                    border: 'none',
                    background: 'whitesmoke'
                },
                keyup: function (event) {
                    this.filterItems(event.target.value);
                }.bind(this),
                focus: function (event) {
                    this.dropdownMenu.toggleClass('show')
                }.bind(this),
                blur: function (event) {
                    if (!this.dropdownMenu.is(":hover")) {
                        // Mouse is not over the dropdown menu, hide it
                        this.dropdownMenu.removeClass("show");
                    }
                }.bind(this)

            });

        } else {
            // Create the main dropdown button
            mainElement = $('<button>', {
                type: 'button',
                class: 'btn--numClusterChoice',
                text: this.selectedItem.text,
                click: this.handleClusteringClick.bind(this)
            });
        }


        dropdownGroup.append(mainElement);

        // Create the dropdown toggle button
        const dropdownToggleButton = $('<button>', {
            type: 'button',
            class: 'btn btn-purple dropdown-toggle dropdown-toggle-split',

            'aria-haspopup': 'true',
            'aria-expanded': 'true',
            click: function (event) {
                this.dropdownMenu.toggleClass('show')
            }.bind(this),
            blur: function (event) {
                if (!this.dropdownMenu.is(":hover")) {
                    // Mouse is not over the dropdown menu, hide it
                    this.dropdownMenu.removeClass("show");
                }
            }.bind(this)
        });
        const toggleButtonSpan = $('<span>', {
            class: 'sr-only',
            text: 'Toggle Dropdown'
        });
        dropdownToggleButton.append(toggleButtonSpan);
        dropdownGroup.append(dropdownToggleButton);

        // Create the dropdown menu with a maximum height and overflow scroll
        this.dropdownMenu = $('<div>', {
            class: 'dropdown-menu dropdown-menu-right',
            css: {
                width: '100%',
                top: '40px',
                position: 'absolute',
                maxHeight: this.data.length > 10 ? '200px' : 'none', // Set max height if items > 10
                overflowY: this.data.length > 10 ? 'scroll' : 'visible' // Enable scrolling if items > 10
            }
        });
        dropdownGroup.append(this.dropdownMenu);

        // Add marker options to the dropdown menu
        this.renderItems(this.data);

    }

 
    renderItems(items) {
        this.dropdownMenu.empty();
        items.forEach((item, index) => {
            const dataOption = $('<button>', {
                class: 'dropdown-item',
                type: 'button',
                'data-id': item.id,
                text: item.text,
                css: {
                    marginTop: '5px' // Add 5px margin to the top of each item
                },
                click: function (event) {

                    event.stopPropagation(); // Prevent the dropdown from closing
                    var itemid = $(event.target).data('id');
                    const filteredData = this.data.filter((item, index) => item.id == itemid)[0] || null;
                    this.selectedItem = item;
                    if (this.isTextbox) {
                        $('input', this.dropdownQuery).val(filteredData.text);
                    } else {
                        $('button.btn--numClusterChoice', this.dropdownQuery).first().text(filteredData.text);
                    }
                    this.dropdownMenu.toggleClass('show');
                }.bind(this)
            });
            this.dropdownMenu.append(dataOption);
        });
    }

    filterItems(query) {
        const filteredData = this.data.filter((item, index) => {

            var rs = `Marker ${item.ID}`.toLowerCase().includes(query.toLowerCase())
            return rs
        });
        this.renderItems(filteredData);
    }

    getSelectedItem() {
        return this.selectedItem;
    }
}
class MarkerInstance {

    static dicMarkerOnMap = {}
    constructor() {
       
    }
    // Static method to fetch marker data
    static async fetchMarker(url = '/api/GarbagePoint?offset=1&limit=200') {
        var dataobj = []
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('JWTToken')}`
            }
        });
        dataobj = await response.json();
        return dataobj.data;
    }
    // Static method to get trash icon based on percentage
    static getTrashIcon(percent) {
        var path = "M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"
        var trash_red_full = {
            path: path,
            fillColor: '#FF0000',
            fillOpacity: 1,
            anchor: new google.maps.Point(250, 250),
            strokeWeight: 1,
            scale: 0.03
        }
        var trash_green_empty = {

            path: path,
            fillColor: '#006400',
            fillOpacity: 1,
            anchor: new google.maps.Point(250, 250),
            strokeWeight: 1,
            scale: 0.03
        }
        var trash_yellow_medium = {

            path: path,
            fillColor: '#FFA500',
            fillOpacity: 1,
            anchor: new google.maps.Point(250, 250),
            strokeWeight: 1,
            scale: 0.03
        }
        if (percent >= 0 && percent <= 33) {
            return trash_green_empty;
        } else if (percent > 33 && percent <= 80) {
            return trash_yellow_medium;
        } else if (percent > 80 && percent <= 100) {
            return trash_red_full;
        } else {
            // Handle cases where the input is out of range
            return 'invalid';
        }
    }
    static getMarkersForRouting(markers) {
        return markers.filter(function (marker) {
            return marker.FillPercent > 33;
        });
    }
    static getTrashIconColor(percent) {
        if (percent >= 0 && percent <= 33) {
            return '#006400'; // Green
        } else if (percent > 33 && percent <= 80) {
            return '#FFA500'; // Orange
        } else if (percent > 80 && percent <= 100) {
            return '#FF0000'; // Red
        } else {
            // Handle cases where the input is out of range
            return 'invalid';
        }
    }
    // Static method to set markers on the map
    static setMarkers(map, markers) {
         
        var infoWindow = new google.maps.InfoWindow();
        var lat_lng = new Array();
        var latlngbounds = new google.maps.LatLngBounds();

        for (var i = 0; i < markers.length; i++) {
            var percent = markers[i].FillPercent

            var myLatlng = new google.maps.LatLng(markers[i].Lat, markers[i].Lng);
            lat_lng.push(myLatlng);
           
            var marker = new google.maps.Marker({
                position: myLatlng,
                map: map,
                title: percent.toString(),
                icon: this.getTrashIcon(percent)
            });
            markers[i].markerOnMap = marker;
            latlngbounds.extend(marker.position);
            var circleOptions = {
                center: marker.getPosition(),
                radius: 5, // Radius of the circle in meters
                strokeColor: 'white', // Color of the circle outline
                strokeOpacity: 1, // Opacity of the circle outline
                strokeWeight: 2, // Thickness of the circle outline
                fillColor: this.getTrashIconColor(percent), // Color of the circle fill
                fillOpacity: 0.4 // Opacity of the circle fill
            };

            var circle = new google.maps.Circle(circleOptions);
            circle.setMap(map);
            this.dicMarkerOnMap[markers[i].ID] = {
                markeronmap: marker, circle, marker:markers[i]
            };
            (function (marker, percent, id) {
                google.maps.event.addListener(marker, "click", function (e) {
                    console.log(e)
                    var color;
                    // Determine the color based on the logic
                    if (percent >= 0 && percent <= 33) {
                        color = 'green'; // or trash_green_empty if you have predefined colors
                    } else if (percent > 33 && percent <= 80) {
                        color = 'orange'; // or trash_yellow_medium
                    } else if (percent > 80 && percent <= 100) {
                        color = 'red'; // or trash_red_full
                    } else {
                        // Handle cases where the input is out of range
                        color = 'invalid';
                    }
                    var titleText = 'hehe'
                    // Set the content of the info window with a progress bar and percentage
                    infoWindow.setContent('<div style="align-items:center;flex-direction:column;display:flex;width: 250px; height: 70px; text-align: center;">' +
                        '<div style="margin-bottom: 5px;">Id: ' + id + '</div>' +
                        '<div style="margin-bottom: 5px;">Percent: ' + percent + '%</div>' +
                        '<div style="width: 80%; height: 20px; border: 1px solid #ccc; border-radius: 5px;">' +
                        '<div style="width: ' + percent + '%; height: 100%; background-color: ' + color + '; border-radius: 5px;"></div>' +
                        '</div>' +
                        '</div>');
                    infoWindow.open(map, marker);
                });
            })(marker, percent, markers[i].ID);

            map.setCenter(latlngbounds.getCenter());
            map.fitBounds(latlngbounds);
        }
        return this.dicMarkerOnMap
           
    }
    static updateMarker(id,percent) {
        if (this.dicMarkerOnMap.hasOwnProperty(id)) {
            var markerObj = this.dicMarkerOnMap[id];
            var markeronmap = markerObj.markeronmap;
            markerObj.marker.FillPercent = percent;
            var circle = markerObj.circle;
             // Update marker's title and icon
            markeronmap.setTitle(percent.toString());
            markeronmap.setIcon(this.getTrashIcon(percent));

            // Update circle options (color based on newFillPercent)
            var circleOptions = {
                center: markeronmap.getPosition(),
                radius: 5,
                strokeColor: 'white',
                strokeOpacity: 1,
                strokeWeight: 2,
                fillColor: this.getTrashIconColor(percent),
                fillOpacity: 0.4
            };
            circle.setOptions(circleOptions);

            // Update info window content
            var color;
            if (percent >= 0 && percent <= 33) {
                color = 'green';
            } else if (percent > 33 && percent <= 80) {
                color = 'orange';
            } else if (percent > 80 && percent <= 100) {
                color = 'red';
            } else {
                color = 'invalid';
            }
            (function (marker, percent, id) {
                google.maps.event.addListener(marker, "click", function (e) {
                    console.log(e)
                    var color;
                    // Determine the color based on the logic
                    if (percent >= 0 && percent <= 33) {
                        color = 'green'; // or trash_green_empty if you have predefined colors
                    } else if (percent > 33 && percent <= 80) {
                        color = 'orange'; // or trash_yellow_medium
                    } else if (percent > 80 && percent <= 100) {
                        color = 'red'; // or trash_red_full
                    } else {
                        // Handle cases where the input is out of range
                        color = 'invalid';
                    }
                    var titleText = 'hehe'
                    // Set the content of the info window with a progress bar and percentage
                    infoWindow.setContent('<div style="align-items:center;flex-direction:column;display:flex;width: 120px; height: 35px; text-align: center;">' +
                        '<div style="margin-bottom: 5px;">' + id + '_Percent: ' + percent + '%</div>' +
                        '<div style="width: 80%; height: 20px; border: 1px solid #ccc; border-radius: 5px;">' +
                        '<div style="width: ' + percent + '%; height: 100%; background-color: ' + color + '; border-radius: 5px;"></div>' +
                        '</div>' +
                        '</div>');
                    infoWindow.open(map, marker);
                });
            })(markeronmap, percent, id);

            // Fit map bounds to updated markers
            map.fitBounds(latlngbounds);
        } else {
            console.log('Marker with ID ' + markerId + ' not found on the map.');
        }
    }


    static getParkingIcon() {
        var path = "M64 32C28.7 32 0 60.7 0 96L0 416c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-320c0-35.3-28.7-64-64-64L64 32zM192 256l48 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-48 0 0 64zm48 64l-48 0 0 32c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-64 0-120c0-22.1 17.9-40 40-40l72 0c53 0 96 43 96 96s-43 96-96 96z"
        var parking = {
            path: path,
            fillColor: 'cyan',
            fillOpacity: 1,
            anchor: new google.maps.Point(200, 250),
            strokeWeight: 1,
            scale: 0.05
        }
        return parking;
    }
    static setStartPoint(map,points) {

        var infoWindow = new google.maps.InfoWindow();
        var lat_lng = new Array();
        var latlngbounds = new google.maps.LatLngBounds();

        for (var i = 0; i < points.length; i++) {

            var myLatlng = new google.maps.LatLng(points[i].Lat, points[i].Lng);
            lat_lng.push(myLatlng);

            var point = new google.maps.Marker({
                position: myLatlng,
                map: map,
                icon: this.getParkingIcon()
            });
            points[i].markerOnMap = point;
            latlngbounds.extend(point.position);
            var circleOptions = {
                center: point.getPosition(),
                radius: 200, // Radius of the circle in meters
                strokeColor: 'white', // Color of the circle outline
                strokeOpacity: 1, // Opacity of the circle outline
                strokeWeight: 2, // Thickness of the circle outline
                fillOpacity: 0.1 // Opacity of the circle fill
            };

            var circle = new google.maps.Circle(circleOptions);
            circle.setMap(map);
           

            map.setCenter(latlngbounds.getCenter());
            map.fitBounds(latlngbounds);
        }
       
    }

}
class Cluster {
    constructor() {
        this.init();
    }
    init() {
    }
    static async Clustering(markers,numcluster) {
        const extractedData = markers.map(item => ({
            ID: item.ID,
            Lat: item.Lat,
            Lng: item.Lng
        }));
        
        try {
            const response = await fetch('/api/cluster', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('JWTToken')}`
                },
                body: JSON.stringify({ numCluster: numcluster, markerData: extractedData })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            var data = await response.json();
            var polygons = [];
            for (var i = 0; i < data.clusters.length; i++) {
                var cluster = data.clusters[i];
                polygons.push(cluster.coordinates)
            }
             
           
            console.log('Success:', data);
            return polygons; // Return data from the async function
        } catch (error) {
            console.error('Error:', error);
            throw error; // Rethrow the error to be caught by the caller if needed
        }
}

    
}
class GridMarker {
    constructor(queryDiv, pageSize, fetchUrl, tab) {
        this.queryDiv = queryDiv
        this.pageSize = pageSize;
        this.fetchUrl = fetchUrl;
        this.tab = tab
        this.initFilter();
        this.tab.append('<div id="' + this.queryDiv + '"></div>');
        this.grid = new gridjs.Grid({
            columns: [
                {
                    name: 'datarow',
                    hidden: true,
                },
                {
                    name: 'ID',
                    width: '80px',
                    formatter: (cell, row) => {
                         
                        return gridjs.html(`<span>${row.cells[0].data.ID}</span>`);
                    },
                },
                {
                    name: 'StreetName',
                    formatter: (cell, row) => {
                        return gridjs.html(`<span>${row.cells[0].data.StreetName}</span>`);
                    },
                },
                {
                    name: 'FillPercent',
                    formatter: (cell, row) => {
                        return gridjs.html(`<span>${row.cells[0].data.FillPercent}</span>`);
                    },
                }
            ],
            pagination: {
                limit: this.pageSize,
                server: {
                    url: (prev, page, limit) =>
                        `${ this.fetchUrl }?limit=${ limit }&offset=${ page * limit}`,
                        
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('JWTToken') // Include the JWT token in the headers
                    }
                },
            },
            server: {
                url: this.fetchUrl,
                
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('JWTToken') // Include the JWT token in the headers
            },
                then: (data) => data.data.map((bin) => [bin]),
                total: (data) => data.totalRecord,
            },
           
           
        }).render(document.getElementById(this.queryDiv));

        
    }
    initFilter() {
        
        $('#binFilterTemplate').tmpl().appendTo(this.tab);
    }
}

