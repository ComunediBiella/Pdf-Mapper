var pdfi
var imaW
var imaH
var imalngLat=null
var maplngLat=null
var scaledbox
var gradirotazione=0
var f_enter=0
var scala = 5000 //fattore di scala iniziale

const el = document.createElement('div');
el.className = 'marker';
	
$( document ).ready(function() {
	$('#geolink').prop('disabled', true)
});

// copia una stringa nel clipboard
function copyData(containerid) {
  var range = document.createRange();
  range.selectNode(containerid); //changed here
  window.getSelection().removeAllRanges(); 
  window.getSelection().addRange(range); 
  document.execCommand("copy");
  window.getSelection().removeAllRanges();
}

// ruota l'immagine in senso antiorario di step a 90°
function ruota() {
	gradirotazione=(gradirotazione + 90) % 360;
	$('#rotaz').val(gradirotazione)
	riscala(scala)
}

// scala l'immagine mantenendo la rotazione
function riscala(sc) {
	scala=sc
	if (gradirotazione==90) {
		origin=proj4("EPSG:4326",proiezione,bbox[3])
		ex1=bbox[3]
		ex2=[origin[0],origin[1]+(imaW/72*2.54)*scala/100]
		ex3=[origin[0]+(imaH/72*2.54)*scala/100,origin[1]+(imaW/72*2.54)*scala/100]
		ex4=[origin[0]+(imaH/72*2.54)*scala/100,origin[1]]	
	}
	if (gradirotazione==180) {
		origin=proj4("EPSG:4326",proiezione,bbox[2])
		ex1=bbox[2]
		ex2=[origin[0]-(imaW/72*2.54)*scala/100,origin[1]]
		ex3=[origin[0]-(imaW/72*2.54)*scala/100,origin[1]+(imaH/72*2.54)*scala/100]
		ex4=[origin[0],origin[1]+(imaH/72*2.54)*scala/100]
	}
	if (gradirotazione==270) {
		origin=proj4("EPSG:4326",proiezione,bbox[1])
		ex1=bbox[1]
		ex2=[origin[0],origin[1]-(imaW/72*2.54)*scala/100]
		ex3=[origin[0]-(imaH/72*2.54)*scala/100,origin[1]-(imaW/72*2.54)*scala/100]
		ex4=[origin[0]-(imaH/72*2.54)*scala/100,origin[1]]
	}    
	if (gradirotazione==0) {
		origin=proj4("EPSG:4326",proiezione,bbox[0])
		ex1=bbox[0]
		ex2=[origin[0]+(imaW/72*2.54)*scala/100,origin[1]]
		ex3=[origin[0]+(imaW/72*2.54)*scala/100,origin[1]-(imaH/72*2.54)*scala/100]
		ex4=[origin[0],origin[1]-(imaH/72*2.54)*scala/100]
	}
	or2=proj4(proiezione,"EPSG:4326",ex2)
	or3=proj4(proiezione,"EPSG:4326",ex3)
	or4=proj4(proiezione,"EPSG:4326",ex4)
	scaledbox=[ex1,or2,or3,or4]
	const mySource = map.getSource('pdfimage');
	mySource.setCoordinates(scaledbox);
}

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

var urlima=urlParams.get('urlima');
var geobox=urlParams.get('geobox');

if (urlima!=null) {
	var link = urlima
	var bbox = JSON.parse(geobox);
} else {
	var link = urlParams.get('link')
	link=link.replaceAll("|ecomm|", "%26")
	var comune = urlParams.get('c');
	var lng = parseFloat(urlParams.get('ln'));
	var lat = parseFloat(urlParams.get('lt'));
	var bbox = [[lng,lat],[lng+0.1,lat],[lng+0.1,lat-0.1],[lng,lat-0.1]]
	var proiezione = urlParams.get('proj');
}

