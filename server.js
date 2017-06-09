const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const couchdb = require('./lib/utils/couchdb');

couchdb.createMainDatabase();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/members', couchdb.superlogin.router);

app.post('/projects', couchdb.superlogin.requireAuth, function(req, res) {
    if (req.body && req.body.name) {
        couchdb.createProject(req.body.name, req.user._id)
          .then((result) => {
              res.send(result);
          }).catch((err) => {
              res.status(500);
              res.send(err);
          });
    }
});

app.get('/projects', couchdb.superlogin.requireAuth, function(req, res) {
    couchdb.listProjects(req.user._id)
        .then((projects) => {
            res.send(projects);
        });    
});

app.post('/projects/:id/members', couchdb.superlogin.requireAuth, function(req, res) {
    if (req.body && req.body.member && req.params.id) {
        couchdb.addMemberToProject(req.user._id, req.params.id, req.body.member)
            .then(() => {
                res.send({
                    success : 'member added to project'
                });
            }).catch(err => {
                res.status(500);
                res.send(err);
            });
    } else {
        res.status(400);
        res.send({ error : 'missing params'});
    }    
});

app.listen(8000);
