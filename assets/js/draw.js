//Real-time Drawing Application with Image upload
//Created By: Terence Li
//Dependencies: GhostScript, Paper.js, ImageMagick
//Code credit for canvas clear and color functions:
// https://github.com/JohnMcLear/draw
//Code credit for current drawing tool:
// https://github.com/byrichardpowell/12devsNodeJsDraw
tool.maxDistance = 50;
var canvas = document.getElementById('draw');
var context = canvas.getContext('2d');
var imagePaper = new Image();

// context.clearRect(0, 0, canvas.width, canvas.height);
// drawBackground(canvas, context);
            
// function drawBackground(canvas, context){

//     imagePaper.onload = function(){
//         // resizeCanvas();
//         console.log("after resize width: "+ canvas.width);
//         console.log("after resize height: "+ canvas.height);
//         // context.drawImage(imagePaper,0, 0, canvas.width, canvas.height);
//         $('#draw').css('background-image', 'url(' + imagePaper.src + ')');

//     };

// imagePaper.src = "/img/background.png";
// }


// //Button functions
// $('#topdf').click(function(){
//                 var imgData = canvas.toDataURL("image/jpeg", 1.0);
//                 var pdf = new jsPDF();

//                 pdf.addImage(imgData, 'JPEG', 0, 0);
//                 pdf.save("download.pdf");
//                 location.reload(true);
// }); 

function clearCanvas() {
  // Remove all but the active layer
  if (project.layers.length > 1) {
    var activeLayerID = project.activeLayer._id;
    for (var i=0; i<project.layers.length; i++) {
      if (project.layers[i]._id != activeLayerID) {
        project.layers[i].remove();
        i--;
      }
    }
  }
  
  // Remove all of the children from the active layer
  if (paper.project.activeLayer && paper.project.activeLayer.hasChildren()) {
    paper.project.activeLayer.removeChildren();
  }
  view.draw();
}

$('#clear').click(function(){
    clearCanvas();
    var data = 1;
    io.emit('ClearCanvas', data);
});

function resizeCanvas() {
    if(imagePaper.width > imagePaper.height){
        canvas.width = 1000;
        canvas.height = 700; 
    }
    else if (imagePaper.width < imagePaper.height) {
        canvas.width = 700;
        canvas.height = 1000;
    }
    else {
        canvas.width = 700;
        canvas.height = 700;
    }
}

var active_color_rgb;
var active_color_json = {"red":0, "green":0, "blue":0, "alpha":1};
var $opacity = $('#opacity');
var update_active_color = function() {

    var rgb_array =  $('.active').attr('data-color').split(',');
    var red = rgb_array[0] / 255;
    var green = rgb_array[1] / 255;
    var blue = rgb_array[2] / 255;
    var opacity =  $opacity.val() / 255;

    active_color_rgb =  new RgbColor( red, green, blue, opacity );
    active_color_rgb._alpha = opacity;

    active_color_json = {
        "red" : red,
        "green" : green,
        "blue" : blue,
        "alpha" : opacity
    };

};

var $color = $('.color');
$color.on('click', function() {

    $color.removeClass('active');
    $(this).addClass('active');

    update_active_color();
    console.log(active_color_rgb);

});

$opacity.on('change', function() {

    update_active_color();
    console.log(active_color_rgb);
});


// function randomColor () {

//     return {
//         red:0,
//         green: 0* Math.random(),
//         blue: 0* Math.random(),
//         alpha: (0 *(Math.random()*0.25) + 0.05) + 100
//     };
// }

// every time the user drags their mouse
// this function will be executed
function onMouseDrag(event) {
    // Take the click/touch position as the centre of our circle
    var x = event.middlePoint.x;
    var y = event.middlePoint.y;
    // The faster the movement, the bigger the circle
    var radius = event.delta.length/2;
    console.log(event.delta.length/2);
    // Generate our random color
    var color = active_color_json;
    // Draw the circle 
    drawCircle( x, y, radius, color );
    // Pass the data for this circle
    // to a special function for later
    emitCircle( x, y, radius, color );
} 
 
function drawCircle( x, y, radius, color ) {
    // Render the circle with Paper.js
    var circle = new Path.Circle( new Point( x, y ), radius );
    circle.fillColor = new RgbColor( color.red, color.green, color.blue, color.alpha );
    // Refresh the view, so we always get an update, even if the tab is not in focus
    view.draw();
} 
 
function emitCircle( x, y, radius, color ) {
    // We'll do something interesting with this shortly...
    // Each Socket.IO connection has a unique session id
    var sessionId = io.sessionid;
  
    // An object to describe the circle's draw data
    var data = {
        x: x,
        y: y,
        radius: radius,
        color: color
    };

    // send a 'drawCircle' event with data and sessionId to the server
    io.emit( 'drawCircle', data, sessionId )

    // Lets have a look at the data we're sending
    console.log( data )
}


// Listen for 'drawCircle' events
// created by other users
io.on( 'drawCircle', function( data ) {

    console.log( data );

    // Draw the circle using the data sent
    // from another user
    drawCircle( data.x, data.y, data.radius, data.color );
    
})

io.on( 'ClearCanvas', function(data){
    console.log("Clear Canvas Data: " + data);
    if (data){
        clearCanvas();
    }
})