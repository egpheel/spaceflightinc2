var player = {
    money: 500,
    spaceship: 1,
    currentCargo: 0,
    location: 3,
    status: 0,
    travellingTo: 3,
    arrivalTime: 0,
    dockingDuration: 4,
}

var statuses = ["docked", "travelling", "docking"]

var planets = [
    { name: "Space", distance: -1 },
    { name: "Mercury", distance: 0 },
    { name: "Venus", distance: 2 },
    { name: "Earth", distance: 4 },
    { name: "Mars", distance: 6 },
    { name: "Jupiter", distance: 13 },
    { name: "Saturn", distance: 26 },
    { name: "Uranus", distance: 40 },
    { name: "Neptune", distance: 53 },
    { name: "Pluto", distance: 66 }
]

var spaceships = [
    { name: "Cessna Spc-Rocket", speed: 0.5, jumpDistance: 10, capacity: 5, price: 250 },
    { name: "Airbus A9000", speed: 1.25, jumpDistance: 25, capacity: 100, price: 3500 },
    { name: "Boeing 9000", speed: 1.2, jumpDistance: 37, capacity: 130, price: 3750 }
]
  
function updateStats() {
    document.getElementById("spaceship").innerHTML = spaceships[player.spaceship].name;
    document.getElementById("speed").innerHTML = spaceships[player.spaceship].speed + " dunits/sec";
    document.getElementById("range").innerHTML = spaceships[player.spaceship].jumpDistance + " dunits";
    document.getElementById("cargoCapacity").innerHTML = player.currentCargo + "/" + spaceships[player.spaceship].capacity;
    document.getElementById("money").innerHTML = player.money + " munits";
    document.getElementById("location").innerHTML = planets[player.location].name;
    document.getElementById("status").innerHTML = statuses[player.status];
}
  
function createPlanetDiv(index, distance) {
    let container = document.getElementById('travelDestinations')
    
    let div = document.createElement('div')
    div.setAttribute('class', 'col-auto')

    let travelLink = ''
    
    if (distance <= spaceships[player.spaceship].jumpDistance) {
        travelLink = ' [<a href="#" onclick="travelTo(' + index + ',' + distance + ')">travel<span class="tooltip">' + Math.round(distance / spaceships[player.spaceship].speed) + ' secs</span></a>]'
    }

    div.innerHTML = '<p>' + planets[index].name + '</p><p>' + distance + ' dunits' + travelLink + '</p>'

    container.appendChild(div)
}

function travelTo(index, distance) {
    player.location = 0
    player.status = 1
    player.travellingTo = index

    updateStats()

    var travelTime = Math.round(distance / spaceships[player.spaceship].speed)

    let date = new Date()
    let now = date.getTime()

    player.arrivalTime = now + travelTime * 1000

    clearDestinations()

    startTravel(index)
}

function startTravel(index) {
    var date = new Date()
    var now = date.getTime()
    var travelTime = Math.round((player.arrivalTime - now)/1000)

    var container = document.getElementById('travelDestinations')
    
    let div = document.createElement('div')
    div.setAttribute('class', 'col-auto')

    div.innerHTML = "<p>Travelling to " + planets[index].name + "</p><p>" + travelTime + " seconds left</p>"

    container.appendChild(div)

    var timeLeft = setInterval(function() {
        date = new Date()
        now = date.getTime()
        travelTime = Math.round((player.arrivalTime - now)/1000)

        div.innerHTML = "<p>Travelling to " + planets[index].name + "</p><p>" + travelTime + " seconds left</p>"
        container.appendChild(div)

        if (travelTime <= 0) {
            clearInterval(timeLeft)

            let date = new Date()
            let now = date.getTime()

            var dockingTime = now + player.dockingDuration * 1000

            clearDestinations()
            
            dock(index, dockingTime)
        }
    }, 1000)
}

function dock(index, dockingTime) {
    player.status = 2
    player.location = index

    updateStats()
    
    var date = new Date()
    var now = date.getTime()
    var dockingTimeLeft = Math.round((dockingTime - now)/1000)

    var container = document.getElementById('travelDestinations')
    
    let div = document.createElement('div')
    div.setAttribute('class', 'col-auto')

    div.innerHTML = "<p>Docking at " + planets[index].name + "'s space station</p><p>" + dockingTimeLeft + " seconds left</p>"

    container.appendChild(div)

    var timeLeft = setInterval(function() {
        date = new Date()
        now = date.getTime()
        var dockingTimeLeft = Math.round((dockingTime - now)/1000)

        div.innerHTML = "<p>Docking at " + planets[index].name + "'s space station</p><p>" + dockingTimeLeft + " seconds left</p>"
        container.appendChild(div)

        if (dockingTimeLeft <= 0) {
            clearInterval(timeLeft)
            
            player.status = 0
            
            container.innerHTML = ''

            updateStats()
            updateDestinations()
        }
    }, 1000)
}

function clearDestinations() {
    let container = document.getElementById('travelDestinations')
    
    container.innerHTML = ''
}

function updateDestinations() {
    // if travelling, do not update destinations and start travel countdown
    if (player.status === 1) {
        startTravel(player.travellingTo)
    } else {
        planets.forEach(function(item, index) {
            if (planets[index].distance !== -1 && index !== player.location) {
                var distance = Math.abs(
                    planets[player.location].distance - planets[index].distance
                )
    
                createPlanetDiv(index, distance)
            }
        })
    }
}
  
(function() {
    updateStats();
    updateDestinations();
})();
  