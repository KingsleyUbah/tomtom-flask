function convertTime(sec) {
    var hours = Math.floor(sec/3600);
    (hours >= 1) ? sec = sec - (hours*3600) : hours = '00';
    var min = Math.floor(sec/60);
    (min >= 1) ? sec = sec - (min*60) : min = '00';
    (sec < 1) ? sec='00' : void 0;

    (min.toString().length == 1) ? min = '0'+min : void 0;    
    (sec.toString().length == 1) ? sec = '0'+sec : void 0;    

    return {
        hrs: hours,
        mins: min,
        secs: sec
    }    
}

var map = null
var instructions = null
var results = null


document.getElementById("submit-btn").addEventListener("click", calculateRoute)

function calculateRoute() {
    var lat0 = document.getElementById("lat-origin").value
var long0 = document.getElementById("long-origin").value

var lat1 = document.getElementById("lat-dest").value
var long1 = document.getElementById("long-dest").value

    fetch(`https://api.tomtom.com/routing/1/calculateRoute/${lat0},${long0}:${lat1},${long1}/json?routeRepresentation=summaryOnly&instructionsType=text&key=rXGP0WD0wr73ApA886gAtl5QPiAgwfeX`)
    .then(response => response.json())
    .then((data) => {
        // Pass response data and coordinates
        loadMapWithStopTimes(data, lat0, long0, lat1, long1)
    })    
}

function loadMapWithStopTimes(data, lat0, long0, lat1, long1) {    
    const {hrs, mins, secs} = convertTime(data.routes[0].summary.travelTimeInSeconds)
    document.getElementById('time').innerHTML = `Your Journey will take ${hrs} hours, ${mins} minutes and ${secs} seconds`        

    instructions = data.routes[0].guidance.instructions

    // create label for select input and set text content
    let label = document.createElement('label')
    label.innerHTML = "Choose a time to stop for a meal"        

    // Create select and set attributes
    let select = document.createElement('select')
    select.id = "cars"
    select.name = "cars"
    select.onchange = getRestaurants

    let button = document.createElement('button')
    button.id = "button"
    button.innerHTML = "Get restaurants"

    // Keep track of the minute already included
    let minTracker = null

    instructions.forEach((instruction, index) => {
        // We don't want to get the first two and last two
        if(index !== 0 && index !== 1 && index !== instruction.length - 1) {
            // Get minute for the location
                let {hrs, mins} = convertTime(instruction.travelTimeInSeconds)                            

                if (mins !== minTracker) {
                    // Creation select option
                    minTracker = mins
                    let option = document.createElement('option')                    

                    // add attributes
                    option.setAttribute('value', instruction.travelTimeInSeconds)
                    option.innerHTML = `${hrs} ${hrs === 1 ? 'hour': 'hours'} and ${mins} minutes in`                    

                    // Append option to select
                    select.appendChild(option)
                }                    
            }
                            
        })                

    // Now, insert into the page
    let targetDiv = document.getElementById("select-input-div")
    targetDiv.appendChild(label)
    targetDiv.appendChild(select)
    targetDiv.appendChild(button)

    let locations = [
        /*
        { lat: '34.024212',  lng: '-118.496475'},
        { lat: '33.953350',  lng: '-117.396156'}
        */
        { lat: lat0,  lng: long0},
        { lat: lat1,  lng: long1}
    ]
    
    map = tt.map({
        key: 'rXGP0WD0wr73ApA886gAtl5QPiAgwfeX',
        container: 'map',
        center: locations[0],
        bearing: 0,
        maxZoom: 7,
        minZoom: 1,
        pitch: 60,
        zoom: 14,
    });        
    
    map.addControl(new tt.FullscreenControl()); 
    map.addControl(new tt.NavigationControl());         
    
    locations.forEach((location, index) => {                    
        new tt.Marker().setLngLat(location).addTo(map)                                                                                                                                      
    })               
}

function getRestaurants() {    
	let option = document.getElementById("cars").value

    console.log(option)
    
    let selectedLoc = instructions.find((instruction) => {
        console.log(instruction.travelTimeInSeconds)
        return instruction.travelTimeInSeconds == option
    })

    console.log(selectedLoc)    

    const lat = selectedLoc.point.latitude
    const long = selectedLoc.point.longitude

    fetch(`https://api.tomtom.com/search/2/categorySearch/pizza.json?lat=${lat}&lon=${long}&radius=1700&categorySet=7315&view=Unified&relatedPois=off&key=rXGP0WD0wr73ApA886gAtl5QPiAgwfeX`)
    .then(response => response.json())
    .then((data) => {
        console.log(data)
        results = data.results

        results.forEach((result) => {
            const div = document.createElement('div')            
            
            const p1 = document.createElement('p')
            p1.innerHTML = `Restaurant Name: ${result.poi.name}`

            const p2 = document.createElement('p')
            p1.innerHTML = `Address: ${result.address.freeformAddress}`

            const p3 = document.createElement('p')
            p1.innerHTML = `Phone no: ${result.poi.phone}`

            const butt = document.createElement('button')
            butt.id = result.id
            butt.className = "restaurants"
            butt.innerHTML = "Add to map"

            div.appendChild(p1)
            div.appendChild(p2)
            div.appendChild(p3)
            div.appendChild(butt)

            document.getElementById('time').appendChild(div)

        })

        let resButtons = document.getElementsByClassName("restaurants")

        for(let i=0; i<resButtons.length; i++) {
            resButtons[i].addEventListener("click", () => {                
                let selectedRes = results.find((result) => {            
                    return result.id == resButtons[i].id
                })
               
                const lat = selectedRes.position.lat
                const lon = selectedRes.position.lon

                new tt.Marker().setLngLat({lat: lat, lng: lon}).addTo(map)
            })
        }        
    })
}