//
// La versione 1.13.0 dell'Sdk Mapbox GL JS non necessita la richiesta di un access token. Dalla versione 2 è necessaria la richiesta di un token alla pagina https://account.mapbox.com/
//
//mapboxgl.accessToken = ''
var map = new mapboxgl.Map({
container: 'map',
id: 'mbox',
style: {
        version: 8,
        sources: {
        },
        layers: [
          {
            id: 'background',
            type: 'background',
            paint: { 
              'background-color': '#fff'
            }
          }
        ]
      },
center: [10.52, 45.3], 
zoom: 7, 
maxZoom: 21
});

map.showTileBoundaries = false;

map.on('load', function () {

var sourceObj =map.addSource('esri', {
'type': 'raster',
'tiles': [
'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
],
'tileSize': 256,
'maxzoom': 19,
'attribution':
'<a target="_top" rel="noopener" href="http://esri.com">ESRI</a>'
});
map.addLayer({
'id': 'esri_tiles',
'type': 'raster',
'source': 'esri',
'minzoom': 0,
'maxzoom': 22
});

var sourceObj =map.addSource('carto', {
'type': 'raster',
'tiles': [
'https://abcd.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
],
'tileSize': 256,
'attribution':
'<a href="https://cartodb.com/attributions">CartoDB</a>'
});
map.addLayer({
'id': 'carto_tiles',
'type': 'raster',
'source': 'carto',
'minzoom': 0,
'maxzoom': 22
});

var sourceObj =map.addSource('OSM', {
'type': 'raster',
'tiles': [
'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'
],
'tileSize': 256,
'maxzoom': 20,
'attribution':
'<a href="https://operations.osmfoundation.org/policies/tiles/">&copy; OSM</a>'
});
map.addLayer({
'id': 'osm_tiles',
'type': 'raster',
'source': 'OSM',
'minzoom': 0,
'maxzoom': 22
});

pdfi=map.addSource('pdfimage', {
'type': 'image',
'url': 'https://images.weserv.nl/?url='+link,
'coordinates': bbox
});
map.addLayer({
id: 'lpdfimage',
'type': 'raster',
'source': 'pdfimage',
'paint': {
'raster-fade-duration': 0
}
});

var sourceObj = map.addSource('catasto', {
'type': 'raster',
'tiles': [
'https://www.fastmap.it:8443/catasto/{z}/{x}/{y}'
],
'tileSize': 256,
'maxzoom': 18,
'attribution':
'<a href="https://www.agenziaentrate.gov.it/portale/it/web/guest/schede/fabbricatiterreni/consultazione-cartografia-catastale/servizio-consultazione-cartografia">Agenzie delle Entrate</a>'
});
map.addLayer({
'id': 'catasto_tiles',
'type': 'raster',
'source': 'catasto',
'minzoom': 0,
'maxzoom': 22
});

const mapBaseLayer = {
	carto_tiles: "Base",
	osm_tiles: "OSM",
	esri_tiles: "Satellitare ESRI"
};

const mapOverLayer = {
	catasto_tiles: "Catasto",
	lpdfimage: "Tavola Pdf"
};

let Opacity = new OpacityControl({
	baseLayers: mapBaseLayer,
	overLayers: mapOverLayer,
	opacityControl: true
});

map.addControl(Opacity, 'top-right');
map.addControl(new mapboxgl.NavigationControl(), 'top-right')

map.setLayoutProperty("lpdfimage", 'visibility', 'visible');
$("#lpdfimage").prop('checked', true);

});

