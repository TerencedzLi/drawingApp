//Real-time Drawing Application with Image upload
//Created By: Terence Li
//Dependencies: GhostScript, Paper.js, ImageMagick
//Code credit for canvas clear and color functions:
// https://github.com/JohnMcLear/draw
//Code credit for current drawing tool:
// https://github.com/byrichardpowell/12devsNodeJsDraw
var express = require("express");
var app = express();
var router = express.Router();
var path = require("path");
var logger = require("morgan"); // For logging errors
var fs = require('fs');
var im = require('imagemagick');
var http = require('http');
var mongoose = require('mongoose');
var Circles = require('./models/drawingData');

//MongoDB Connection
var configDB = require('./config/database.js');
mongoose.connect(configDB.url);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
  console.log("MongoDB connection is live");
});

var formidable = require('formidable');

app.set(logger('dev'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use('/static', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'assets')));
app.use('/', router);


//Routes
router.get('/', function(req,res){
	res.render('index', {title: "CASCON"});
	
});

router.post('/upload', function(req, res) {
    var form = new formidable.IncomingForm();
    form.uploadDir = path.join(__dirname, 'uploads');
    form.parse(req, function(err, fields, files) {
        // `file` is the name of the <input> field of type `file`
        
        var old_path = files.file.path,
            file_size = files.file.size,
            file_ext = files.file.name.split('.').pop(),
            index = old_path.lastIndexOf('/') + 1,
            file_name = old_path.substr(index),
            what = file_name;
            same_name = files.file.name.split('.').shift(),
            nameBackground = "background";
            new_path = path.join(process.env.PWD, '/assets/img/', nameBackground + '.' + file_ext);
            allext = ["png", "jpg", "jpeg", "JPEG"];

        fs.readFile(old_path, function(err, data) {
            fs.writeFile(new_path, data, function(err) {
                fs.unlink(old_path, function(err) {
                    if (err) {
                        res.status(500);
                        res.json({'success': false});
                    } else {
                        res.status(200);
                        console.log(process.env.PWD);	
                        if(allext.indexOf(file_ext) == -1 ){
        					im.convert(["assets/img/background." + file_ext, "assets/img/background.png"], function(err,stdout){
 								if (err) throw err;
 								console.log('stdout:', stdout);
 								res.redirect('/');	
    						});
        				}
        				else {
        					res.redirect('/');
        				}
                    }
                });
            });
        });
 	});
});

if (app.get('env') === 'development') {
     app.use(function(err, req, res, next) {
         res.status(err.status || 500);
         res.render('error', {
             message: err.message,
             error: err
         });
     });
}

app.set('port', process.env.PORT || 3000);

var server = http.createServer(app).listen( app.get('port') );
var io = require('socket.io').listen(server, function() {
  console.log("Express server listening on port " + app.get('port'));
});


// A user connects to the server (opens a socket)
io.sockets.on('connection', function (socket) {

    var id = socket.id;
    console.log("Connected ----- " + socket.id);

    Circles.find({}, {'_id':0}, function(err, points){
    	if(!points){ 
    		return;
    	}
    	else{
    		points.forEach(function(point){
    			io.to(id).emit('drawCircle', point);
    		});	
    	}
    });
    			

    socket.on('disconnect', function(socket){
    	console.log("Socket Disonnected");
    });


    socket.on( 'drawCircle', function( data, sessionId ) {
    	
    	var point = new Circles();
		point.x = data.x;
		point.y= data.y;
		point.radius = data.radius;
		point.color = data.color;
    	
    	point.save(function(err, data){
    		if (err)
    			console.log(err);
			console.log({message: 'Save successful'+ data});
    	});

    	socket.broadcast.emit( 'drawCircle', data );
	});

	socket.on('ClearCanvas', function(data){
		socket.broadcast.emit('ClearCanvas', data);
		Circles.remove({}, function (err) {
  			if (err) return handleError(err);
  			console.log("EVERYTHING HAS BEEN REMOVED!");
		});
	});

	socket.on('PossibleRefresh', function(data){
		socket.broadcast.emit('PossibleRefresh', data);
	});
});


