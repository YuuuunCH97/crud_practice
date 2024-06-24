var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var mysql = require("mysql2");


// ///////////////////////////////////// DataBase 


var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "password",
    database: "member_data",
    insecureAuth: true
});

con.connect(function(err) {
    if (err) {
        console.log('connecting error', err.stack);
        return;
    }
    console.log('connecting success');
});
//////////////////////////////////////////

var app = express();
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//////////////////////////////////////////////////
app.use(function(req, res, next) {
  req.con = con;
  next();
});


//////////////////////////////////////////////////

app.use('/', indexRouter);
app.use('/users', usersRouter);
//app.use('/create_member', createMemberRouter); // 使用新的路由


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  console.log(`${req.method} ${req.url}`);
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