map.on('idle', function() {
	$('#wheel').hide();
	if (f_enter==0) {
		if (link!=null) {
			mpos=[bbox[0][0]+((bbox[1][0]-bbox[0][0])/2),bbox[0][1]-((bbox[1][1]-bbox[2][1])/2)]
		}
		if (geobox!=null) {
			$('#geopulsanti').hide();
		}
	
		// marker di posizionamento del punto di riferimento nell'immagine Pdf
		const imamarker = new mapboxgl.Marker({
			draggable: true,
			rotation: 0
		})
		.setLngLat(mpos)
		.addTo(map);
		
		//marker di indicazione in mappa del punto di riferimento
		const mapmarker = new mapboxgl.Marker(el,{
			draggable: true,
			color: '#f00',
			rotation: 0,
		})
		.setLngLat(mpos)
		.addTo(map);
 
	  function imaonDragEnd() {
		imalngLat = imamarker.getLngLat();
		xyposima=proj4("EPSG:4326",proiezione,[imalngLat.lng,imalngLat.lat])
		posmap0=proj4("EPSG:4326",proiezione,scaledbox[0])
		posmap1=proj4("EPSG:4326",proiezione,scaledbox[1])
		posmap2=proj4("EPSG:4326",proiezione,scaledbox[2])
		posmap3=proj4("EPSG:4326",proiezione,scaledbox[3])
		if (gradirotazione==0) {
			xposmap=(xyposima[0]-posmap0[0])/(posmap1[0]-posmap0[0])*imaW
			yposmap=(xyposima[1]-posmap1[1])/(posmap2[1]-posmap1[1])*imaH
		}
		if (gradirotazione==90) {
			xposmap=(xyposima[0]-posmap1[0])/(posmap2[0]-posmap1[0])*imaH
			yposmap=(xyposima[1]-posmap2[1])/(posmap3[1]-posmap2[1])*imaW
		}
		if (gradirotazione==180) {
			xposmap=(xyposima[0]-posmap2[0])/(posmap3[0]-posmap2[0])*imaW
			yposmap=(xyposima[1]-posmap3[1])/(posmap0[1]-posmap3[1])*imaH
		}
		if (gradirotazione==270) {
			xposmap=(xyposima[0]-posmap3[0])/(posmap0[0]-posmap3[0])*imaH
			yposmap=(xyposima[1]-posmap0[1])/(posmap1[1]-posmap0[1])*imaW
		}
		if (maplngLat !== null) {
			dlng=maplngLat.lng-imalngLat.lng
			dlat=maplngLat.lat-imalngLat.lat
			scaledbox[0]=[scaledbox[0][0]+dlng,scaledbox[0][1]+dlat]
			scaledbox[1]=[scaledbox[1][0]+dlng,scaledbox[1][1]+dlat]
			scaledbox[2]=[scaledbox[2][0]+dlng,scaledbox[2][1]+dlat]
			scaledbox[3]=[scaledbox[3][0]+dlng,scaledbox[3][1]+dlat]
			const mySource = map.getSource('pdfimage');
			mySource.setCoordinates(scaledbox);
			imamarker.setLngLat(mapmarker.getLngLat())
		}
		geobox='[['+scaledbox[0][0]+', '+scaledbox[0][1]+'],['+scaledbox[1][0]+', '+scaledbox[1][1]+'],['+scaledbox[2][0]+', '+scaledbox[2][1]+'],['+scaledbox[3][0]+', '+scaledbox[3][1]+']]';
		$('#geolink').prop('disabled', false)
		var root=getBaseUrl();
		$('#linkdef').html(root+"pdfmapper.html?urlima="+link+"&geobox="+geobox);
	  }
	  function maponDragEnd() {
		  maplngLat = mapmarker.getLngLat();
	  }
 	  imamarker.on('dragend', imaonDragEnd);
	  mapmarker.on('dragend', maponDragEnd);
	
	  if (geobox==null) {
		riscala(scala)
    	bounds=[bbox[3], bbox[1]]
    	map.fitBounds(bounds);	
	  } else {
		bounds=[bbox[3], bbox[1]]
		imamarker.remove();
		mapmarker.remove();
		map.fitBounds(bounds);
	  }
	}
	f_enter=1	
});

// selva l'immagine in modalità nascosta
const a1 = "https://images.weserv.nl/?url="+link;
const image = document.getElementById("ima2");
image.src = a1;
image.onload = function() {
  imaW=this.width
  imaH=this.height
}

function getBaseUrl() {
    var re = new RegExp(/^.*\//);
    var location = re.exec(window.location.href)
    var root=location[0].split("pdfmapper.html")
    return root[0];
}
