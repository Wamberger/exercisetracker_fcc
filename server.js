const express = require('express')
const app = express()
const bodyParser = require('body-parser');

const cors = require('cors');

const mongoose = require('mongoose')
const uri = '...your uri of your mongoDB...'
mongoose.connect(uri, {useNewUrlParser: true, useUnifiedTopology: true})


app.use(cors());

app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

let exerciseSessionSchema = new mongoose.Schema({
  description: {type: String, required: true},
  duration: {type: Number, required: true},
  date: String
})

let userSchema = new mongoose.Schema({
  username: {type: String, required: true},
  log: [exerciseSessionSchema]
})

let Session = new mongoose.model('Session', exerciseSessionSchema);
let User = mongoose.model('User', userSchema);

app.post('/api/users', bodyParser.urlencoded({ extended: false}), (request, response) => {
  let newUser = new User({username: request.body.username})
  newUser.save((error, savedUser) => {
    if(!error){
      let responseObject = {}
      responseObject['username'] = savedUser.username
      responseObject['_id'] = savedUser.id
      response.json(responseObject)
    }
  })
})

app.get('/api/users', (request, response) => {

  User.find({}, (error, arrayOfUsers) => {
    if(!error){
      response.json(arrayOfUsers)
    }
  })
})

app.post('/api/users/:_id/exercises', bodyParser.urlencoded({ extended: false}), (request, response) => {
  let newSession = new Session({
    description: request.body.description,
    duration: parseInt(request.body.duration),
    date: request.body.date
  })

  if(newSession.date === ''){
    newSession.date = new Date().toISOString().substring(0, 10)
  }

  User.findByIdAndUpdate(
    request.params._id,
    {$push: {log: newSession}},
    {new: true},
    (error, updateUser) => {
      let responseObject = {}
      responseObject['_id'] = updateUser._id
      responseObject['username'] = updateUser.username
      responseObject['date'] = new Date(newSession.date).toDateString()
      responseObject['description'] = newSession.description
      responseObject['duration'] = newSession.duration
      response.json(responseObject)
    }
  )
})

app.get('/api/users/:_id/logs', (request, response) => {

  User.findById(request.params._id, (error, result) => {
    
    if(!error){

      let responseObject = {};
      let log = '';
      let newParam = request.query;

      if(newParam.from && newParam.to) {
        let fromDate = new Date(newParam.from).toISOString().substring(0, 10)
        let toDate = new Date(newParam.to).toISOString().substring(0, 10)
        log = result.log.filter(c => c.date > fromDate && c.date < toDate)     
      };

      if(newParam.from && !newParam.to) {
        let fromDate = new Date(newParam.from).toISOString().substring(0, 10)
        log = result.log.filter(c => c.date > fromDate)
      }

      if(newParam.to && !newParam.from){
        let toDate = new Date(newParam.to).toISOString().substring(0, 10)
        log = result.log.filter(e => e.date < toDate)
      }

      if(newParam.limit){
        if(!log){
          log = result.log
        }
        log = log.slice(0, newParam.limit)
      }

      responseObject['_id'] = result._id
      responseObject['username'] = result.username
      responseObject['count'] = result.log.length
      if(log){
        responseObject['log'] = log
      } else {
        responseObject['log'] = result.log
      }
      
      response.json(responseObject)
    } 
  })
})

