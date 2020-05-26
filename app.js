var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var bodyParser = require('body-parser')


var app = express();

var mongoose = require('mongoose');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(logger('dev'));
 app.use(express.json());
// app.use(bodyParser.urlencoded({ extended: false }))
//app.use(bodyParser.json());
//app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect("mongodb://localhost:27017/TemperaturesDB" ,{ useNewUrlParser: true , useUnifiedTopology: true },(error) =>{
  if (!error){
    console.log("Success");
  }
  else{
    console.log("Error connecting to the database.")
  }
})

app.use(express.static(path.join(__dirname, 'public')));
const TemperatureModel = mongoose.model("temperature",{
  DateTime: Date,
  Temperature: String
})


app.post('/api', (req, res) => {
  var Temp = new TemperatureModel(req.body);
  Temp.save()
      .then(item => {
        res.json({message: "item saved to database"})
      }).catch(error => {
              res.status(400).send("error");
            })
})

app.use('/', indexRouter);
app.use('/users', usersRouter);
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});




module.exports = app;
