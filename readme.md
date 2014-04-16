#AplusACL
The "A" is for "assertions".

A+ACL is loosely modeled after Zend Framework's Zend_Acl package. The most significant difference between A+ACL and other NodeJs ACL modules, is that A+ACL is **assertive**, meaning that it provides a mechanism for making *assertions* when calling isAllowed().

Assertions allow us to assert based on all information already available rather than storing and retrieving granted privileges for each user/role, resource, and permission combination.

**Getting started**
1. Install AplusACL
2. Define roles, resources
3. Grant permissions
4. Apply assertions
5. Query the ACL

##Installation
`npm install aplusacl`

##Define Roles and Resources
A+ACL is not opinionated in regards to roles, resources and permissions; it has no inherent idea what they are, only that they should exist. Therefore it is up to you to define them. For a "todo application" REST API, defining roles and resources can be done like so:
```javascript
var AplusACL = require('aplusacl');
var aclConfig = {
  roles:['guest','user','admin'],
  resources:['users','todo']
};
var acl = new AplusACL(aclConfig);
```
Here we've simply defined our roles as 'guest', 'user', and 'admin', and we've defined our resources as:'users', and 'todos'. Note that it is up to you to determine what a user's role is.

##Grant Permissions
Now that we've defined our roles and resources we can grant permissions to roles. A+ACL is not opinionated in regards to permissions, so it's up to us to define them under the property `allows` (continuing from previous example):
```javascript
aclConfig.allows = [
  // a guest can create a user account but that is all
  {role:'guest', resource:'users', permissions:['create']},

  // a user can only get the details and update ( GET|PUT /users/:id)
  // a user cannot list, create, or delete users
  {role:'user', resource:'users', permissions:['detail','update']},

  // a user has full access to the todos resource
  {role:'user', resource:'todos', permissions:['list','detail','create','update','delete']},

  // an admin has full permissions to all resources
  {role:'admin', resource:'users', permissions:['list','detail','create','update','delete']},
  {role:'admin', resource:'todos', permissions:['list','detail','create','update','delete']}
];
```

##Apply Assertions
In the previous configuration, we granted the *user* role the ability to get the details of and update a users record. We also gave the user full access to the todos resource, but what prevents one user from looking at or updating another user's record or todos?  An **assertion** does!

Assertions are named using the following pattern:`{role}_can_{privilege}_{resource}`. We will add an assertion to test whether a user owns the user records they are trying to detail or update.

```javascript

aclConfig.assertions = {
  // here params is a reference to arbitrary data, they could be req.query or req.body
  user_can_detail_users: function (user, resource, options) {
    // user is perhaps an instance of a mongoose user model and is the one currently authenticated
    // assert that the logged in user owns the requested resource
    return (user._id === options.id) // request.params was passed in as options to isAllowed()
  },

  user_can_list_todos: function (user, resource, options) {
    // user is perhaps an instance of a mongoose user model
    // users can only list their own todos
    // assert that the user query string param is the same as the authenticated user
    return (user._id === options.user); // request.query was passed in as options to isAllowed()
  }
}

```

##Query the ACL
Now that our ACL is built, we can query it to determine if a user can perform privileged actions on the requested resource. Consider the following controller in a (Express+Mongoose powered) REST API:

```javascript
var UserModel = mongoose.model('user');
var UsersControler = {

  // GET /users/:id
  detail: function (req, res) {
    // get the record
    UserModel.findById(req.params.id, function (err, doc) {
      if (!acl.isAllowed(req.session.user, doc, 'detail', req.params)) {
        return res.json(403, {error:"forbidden"});
      }

      res.json(200, doc);
    });
  }

  // PUT /users/:id
  update: function (req, res) {
    // get the record
    UserModel.findById(req.params.id, function (err, doc) {
      if (!acl.isAllowed(req.session.user, doc, 'update', req.params)) {
        return res.json(403, {error:"forbidden"});
      }

      res.json(204);
    });
  }
};
```
Note that A+ACL is not opinionated toward frameworks and inherently knows nothing of Express or Mongoose.
