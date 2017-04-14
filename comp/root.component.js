function RootController(rootFactory, $mdDialog, $mdSidenav){
    console.log('Root component');

    var vm = this;

    vm.records = [];
    vm.markers = [];

    vm.initMap = function() {
        var mapCenter = {lat: 48.8611171, lng: 2.3347824}
        vm.map = new google.maps.Map(document.getElementById('map'), {
            center: mapCenter,
            zoom: 13
        });
    };
    vm.initMap();

    vm.clearMarkers = function(callback){
        vm.map.setCenter(new google.maps.LatLng(48.8611171, 2.3347824));
        vm.map.setZoom(13);
        vm.markers.forEach(function(marker){
            marker.setMap(null);
        });
        vm.markers = [];
        callback();
    }

    vm.placeMarker = function(hotspot){
        $mdSidenav('left').toggle();
        vm.clearMarkers(function(){
            var marker = new google.maps.Marker({
            position: hotspot.location,
            title: hotspot.name,
            animation: google.maps.Animation.DROP,
            icon: 'assets/images/wifiSpot.png',
            infoWindow: new google.maps.InfoWindow({
                content: "<b>"+hotspot.name+"</b><br><em>"+hotspot.address+"</em>"
            })
        });
        marker.addListener('click', function() {
            marker.infoWindow.open(vm.map, marker);
        });
        marker.setMap(vm.map);
        vm.markers.push(marker);
        });
    }

    vm.showMenu = function($mdMenu, ev) {
        $mdMenu.open(ev);
    };

    vm.openSidenav = function() {
        $mdSidenav('left').toggle();
    };

    vm.getAroundMe = function(){
        vm.clearMarkers(function(){
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function(position){
                    var position = {lat: position.coords.latitude, lng: position.coords.longitude};
                    vm.map.setCenter(new google.maps.LatLng(position.lat, position.lng));
                    vm.map.setZoom(15);
                    var userLocationSpot = new google.maps.Marker({
                        position: position,
                        map: vm.map,
                        icon: 'assets/images/userLocation.png',
                        title: 'You are here !'
                    });
                    vm.markers.push(userLocationSpot);
                    vm.records.forEach(function(district){
                        district.forEach(function(spot){
                            if(google.maps.geometry.spherical.computeDistanceBetween(new google.maps.LatLng(spot.location.lat, spot.location.lng), new google.maps.LatLng(position.lat, position.lng)) <= 1000){
                                var marker = new google.maps.Marker({
                                    position: spot.location,
                                    title: spot.name,
                                    map: vm.map,
                                    animation: google.maps.Animation.DROP,
                                    icon: 'assets/images/wifiSpot.png',
                                    infoWindow: new google.maps.InfoWindow({
                                        content: "<b>"+spot.name+"</b><br><em>"+spot.address+"</em>"
                                    })
                                });
                                marker.addListener('click', function() {
                                    marker.infoWindow.open(vm.map, marker);
                                });
                                vm.markers.push(marker);
                            }
                        });
                    });
                });
            }
        });
    }

    rootFactory.getNbResults().then(function(hits){
        rootFactory.getAllResults(hits.nhits).then(function(data){
            var unsorted = [];
            data.records.forEach(function(spot){
                var temp = {
                    name: spot.fields.nom_site.substring(0, 1)+spot.fields.nom_site.substring(1, spot.fields.nom_site.length).toLowerCase(),
                    address: spot.fields.adresse.toLowerCase()+" "+spot.fields.arrondissement,
                    district: spot.fields.arrondissement,
                    location: {lat: spot.fields.geo_point_2d[0], lng: spot.fields.geo_point_2d[1]}
                };
                var district = temp.district.substring(3, 5);
                if(district.substring(0, 1) === "0")
                    district = district.substring(1, 2);
                district = district - 1;
                if(!(district in vm.records)){
                    vm.records[district] = [temp];
                } else
                    vm.records[district].push(temp);
            });
            console.log(vm.records);
        });
    });

}

RootController.$inject = ['rootFactory', '$mdDialog', '$mdSidenav'];

angular.module('characterSheetmanager.rootComponent', []).component('rootComponent', {
    templateUrl: 'comp/root.component.html',
    controller: RootController,
    controllerAs: "rootCtrl",
    bindings: {}
}).factory('rootFactory', function($http){
    return {
        getNbResults: function(){
            var url = "https://opendata.paris.fr/api/records/1.0/search/?dataset=liste_des_sites_des_hotspots_paris_wifi&rows=0";
            return $http({
                method: 'GET',
                url: url
            }).then(function(response){
                return response.data;
            }).catch(function(response){
                console.log("[Error] [getNbResults] . "+response.status+" : "+response.statusText);
            });
        },
        getAllResults: function(total){
            var url = "https://opendata.paris.fr/api/records/1.0/search/?dataset=liste_des_sites_des_hotspots_paris_wifi&rows="+total;
            return $http({
                method: 'GET',
                url: url
            }).then(function(response){
                return response.data;
            }).catch(function(response){
                console.log("[Error] [getNbResults] . "+response.status+" : "+response.statusText);
            });
        }
    }
});