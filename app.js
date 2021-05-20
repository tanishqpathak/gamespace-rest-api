const express = require('express')
const path = require('path')
const expressValidator = require('express-validator');
const flash = require('connect-flash');
const session = require('express-session');
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const passport = require('passport');
const config = require('./config/database');
const bcrypt = require('bcryptjs');

mongoose.connect(config.database , {useNewUrlParser: true, useUnifiedTopology: true});
let db = mongoose.connection;

db.once('open', () => {
    console.log('Connected to MongoDB')
})

db.on('error', (err) => {
    console.log(err)
})

const app = express();

let Game = require('./models/games')
let User = require('./models/users')
let Contact = require('./models/contacts')

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(express.static(path.join(__dirname, 'public')));



app.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true
  }));
  
// Express Messages Middleware
app.use(require('connect-flash')());
app.use(function (req, res, next) {
res.locals.messages = require('express-messages')(req, res);
next();
});

app.use(expressValidator({
    errorFormatter: function (param, msg, value) {
      var namespace = param.split('.')
        , root = namespace.shift()
        , formParam = root;
  
      while (namespace.length) {
        formParam += '[' + namespace.shift() + ']';
      }
      return {
        param: formParam,
        msg: msg,
        value: value
      };
    }
  }));

 
require('./config/passport')(passport)

app.use(passport.initialize());
app.use(passport.session());
  


app.get('*', (req, res, next) => {
    res.locals.user = req.user || null;
    next();
})


app.get('/', (req, res) => {
    res.render('index')
})

app.get('/about', (req, res) => {
    res.render('about')
})


app.get('/contact', (req, res) => {
    res.render('contact')
})

app.post('/contact', (req, res) => {

    const name = req.body.name;
    const email = req.body.email;
    const message = req.body.message;

    req.checkBody('name', 'Name is Required').notEmpty();
    req.checkBody('email', 'Email is Required').notEmpty();
    req.checkBody('email', 'Email is not Valid').isEmail();
    req.checkBody('message', 'Message is Required').notEmpty();

    let err = req.validationErrors();

    if(err){
        res.render('contact', {
            err:err
        })
    }else{
        let newContact = new Contact({
            name:name,
            email:email,
            message:message
        })

        newContact.save( (err) => {
            if(err) throw err;

            req.flash('success', 'Message Sent Successfully !')
            res.redirect('/')
        })
        
    }
})


app.get('/store', (req, res) => {

    Game.find({}, (err, games) => {
        if(err){
            console.log(err);
        }else{
            res.render('store', {
                games:games
            })
        }
    })
})




app.get('/games/add', ensureAuthenticated, (req, res) => {
    res.render('add_game')
})

app.post('/games/add', (req, res) => {

    req.checkBody('game', 'Game is Required').notEmpty();
    //req.checkBody('author', 'Author is Required').notEmpty();
    req.checkBody('price', 'Price is Required').notEmpty();
    req.checkBody('desc', 'Description is Required').notEmpty();

    let err = req.validationErrors();

    if(err){
        res.render('add_game', {
            err:err
        })
    }else{
        let game = new Game();
    
        game.game = req.body.game;
        game.author = req.user._id;
        game.price = req.body.price;
        game.desc = req.body.desc;
    
        game.save( (err) => {
            if(err){
                console.log(err);
                return;
            } else {
                req.flash('success', 'Game Added Successfully !')
                res.redirect('/store')
            }
        })
    }
})




app.get('/games/edit/:id', ensureAuthenticated, (req, res) => {
    Game.findById(req.params.id , (err, game) => {
        
        if(game.author != req.user._id){
            req.flash('danger', 'Not Authorized !')
            res.redirect('/')
        }
        res.render('edit_game', {
            game:game
        })
    })
})



app.post('/games/edit/:id', (req, res) => {

    let game = {};

    game.game = req.body.game;
    game.author = req.user._id;
    game.price = req.body.price;
    game.desc = req.body.desc;

    let query ={_id:req.params.id}

    Game.update( query, game, (err) => {
        if(err) throw err;
            req.flash('success', 'Game Updated !')
            res.redirect('/store')
        
    })

})

app.delete('/games/:id', (req, res) => {

    if(!req.user._id){
        res.status(500).send()
    }

    let query = {_id:req.params.id}

    Game.findById(req.params.id, (err, game) => {
        if(game.author != req.user._id){
            res.status(500).send()
        } else{
            Game.remove(query, (err) => {
                if(err){
                    console.log(err);
                }
                res.send('Success');
            });
        }
    })
});



app.get('/users/register', (req, res) => {
    res.render('register');
})

app.post('/users/register', (req, res) => {

    const name = req.body.name;
    const email = req.body.email;
    const username = req.body.username;
    const password = req.body.password;
    const password2 = req.body.password2;

    req.checkBody('name', 'Name is Required').notEmpty();
    req.checkBody('email', 'Email is Required').notEmpty();
    req.checkBody('email', 'Email is not Valid').isEmail();
    req.checkBody('username', 'Username is Required').notEmpty();
    req.checkBody('password', 'Password is Required').notEmpty();
    req.checkBody('password2', 'Passwords do not Match').equals(req.body.password);

    let err = req.validationErrors();

    if(err){
        res.render('register', {
            err:err
        })
    }else{
        let newUser = new User({
            name:name,
            email:email,
            username:username,
            password:password
        })
        
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(newUser.password, salt, (err, hash) => {
                if(err) throw err;

                newUser.password = hash;
                newUser.save( (err) => {
                    if(err) throw err;

                    res.redirect('/users/login')
                })
            })
        } )
    }
})


app.get('/users/login', (req, res) => {
    res.render('login')
});

app.post('/users/login', (req, res, next) => {
    passport.authenticate('local', {
      successRedirect: '/',
      failureRedirect: '/users/login',
      failureFlash: true
    })(req, res, next);
  });

app.get('/users/logout', (req, res) => {
    req.logout();
    req.flash('success', 'You are logged out');
    res.redirect('/users/login');
  });

  app.get('/games/:id', (req, res) => {
    Game.findById(req.params.id, (err, game) => {
      User.findById(game.author, (err, user) => {
        if (err) throw err;
  
        res.render('game', {
          game:game,
          author: user.name
        })
      })
    })
});

function ensureAuthenticated (req, res, next) {
      if(req.isAuthenticated()){
          return next();
      } else{
          req.flash('danger', 'Please LOG-IN to access !')
          res.redirect('/users/login')
      }
  }

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => { console.log(`Server running on Port: ${PORT}`) });