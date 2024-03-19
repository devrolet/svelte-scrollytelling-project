<script>
    // import { Map } from "maplibre-gl";
    import { onMount } from "svelte";
    
    /* 
        MAPLIBRE SETUP
        TODO: SETUP MAPLIBRE, LOAD A MAP, TEST MAP.TO FUNCTION, ADD JC WORK
    */

    let zoomLevel;
    let minZoom;
    let maxZoom;

    let loadMap = () => {
        zoomLevel = 16.26;
        minZoom = 12;
        maxZoom = 18;
        let map = new maplibregl.Map({
            attributionControl: false,
            container: 'slippy-map', // container id NB: DO NOT USE 'MAP' (There's another 'map' already on page in dailygraphics)
            hash: true,
            style: {
                version: 8,
                glyphs:
                'https://dataviz.nbcnews.com/projects/20240308-slippy-sat/assets/{fontstack}/{range}.pbf', //I made this here https://maplibre.org/font-maker/ smth not working tho
                sources: {
                'raster-tiles': {
                    type: 'raster',
                    tiles: [
                    'https://dataviz.nbcnews.com/projects/20240308-slippy-sat/assets/my-tiles/{z}/{x}/{y}.png'
                    ],
                    tileSize: 256,
                    minzoom: minZoom,
                    maxzoom: maxZoom,
                    scheme: 'tms'
                }
                },
                layers: [
                {
                    id: 'raster-tiles-layer',
                    type: 'raster',
                    source: 'raster-tiles'
                }
                ]
            },
            center: [-156.684795, 20.893004], //north of location 1
            zoom: zoomLevel // starting zoom
        });
        console.log(map);

        // TODO: Create function for updating map upon scrolling
        // let updateMap = () => {}

        // map.on('load', () => {
    //   //You must first specify the data source
    //   //(BTW, Am not yet giving up on generating these as .pbf files but haven't cracked it yet and this works for now)
    //   map.addSource('kahua', {
    //     type: 'geojson',
    //     // This can be an external file, but this boundary is a small fry
    //     data: {
    //       type: 'Feature',
    //       geometry: {
    //         type: 'Polygon',
    //         coordinates: [
    //           [
    //             [-156.67236578215818, 20.884206614742524],
    //             [-156.67264861535222, 20.883898320598163],
    //             [-156.67401564235593, 20.883215667116104],
    //             [-156.67469915585792, 20.882731201471714],
    //             [-156.67538266935975, 20.88251098929858],
    //             [-156.67641972432813, 20.88268715906274],
    //             [-156.67797530678064, 20.88196045745302],
    //             [-156.6752648222043, 20.878745311168345],
    //             [-156.67300215681874, 20.880176720411413],
    //             [-156.67024453338001, 20.88196045745302],
    //             [-156.67236578215818, 20.884206614742524]
    //           ]
    //         ]
    //       }
    //     }
    //   })
    //   //Another example of adding a data source
    //   map.addSource('labels', {
    //     type: 'geojson',
    //     data: {
    //       type: 'FeatureCollection',
    //       features: [
    //         {
    //           type: 'Feature',
    //           properties: { id: 'note1', name: 'Kahua label' },
    //           geometry: {
    //             type: 'Point',
    //             coordinates: [-156.67814968373023, 20.883540023966397]
    //           }
    //         }
    //       ]
    //     }
    //   })

    //   //Now to get it on the map, add it as a layer
    //   map.addLayer({
    //     id: 'kahua',
    //     type: 'fill',
    //     source: 'kahua',
    //     layout: {
    //       visibility: 'none'
    //     },
    //     paint: {
    //       'fill-color': '#ffffff',
    //       'fill-opacity': 0.8
    //     }
    //   })

    //   //Another layer added
    //   map.addLayer({
    //     id: 'labels',
    //     type: 'symbol',
    //     source: 'labels',
    //     layout: {
    //       'text-font': ['FoundersGroteskCond'],
    //       'text-field': ['get', 'name'],
    //       'text-size': 40,
    //       visibility: 'none'
    //     },
    //     paint: {
    //       'text-color': '#FFFFFF',
    //       'text-halo-blur': 2,
    //       'text-halo-width': 2,
    //       'text-halo-color': 'rgb(60, 60, 60, 0.8)'
    //     }
    //   })
    // })

    // // disable map zoom
    // map.scrollZoom.disable()

    // // disable map pan
    // map.dragPan.disable()

    // //These are made up points and zooms to use in the event handler example below
    // const destinations = {
    //   loc1: {
    //     center: [-156.685234, 20.887898], //boats to the left of the shore
    //     zoom: 16.26
    //   },
    //   loc2: {
    //     center: [-156.681685, 20.883313], //zoom out to show the shoreline
    //     zoom: 15.13
    //   },
    //   loc3: {
    //     center: [-156.674698, 20.881803], // show teh white box //
    //     zoom: 15.75
    //   }
    // }
    }

    onMount(() => {
        loadMap();
    });

    
</script>

<div id="slippy-map"></div>

<style>
    
</style>
