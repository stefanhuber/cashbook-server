const SuperLogin = require('superlogin');
const utils = require('./utils');

const protocol = 'http://';
const host = 'db:5984';
const user = process.env.COUCHDB_USER;
const pass = process.env.COUCHDB_PASSWORD;
const nano = require('nano')(protocol + user + ":" + pass + '@' + host);

const config = {
  dbServer: {
    protocol: protocol,
    host: host,
    user: user,
    password: pass
  },
  local: {
    sendConfirmEmail: false,
    requireEmailConfirm: false,
  },
  session: {
    adapter: 'memory'
  },
  userDBs: {
    defaultDBs: {
      // private: ['supertest']
    }
  }
};

const superlogin = new SuperLogin(config);

const addMemberToProject = function(user, projectId, member) {
    return new Promise((resolve, reject) => {
        var maindb = nano.use('maindb');
        maindb.get(projectId, function(err, project) {
            if (!err && project.owner == user) {
                superlogin.addUserDB(member, projectId, 'shared')
                    .then(() => {
                        return helperAddProjectToUser(projectId, member);
                    }).catch(err => {
                        reject(err);
                    }).then(() => {
                        resolve();
                    }).catch(err => {
                        reject(err);
                    });
            } else {
                reject(err);
            }
        });
    });
};

const listProjects = function(user) {
    return new Promise((resolve, reject) => {
        var users = nano.use('sl_users');
        users.get(user, function(err, doc) {
            if (!err) {
                var maindb = nano.use('maindb');
                maindb.fetch({ keys: doc.projects }, function(err, docs) {
                    if (!err) {
                        let projects = [];

                        if (docs.rows) {
                            for (let row of docs.rows) {
                                row.id   = row._id;
                                row._id  = undefined;
                                row._rev = undefined;
                                projects.push(row);
                            }
                        }

                        resolve(projects);
                    } else {
                        reject(err);
                    }                    
                });
            } else {    
                reject(err);
            }
        });
    });
}

const createMainDatabase = function() {
    return new Promise((resolve, reject) => {
        nano.db.create('maindb', function() {
            resolve();
        });
    });
};

const createProject = function(name, user) {
    return new Promise((resolve, reject) => {
        var dbname = "project-" + utils.md5(user + name);

        superlogin.addUserDB(user, dbname, 'shared')
            .then(function() {
                return new Promise((resolve, reject) => {
                    var maindb = nano.use('maindb');
                    maindb.insert({
                        name : name ,
                        type : 'project' ,
                        owner : user
                    }, dbname, function(err) {
                        if (!err) {
                            resolve();
                        } else {
                            reject(err);
                        }
                    });
                });                
            }).then(function() {
                return helperAddProjectToUser(dbname, user);
            }).then(() => {
                resolve({
                    id : dbname
                });
            }).catch((err) => {
                reject(err);
            });
    });
};

const helperAddProjectToUser = function(project, user) {
    return new Promise((resolve, reject) => {
        var users = nano.use('sl_users');
        users.get(user, function(err, doc) {
            if (!err) {
                if (doc.projects && Array.isArray(doc.projects)) {
                    doc.projects.push(project);
                } else {
                    doc.projects = [project];
                }

                users.insert(doc, function(err) {
                    if (!err) {
                        resolve();
                    } else {
                        reject(err);
                    }
                });
            } else {
                reject(err);
            }
        });
    });
};

module.exports = {
    nano : nano ,
    superlogin : superlogin ,
    addMemberToProject : addMemberToProject ,
    createProject : createProject ,
    createMainDatabase : createMainDatabase ,
    listProjects : listProjects
};